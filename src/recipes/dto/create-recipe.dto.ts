import { FieldType, RecipeStatus } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRecipeDto {
  @ApiProperty()
  employeeId: string;

  @ApiPropertyOptional({ description: 'ID клиента (опционально)' })
  clientId?: string;

  @ApiProperty()
  address: string;

  @ApiProperty({ enum: RecipeStatus })
  status: RecipeStatus;

  @ApiPropertyOptional({ default: 0 })
  price?: number;

  @ApiPropertyOptional()
  locationLat?: number;

  @ApiPropertyOptional()
  locationLng?: number;

  @ApiPropertyOptional({
    type: 'array',
    items: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        type: {
          type: 'string',
          enum: Object.values(FieldType),
        },
        description: { type: 'string' },
        order: { type: 'number' },
      },
    },
  })
  parameters?: {
    name: string;
    type: FieldType;
    description: string;
    order: number;
  }[];
}
