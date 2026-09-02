import { Injectable } from '@nestjs/common';

@Injectable()
export class OfficialBackendService {
  getHello(): string {
    return 'Hello World!';
  }
}
