import { Controller, Delete, Post, Put } from '@nestjs/common';
import { QualityServiceSurveyService } from '../services';

@Controller('quality-service-surveys')
export class QualityServiceSurveyController {
  constructor(
    private readonly qualityServiceSurveyService: QualityServiceSurveyService,
  ) {}
  @Post()
  create() {}

  @Put()
  update() {}

  @Delete()
  delete() {}
}
