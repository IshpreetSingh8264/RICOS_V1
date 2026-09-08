import { IsNumber, IsOptional, IsString, IsIn } from 'class-validator';

export class UpdateGroupLocationDto {
  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsOptional()
  @IsNumber()
  accuracy?: number;

  @IsOptional()
  @IsString()
  @IsIn(['available', 'deployed', 'rescuing', 'offline'])
  status?: string;

  @IsOptional()
  @IsNumber()
  battery_level?: number;
}
