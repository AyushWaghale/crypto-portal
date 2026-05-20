import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { z } from 'zod';
import { prisma } from '../services/db';

const router = Router();

const positionSchema = z.object({
  coinId: z.string(),
  quantity: z.number().positive(),
  purchasePrice: z.number().positive(),
});

router.use(authenticateToken);

router.post('/positions', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { coinId, quantity, purchasePrice } = positionSchema.parse(req.body);
    const userId = req.user!.id;

    const position = await prisma.portfolio.create({
      data: {
        userId,
        coinId,
        quantity,
        purchasePrice,
      },
    });

    res.status(201).json(position);
  } catch (error) {
    res.status(400).json({ error: 'Invalid data' });
  }
});

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const portfolio = await prisma.portfolio.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(portfolio);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
