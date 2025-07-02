import { AuthProvider } from '@prisma/client';
import { IsEmail, IsEnum, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class OAuthLoginDto {
  @ApiProperty({ enum: AuthProvider })
  @IsEnum(AuthProvider)
  provider: AuthProvider;

  @ApiProperty({ example: 'social-unique-id-12345' })
  @IsString()
  @IsNotEmpty()
  socialId: string;

  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'User Name' })
  @IsString()
  @IsNotEmpty()
  name: string;
}
