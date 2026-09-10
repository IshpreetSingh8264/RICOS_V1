import { IsNumber, IsString, IsOptional, IsBoolean, IsArray, IsEnum } from 'class-validator';

export class UpdateLocationDto {
  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsOptional()
  @IsNumber()
  accuracy?: number;

  @IsEnum(['available', 'deployed', 'rescuing', 'offline'])
  status: 'available' | 'deployed' | 'rescuing' | 'offline';

  @IsOptional()
  @IsNumber()
  battery_level?: number;
}

export class SubmitDisasterReportDto {
  @IsOptional()
  @IsString()
  pincode?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  village?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsEnum(['LOW', 'MODERATE', 'SEVERE'])
  severity: 'LOW' | 'MODERATE' | 'SEVERE';

  @IsOptional()
  @IsString()
  water_level?: string;

  @IsOptional()
  @IsNumber()
  affected_population?: number;

  @IsOptional()
  @IsBoolean()
  stuck_people_found?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  resources_needed?: string[];

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}

export class ApproveReportDto {
  @IsEnum(['approved', 'rejected'])
  status: 'approved' | 'rejected';
}
