import { ConfigService } from '@nestjs/config';
import 'dotenv/config';
import * as dotenv from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';

import * as fs from 'fs';
import * as path from 'node:path';
import { TypeOrmConfigService } from '@/modules/database/config/type-orm-config.service';

const data: any = dotenv.parse(fs.readFileSync('.env'));

export const config = new TypeOrmConfigService(
  new ConfigService(data || process.env),
);

export default new DataSource({
  ...(config.createTypeOrmOptions() as DataSourceOptions),
  ...{
    entities: [path.join(__dirname, './src/modules/**/*.entity{.ts,.js}')],
    migrations: [
      path.join(__dirname, './src/modules/database/migrations/*{.ts,.js}'),
    ],
  },
});
