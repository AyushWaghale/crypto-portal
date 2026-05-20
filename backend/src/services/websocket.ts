import { Server } from 'socket.io';
import Redis from 'ioredis';
import dotenv from 'dotenv';
dotenv.config();

let ioInstance: Server | null = null;
const redisSubscriber = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export const setupWebSocket = (io: Server) => {
  ioInstance = io;
  
  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);
    
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  redisSubscriber.subscribe('prices_update', 'alerts_trigger', (err, count) => {
    if (err) console.error('Redis Subscribe Error:', err);
  });

  redisSubscriber.on('message', (channel, message) => {
    if (channel === 'prices_update') {
      const prices = JSON.parse(message);
      io.emit('prices_update', prices);
    } else if (channel === 'alerts_trigger') {
      const alert = JSON.parse(message);
      io.emit(`alert_${alert.userId}`, alert);
    }
  });
};
