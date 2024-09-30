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

type JobData = {
  ticket: any;
  messages: ApiCoreMessage[];
  settings: QualityServiceGroupEntity;
};

@Processor('quality_service_tickets')
export class QualityServiceAnalyzeTicketConsumer extends WorkerHost {
  constructor(
    private readonly vertexAIService: VertexAIService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {
    super();

    this.qualityServiceSurveyAnswerRepository = this.dataSource.getRepository(
      QualityServiceSurveyAnswerEntity,
    );
  }

  private readonly qualityServiceSurveyAnswerRepository: Repository<QualityServiceSurveyAnswerEntity>;

  async process(job: Job<JobData, any, string>): Promise<any> {
    switch (job.name) {
      case 'analyze':
        return this.analyzeTicket(job.data);
    }
  }

  async analyzeTicket({ ticket, messages, settings }: JobData) {
    const model = 'gemini-1.5-flash-002';

    const instructions = [];
    instructions.push(
      // 'Inicie uma nova conversa a partir daqui, nao responda nada que nao sejam OBJETIVOS e FORMULÁRIO',
      settings.goals.length ? 'OBJETIVOS:' : '',
      ...settings.goals?.map((goal) => goal.instruction),
      settings.surveys.length ? 'FORMULÁRIO' : '',
      ...settings.surveys?.map(
        (survey) =>
          `${survey.question} (Categoria: ${survey.category?.name || 'Sem categoria'} | Peso: ${survey.weight || 1})`,
      ),
      settings.instructions,
      'Retorne tudo em formato json, separando FORMULÁRIO e OBJETIVOS e com os campos pergunta e resposta em cada node, sem formatação',
    );

    const chatHistory: Content[] = [
      {
        parts: [{ text: 'CONVERSA' }],
        role: 'user',
      },
      ...messages
        .filter((i) => !!i.message)
        .flatMap<Content>((message) => [
          {
            role: message.source === 'operator' ? 'model' : 'user',
            parts: [
              { text: message.created_at },
              { text: message.message?.replaceAll('\n', ' ') },
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
      ?.flatMap(({ content }) => content.parts?.flatMap((part) => part?.text))
      ?.join('')
      ?.replaceAll('```', '')
      ?.replace('json', '')
      ?.replaceAll('\n', '');

    const surveyAnswer = new QualityServiceSurveyAnswerEntity();
    surveyAnswer.answer = answer ? JSON.parse(answer) : null;
    surveyAnswer.companyToken = settings.companyToken;
    surveyAnswer.referenceId = ticket.id;
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
  }
}
