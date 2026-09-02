import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../libs/prisma/src/prisma.service';

@Injectable()
export class UserBackendService {
  constructor(private readonly prisma: PrismaService) {}

  getHello(): string {
    return 'Hello World!';
  }

  async getProfile(userId: string) {
    const allUser = await this.prisma.allUsers.findUnique({
      where: { id: userId },
    });

    if (!allUser) throw new NotFoundException('User not found');

    if (allUser.user_type === 'user' && allUser.user_id) {
      const user = await this.prisma.user.findUnique({
        where: { id: allUser.user_id },
      });
      return { ...allUser, ...user };
    }
    return allUser;
  }
}
