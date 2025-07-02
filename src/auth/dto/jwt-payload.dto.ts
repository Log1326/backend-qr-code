import { Role } from '@prisma/client';
import { IsEmail, IsEnum, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class JwtPayloadDto {
  @ApiProperty({ example: 'user-uuid-1234' })
  @IsString()
  sub: string;

  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ enum: Role })
  @IsEnum(Role)
  role: Role;
}
