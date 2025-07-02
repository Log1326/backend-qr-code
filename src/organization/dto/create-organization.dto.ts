import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class CreateOrganizationDto {
  @ApiProperty()
  @IsNotEmpty()
  organizationName: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @MinLength(6)
  password: string;

  @ApiProperty()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: Role, default: Role.SUPERUSER })
  readonly role: Role = Role.SUPERUSER;
}
