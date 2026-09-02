import { Module } from '@nestjs/common';
import { CommonController } from './common.controller';
import { CommonService } from './common.service';
import { PrismaModule } from '../../../libs/prisma/src/prisma.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [CommonController],
  providers: [CommonService],
})
export class CommonModule {}
