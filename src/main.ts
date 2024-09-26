import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { EnvVars } from './config/env-vars';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService<EnvVars>);

  const port = configService.get<number>('PORT', 4321);

  await app.listen(port);
  console.log(`Server is running on ::${port}`);
}
bootstrap();
