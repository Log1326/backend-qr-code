import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { RecipeService } from './recipes.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';

import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  getSchemaPath,
} from '@nestjs/swagger';
import { RecipeDto } from './dto/recipe.dto';
import { RecipeTableDto } from './dto/recipe-table.dto';
import { UserDto } from 'src/auth/dto/user.dto';

@ApiTags('recipes')
@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipeService: RecipeService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new recipe' })
  @ApiBody({ type: CreateRecipeDto })
  @ApiResponse({ status: 201, description: 'Recipe successfully created' })
  create(@Body() createRecipeDto: CreateRecipeDto) {
    return this.recipeService.create(createRecipeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all recipes' })
  @ApiResponse({
    status: 200,
    description: 'List of recipes',
    type: [RecipeDto],
  })
  findAll() {
    return this.recipeService.findAll();
  }

  @Get('table')
  @ApiOperation({ summary: 'Get recipe data formatted for table' })
  @ApiResponse({
    status: 200,
    description: 'Recipe data for table',
    type: [RecipeTableDto],
  })
  getRecipeForTable() {
    return this.recipeService.getDataTable();
  }

  @Get('info')
  @ApiOperation({ summary: 'Get recipes with employee information' })
  @ApiResponse({
    status: 200,
    description: 'Recipes with employees info',
    schema: {
      type: 'array',
      items: {
        oneOf: [
          { type: 'array', items: { $ref: getSchemaPath(RecipeDto) } },
          { type: 'array', items: { $ref: getSchemaPath(UserDto) } },
        ],
      },
    },
  })
  getRecipesWithEmployees() {
    return this.recipeService.getInfo();
  }

  @Get('with-location')
  @ApiOperation({ summary: 'Get orders with location data' })
  @ApiResponse({
    status: 200,
    description: 'Orders including location info',
    type: [RecipeDto],
  })
  getOrdersWithLocation() {
    return this.recipeService.getOrdersWithLocation();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a recipe by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Recipe ID' })
  @ApiResponse({
    status: 200,
    description: 'Recipe data by ID',
    type: RecipeDto,
  })
  @ApiResponse({ status: 404, description: 'Recipe not found' })
  getRecipeById(@Param('id') id: string) {
    return this.recipeService.getById(id);
  }
}
