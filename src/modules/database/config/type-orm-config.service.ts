import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { PostgresConnectionCredentialsOptions } from 'typeorm/driver/postgres/PostgresConnectionCredentialsOptions';
import { EnvVars } from '@/config/env-vars';
import {
  QualityServiceCategoryEntity,
  QualityServiceGoalEntity,
  QualityServiceGroupEntity,
  QualityServiceSurveyAnswerEntity,
  QualityServiceSurveyEntity,
} from '@/modules/quality-service/entities';

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  constructor(private readonly configService: ConfigService<EnvVars>) {}

  createTypeOrmOptions(): TypeOrmModuleOptions | Promise<TypeOrmModuleOptions> {
    const dbReadHost = this.configService.get<string>('DB_READ_HOST');
    const slaves: PostgresConnectionCredentialsOptions[] = dbReadHost
      ? [
          {
            host: dbReadHost,
            username: this.configService.get<string>('DB_USERNAME'),
            password: this.configService.get<string>('DB_PASSWORD'),
            database: this.configService.getOrThrow<string>('DB_DATABASE'),
          },
        ]
      : [];

    return {
      applicationName: 'ms-ai-assistant',
      type: 'postgres',
      port: this.configService.get<number>('DB_PORT', 5432),
      synchronize: true,
      useUTC: true,
      namingStrategy: new SnakeNamingStrategy(),
      logging: false,
      entitySkipConstructor: false,
      migrationsRun: false,
      entities: [
        QualityServiceCategoryEntity,
        QualityServiceGoalEntity,
        QualityServiceGroupEntity,
        QualityServiceSurveyEntity,
        QualityServiceSurveyAnswerEntity,
      ],
      replication: {
        master: {
          host: this.configService.getOrThrow<string>('DB_HOST'),
          username: this.configService.get<string>('DB_USERNAME'),
          password: this.configService.get<string>('DB_PASSWORD'),
          database: this.configService.getOrThrow<string>('DB_DATABASE'),
        },
        slaves,
      },
    };
  }
}
