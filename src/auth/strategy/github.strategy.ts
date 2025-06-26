import { PassportStrategy } from '@nestjs/passport';
import {
  Strategy as GithubStrategyBase,
  Profile as GithubProfile,
} from 'passport-github2';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { OAuthLoginDto } from './types/types';
import { AuthProvider } from '@prisma/client';

@Injectable()
export class GithubStrategy extends PassportStrategy(
  GithubStrategyBase,
  'github',
) {
  constructor(private readonly authService: AuthService) {
    super({
      clientID: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      callbackURL: `${process.env.HOST_URL}/auth/github/redirect`,
      scope: ['user:email'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: GithubProfile,
  ): Promise<ReturnType<AuthService['validateOAuthLogin']>> {
    const email = profile.emails?.[0]?.value;
    if (!email)
      throw new UnauthorizedException('Email not found in GitHub profile');

    const dto: OAuthLoginDto = {
      provider: AuthProvider.GITHUB,
      socialId: profile.id,
      email,
      name: profile.displayName || profile.username || 'Unknown',
    };
    return this.authService.validateOAuthLogin(dto);
  }
}
