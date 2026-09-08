import {
  IsString,
  IsInt,
  IsArray,
  IsEnum,
  MinLength,
  Min,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { TTLType, ResourceAllocation } from './create-group.dto';

export class UpdateGroupDto {
  @IsOptional()
  @IsString()
  group_name?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsEnum(TTLType)
  ttl_type?: TTLType;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsArray()
  resource_allocations?: ResourceAllocation[];
}
