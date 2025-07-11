import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { User, $Enums } from '@prisma/client';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { UserDto } from 'src/users/dto/user.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CacheTTL } from '@nestjs/cache-manager';
import { UserCacheInterceptor } from './interceptor/UserCacheInterceptor';
import { parseDuration } from 'src/common/parseDuration';
import { RequestWithUser } from 'src/auth/interface/request-with-user.interface';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(UserCacheInterceptor)
  @CacheTTL(parseDuration('1h'))
  @Get('profile')
  @ApiOperation({ summary: 'Get current logged in user' })
  @ApiCookieAuth()
  @ApiResponse({ status: 200, type: UserDto })
  async getFrofile(@Req() req: RequestWithUser) {
    return this.usersService.findById(req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, type: [UserDto] })
  async findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: UserDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findById(@Param('id') id: string): Promise<{
    name: string;
    id: string;
    email: string;
    avatarUrl: string | null;
    role: $Enums.Role;
    socialId: string | null;
    provider: $Enums.AuthProvider;
    createdAt: Date;
    organizationId: string;
    organization: {
      name: string;
    };
  }> {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, type: UserDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(
    @Param('id') id: string,
    @Body() data: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: UserDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async delete(@Param('id') id: string): Promise<User> {
    return this.usersService.delete(id);
  }
}
