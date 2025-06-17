import { FieldType, RecipeStatus } from '@prisma/client';

export class CreateRecipeDto {
  employeeId: string;
  clientName: string;
  address: string;
  status: RecipeStatus;
  price?: number;
  locationLat?: number;
  locationLng?: number;
  parameters?: {
    name: string;
    type: FieldType;
    description: string;
    order: number;
  }[];
}
