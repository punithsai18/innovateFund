import { Chat, Message } from '../models/Chat.js';
import jwt from 'jsonwebtoken';

export const setupSocketHandlers = (io) => {
  // Authentication middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      socket.userId = decoded.id;
      socket.userType = decoded.userType;
      
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User ${socket.userId} connected`);

    // Join user to their personal room
    socket.join(`user_${socket.userId}`);

    // Join chat rooms
    socket.on('join_chat', async (chatId) => {
      try {
        const chat = await Chat.findById(chatId);
        
        if (!chat || !chat.participants.includes(socket.userId)) {
          socket.emit('error', { message: 'Access denied' });
          return;
        }

        socket.join(`chat_${chatId}`);
        socket.emit('joined_chat', { chatId });
        
      } catch (error) {
        socket.emit('error', { message: 'Failed to join chat' });
      }
    });

    // Leave chat room
    socket.on('leave_chat', (chatId) => {
      socket.leave(`chat_${chatId}`);
      socket.emit('left_chat', { chatId });
    });

    // Handle real-time typing indicators
    socket.on('typing_start', (data) => {
      socket.to(`chat_${data.chatId}`).emit('user_typing', {
        userId: socket.userId,
        chatId: data.chatId
      });
    });

    socket.on('typing_stop', (data) => {
      socket.to(`chat_${data.chatId}`).emit('user_stop_typing', {
        userId: socket.userId,
        chatId: data.chatId
      });
    });

    // Handle message delivery confirmations
    socket.on('message_delivered', (data) => {
      socket.to(`user_${data.senderId}`).emit('message_status_update', {
        messageId: data.messageId,
        status: 'delivered'
      });
    });

    // Handle online status
    socket.on('update_status', (status) => {
      // Broadcast to relevant chats that user is online/offline
      socket.broadcast.emit('user_status_update', {
        userId: socket.userId,
        status,
        lastSeen: new Date()
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User ${socket.userId} disconnected`);
      
      // Broadcast offline status
      socket.broadcast.emit('user_status_update', {
        userId: socket.userId,
        status: 'offline',
        lastSeen: new Date()
      });
    });

    // Error handling
    socket.on('error', (error) => {
      console.error('Socket error:', error);
      socket.emit('error', { message: 'Socket connection error' });
    });
  });
};