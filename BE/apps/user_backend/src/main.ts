import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { UserBackendModule } from './user_backend.module';
import * as dotenv from 'dotenv';
import { existsSync } from 'fs';

const envPath = existsSync('./.env') ? './.env' : './common.env';
dotenv.config({ path: envPath });

async function bootstrap() {
  const app = await NestFactory.create(UserBackendModule);
  
  // Enable CORS for frontend
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:5174',

      // frontend URL
      'https://d6cf94be-1ad6-4d8d-b32f-956f520e7444-00-1ct3zfbud5dw0.pike.replit.dev',

      // backend port 3000 URL
      'https://3000-d6cf94be-1ad6-4d8d-b32f-956f520e7444-00-1ct3zfbud5dw0.pike.replit.dev'
    ],    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });
  
  app.useGlobalPipes(new ValidationPipe());
  const port = process.env.USER_BACKEND_PORT || 8080;
  await app.listen(port);
  console.log(`User Backend is running on: http://localhost:${port}`);
}
bootstrap();
