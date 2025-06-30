import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  Inject,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role, User, AuthProvider } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
}

export interface OAuthLoginDto {
  provider: AuthProvider;
  socialId: string;
  email: string;
  name: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.password)
      throw new UnauthorizedException('Invalid email or password');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid email or password');

    if (user.role === Role.CLIENT)
      throw new ForbiddenException('Access denied for clients');

    return user;
  }
  async signUp(email: string, password: string, name: string): Promise<User> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser)
      throw new ForbiddenException('User with this email already exists');

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: Role.CLIENT,
        provider: AuthProvider.EMAIL,
      },
    });
    return newUser;
  }
  async login(user: User): Promise<{ access_token: string }> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const token = await this.jwtService.signAsync(payload);
    return { access_token: token };
  }

  async validateOAuthLogin(dto: OAuthLoginDto): Promise<User> {
    const { provider, socialId, email, name } = dto;

    let user = await this.prisma.user.findUnique({ where: { email } });

    if (user) {
      if (user.provider !== provider || user.socialId !== socialId) {
        user = await this.prisma.user.update({
          where: { email },
          data: { socialId, provider },
        });
      }
      return user;
    }

    return this.prisma.user.create({
      data: {
        email,
        name,
        socialId,
        provider,
        role: Role.CLIENT,
      },
    });
  }

  async getUserById(userId: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');
    return user;
  }
  async registerUserByInvite(data: {
    email: string;
    name: string;
    password: string;
    organizationId: string;
    role: Role;
  }) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existingUser)
      throw new BadRequestException('User with this email already exists');

    const hashedPassword = await bcrypt.hash(data.password, 10);
    return this.prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        password: hashedPassword,
        role: data.role,
        organizationId: data.organizationId,
        provider: 'EMAIL',
      },
    });
  }
  logout(): { message: string } {
    return { message: 'Logged out successfully' };
  }
}
