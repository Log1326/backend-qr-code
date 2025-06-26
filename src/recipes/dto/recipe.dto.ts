import { ApiProperty } from '@nestjs/swagger';
import { FieldType, RecipeStatus } from '@prisma/client';

export class RecipeEmployeeDto {
  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  avatarUrl: string | null;
}

export class RecipeParameterDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: FieldType })
  type: FieldType;

  @ApiProperty()
  description: string;

  @ApiProperty()
  order: number;
}

export class RecipeDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: RecipeStatus })
  status: RecipeStatus;

  @ApiProperty()
  price: number;

  @ApiProperty()
  address: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  position: number;

  @ApiProperty()
  locationLat?: number;

  @ApiProperty()
  locationLng?: number;

  @ApiProperty()
  qrCodeUrl?: string;

  @ApiProperty({
    type: () => RecipeEmployeeDto,
  })
  employee: RecipeEmployeeDto;

  @ApiProperty({
    type: () => [RecipeParameterDto],
  })
  parameters: RecipeParameterDto[];
}
