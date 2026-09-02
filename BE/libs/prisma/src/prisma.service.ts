import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env as early as possible to ensure PrismaClient reads DATABASE_URL correctly
dotenv.config({ path: path.join(process.cwd(), 'common.env') });

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    // Pass the datasource explicitly to ensure the client uses the local DB
    const dbUrl = process.env.DATABASE_URL || '';
    super({
      datasources: { db: { url: dbUrl } },
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
