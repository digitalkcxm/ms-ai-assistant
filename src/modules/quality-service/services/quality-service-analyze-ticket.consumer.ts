import { VertexAIService } from '@/modules/vertex-ai/vertex-ai.service';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ApiCoreMessage } from '../dtos';
import { QualityServiceGroupEntity } from '../entities';
import { DataSource, Repository } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

type JobData = {
  ticket: any;
  messages: ApiCoreMessage[];
};

@Processor('quality_service_tickets')
export class QualityServiceAnalyzeTicketConsumer extends WorkerHost {
  constructor(
    private readonly vertexAIService: VertexAIService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {
    super();

    this.qualityServiceGroupRepository = this.dataSource.getRepository(
      QualityServiceGroupEntity,
    );
  }

  private readonly qualityServiceGroupRepository: Repository<QualityServiceGroupEntity>;

  async process(job: Job<JobData, any, string>): Promise<any> {
    switch (job.name) {
      case 'analyze':
        return this.analyzeTicket(job.data);
    }
  }

  async analyzeTicket({ ticket, messages }: JobData) {
    console.log('Analyzing ticket', ticket, messages);

    const settings = await this.qualityServiceGroupRepository.findOne({
      where: {
        referenceId: ticket.phase.workflowId,
      },
      select: {
        id: true,
        instructions: true,
        samplingPercentage: true,
        referenceId: true,
        goals: {
          id: true,
          instruction: true,
        },
        surveys: {
          id: true,
          question: true,
          weight: true,
          category: {
            id: true,
            name: true,
          },
        },
      },
      relations: {
        goals: true,
        surveys: {
          category: true,
        },
      },
    });

    if (!settings) {
      return 'No settings found for this workflow, skipping analysis';
    }

    const instructions = [];
    instructions.push(
      settings.instructions,
      settings.goals.length
        ? 'Gostaria que você respondesse também os questionamentos abaixo:'
        : '',
      ...settings.goals?.map((goal) => goal.instruction),
    );

    const inputs = [];
    inputs.push(
      'CONVERSA',
      ...messages.flatMap((message) => [message.created_at, message.message]),
    );
    inputs.push(
      settings.surveys.length ? 'FORMULÁRIO' : '',
      ...settings.surveys?.map(
        (survey) =>
          `${survey.question} (Categoria: ${survey.category?.name || 'Sem categoria'})`,
      ),
    );

    // const streamResponse = await this.vertexAIService.generateContentStream(
    //   instructions,
    //   inputs,
    //   'gemini-1.5-flash-002',
    // );

    // const aggregatedResponse = await streamResponse.response;

    // return aggregatedResponse;
    return { instructions, inputs };
  }
}
