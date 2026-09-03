import {
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsInt,
  IsNumber,
  MinLength,
  IsDateString,
  IsArray,
} from 'class-validator';

// User Signup DTO
export class UserSignUpDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  full_name: string;

  @IsOptional()
  @IsDateString()
  dob?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsString()
  phone_number: string;

  @IsOptional()
  @IsString()
  alternate_phone?: string;

  @IsString()
  current_address: string;

  @IsString()
  pincode: string;

  @IsString()
  city: string;

  @IsString()
  state: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsBoolean()
  live_location_permission?: boolean;

  @IsOptional()
  @IsNumber()
  home_location_lat?: number;

  @IsOptional()
  @IsNumber()
  home_location_lng?: number;

  @IsString()
  aadhar_id: string;

  @IsOptional()
  @IsString()
  blood_group?: string;

  @IsOptional()
  @IsString()
  medical_conditions?: string;

  @IsOptional()
  @IsString()
  allergies?: string;

  @IsOptional()
  @IsString()
  disabilities?: string;

  @IsString()
  emergency_contact_name: string;

  @IsString()
  emergency_contact_relation: string;

  @IsString()
  emergency_contact_phone: string;

  @IsString()
  primary_language: string;

  @IsOptional()
  @IsString()
  secondary_language?: string;

  @IsOptional()
  @IsBoolean()
  communication_assistance?: boolean;
}

// NGO Signup DTO
export class NGOSignUpDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  ngo_name: string;

  @IsString()
  registration_number: string;

  @IsString()
  ngo_type: string;

  @IsInt()
  year_established: number;

  @IsOptional()
  @IsString()
  mission_statement?: string;

  @IsString()
  official_contact: string;

  @IsOptional()
  @IsString()
  alternate_contact?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsString()
  registered_address: string;

  @IsArray()
  @IsString({ each: true })
  operational_areas: string[];

  @IsOptional()
  @IsNumber()
  location_lat?: number;

  @IsOptional()
  @IsNumber()
  location_lng?: number;

  @IsString()
  admin_name: string;

  @IsString()
  admin_designation: string;

  @IsString()
  admin_mobile: string;

  @IsString()
  @IsEmail()
  admin_email: string;

  @IsString()
  aadhar_card: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  resource_types?: string[];

  @IsOptional()
  @IsInt()
  team_strength?: number;

  @IsString()
  bank_account_number: string;
}

// Government Signup DTO
export class GovernmentSignUpDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  agency_name: string;

  @IsString()
  department: string;

  @IsString()
  govt_level: string;

  @IsString()
  official_id: string;

  @IsString()
  department_code: string;

  @IsString()
  hq_address: string;

  @IsString()
  incharge_name: string;

  @IsString()
  incharge_mobile: string;

  @IsString()
  @IsEmail()
  incharge_email: string;

  @IsOptional()
  @IsString()
  control_room_number?: string;

  @IsArray()
  @IsString({ each: true })
  jurisdiction_area: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  resource_types?: string[];

  @IsOptional()
  @IsInt()
  resource_capacity?: number;

  @IsString()
  bank_account_number: string;
}

// Volunteer Signup DTO
export class VolunteerSignUpDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  group_name: string;

  @IsString()
  volunteer_type: string;

  @IsInt()
  group_size: number;

  @IsArray()
  @IsString({ each: true })
  operational_areas: string[];

  @IsOptional()
  @IsString()
  social_media_link?: string;

  @IsString()
  leader_name: string;

  @IsString()
  leader_phone: string;

  @IsString()
  @IsEmail()
  leader_email: string;

  @IsOptional()
  @IsString()
  id_proof?: string;

  @IsOptional()
  @IsBoolean()
  has_medical_training?: boolean;

  @IsOptional()
  @IsBoolean()
  has_first_aid_cert?: boolean;

  @IsOptional()
  @IsBoolean()
  has_vehicle?: boolean;

  @IsArray()
  @IsString({ each: true })
  languages_spoken: string[];
}

// Common SignIn DTO
export class SignInDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
