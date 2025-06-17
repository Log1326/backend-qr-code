import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { put } from '@vercel/blob';
import * as QRCode from 'qrcode';
import type { PutBlobResult } from '@vercel/blob';

@Injectable()
export class UploadService {
  constructor(private readonly prisma: PrismaService) {}

  async uploadFile(
    file: Express.Multer.File,
    recipeId: string,
  ): Promise<PutBlobResult> {
    const blob = await put(file.originalname, file.buffer, {
      access: 'public',
      allowOverwrite: true,
    });

    await this.prisma.recipe.update({
      where: { id: recipeId },
      data: { qrCodeUrl: blob.url },
    });

    return blob;
  }

  async generateAndUploadQRCode(
    url: string,
    recipeId: string,
  ): Promise<{ buffer: Buffer; url: string }> {
    const qrBuffer = await QRCode.toBuffer(url, {
      type: 'png',
      errorCorrectionLevel: 'H',
    });

    const blob = await put(`${recipeId}.png`, qrBuffer, {
      access: 'public',
      allowOverwrite: true,
    });

    await this.prisma.recipe.update({
      where: { id: recipeId },
      data: { qrCodeUrl: blob.url },
    });

    return {
      buffer: qrBuffer,
      url: blob.url,
    };
  }
}
