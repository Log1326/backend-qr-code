import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role, User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { OrganizationService } from 'src/organization/organization.service';
import { CreateOrganizationDto } from 'src/organization/dto/create-organization.dto';
import { OAuthLoginDto } from './dto/oauth-login.dto';
import { JwtPayload } from './strategy/types/types';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly organizationService: OrganizationService,
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
  async signUpWithOrganization(dto: CreateOrganizationDto) {
    return this.organizationService.create(dto);
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
    const { provider, socialId, email } = dto;
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user)
      throw new ForbiddenException(
        'Access denied. You must be invited by an organization administrator before using OAuth login.',
      );

    if (user.provider !== provider || user.socialId !== socialId) {
      return this.prisma.user.update({
        where: { email },
        data: { socialId, provider },
      });
    }

    return user;
  }

  async getUserById(userId: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');
    return user;
  }
}
