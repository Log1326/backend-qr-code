import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Patch,
  UseGuards,
  Request,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { OrganizationService } from './organization.service';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

class CreateOrganizationDto {
  orgName: string;
  superUserEmail: string;
  superUserPassword: string;
  superUserName: string;
}

class CreateInviteDto {
  email: string;
  role: Role;
}

class RegisterUserByInviteDto {
  email: string;
  name: string;
  password: string;
  token: string;
}

class ChangeUserRoleDto {
  newRole: Role;
}

@ApiTags('organizations')
@Controller('organizations')
export class OrganizationController {
  constructor(private readonly orgService: OrganizationService) {}

  @Post()
  @ApiOperation({ summary: 'Create organization with superuser' })
  @ApiBody({ type: CreateOrganizationDto })
  @ApiResponse({
    status: 201,
    description: 'Organization created successfully',
  })
  async createOrganization(@Body() dto: CreateOrganizationDto) {
    return this.orgService.createOrganization(
      dto.orgName,
      dto.superUserEmail,
      dto.superUserPassword,
      dto.superUserName,
    );
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(':orgId/users')
  @ApiOperation({ summary: 'Get all users in organization' })
  @ApiParam({ name: 'orgId', type: 'string' })
  @ApiResponse({ status: 200, description: 'List of users' })
  async getUsersByOrganization(@Param('orgId') orgId: string) {
    return this.orgService.getUsersByOrganization(orgId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post(':orgId/invite')
  @ApiOperation({ summary: 'Invite user to organization' })
  @ApiParam({ name: 'orgId', type: 'string' })
  @ApiBody({ type: CreateInviteDto })
  @ApiResponse({ status: 201, description: 'Invite created successfully' })
  async createInvite(
    @Param('orgId') orgId: string,
    @Body() dto: CreateInviteDto,
    @Request() req,
  ) {
    const inviterId = req.user.id;
    return this.orgService.createInvite(orgId, dto.email, dto.role, inviterId);
  }

  @Post('register-by-invite')
  @ApiOperation({ summary: 'Register user by invite token' })
  @ApiBody({ type: RegisterUserByInviteDto })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  async registerUserByInvite(@Body() dto: RegisterUserByInviteDto) {
    return this.orgService.registerUserByInvite(dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch('users/:userId/role')
  @ApiOperation({ summary: 'Change user role' })
  @ApiParam({ name: 'userId', type: 'string' })
  @ApiBody({ type: ChangeUserRoleDto })
  @ApiResponse({ status: 200, description: 'User role updated' })
  async changeUserRole(
    @Param('userId') userId: string,
    @Body() dto: ChangeUserRoleDto,
    @Request() req,
  ) {
    const changedByUserId = req.user.id;
    return this.orgService.changeUserRole(userId, dto.newRole, changedByUserId);
  }
}
