import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateInventoryDto {
  @IsOptional()
  @IsString()
  item?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  total_quantity?: number;
}
