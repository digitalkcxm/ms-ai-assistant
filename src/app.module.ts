import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { VertexAIModule } from './vertex-ai.module';
import { EnvVars } from './env-vars';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
