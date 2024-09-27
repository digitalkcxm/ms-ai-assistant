import { EnvVars } from '@/config/env-vars';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom, map } from 'rxjs';
import { convert } from 'html-to-text';

type ApiCoreMessage = {
  id: string;
  ticket_id: string;
  type: string;
  message: string;
  source: string;
  created_at: string;
};

@Injectable()
export class QualityServiceAnalyzeService {
  constructor(
    private readonly configService: ConfigService<EnvVars>,
    private readonly httpService: HttpService,
  ) {}

  async analyzeTicket(ticketId: string, apiCoreUrl: string) {
    const messages = await lastValueFrom(
      this.httpService
        .get<ApiCoreMessage[]>(`api/v2/ticket/internal/${ticketId}/messages`, {
          baseURL: apiCoreUrl,
        })
        .pipe(
          map(({ data }) => data),
          map((data) =>
            data.map((message) => {
              return {
                ...message,
                message: convert(message.message),
              };
            }),
          ),
        ),
    );

    return messages;
  }

  async analyzeWorkflowTickets(
    dateStart: Date,
    dateEnd: Date,
    workflowId: string,
    apiCoreUrl: string,
    companyToken: string,
  ) {
    const tickets = await lastValueFrom(
      this.httpService
        .get(`api/v2/workflows/${workflowId}/tickets`, {
          baseURL: this.configService.getOrThrow<string>('MS_WORKFLOW_V2'),
          headers: {
            Authorization: `${companyToken}`,
          },
          params: {
            dateStart,
            dateEnd,
          },
        })
        .pipe(map(({ data }) => data)),
    );

    if (!tickets.length) {
      return [];
    }

    const messagesByTicket = await lastValueFrom(
      this.httpService
        .get<ApiCoreMessage[]>(`api/v2/ticket/internal/messages`, {
          params: {
            ids: tickets.map((ticket: any) => ticket.id),
          },
          baseURL: apiCoreUrl,
        })
        .pipe(map(({ data }) => data))
        .pipe(
          map((ticketMessages) => {
            return ticketMessages?.reduce<{
              [ticketId: string]: ApiCoreMessage[];
            }>((acc, ticketMessage) => {
              if (!acc[ticketMessage.ticket_id]) {
                acc[ticketMessage.ticket_id] = [];
              }
              acc[ticketMessage.ticket_id].push(ticketMessage);
              return acc;
            }, {});
          }),
        ),
    );

    return messagesByTicket;
  }
}
