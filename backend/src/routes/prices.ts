import { Router, Request, Response } from 'express';
import { prisma } from '../services/db';
import { redis } from '../services/redis';

const router = Router();

router.get('/live', async (req: Request, res: Response) => {
  try {
    const cachedPrices = await redis.get('crypto_prices');
    if (cachedPrices) {
      res.json(JSON.parse(cachedPrices));
      return;
    }
    res.json([]);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/history/:coinId', async (req: Request, res: Response) => {
  try {
    const coinId = req.params.coinId as string;
    const history = await prisma.priceHistory.findMany({
      where: { coinId },
      orderBy: { timestamp: 'desc' },
      take: 100,
    });
    res.json(history.reverse());
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
