import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';

import {
  ApiTags,
  ApiConsumes,
  ApiBody,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';

@ApiTags('upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a file with associated recipeId' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        recipeId: {
          type: 'string',
          description: 'ID of the recipe to associate with the file',
        },
      },
      required: ['file', 'recipeId'],
    },
  })
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Missing file or recipeId' })
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('recipeId') recipeId: string,
  ) {
    if (!file || !recipeId)
      throw new BadRequestException('Missing file or recipeId');

    const blob = await this.uploadService.uploadFile(file, recipeId);
    return blob;
  }
}
