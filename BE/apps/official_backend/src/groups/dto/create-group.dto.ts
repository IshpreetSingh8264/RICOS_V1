import {
  IsString,
  IsInt,
  IsArray,
  IsEnum,
  MinLength,
  Min,
  IsOptional,
} from 'class-validator';

export enum TTLType {
  FIVE_DAYS = '5_days',
  TWENTY_DAYS = '20_days',
  THIRTY_DAYS = '30_days',
  NO_EXPIRY = 'no_expiry',
}

export class ResourceAllocation {
  @IsString()
  inventory_item_id: string;

  @IsInt()
  @Min(1)
  allocated_quantity: number;
}

export class CreateGroupDto {
  @IsString()
  group_name: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEnum(TTLType)
  ttl_type: TTLType;

  @IsString()
  @IsOptional()
  email?: string;

  @IsArray()
  @IsOptional()
  resource_allocations?: ResourceAllocation[];
}
