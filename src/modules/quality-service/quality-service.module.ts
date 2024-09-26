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
  QualityServiceSurveyController,
} from './controllers';
import {
  QualityServiceCategoryService,
  QualityServiceSurveyService,
} from './services';

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
  ],
  controllers: [
    QualityServiceCategoryController,
    QualityServiceSurveyController,
  ],
  providers: [QualityServiceCategoryService, QualityServiceSurveyService],
})
export class QualityServiceModule {}
