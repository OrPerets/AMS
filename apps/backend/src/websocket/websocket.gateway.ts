import {
  WebSocketGateway as WSGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
@WSGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
    credentials: true,
  },
})
export class WebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private logger: Logger = new Logger('WebSocketGateway');
  private connectedUsers = new Map<string, string>(); // socketId -> userId

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      // Extract token from handshake
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');
      
      if (!token) {
        this.logger.warn('Connection attempt without token');
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = this.jwtService.verify(token);
      const userId = payload.sub || payload.id;
      
      if (!userId) {
        this.logger.warn('Invalid token payload');
        client.disconnect();
        return;
      }

      // Store user connection
      this.connectedUsers.set(client.id, userId.toString());
      client.join(`user_${userId}`);
      
      this.logger.log(`User ${userId} connected with socket ${client.id}`);
      
      // Send welcome message
      client.emit('connected', { 
        message: 'Connected to real-time updates',
        userId: userId 
      });

    } catch (error) {
      this.logger.error('Connection error:', (error as Error).message);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = this.connectedUsers.get(client.id);
    if (userId) {
      this.logger.log(`User ${userId} disconnected`);
      this.connectedUsers.delete(client.id);
    }
  }

  @SubscribeMessage('join_room')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { room: string }
  ) {
    const userId = this.connectedUsers.get(client.id);
    if (userId && data.room) {
      client.join(data.room);
      this.logger.log(`User ${userId} joined room ${data.room}`);
      client.emit('joined_room', { room: data.room });
    }
  }

  @SubscribeMessage('leave_room')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { room: string }
  ) {
    const userId = this.connectedUsers.get(client.id);
    if (userId && data.room) {
      client.leave(data.room);
      this.logger.log(`User ${userId} left room ${data.room}`);
      client.emit('left_room', { room: data.room });
    }
  }

  // Methods to broadcast events to specific users or rooms
  broadcastToUser(userId: string, event: string, data: any) {
    this.server.to(`user_${userId}`).emit(event, data);
  }

  broadcastToRoom(room: string, event: string, data: any) {
    this.server.to(room).emit(event, data);
  }

  broadcastToAll(event: string, data: any) {
    this.server.emit(event, data);
  }

  // Specific methods for our use case
  notifyNewTicket(ticket: any, notifyUserIds: number[] = []) {
    // Notify Maya (PM) and other relevant users about new tickets
    this.broadcastToRoom('pm_notifications', 'new_ticket', {
      type: 'new_ticket',
      ticket,
      timestamp: new Date().toISOString(),
    });

    // Notify specific users (assigned users, building managers, etc.)
    notifyUserIds.forEach(userId => {
      this.broadcastToUser(userId.toString(), 'new_ticket', {
        type: 'new_ticket',
        ticket,
        timestamp: new Date().toISOString(),
      });
    });
  }

  notifyTicketUpdate(ticket: any, notifyUserIds: number[] = []) {
    // Notify relevant users about ticket updates
    this.broadcastToRoom('ticket_updates', 'ticket_updated', {
      type: 'ticket_updated',
      ticket,
      timestamp: new Date().toISOString(),
    });

    // Notify specific users
    notifyUserIds.forEach(userId => {
      this.broadcastToUser(userId.toString(), 'ticket_updated', {
        type: 'ticket_updated',
        ticket,
        timestamp: new Date().toISOString(),
      });
    });
  }

  notifyNewNotification(notification: any, userId: string | number) {
    // Notify specific user about new notification
    this.broadcastToUser(userId.toString(), 'new_notification', {
      type: 'new_notification',
      notification,
      timestamp: new Date().toISOString(),
    });
  }

  // Notify multiple users at once
  notifyUsers(userIds: (string | number)[], event: string, data: any) {
    userIds.forEach(userId => {
      this.broadcastToUser(userId.toString(), event, data);
    });
  }
}
