import { IsString, IsOptional, IsIn } from 'class-validator';

export class AssignGroupDto {
  @IsString()
  disaster_report_id: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateAssignmentStatusDto {
  @IsString()
  @IsIn(['active', 'completed', 'cancelled'])
  status: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateOperationStatusDto {
  @IsString()
  @IsIn(['available', 'deployed', 'rescuing'])
  status: string;
}

export class CompleteAssignmentDto {
  @IsOptional()
  @IsString()
  notes?: string;
}
