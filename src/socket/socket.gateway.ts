import { Server, Socket } from 'socket.io';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { RecipeService } from 'src/recipes/recipes.service';
import { RecipeStatus } from '@prisma/client';

interface ConnectedEmployee {
  socketId: string;
  employeeId: string;
}
const origin: string = process.env.WEB_LINK_PROJECT!;

@WebSocketGateway({
  path: '/socket',
  cors: {
    origin: origin,
  },
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly recipeService: RecipeService) {}

  @WebSocketServer()
  server: Server;

  private connectedEmployees = new Map<string, ConnectedEmployee>();

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.connectedEmployees.delete(client.id);
    this.emitEmployeesUpdated();
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join')
  async handleJoin(
    @MessageBody() data: { employeeId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { employeeId } = data;
    if (typeof employeeId !== 'string' || !employeeId.trim()) {
      client.disconnect();
      return;
    }

    this.connectedEmployees.set(client.id, { socketId: client.id, employeeId });
    await client.join('chat-room');
    this.emitEmployeesUpdated();
  }

  @SubscribeMessage('recipe-updated')
  async handleRecipeUpdated(
    @MessageBody()
    data: {
      id: string;
      status: RecipeStatus;
    },
    @ConnectedSocket() client: Socket,
  ) {
    const { id, status } = data;
    try {
      await this.recipeService.updateStatus(id, status);
      client.broadcast.emit('recipe-updated', data);
    } catch (error) {
      console.error('Error updating recipe status:', error);
      client.emit('error', { message: 'Failed to update recipe status' });
    }
  }

  @SubscribeMessage('recipe-reordered')
  async handleRecipeReordered(
    @MessageBody()
    data: { status: string; recipes: { id: string; position: number }[] },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      await this.recipeService.reorder(
        data.status as RecipeStatus,
        data.recipes,
      );
      client.broadcast.emit('recipe-reordered', data);
    } catch (error) {
      console.error('Reorder error:', error);
      client.emit('reorder-error', { message: 'Reorder failed' });
    }
  }

  @SubscribeMessage('mouse-move')
  handleMouseMove(
    @MessageBody()
    data: { employeeId: string; x: number; y: number; name: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.broadcast.emit('mouse-move', data);
  }

  private emitEmployeesUpdated() {
    const onlineIds = Array.from(this.connectedEmployees.values()).map(
      (e) => e.employeeId,
    );
    this.server.emit('employees-updated', onlineIds);
  }
}
