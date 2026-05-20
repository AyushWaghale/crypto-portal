import { useStore } from '../store';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const prices = useStore(state => state.prices);
  const navigate = useNavigate();

  // Simple mock data for sparkline
  const generateSparklineData = (price: number, change: number) => {
    return Array.from({ length: 10 }).map((_, i) => ({
      val: price * (1 + (change / 100) * (Math.random() - 0.5) * (i / 10))
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-foreground tracking-tight">Market Overview</h2>
        <div className="flex items-center space-x-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span className="text-sm text-muted-foreground">Live Updates</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Market Cap</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">$2.34T</div>
            <p className="text-xs text-emerald-400 mt-1 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" /> +2.4% from yesterday
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">24h Volume</CardTitle>
            <Activity className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">$84.2B</div>
            <p className="text-xs text-emerald-400 mt-1 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" /> +12.5% from yesterday
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border/50 overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-foreground">Live Prices</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-card/50">
              <TableRow className="border-border/50 hover:bg-secondary/50 transition-colors">
                <TableHead className="text-muted-foreground font-medium">Asset</TableHead>
                <TableHead className="text-muted-foreground font-medium text-right">Price (USD)</TableHead>
                <TableHead className="text-muted-foreground font-medium text-right">24h Change</TableHead>
                <TableHead className="text-muted-foreground font-medium text-right">24h Volume</TableHead>
                <TableHead className="text-muted-foreground font-medium hidden md:table-cell">Trend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prices.length > 0 ? (
                prices.map((coin) => (
                  <TableRow 
                    key={coin.id} 
                    className="border-border/50 cursor-pointer hover:bg-secondary transition-colors"
                    onClick={() => navigate(`/coin/${coin.id}`)}
                  >
                    <TableCell className="font-medium text-foreground flex items-center">
                      <div className="w-6 h-6 rounded-full bg-secondary mr-3 flex items-center justify-center text-xs text-muted-foreground border border-border">
                        {coin.name.charAt(0)}
                      </div>
                      {coin.name}
                    </TableCell>
                    <TableCell className="text-right text-foreground font-mono">
                      ${coin.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                    </TableCell>
                    <TableCell className={`text-right font-medium flex items-center justify-end ${coin.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {coin.change24h >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                      {Math.abs(coin.change24h).toFixed(2)}%
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground font-mono">
                      ${(coin.volume24h / 1e9).toFixed(2)}B
                    </TableCell>
                    <TableCell className="w-32 hidden md:table-cell">
                      <div className="h-10 w-24">
                        <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
                          <AreaChart data={generateSparklineData(coin.price, coin.change24h)}>
                            <Area 
                              type="monotone" 
                              dataKey="val" 
                              stroke={coin.change24h >= 0 ? '#34d399' : '#fb7185'} 
                              fillOpacity={0.2}
                              fill={coin.change24h >= 0 ? '#34d399' : '#fb7185'}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    Waiting for market data...
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
