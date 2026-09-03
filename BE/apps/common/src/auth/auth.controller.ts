import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  UserSignUpDto,
  NGOSignUpDto,
  GovernmentSignUpDto,
  VolunteerSignUpDto,
  SignInDto,
} from './auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup/user')
  async userSignUp(@Body() signUpDto: UserSignUpDto) {
    return this.authService.userSignUp(signUpDto);
  }

  @Post('signup/ngo')
  async ngoSignUp(@Body() signUpDto: NGOSignUpDto) {
    return this.authService.ngoSignUp(signUpDto);
  }

  @Post('signup/govt')
  async govtSignUp(@Body() signUpDto: GovernmentSignUpDto) {
    return this.authService.govtSignUp(signUpDto);
  }

  @Post('signup/volunteer')
  async volunteerSignUp(@Body() signUpDto: VolunteerSignUpDto) {
    return this.authService.volunteerSignUp(signUpDto);
  }

  @Post('signin')
  async signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto);
  }
}
