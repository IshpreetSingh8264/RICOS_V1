import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { GroupsService } from './groups.service';
import { GroupsController } from './groups.controller';
import { PrismaModule } from '../../../../libs/prisma/src/prisma.module';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret:
        process.env.JWT_SECRET ||
        'your_super_secret_jwt_key_change_in_production',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [GroupsController],
  providers: [GroupsService],
})
export class GroupsModule {}
