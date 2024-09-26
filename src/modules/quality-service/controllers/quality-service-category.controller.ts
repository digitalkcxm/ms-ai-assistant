import { Controller, Delete, Get, Post, Put } from '@nestjs/common';
import {
  QualityServiceCategoryService,
  QualityServiceSurveyService,
} from '../services';

@Controller('quality-service-categories')
export class QualityServiceCategoryController {
  constructor(
    private readonly qualityServiceCategoryService: QualityServiceCategoryService,
    private readonly qualityServiceSurveyService: QualityServiceSurveyService,
  ) {}

  @Get()
  getPaged() {}

  @Get(':qualityServiceCategoryId')
  getById() {}

  @Get(':qualityServiceCategoryId/surveys')
  getSurveys() {}

  @Post()
  create() {}

  @Put()
  update() {}

  @Delete()
  delete() {}
}
