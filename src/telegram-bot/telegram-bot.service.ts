import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Telegraf } from 'telegraf';
import { handleStart } from './handlers/start.handler';
import { createEmployeeSelectionHandler } from './handlers/employee-selection.handler';
import { createTextHandler } from './handlers/text.handler';
import { GeoService } from 'src/geo/geo.service';
import { UploadService } from 'src/upload/upload.service';
import { showMyOrdersHandler } from './handlers/my-orders.handler';
import { newOrderHandler } from './handlers/new-order.handler';

const token: string = process.env.TELEGRAM_BOT_TOKEN!;

@Injectable()
export class TelegramBotService implements OnModuleInit, OnModuleDestroy {
  private bot: Telegraf;
  constructor(
    private readonly prisma: PrismaService,
    private readonly geoService: GeoService,
    private readonly uploadService: UploadService,
  ) {}

  onModuleInit() {
    this.bot = new Telegraf(token);

    this.bot.start((ctx) => handleStart(ctx, this.prisma));
    this.bot.action(
      /select_employee:(.+)/,
      createEmployeeSelectionHandler(this.prisma),
    );

    this.bot.action(/show_myorders(:\d+)?/, showMyOrdersHandler(this.prisma));

    this.bot.action('start_neworder', newOrderHandler());
    this.bot.on(
      'text',
      createTextHandler({
        prisma: this.prisma,
        getCoordinatesFromAddressParts: (args) =>
          this.geoService.getCoordinatesFromAddressParts(args),
        sendQRCodeToVercelBlobDirect: (link, recipeId) =>
          this.uploadService.generateAndUploadQRCode(link, recipeId),
      }),
    );

    void this.bot.launch();
  }

  onModuleDestroy() {
    this.bot.stop();
  }
}
