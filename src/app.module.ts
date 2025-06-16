import { Module } from '@nestjs/common';
import { TelegramBotModule } from './telegram-bot/telegram-bot.module';
import { PrismaModule } from './prisma/prisma.module';
import { SocketGateway } from './socket/socket.gateway';
import { SocketModule } from './socket/socket.module';

@Module({
  imports: [PrismaModule, TelegramBotModule, SocketModule],
  controllers: [],
  providers: [SocketGateway],
})
export class AppModule {}
