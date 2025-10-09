import { io, Socket } from 'socket.io-client';

class WebSocketService {
  private socket: Socket | null = null;
  private token: string | null = null;
  private listeners: Map<string, Function[]> = new Map();

  connect(token: string) {
    if (this.socket?.connected) {
      return;
    }

    this.token = token;
    
    this.socket = io(process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000', {
      auth: {
        token: token,
      },
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      
      // Join PM notifications room for Maya
      this.socket?.emit('join_room', { room: 'pm_notifications' });
      
      // Join ticket updates room
      this.socket?.emit('join_room', { room: 'ticket_updates' });
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });

    this.socket.on('connected', (data) => {
      console.log('WebSocket connected:', data);
    });

    this.socket.on('new_ticket', (data) => {
      console.log('New ticket received:', data);
      this.emit('new_ticket', data);
    });

    this.socket.on('ticket_updated', (data) => {
      console.log('Ticket update received:', data);
      this.emit('ticket_updated', data);
    });

    this.socket.on('new_notification', (data) => {
      console.log('New notification received:', data);
      this.emit('new_notification', data);
    });

    this.socket.on('joined_room', (data) => {
      console.log('Joined room:', data);
    });

    this.socket.on('left_room', (data) => {
      console.log('Left room:', data);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data));
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  joinRoom(room: string) {
    this.socket?.emit('join_room', { room });
  }

  leaveRoom(room: string) {
    this.socket?.emit('leave_room', { room });
  }
}

export const websocketService = new WebSocketService();
