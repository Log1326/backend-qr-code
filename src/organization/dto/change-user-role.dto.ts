import { Role } from '@prisma/client';
import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangeUserRoleDto {
  @ApiProperty({ enum: Role })
  @IsEnum(Role)
  newRole: Role;
}
