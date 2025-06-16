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

interface ConnectedEmployee {
  socketId: string;
  employeeId: string;
}
const origin: string = process.env.SOCKET_SITE_URL!;

@WebSocketGateway({
  path: '/socket',
  cors: {
    origin: origin,
  },
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
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
  handleRecipeUpdated(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ) {
    client.broadcast.emit('recipe-updated', data);
  }

  @SubscribeMessage('recipe-reordered')
  handleRecipeReordered(
    @MessageBody() data: { status: string; recipes: any[] },
    @ConnectedSocket() client: Socket,
  ) {
    client.broadcast.emit('recipe-reordered', data);
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
