import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { OfficialBackendController } from './official_backend.controller';
import { OfficialBackendService } from './official_backend.service';
import { PrismaModule } from '../../../libs/prisma/src/prisma.module';
import { JwtStrategy } from '../../../libs/auth/jwt.strategy';
import { InventoryModule } from './inventory/inventory.module';
import { GroupsModule } from './groups/groups.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { DonationModule } from './donation/donation.module';

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
    InventoryModule,
    GroupsModule,
    DashboardModule,
    DonationModule,
  ],
  controllers: [OfficialBackendController],
  providers: [OfficialBackendService, JwtStrategy],
})
export class OfficialBackendModule {}
