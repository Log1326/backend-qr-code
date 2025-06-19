import { Injectable } from '@nestjs/common';
import {
  Employee,
  EventType,
  FieldType,
  Recipe,
  RecipeStatus,
} from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';

@Injectable()
export class RecipeService {
  constructor(private readonly prisma: PrismaService) {}
  async updateStatus(recipeId: string, newStatus: RecipeStatus): Promise<void> {
    await this.prisma.recipe.update({
      where: { id: recipeId },
      data: {
        status: newStatus,
      },
      select: {
        id: true,
        status: true,
      },
    });

    await this.prisma.recipeEvent.create({
      data: {
        recipeId,
        type: EventType.STATUS_CHANGE,
      },
    });
  }
  async reorder(
    status: RecipeStatus,
    recipes: { id: string; position: number }[],
  ): Promise<
    | {
        success: boolean;
        message: string;
      }
    | {
        success: boolean;
        message?: undefined;
      }
  > {
    const ids = recipes.map((r) => r.id);
    const currentRecipes = await this.prisma.recipe.findMany({
      where: { id: { in: ids } },
      select: { id: true, position: true, status: true },
    });

    const updates = recipes.filter((newRecipe) => {
      const current = currentRecipes.find((cr) => cr.id === newRecipe.id);
      return (
        !current ||
        current.position !== newRecipe.position ||
        current.status !== status
      );
    });

    if (updates.length === 0) {
      return { success: true, message: 'No changes needed' };
    }

    await this.prisma.$transaction(async (tx) => {
      const tempSQL = `
        UPDATE "Recipe"
        SET "position" = CASE
          ${updates.map((r, i) => `WHEN id = '${r.id}' THEN ${-1000 - i}`).join('\n')}
          ELSE "position"
        END
        WHERE id IN (${updates.map((r) => `'${r.id}'`).join(',')});
      `;

      const finalSQL = `
        UPDATE "Recipe"
        SET
          "position" = CASE
            ${updates.map((r) => `WHEN id = '${r.id}' THEN ${r.position}`).join('\n')}
            ELSE "position"
          END,
          "status" = CASE
            ${updates.map((r) => `WHEN id = '${r.id}' THEN '${status}'::"RecipeStatus"`).join('\n')}
            ELSE "status"
          END
        WHERE id IN (${updates.map((r) => `'${r.id}'`).join(',')});
      `;

      await tx.$executeRawUnsafe(tempSQL);
      await tx.$executeRawUnsafe(finalSQL);
    });

    return { success: true };
  }
  async create(dto: CreateRecipeDto): Promise<{
    id: string;
  }> {
    const max = await this.prisma.recipe.aggregate({
      where: { status: dto.status },
      _max: { position: true },
    });
    const nextPosition = (max._max.position ?? -1) + 1;

    const recipe = await this.prisma.recipe.create({
      data: {
        employee: { connect: { id: dto.employeeId } },
        address: dto.address,
        position: nextPosition,
        clientName: dto.clientName,
        status: dto.status,
        price: dto.price ?? 0,
        locationLat: dto.locationLat,
        locationLng: dto.locationLng,
        parameters: dto.parameters
          ? {
              createMany: {
                data: dto.parameters,
              },
            }
          : undefined,
      },
      include: {
        parameters: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    return { id: recipe.id };
  }

  async findAll(): Promise<
    {
      id: string;
      status: RecipeStatus;
      price: number;
      clientName: string;
      createdAt: Date;
      position: number;
      employee: {
        name: string;
        avatarUrl: string | null;
      };
      parameters: {
        id: string;
        name: string;
        type: FieldType;
        description: string;
        order: number;
      }[];
    }[]
  > {
    return await this.prisma.recipe.findMany({
      select: {
        id: true,
        status: true,
        price: true,
        clientName: true,
        createdAt: true,
        position: true,
        employee: {
          select: {
            name: true,
            avatarUrl: true,
          },
        },
        parameters: {
          select: {
            id: true,
            name: true,
            type: true,
            description: true,
            order: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: {
        position: 'asc',
      },
    });
  }
  async getDataTable(): Promise<
    {
      id: string;
      employeeName: string;
      clientName: string;
      price: number;
      status: RecipeStatus;
      createdAt: string;
    }[]
  > {
    const recipes = await this.prisma.recipe.findMany({
      include: {
        employee: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return recipes.map((recipe) => ({
      id: recipe.id,
      employeeName: recipe.employee.name,
      clientName: recipe.clientName,
      price: recipe.price ?? 0,
      status: recipe.status,
      createdAt: recipe.createdAt.toISOString(),
    }));
  }
  async getInfo(): Promise<[Recipe[], Employee[]]> {
    const recipes = await this.prisma.recipe.findMany({
      include: {
        employee: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const employees = await this.prisma.employee.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    return [recipes, employees];
  }
  async getOrdersWithLocation() {
    return this.prisma.recipe.findMany({
      where: {
        locationLat: { not: null },
        locationLng: { not: null },
      },
      select: {
        id: true,
        address: true,
        locationLat: true,
        locationLng: true,
        clientName: true,
        status: true,
        price: true,
        employee: {
          select: {
            name: true,
            avatarUrl: true,
          },
        },
      },
    });
  }
  async getById(id: string): Promise<Recipe | null> {
    await this.prisma.recipeEvent.create({
      data: {
        type: EventType.VIEWED,
        recipeId: id,
      },
    });

    return this.prisma.recipe.findUnique({
      where: { id },
      include: {
        employee: {
          select: { name: true },
        },
        parameters: {
          orderBy: { order: 'asc' },
        },
      },
    });
  }
}
