import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  QualityServiceCategoryEntity,
  QualityServiceGoalEntity,
  QualityServiceGroupEntity,
  QualityServiceSurveyAnswerEntity,
  QualityServiceSurveyEntity,
} from './entities';
import {
  QualityServiceCategoryController,
  QualityServiceController,
  QualityServiceSurveyController,
} from './controllers';
import {
  QualityServiceAnalyzeService,
  QualityServiceCategoryService,
  QualityServiceSurveyService,
} from './services';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    DatabaseModule,
    TypeOrmModule.forFeature([
      QualityServiceCategoryEntity,
      QualityServiceGoalEntity,
      QualityServiceGroupEntity,
      QualityServiceSurveyEntity,
      QualityServiceSurveyAnswerEntity,
    ]),
    HttpModule,
  ],
  controllers: [
    QualityServiceController,
    QualityServiceCategoryController,
    QualityServiceSurveyController,
  ],
  providers: [
    QualityServiceAnalyzeService,
    QualityServiceCategoryService,
    QualityServiceSurveyService,
  ],
})
export class QualityServiceModule {}
