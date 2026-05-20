import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import authRoutes from '../routes/auth';
import priceRoutes from '../routes/prices';
import alertRoutes from '../routes/alerts';
import portfolioRoutes from '../routes/portfolio';
import { prisma } from '../services/db';

// Mock the Prisma Client
jest.mock('../services/db', () => ({
  prisma: {
    user: { findUnique: jest.fn(), create: jest.fn() },
    priceHistory: { findMany: jest.fn() },
    alert: { create: jest.fn(), findMany: jest.fn() },
    portfolio: { create: jest.fn(), findMany: jest.fn() }
  }
}));

// Mock Redis
jest.mock('../services/redis', () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    publish: jest.fn()
  }
}));

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/prices', priceRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/portfolio', portfolioRoutes);

describe('Crypto Intelligence Platform API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- Auth Tests ---
  describe('Auth Routes', () => {
    it('1. should successfully register a new user', async () => {
      (prisma.user.findUnique as any).mockResolvedValue(null);
      (prisma.user.create as any).mockResolvedValue({ id: '1', email: 'test@test.com' });

      const res = await request(app).post('/api/auth/register').send({
        email: 'test@test.com',
        password: 'password123',
        name: 'Test User'
      });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
    });

    it('2. should reject registration with duplicate email', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({ id: '1', email: 'test@test.com' });

      const res = await request(app).post('/api/auth/register').send({
        email: 'test@test.com',
        password: 'password123',
        name: 'Test User'
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('User already exists');
    });

    it('3. should reject login for non-existent user', async () => {
      (prisma.user.findUnique as any).mockResolvedValue(null);

      const res = await request(app).post('/api/auth/login').send({
        email: 'wrong@test.com',
        password: 'password123'
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid credentials');
    });
  });

  // --- Price Tests ---
  describe('Price Routes', () => {
    it('4. should fetch live prices from cache', async () => {
      const { redis } = require('../services/redis');
      redis.get.mockResolvedValue(JSON.stringify([{ id: 'bitcoin', price: 50000 }]));

      const res = await request(app).get('/api/prices/live');
      
      expect(res.status).toBe(200);
      expect(res.body[0].id).toBe('bitcoin');
    });

    it('5. should fetch price history for a specific coin', async () => {
      (prisma.priceHistory.findMany as any).mockResolvedValue([
        { coinId: 'bitcoin', price: 49000, timestamp: new Date() }
      ]);

      const res = await request(app).get('/api/prices/history/bitcoin');
      
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
    });
  });

  // --- Alert Tests ---
  describe('Alert Routes', () => {
    // Generate a valid JWT for mocked auth middleware
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ userId: '1' }, process.env.JWT_SECRET || 'super-secret-key-change-me');

    it('6. should reject alert creation without auth', async () => {
      const res = await request(app).post('/api/alerts').send({
        coinId: 'bitcoin', condition: 'above', targetPrice: 60000
      });
      expect(res.status).toBe(401);
    });

    it('7. should create an alert with valid auth', async () => {
      (prisma.alert.create as any).mockResolvedValue({ id: '1', coinId: 'bitcoin', targetPrice: 60000 });

      const res = await request(app)
        .post('/api/alerts')
        .set('Authorization', `Bearer ${token}`)
        .send({ coinId: 'bitcoin', condition: 'above', targetPrice: 60000 });

      expect(res.status).toBe(201);
      expect(res.body.coinId).toBe('bitcoin');
    });

    it('8. should fetch all alerts for user', async () => {
      (prisma.alert.findMany as any).mockResolvedValue([{ id: '1', coinId: 'bitcoin' }]);

      const res = await request(app)
        .get('/api/alerts')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
    });
  });

  // --- Portfolio Tests ---
  describe('Portfolio Routes', () => {
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ userId: '1' }, process.env.JWT_SECRET || 'super-secret-key-change-me');

    it('9. should add a portfolio position', async () => {
      (prisma.portfolio.create as any).mockResolvedValue({ id: '1', coinId: 'ethereum', quantity: 2, purchasePrice: 2000 });

      const res = await request(app)
        .post('/api/portfolio/positions')
        .set('Authorization', `Bearer ${token}`)
        .send({ coinId: 'ethereum', quantity: 2, purchasePrice: 2000 });

      expect(res.status).toBe(201);
      expect(res.body.coinId).toBe('ethereum');
    });

    it('10. should fetch portfolio positions', async () => {
      (prisma.portfolio.findMany as any).mockResolvedValue([
        { id: '1', coinId: 'ethereum', quantity: 2, purchasePrice: 2000 }
      ]);

      const res = await request(app)
        .get('/api/portfolio')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
    });
  });
});
