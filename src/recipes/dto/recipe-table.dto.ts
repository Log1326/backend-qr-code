import { ApiProperty } from '@nestjs/swagger';
import { RecipeStatus } from '@prisma/client';

export class RecipeTableDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  employeeName: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  status: RecipeStatus;

  @ApiProperty()
  createdAt: string;
}
