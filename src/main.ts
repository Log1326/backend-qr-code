import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

const PORT = process.env.PORT ?? 3001;
const origin: string = process.env.WEB_LINK_PROJECT!;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('QR-CODE API')
    .setDescription('Документация API')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.enableCors({
    origin,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  app.useWebSocketAdapter(new IoAdapter(app));
  app.useGlobalFilters(new AllExceptionsFilter());

  await app.listen(PORT);
  console.log('Application is starting with port:', PORT);
}
bootstrap();
