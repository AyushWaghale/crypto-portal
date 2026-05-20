import axios from 'axios';
import { prisma } from './services/db';
import { redis } from './services/redis';
import dotenv from 'dotenv';

dotenv.config();

const COINS = [
  'bitcoin', 'ethereum', 'tether', 'binancecoin', 'solana',
  'ripple', 'usd-coin', 'cardano', 'dogecoin', 'tron'
];

const fetchPrices = async () => {
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
      params: {
        ids: COINS.join(','),
        vs_currencies: 'usd',
        include_24hr_change: 'true',
        include_24hr_vol: 'true',
      },
    });

    const prices = Object.keys(response.data).map(coinId => ({
      id: coinId,
      name: coinId.charAt(0).toUpperCase() + coinId.slice(1),
      price: response.data[coinId].usd,
      change24h: response.data[coinId].usd_24h_change,
      volume24h: response.data[coinId].usd_24h_vol,
    }));

    // Cache in redis
    await redis.set('crypto_prices', JSON.stringify(prices), 'EX', 60);
    
    // Publish to Redis for WebSocket server
    redis.publish('prices_update', JSON.stringify(prices));

    // Store in Postgres (history)
    for (const data of prices) {
      await prisma.priceHistory.create({
        data: {
          coinId: data.id,
          price: data.price,
        },
      });
    }

    // Check alerts
    await checkAlerts(prices);
    
    console.log(`Fetched and processed prices for ${prices.length} coins`);
  } catch (error: any) {
    console.error('Error fetching prices from CoinGecko:', error.message);
  }
};

const checkAlerts = async (prices: any[]) => {
  const activeAlerts = await prisma.alert.findMany({
    where: { isActive: true },
  });

  for (const alert of activeAlerts) {
    const coinData = prices.find(p => p.id === alert.coinId);
    if (!coinData) continue;

    let triggered = false;
    if (alert.condition === 'above' && coinData.price > alert.targetPrice) {
      triggered = true;
    } else if (alert.condition === 'below' && coinData.price < alert.targetPrice) {
      triggered = true;
    }

    if (triggered) {
      await prisma.alert.delete({
        where: { id: alert.id },
      });
      redis.publish('alerts_trigger', JSON.stringify({
        userId: alert.userId,
        id: alert.id,
        coinId: alert.coinId,
        condition: alert.condition,
        targetPrice: alert.targetPrice,
        currentPrice: coinData.price,
      }));
    }
  }
};

const startWorker = () => {
  console.log('Worker started. Fetching prices every 15 seconds...');
  fetchPrices(); // initial fetch
  setInterval(fetchPrices, 15000); 
};

startWorker();
