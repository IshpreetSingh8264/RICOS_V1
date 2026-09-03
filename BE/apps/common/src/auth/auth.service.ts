import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../../libs/prisma/src/prisma.service';
import * as bcrypt from 'bcrypt';
import {
  UserSignUpDto,
  NGOSignUpDto,
  GovernmentSignUpDto,
  VolunteerSignUpDto,
  SignInDto,
} from './auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // User Signup
  async userSignUp(signUpDto: UserSignUpDto) {
    const existingUser = await this.prisma.allUsers.findUnique({
      where: { email: signUpDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(signUpDto.password, 10);

    const { password, ...userData } = signUpDto;

    // Convert dob string to Date object if present
    const userDataWithDate = {
      ...userData,
      dob: userData.dob ? new Date(userData.dob) : undefined,
    };

    const user = await this.prisma.user.create({
      data: userDataWithDate,
    });

    await this.prisma.allUsers.create({
      data: {
        email: signUpDto.email,
        password: hashedPassword,
        user_type: 'user',
        full_name: signUpDto.full_name,
        user_id: user.id,
      },
    });

    const payload = {
      sub: user.id,
      email: user.email,
      userType: 'user',
      role: 'user',
      full_name: signUpDto.full_name,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user_type: 'user',
    };
  }

  // NGO Signup
  async ngoSignUp(signUpDto: NGOSignUpDto) {
    const existingNGO = await this.prisma.allUsers.findUnique({
      where: { email: signUpDto.email },
    });

    if (existingNGO) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(signUpDto.password, 10);

    const { password, ...ngoData } = signUpDto;

    const ngo = await this.prisma.nGO.create({
      data: {
        ...ngoData,
        operational_areas: JSON.stringify(signUpDto.operational_areas),
        resource_types: signUpDto.resource_types
          ? JSON.stringify(signUpDto.resource_types)
          : null,
      },
    });

    const allUser = await this.prisma.allUsers.create({
      data: {
        email: signUpDto.email,
        password: hashedPassword,
        user_type: 'ngo',
        full_name: signUpDto.ngo_name,
        ngo_id: ngo.id,
      },
    });

    // Create responder entry
    await this.prisma.responder.create({
      data: {
        ngo_id: ngo.id,
        services_provided: signUpDto.resource_types
          ? JSON.stringify(signUpDto.resource_types)
          : 'General Relief',
        bank_account_number: signUpDto.bank_account_number,
        location_lat: signUpDto.location_lat,
        location_lng: signUpDto.location_lng,
        location_address: signUpDto.registered_address,
      },
    });

    const payload = {
      sub: allUser.id,
      email: ngo.email,
      userType: 'ngo',
      role: 'ngo',
      full_name: signUpDto.ngo_name,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user_type: 'ngo',
    };
  }

  // Government Signup
  async govtSignUp(signUpDto: GovernmentSignUpDto) {
    const existingGovt = await this.prisma.allUsers.findUnique({
      where: { email: signUpDto.email },
    });

    if (existingGovt) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(signUpDto.password, 10);

    const { password, ...govtData } = signUpDto;

    const govt = await this.prisma.government.create({
      data: {
        ...govtData,
        jurisdiction_area: JSON.stringify(signUpDto.jurisdiction_area),
        resource_types: signUpDto.resource_types
          ? JSON.stringify(signUpDto.resource_types)
          : null,
      },
    });

    const allUser = await this.prisma.allUsers.create({
      data: {
        email: signUpDto.email,
        password: hashedPassword,
        user_type: 'govt',
        full_name: signUpDto.agency_name,
        govt_id: govt.id,
      },
    });

    // Create responder entry
    await this.prisma.responder.create({
      data: {
        govt_id: govt.id,
        services_provided: signUpDto.resource_types
          ? JSON.stringify(signUpDto.resource_types)
          : 'Government Services',
        bank_account_number: signUpDto.bank_account_number,
        location_address: signUpDto.hq_address,
      },
    });

    const payload = {
      sub: allUser.id,
      email: govt.email,
      userType: 'govt',
      role: 'govt',
      full_name: signUpDto.agency_name,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user_type: 'govt',
    };
  }

  // Volunteer Signup
  async volunteerSignUp(signUpDto: VolunteerSignUpDto) {
    const existingVolunteer = await this.prisma.allUsers.findUnique({
      where: { email: signUpDto.email },
    });

    if (existingVolunteer) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(signUpDto.password, 10);

    const { password, ...volunteerData } = signUpDto;

    const volunteer = await this.prisma.volunteer.create({
      data: {
        ...volunteerData,
        operational_areas: JSON.stringify(signUpDto.operational_areas),
        languages_spoken: JSON.stringify(signUpDto.languages_spoken),
      },
    });

    const allUser = await this.prisma.allUsers.create({
      data: {
        email: signUpDto.email,
        password: hashedPassword,
        user_type: 'volunteer',
        full_name: signUpDto.group_name,
        volunteer_id: volunteer.id,
      },
    });

    // Create responder entry
    await this.prisma.responder.create({
      data: {
        volunteer_id: volunteer.id,
        services_provided: signUpDto.volunteer_type,
        bank_account_number: 'N/A', // Volunteers may not have bank accounts
        location_address: JSON.stringify(signUpDto.operational_areas),
      },
    });

    const payload = {
      sub: allUser.id,
      email: volunteer.email,
      userType: 'volunteer',
      role: 'volunteer',
      full_name: signUpDto.group_name,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user_type: 'volunteer',
    };
  }

  // Unified SignIn - seamless authentication without user_type required
  async signIn(signInDto: SignInDto) {
    const { email, password } = signInDto;

    const authUser = await this.prisma.allUsers.findUnique({
      where: { email },
    });

    if (!authUser) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, authUser.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Use the all_users.id for consistency across all user types
    const payload = {
      sub: authUser.id,  // Use all_users.id for consistency
      email: authUser.email,
      userType: authUser.user_type,
      role: authUser.user_type,
      full_name: authUser.full_name,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user_type: authUser.user_type,
    };
  }
}
