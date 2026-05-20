import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

const Portfolio = () => {
  const prices = useStore(state => state.prices);
  const [positions, setPositions] = useState<any[]>([]);
  const token = useStore(state => state.token);

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const res = await fetch(`${API_URL}/api/portfolio`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setPositions(data);
        }
      } catch (err) {
        console.error('Failed to fetch portfolio:', err);
      }
    };
    fetchPortfolio();
  }, [token]);

  const handleAddPosition = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const coinId = formData.get('asset') as string;
    const quantity = Number(formData.get('qty'));
    const purchasePrice = Number(formData.get('buyPrice'));

    try {
      const res = await fetch(`${API_URL}/api/portfolio/positions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ coinId, quantity, purchasePrice })
      });
      
      if (res.ok) {
        const newPos = await res.json();
        setPositions([...positions, newPos]);
        toast.success('Position added successfully');
        (e.target as HTMLFormElement).reset();
      }
    } catch (err) {
      toast.error('Failed to add position');
    }
  };

  const calculatePnL = (position: any) => {
    const coin = prices.find(p => p.id === position.coinId);
    if (!coin) return { currentPrice: 0, currentValue: 0, pnl: 0, pnlPercent: 0 };
    
    const currentPrice = coin.price;
    const currentValue = currentPrice * position.quantity;
    const initialValue = position.purchasePrice * position.quantity;
    const pnl = currentValue - initialValue;
    const pnlPercent = (pnl / initialValue) * 100;
    
    return { currentPrice, currentValue, pnl, pnlPercent };
  };

  const totalValue = positions.reduce((acc, pos) => acc + calculatePnL(pos).currentValue, 0);
  const totalCost = positions.reduce((acc, pos) => acc + (pos.purchasePrice * pos.quantity), 0);
  const totalPnL = totalValue - totalCost;
  const totalPnLPercent = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground tracking-tight">Portfolio Tracker</h2>
          <p className="text-muted-foreground text-sm mt-1">Track your holdings and live P&L.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-card border-border/50 md:col-span-3">
          <CardHeader>
            <CardTitle className="text-lg text-foreground flex items-center">
              <Wallet className="w-5 h-5 mr-2 text-primary" /> Your Assets
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-card/50">
                <TableRow className="border-border/50">
                  <TableHead className="text-muted-foreground">Asset</TableHead>
                  <TableHead className="text-muted-foreground text-right">Holdings</TableHead>
                  <TableHead className="text-muted-foreground text-right">Avg. Buy Price</TableHead>
                  <TableHead className="text-muted-foreground text-right">Current Price</TableHead>
                  <TableHead className="text-muted-foreground text-right">Total Value</TableHead>
                  <TableHead className="text-muted-foreground text-right">Unrealized P&L</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {positions.map((pos) => {
                  const { currentPrice, currentValue, pnl, pnlPercent } = calculatePnL(pos);
                  return (
                    <TableRow key={pos.id} className="border-border/50">
                      <TableCell className="font-medium text-foreground capitalize">{pos.coinId}</TableCell>
                      <TableCell className="text-right text-foreground">{pos.quantity}</TableCell>
                      <TableCell className="text-right text-muted-foreground font-mono">${pos.purchasePrice.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-foreground font-mono">${currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-right font-medium text-foreground font-mono">${currentValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
                      <TableCell className={`text-right font-medium flex items-center justify-end ${pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {pnl >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                        ${Math.abs(pnl).toLocaleString(undefined, { maximumFractionDigits: 2 })} ({pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%)
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-card border-border/50 bg-gradient-to-br from-primary/20 to-primary/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
              <p className={`text-sm mt-2 flex items-center ${totalPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {totalPnL >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                ${Math.abs(totalPnL).toLocaleString(undefined, { maximumFractionDigits: 2 })} ({totalPnLPercent >= 0 ? '+' : ''}{totalPnLPercent.toFixed(2)}%)
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border/50">
            <CardHeader>
              <CardTitle className="text-base text-foreground">Add Position</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddPosition} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="asset" className="text-foreground">Asset</Label>
                  <select id="asset" name="asset" className="flex h-10 w-full items-center justify-between rounded-md border border-border/50 bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                    <option value="bitcoin">Bitcoin (BTC)</option>
                    <option value="ethereum">Ethereum (ETH)</option>
                    <option value="solana">Solana (SOL)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qty" className="text-foreground">Quantity</Label>
                  <Input id="qty" name="qty" type="number" step="0.0001" placeholder="0.0" className="bg-background border-border/50 text-foreground" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="buyPrice" className="text-foreground">Buy Price (USD)</Label>
                  <Input id="buyPrice" name="buyPrice" type="number" step="0.01" placeholder="0.00" className="bg-background border-border/50 text-foreground" />
                </div>
                <Button type="submit" className="w-full bg-slate-100 hover:bg-white text-slate-900 mt-2">
                  Add Transaction
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Portfolio;
