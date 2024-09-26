import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { VertexAIModule } from './modules/vertex-ai/vertex-ai.module';
import { EnvVars } from './config/env-vars';
import { DatabaseModule } from './modules/database/database.module';
import { QualityServiceModule } from './modules/quality-service/quality-service.module';

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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
