import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { VertexAIModule } from './modules/vertex-ai/vertex-ai.module';
import { EnvVars } from './config/env-vars';
import { DatabaseModule } from './modules/database/database.module';
import { QualityServiceModule } from './modules/quality-service/quality-service.module';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    QualityServiceModule,
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
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<EnvVars>) => ({
        prefix: 'ai-assistant',
        connection: {
          host: configService.getOrThrow<string>('REDIS_HOST'),
          port: configService.getOrThrow<number>('REDIS_PORT'),
        },
      }),
    }),
    BullBoardModule.forRoot({
      route: '/queues',
      adapter: ExpressAdapter,
    }),
  ],
})
export class AppModule {}
