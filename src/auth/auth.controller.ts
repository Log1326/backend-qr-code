import {
  Controller,
  Post,
  Req,
  Res,
  UseGuards,
  Get,
  HttpCode,
  BadRequestException,
  Body,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response, Request } from 'express';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { AuthGuard } from '@nestjs/passport';
import { User } from '@prisma/client';

import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
  ApiBody,
} from '@nestjs/swagger';
import { parseDuration } from 'src/common/parseDuration';
import { OrganizationService } from 'src/organization/organization.service';

interface RequestWithUser extends Request {
  user: User;
}

class RegisterByInviteDto {
  token: string;
  email: string;
  name: string;
  password: string;
}

class LoginResponse {
  message: string;
}
const redirect: string = process.env.WEB_LINK_PROJECT!;

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly organizationService: OrganizationService,
  ) {}

  @Post('register-invite')
  @ApiOperation({ summary: 'Register user by invite token' })
  @ApiBody({ type: RegisterByInviteDto })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  async registerByInvite(@Body() body: RegisterByInviteDto) {
    const invite = await this.organizationService.validateInvite(body.token);

    if (invite.email !== body.email) {
      throw new BadRequestException('Email does not match the invite');
    }

    const user = await this.authService.registerUserByInvite({
      email: body.email,
      name: body.name,
      password: body.password,
      organizationId: invite.organizationId,
      role: invite.role,
    });

    await this.organizationService.markInviteAccepted(invite.token);

    return { message: 'User registered successfully', userId: user.id };
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Login user with email and password' })
  @ApiResponse({ status: 200, type: LoginResponse })
  async login(
    @Req() req: RequestWithUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = await this.authService.login(req.user);
    res.cookie('access_token', token.access_token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      maxAge: parseDuration('24h'),
    });
    return { message: 'Logged in' };
  }

  @Post('logout')
  @HttpCode(200)
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, type: LoginResponse })
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
    });
    return { message: 'Logged out' };
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth login' })
  googleLogin() {}

  @Get('google/redirect')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback' })
  @ApiCookieAuth()
  @ApiResponse({ status: 200, type: LoginResponse })
  async googleRedirect(
    @Req() req: RequestWithUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const token = await this.authService.login(req.user);
    res.cookie('access_token', token.access_token, {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return res.redirect(redirect ?? '/');
  }

  @Get('github')
  @UseGuards(AuthGuard('github'))
  @ApiOperation({ summary: 'GitHub OAuth login' })
  githubLogin() {}

  @Get('github/redirect')
  @UseGuards(AuthGuard('github'))
  @ApiOperation({ summary: 'GitHub OAuth callback' })
  @ApiCookieAuth()
  @ApiResponse({ status: 200, type: LoginResponse })
  async githubRedirect(
    @Req() req: RequestWithUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = await this.authService.login(req.user);
    res.cookie('access_token', token.access_token, {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return res.redirect(redirect ?? '');
  }
}
