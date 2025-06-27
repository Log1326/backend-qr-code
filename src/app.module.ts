import { Module } from '@nestjs/common';
import { TelegramBotModule } from './telegram-bot/telegram-bot.module';
import { PrismaModule } from './prisma/prisma.module';
import { SocketGateway } from './socket/socket.gateway';
import { SocketModule } from './socket/socket.module';
import { UploadModule } from './upload/upload.module';
import { EmployeesModule } from './employees/employees.module';
import { RecipesModule } from './recipes/recipes.module';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { CacheModule } from '@nestjs/cache-manager';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { UserCacheInterceptor } from './users/interceptor/UserCacheInterceptor';
import { parseDuration } from './common/parseDuration';

@Module({
  imports: [
    CacheModule.register({
      ttl: parseDuration('10m'),
      isGlobal: true,
    }),
    RecipesModule,
    SocketModule,
    PrismaModule,
    TelegramBotModule,
    SocketModule,
    UploadModule,
    EmployeesModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    SocketGateway,
    {
      provide: APP_INTERCEPTOR,
      useClass: UserCacheInterceptor,
    },
  ],
})
export class AppModule {}
