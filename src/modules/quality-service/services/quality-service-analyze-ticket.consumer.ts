import { VertexAIService } from '@/modules/vertex-ai/vertex-ai.service';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ApiCoreMessage } from '../dtos';
import {
  QualityServiceGroupEntity,
  QualityServiceSurveyAnswerEntity,
} from '../entities';
import { DataSource, Repository } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Content } from '@google-cloud/vertexai';
import { Logger } from '@nestjs/common';
import { lastValueFrom, map } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { htmlToText } from 'html-to-text';

type JobData = {
  ticketId: string;
  apiCoreUrl: string;
  settings: QualityServiceGroupEntity;
};

@Processor('quality_service_tickets', {
  concurrency: 5,
  skipStalledCheck: true,
})
export class QualityServiceAnalyzeTicketConsumer extends WorkerHost {
  constructor(
    private readonly httpService: HttpService,
    private readonly vertexAIService: VertexAIService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {
    super();

    this.qualityServiceSurveyAnswerRepository = this.dataSource.getRepository(
      QualityServiceSurveyAnswerEntity,
    );
  }

  private readonly logger = new Logger(
    QualityServiceAnalyzeTicketConsumer.name,
  );
  private readonly qualityServiceSurveyAnswerRepository: Repository<QualityServiceSurveyAnswerEntity>;

  async process(job: Job<JobData, any, string>): Promise<any> {
    switch (job.name) {
      case 'analyze':
        return await this.analyzeTicket(job.data);
    }
  }

  async analyzeTicket({ ticketId, apiCoreUrl, settings }: JobData) {
    try {
      const messages = await lastValueFrom(
        this.httpService
          .get<ApiCoreMessage[]>(
            `api/v2/ticket/internal/${ticketId}/messages`,
            {
              baseURL: apiCoreUrl,
            },
          )
          .pipe(
            map(({ data }) =>
              data?.map((message) => ({
                ...(message || {}),
                message: message?.message
                  ? htmlToText(message.message)
                      ?.replace(/\[data:[^;]+;base64,[^\]]*\]/g, '')
                      ?.replaceAll('\n', ' ')
                  : message?.message,
              })),
            ),
          ),
      );

      if (!messages?.length) {
        return { message: 'No messages to analyze' };
      }

      const model = 'gemini-1.5-flash-002';

      const instructions = [];
      instructions.push(
        settings.goals?.length ? 'OBJETIVOS:' : '',
        ...settings.goals?.map((goal) => goal.instruction),
        settings.surveys?.length ? 'FORMULÁRIO' : '',
        ...settings.surveys?.map(
          (survey) =>
            `${survey.question} (Categoria: ${survey.category?.name || 'Sem categoria'} | Peso: ${survey.weight || 1})`,
        ),
        settings.instructions || '',
        'Voce deve responder em um único JSON válido. Exemplo: {"FORMULARIO": [{"pergunta": "Voce é uma IA generativa?", "resposta": "Sim"}], "OBJETIVOS": [{"objetivo": "O que você espera do atendimento?", "resposta": "Espero que o atendimento seja rápido e eficiente"}]}',
        'Este JSON deve ter:',
        '- Uma propriedade FORMULÁRIO, será uma lista onde cada objeto terá pergunta e resposta com os campos pergunta e resposta.',
        '- Uma propriedade OBJETIVOS, será uma lista onde cada objeto terá uma propriedade objetivo com texto original e uma propriedade resposta com sua resposta para cada objetivo',
      );

      const chatHistory: Content[] = [
        {
          role: 'user',
          parts: [{ text: 'CONVERSA' }],
        },
        ...messages
          .filter((i) => !!i.message)
          .flatMap<Content>((message) => [
            {
              role: 'user',
              parts: [
                {
                  text:
                    message.source === 'operator'
                      ? `Operador enviou mensagem para o cliente`
                      : 'Operador recebeu mensagem do cliente',
                },
                { text: `às ${message.created_at}` },
                { text: `Mensagem: ${message.message}` },
              ],
            },
          ]),
      ];

      const response = await this.vertexAIService.chat(
        instructions,
        chatHistory,
        model,
      );

      const answer = response?.candidates
        ?.flatMap(({ content }) => content?.parts?.flatMap(({ text }) => text))
        ?.join('')
        ?.replaceAll('```', '')
        ?.replace('json', '')
        ?.replaceAll('\n', '');

      const tryParseJSON = (jsonString: string) => {
        try {
          return JSON.parse(jsonString);
        } catch (e) {
          return {
            error: 'Invalid JSON',
            e,
          };
        }
      };

      const surveyAnswer = new QualityServiceSurveyAnswerEntity();
      surveyAnswer.answer = answer ? tryParseJSON(answer) : null;
      surveyAnswer.companyToken = settings.companyToken;
      surveyAnswer.referenceId = ticketId;
      surveyAnswer.rawInput = JSON.stringify({
        instructions,
        chatHistory,
        model,
      });
      surveyAnswer.rawOutput = JSON.stringify(response);
      surveyAnswer.createdBy = QualityServiceAnalyzeTicketConsumer.name;

      await this.qualityServiceSurveyAnswerRepository.save(surveyAnswer);

      delete surveyAnswer.rawInput;
      delete surveyAnswer.rawOutput;

      return surveyAnswer;
    } catch (error) {
      this.logger.error('Error analyzing ticket', error);
      throw new Error(error.message);
    }
  }
}
