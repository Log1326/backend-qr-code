import { Module } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { RecipesModule } from 'src/recipes/recipes.module';

@Module({
  imports: [RecipesModule],
  providers: [SocketGateway],
  exports: [SocketGateway],
})
export class SocketModule {}
