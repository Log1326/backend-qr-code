import { ApiProperty } from '@nestjs/swagger';
import { Role, AuthProvider, User } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  IsDateString,
} from 'class-validator';

export class UserDto {
  @ApiProperty()
  @IsUUID()
  id: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ nullable: true })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiProperty({ enum: Role })
  @IsEnum(Role)
  role: Role;

  @ApiProperty({ nullable: true })
  @IsOptional()
  @IsString()
  socialId?: string;

  @ApiProperty({ enum: AuthProvider })
  @IsEnum(AuthProvider)
  provider: AuthProvider;

  @ApiProperty()
  @IsDateString()
  createdAt: Date;

  @ApiProperty({ nullable: true })
  @IsOptional()
  @IsString()
  organizationId?: string;
  static from(user: User): UserDto {
    const dto = new UserDto();
    dto.id = user.id;
    dto.email = user.email;
    dto.name = user.name;
    dto.avatarUrl = user.avatarUrl ?? '';
    dto.role = user.role;
    dto.socialId = user.socialId ?? '';
    dto.provider = user.provider;
    dto.createdAt = user.createdAt;
    dto.organizationId = user.organizationId ?? '';
    return dto;
  }
}
