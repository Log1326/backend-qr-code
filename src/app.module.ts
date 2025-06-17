import { Module } from '@nestjs/common';
import { TelegramBotModule } from './telegram-bot/telegram-bot.module';
import { PrismaModule } from './prisma/prisma.module';
import { SocketGateway } from './socket/socket.gateway';
import { SocketModule } from './socket/socket.module';
import { UploadModule } from './upload/upload.module';
import { EmployeesModule } from './employees/employees.module';
import { RecipesModule } from './recipes/recipes.module';

@Module({
  imports: [
    RecipesModule,
    SocketModule,
    PrismaModule,
    TelegramBotModule,
    SocketModule,
    UploadModule,
    EmployeesModule,
  ],
  controllers: [],
  providers: [SocketGateway],
})
export class AppModule {}
