import { IsString, IsOptional, IsArray, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class GetDisasterNewsDto {
  @IsString()
  @IsOptional()
  location?: string; // Optional override location

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  latitude?: number; // User's latitude

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  longitude?: number; // User's longitude

  @IsString()
  @IsOptional()
  refresh?: string; // Pass "true" to force refresh
}

export class ConversationMessageDto {
  @IsString()
  role: 'user' | 'assistant';

  @IsString()
  content: string;
}

export class ChatWithLLMDto {
  @IsString()
  message: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ConversationMessageDto)
  conversationHistory?: ConversationMessageDto[];
}
