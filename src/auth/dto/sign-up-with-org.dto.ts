import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class SignUpWithOrgDto {
  @IsNotEmpty()
  orgName: string;

  @IsNotEmpty()
  superUserName: string;

  @IsEmail()
  superUserEmail: string;

  @MinLength(6)
  superUserPassword: string;
}
