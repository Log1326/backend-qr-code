import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { IoAdapter } from '@nestjs/platform-socket.io';

const PORT =
  process.env.RENDER === 'true'
    ? parseInt(process.env.PORT || '3000', 10)
    : 3001;
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useWebSocketAdapter(new IoAdapter(app));
  await app.listen(PORT);
  console.log('Application is starting');
}
bootstrap();
