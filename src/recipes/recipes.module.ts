import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RecipeService } from './recipes.service';
import { RecipesController } from './recipes.controller';

@Module({
  controllers: [RecipesController],
  providers: [PrismaService, RecipeService],
  exports: [RecipeService],
})
export class RecipesModule {}
