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
    if (!messages.length) {
      return { message: 'No messages to analyze' };
    }

    const model = 'gemini-1.5-flash-002';

    const instructions = [];
    instructions.push(
      settings.goals.length ? 'OBJETIVOS:' : '',
      ...settings.goals?.map((goal) => goal.instruction),
      settings.surveys.length ? 'FORMULÁRIO' : '',
      ...settings.surveys?.map(
        (survey) =>
          `${survey.question} (Categoria: ${survey.category?.name || 'Sem categoria'} | Peso: ${survey.weight || 1})`,
      ),
      settings.instructions,
      'Retorne tudo em um único json. Uma lista de FORMULÁRIO com os campos pergunta e resposta. Uma de lista de OBJETIVOS com os campos description, que terá o valor do objetivo e outro com a sua resposta',
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
            role: 'user',
            parts: [
              { text: `Mensagem enviada pelo ${message.source}` },
              { text: `às ${message.created_at}` },
              { text: `Mensagem: ${message.message?.replaceAll('\n', ' ')}` },
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
