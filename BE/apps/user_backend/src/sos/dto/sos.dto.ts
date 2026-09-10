import { IsNumber, IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateSOSDto {
  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsNumber()
  @IsOptional()
  accuracy?: number;

  @IsDateString()
  @IsOptional()
  timestamp?: string;
}

export class UpdateSOSDetailsDto {
  @IsString()
  optionalDetails: string;
}

export class SOSResponseDto {
  success: boolean;
  id: string;
  sos_id?: string;
  message: string;
  timestamp: string;
  location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
}
