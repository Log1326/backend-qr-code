import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  UseGuards,
  Delete,
} from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';

@ApiTags('Organization')
@Controller('organization')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new organization with a superuser' })
  @ApiBody({
    schema: {
      example: {
        name: 'My Company',
        email: 'admin@company.com',
        password: 'securePass123',
        userName: 'Admin User',
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Organization and superuser successfully created',
  })
  async createOrganization(
    @Body()
    body: {
      name: string;
      email: string;
      password: string;
      userName: string;
    },
  ) {
    return this.organizationService.createOrganization(
      body.name,
      body.email,
      body.password,
      body.userName,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPERUSER, Role.ADMIN)
  @ApiBearerAuth()
  @Get(':orgId/users')
  @ApiOperation({ summary: 'Get all users within an organization' })
  @ApiParam({ name: 'orgId', required: true, description: 'Organization ID' })
  @ApiResponse({
    status: 200,
    description: 'List of users in the organization',
  })
  async getUsers(@Param('orgId') orgId: string) {
    return this.organizationService.getUsersByOrganization(orgId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPERUSER, Role.ADMIN)
  @ApiBearerAuth()
  @Post(':orgId/invite')
  @ApiOperation({ summary: 'Create an invite for a new user' })
  @ApiParam({ name: 'orgId', required: true, description: 'Organization ID' })
  @ApiBody({
    schema: {
      example: {
        email: 'newuser@example.com',
        role: 'EMPLOYEE',
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Invitation token created successfully',
  })
  async createInvite(
    @Param('orgId') orgId: string,
    @Body() body: { email: string; role: Role },
  ) {
    return this.organizationService.createInvite(orgId, body.email, body.role);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPERUSER, Role.ADMIN)
  @ApiBearerAuth()
  @Delete(':orgId/users/:userId')
  @ApiOperation({ summary: 'Remove a user from an organization' })
  @ApiParam({ name: 'orgId', description: 'Organization ID' })
  @ApiParam({ name: 'userId', description: 'User ID to remove' })
  @ApiResponse({
    status: 200,
    description: 'User successfully removed from the organization',
  })
  async removeUser(
    @Param('orgId') orgId: string,
    @Param('userId') userId: string,
  ) {
    await this.organizationService.removeUserFromOrganization(userId, orgId);
    return { message: 'User removed from organization' };
  }
}
