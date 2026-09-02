import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { UserBackendController } from './user_backend.controller';
import { UserBackendService } from './user_backend.service';
import { PrismaModule } from '../../../libs/prisma/src/prisma.module';
import { JwtStrategy } from '../../../libs/auth/jwt.strategy';
import { NewsModule } from './news/news.module';
import { MapModule } from './map/map.module';
import { DonationsModule } from './donations/donations.module';
import { SosModule } from './sos/sos.module';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    JwtModule.register({
      secret:
        process.env.JWT_SECRET ||
        'your_super_secret_jwt_key_change_in_production',
      signOptions: { expiresIn: '24h' },
    }),
    NewsModule,
    MapModule,
    DonationsModule,
    SosModule,
  ],
  controllers: [UserBackendController],
  providers: [UserBackendService, JwtStrategy],
})
export class UserBackendModule {}
