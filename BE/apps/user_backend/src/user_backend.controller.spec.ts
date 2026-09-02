import { Test, TestingModule } from '@nestjs/testing';
import { UserBackendController } from './user_backend.controller';
import { UserBackendService } from './user_backend.service';

describe('UserBackendController', () => {
  let userBackendController: UserBackendController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [UserBackendController],
      providers: [UserBackendService],
    }).compile();

    userBackendController = app.get<UserBackendController>(
      UserBackendController,
    );
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(userBackendController.getHello()).toBe('Hello World!');
    });
  });
});
