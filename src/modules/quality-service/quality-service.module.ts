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
  QualityServiceAnalyzeTicketConsumer,
  QualityServiceCategoryService,
  QualityServiceSurveyService,
} from './services';
import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { EnvVars } from '@/config/env-vars';
import { ConfigService } from '@nestjs/config';
import { VertexAIModule } from '../vertex-ai/vertex-ai.module';

@Module({
  imports: [
    DatabaseModule,
    VertexAIModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService<EnvVars>) => ({
        vertexOptions: {
          googleAuthOptions: {
            credentials: {
              client_email: configService.getOrThrow<string>(
                'GCLOUD_SERVICE_ACCOUNT_EMAIL',
              ),
              private_key: configService.getOrThrow<string>(
                'GCLOUD_SERVICE_ACCOUNT_PRIVATE_KEY',
              ),
            },
          },
          project: configService.getOrThrow<string>('GCLOUD_PROJECT_ID'),
          location: configService.getOrThrow<string>('GCLOUD_LOCATION'),
        },
      }),
    }),
    TypeOrmModule.forFeature([
      QualityServiceCategoryEntity,
      QualityServiceGoalEntity,
      QualityServiceGroupEntity,
      QualityServiceSurveyEntity,
      QualityServiceSurveyAnswerEntity,
    ]),
    HttpModule,
    BullModule.registerQueue({
      name: 'quality_service_tickets',
    }),
    BullModule.registerFlowProducer({
      name: 'quality_service_tickets',
    }),
    BullBoardModule.forFeature({
      name: 'quality_service_tickets',
      adapter: BullMQAdapter,
    }),
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
    QualityServiceAnalyzeTicketConsumer,
  ],
})
export class QualityServiceModule {}
