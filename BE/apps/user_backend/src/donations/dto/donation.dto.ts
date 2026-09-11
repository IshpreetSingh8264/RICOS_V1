import { IsString, IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';

export class CreateDonationDto {
  @IsNumber()
  @Min(1)
  amount: number;

  @IsString()
  recipient_type: 'ngo' | 'govt' | 'volunteer' | 'ricos';

  @IsString()
  @IsOptional()
  recipient_id?: string;

  @IsString()
  @IsOptional()
  message?: string;

  @IsString()
  @IsOptional()
  payment_method?: string;

  @IsBoolean()
  @IsOptional()
  is_anonymous?: boolean;
}

export class DonationResponseDto {
  success: boolean;
  donation_id: string;
  transaction_id: string;
  amount: number;
  currency: string;
  payment_status: string;
  message: string;
}

export class RecipientOrgDto {
  id: string;
  name: string;
  type: string;
  description?: string;
  activeGroups?: number;
}
