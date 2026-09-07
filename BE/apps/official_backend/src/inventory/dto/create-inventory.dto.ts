import { IsInt, IsString, Min } from 'class-validator';

export class CreateInventoryDto {
  @IsString()
  item: string;

  @IsInt()
  @Min(0)
  total_quantity: number;
}
