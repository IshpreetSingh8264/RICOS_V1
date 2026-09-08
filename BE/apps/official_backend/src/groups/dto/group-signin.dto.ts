import { IsString, MinLength } from 'class-validator';

export class GroupSignInDto {
  @IsString()
  username: string;

  @IsString()
  @MinLength(6)
  password: string;
}
