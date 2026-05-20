import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { z } from 'zod';
import { prisma } from '../services/db';

const router = Router();

const alertSchema = z.object({
  coinId: z.string(),
  condition: z.enum(['above', 'below']),
  targetPrice: z.number().positive(),
});

router.use(authenticateToken);

router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { coinId, condition, targetPrice } = alertSchema.parse(req.body);
    const userId = req.user!.id;

    const alert = await prisma.alert.create({
      data: {
        userId,
        coinId,
        condition,
        targetPrice,
      },
    });

    res.status(201).json(alert);
  } catch (error) {
    res.status(400).json({ error: 'Invalid data' });
  }
});

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const alerts = await prisma.alert.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
