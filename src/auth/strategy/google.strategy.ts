import { PassportStrategy } from '@nestjs/passport';
import {
  Strategy as GoogleStrategyBase,
  Profile,
} from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { OAuthLoginDto } from './types/types';
import { AuthProvider } from '@prisma/client';

const origin: string = process.env.HOST_URL!;

@Injectable()
export class GoogleStrategy extends PassportStrategy(
  GoogleStrategyBase,
  'google',
) {
  constructor(private readonly authService: AuthService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: `${origin}/auth/google/redirect`,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ): Promise<ReturnType<AuthService['validateOAuthLogin']>> {
    const email = profile.emails?.[0]?.value;
    if (!email) throw new Error('Email not found in Google profile');

    const dto: OAuthLoginDto = {
      provider: AuthProvider.GOOGLE,
      socialId: profile.id,
      email,
      name: profile.displayName,
    };
    return this.authService.validateOAuthLogin(dto);
  }
}
