import { Module } from '@nestjs/common';
import { TelegramBotService } from './telegram-bot.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { GeoModule } from 'src/geo/geo.module';
import { UploadModule } from 'src/upload/upload.module';

@Module({
  imports: [PrismaModule, GeoModule, UploadModule],
  providers: [TelegramBotService],
})
export class TelegramBotModule {}
