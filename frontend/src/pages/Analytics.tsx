import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useStore } from '../store';

const Analytics = () => {
  const prices = useStore(state => state.prices);

  // Use live data for volatility chart (mocked as abs(change24h))
  const volatilityData = prices.slice(0, 10).map(coin => ({
    name: coin.name,
    volatility: Math.abs(coin.change24h),
    isPositive: coin.change24h >= 0,
  })).sort((a, b) => b.volatility - a.volatility);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground tracking-tight">Market Analytics</h2>
          <p className="text-muted-foreground text-sm mt-1">Deep dive into market volatility and correlations.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="bg-card border-border/50">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">24h Volatility Index</CardTitle>
            <CardDescription className="text-muted-foreground">Comparing absolute price changes across top assets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
                <BarChart data={volatilityData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                  <XAxis type="number" stroke="#64748b" tick={{fill: '#64748b'}} axisLine={false} />
                  <YAxis type="category" dataKey="name" stroke="#64748b" tick={{fill: '#64748b'}} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(value: any) => [`${value.toFixed(2)}%`, 'Volatility']}
                  />
                  <Bar dataKey="volatility" radius={[0, 4, 4, 0]}>
                    {volatilityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.isPositive ? '#34d399' : '#fb7185'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
