import { EnvVars } from '@/config/env-vars';
import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom, map } from 'rxjs';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { QualityServiceGroupEntity } from '../entities';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class QualityServiceAnalyzeService {
  constructor(
    private readonly configService: ConfigService<EnvVars>,
    private readonly httpService: HttpService,
    @InjectQueue('quality_service_tickets') private queue: Queue,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {
    this.qualityServiceGroupRepository = this.dataSource.getRepository(
      QualityServiceGroupEntity,
    );
  }

  private readonly logger = new Logger(QualityServiceAnalyzeService.name);
  private readonly qualityServiceGroupRepository: Repository<QualityServiceGroupEntity>;

  async enqueueTicketAnalysis(
    ticketId: string,
    apiCoreUrl: string,
    ticketInput?: any,
    settingsInput?: QualityServiceGroupEntity,
  ) {
    const ticket = await (ticketInput
      ? Promise.resolve(ticketInput)
      : lastValueFrom(
          this.httpService
            .get<any>(`api/v2/tickets/${ticketId}`, {
              baseURL: this.configService.getOrThrow<string>('MS_WORKFLOW_V2'),
            })
            .pipe(map(({ data }) => data)),
        ));

    const settings =
      settingsInput ??
      (await this.qualityServiceGroupRepository.findOne({
        where: {
          referenceId: ticket.phase.workflowId,
        },
        select: {
          id: true,
          instructions: true,
          samplingPercentage: true,
          referenceId: true,
          companyToken: true,
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
      }));

    await this.queue.add('analyze', {
      ticketId: ticket.id,
      apiCoreUrl,
      settings,
    });

    return { ticket, apiCoreUrl, settings };
  }

  async enqueueWorkflowTicketsAnalysis(
    dateStart: Date,
    dateEnd: Date,
    workflowId: string,
    apiCoreUrl: string,
    companyToken: string,
  ) {
    const [tickets, settings] = await Promise.all([
      lastValueFrom(
        this.httpService
          .get(`api/v2/workflows/${workflowId}/tickets`, {
            baseURL: this.configService.getOrThrow<string>('MS_WORKFLOW_V2'),
            headers: {
              Authorization: `${companyToken}`,
            },
            params: {
              dateStart,
              dateEnd,
              open: false,
            },
          })
          .pipe(map(({ data }) => data)),
      ),
      await this.qualityServiceGroupRepository.findOne({
        where: {
          referenceId: workflowId,
        },
        select: {
          id: true,
          instructions: true,
          samplingPercentage: true,
          referenceId: true,
          companyToken: true,
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
      }),
    ]);

    const samplesCount = Math.ceil(
      (tickets.length * settings.samplingPercentage) / 100,
    );

    if (!samplesCount || !tickets.length || !settings) {
      this.logger.debug(
        'No tickets or settings found for workflow',
        workflowId,
      );
      return { tickets, samplesCount, settings };
    }

    const sampleTickets: { [ticketId: string]: any } = {};

    while (Object.keys(sampleTickets).length < samplesCount) {
      const randomIndex = Math.floor(Math.random() * tickets.length);
      const ticket = tickets[randomIndex];

      if (!sampleTickets[ticket.id]) {
        sampleTickets[ticket.id] = ticket;
      }
    }

    const samples = Object.values(sampleTickets);

    const enqueueResults = await Promise.allSettled(
      samples.map((ticket) =>
        this.enqueueTicketAnalysis(ticket.id, apiCoreUrl, ticket, settings),
      ),
    );

    return {
      ticketLength: tickets.length,
      samples,
      settings,
      notSent: enqueueResults.filter((p) => p.status === 'rejected'),
    };
  }
}
