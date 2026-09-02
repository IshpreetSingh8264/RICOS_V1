import { Test, TestingModule } from '@nestjs/testing';
import { OfficialBackendController } from './official_backend.controller';
import { OfficialBackendService } from './official_backend.service';

describe('OfficialBackendController', () => {
  let officialBackendController: OfficialBackendController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [OfficialBackendController],
      providers: [OfficialBackendService],
    }).compile();

    officialBackendController = app.get<OfficialBackendController>(
      OfficialBackendController,
    );
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(officialBackendController.getHello()).toBe('Hello World!');
    });
  });
});
