import { AuthProvider, Role } from '@prisma/client';

export interface OAuthLoginDto {
  provider: AuthProvider;
  socialId: string;
  email: string;
  name: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
}
