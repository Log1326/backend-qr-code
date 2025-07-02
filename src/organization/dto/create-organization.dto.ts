import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrganizationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  orgName: string;

  @ApiProperty()
  @IsEmail()
  superUserEmail: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  superUserPassword: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  superUserName: string;
}
