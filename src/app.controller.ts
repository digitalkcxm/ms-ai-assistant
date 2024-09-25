import { Body, Controller, Post } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('analyze-ticket')
  analyzeTicket(@Body() body: { instructions: string[]; inputs: string[] }) {
    const { instructions, inputs } = body;
    return this.appService.analyzeTicket(instructions, inputs);
  }
}
