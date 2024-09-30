import {
  BadRequestException,
  Controller,
  Headers,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { QualityServiceAnalyzeService } from '../services';

@Controller('quality-service')
export class QualityServiceController {
  constructor(
    private readonly qualityServiceAnalyzeService: QualityServiceAnalyzeService,
  ) {}

  @Post('ticket/:ticketId/analysis')
  analyzeTicket(
    @Param('ticketId') ticketId: string,
    @Query('apiCoreUrl') apiCoreUrl: string,
  ) {
    if (!apiCoreUrl) {
      throw new BadRequestException('apiCoreUrl is required');
    }

    return this.qualityServiceAnalyzeService.enqueueTicketAnalysis(
      ticketId,
      apiCoreUrl,
    );
  }

  @Post('workflow/:workflowId/analysis')
  analyzeWorkflowTickets(
    @Headers('Authorization') companyToken: string,
    @Param('workflowId') workflowId: string,
    @Query('apiCoreUrl') apiCoreUrl: string,
    @Query('dateStart') dateStart: Date,
    @Query('dateEnd') dateEnd: Date,
  ) {
    if (!companyToken) {
      throw new BadRequestException('companyToken is required');
    }

    return this.qualityServiceAnalyzeService.enqueueWorkflowTicketsAnalysis(
      dateStart,
      dateEnd,
      workflowId,
      apiCoreUrl,
      companyToken,
    );
  }
}
