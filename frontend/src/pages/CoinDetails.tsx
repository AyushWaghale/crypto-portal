import { useParams } from 'react-router-dom';
import { useStore } from '../store';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { BellPlus, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CoinDetails = () => {
  const { id } = useParams<{ id: string }>();
  const prices = useStore(state => state.prices);
  const navigate = useNavigate();

  const coin = prices.find(p => p.id === id);

  // Mock historical data for the chart
  const historicalData = Array.from({ length: 24 }).map((_, i) => ({
    time: `${i}:00`,
    price: coin ? coin.price * (1 + (Math.random() - 0.5) * 0.05) : 0,
  }));

  if (!coin) {
    return <div className="text-foreground text-center mt-12">Coin not found or loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-secondary mr-4 flex items-center justify-center text-lg font-bold text-foreground border border-border">
              {coin.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">{coin.name}</h2>
              <div className="text-muted-foreground text-sm uppercase">{coin.id}</div>
            </div>
          </div>
        </div>
        <Button onClick={() => navigate('/alerts')} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <BellPlus className="w-4 h-4 mr-2" /> Set Alert
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-card border-border/50 md:col-span-3">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">Price History (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
                <LineChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="time" stroke="#64748b" tick={{fill: '#64748b'}} axisLine={false} />
                  <YAxis 
                    domain={['auto', 'auto']} 
                    stroke="#64748b" 
                    tick={{fill: '#64748b'}} 
                    axisLine={false}
                    tickFormatter={(value) => `$${value.toLocaleString()}`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff' }}
                    itemStyle={{ color: '#38bdf8' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="price" 
                    stroke="#38bdf8" 
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6, fill: '#38bdf8', stroke: '#0f172a', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Current Price</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">${coin.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">24h Change</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${coin.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {coin.change24h >= 0 ? '+' : ''}{coin.change24h.toFixed(2)}%
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">24h Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-foreground">${(coin.volume24h).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CoinDetails;
