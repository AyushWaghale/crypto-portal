import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { toast } from 'sonner';
import { Trash2, BellRing } from 'lucide-react';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

const Alerts = () => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const token = useStore(state => state.token);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch(`${API_URL}/api/alerts`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setAlerts(data);
        }
      } catch (err) {
        console.error('Failed to fetch alerts:', err);
      }
    };
    fetchAlerts();
  }, [token]);

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const coinId = formData.get('asset') as string;
    const condition = formData.get('condition') as string;
    const targetPrice = Number(formData.get('price'));

    try {
      const res = await fetch(`${API_URL}/api/alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ coinId, condition, targetPrice })
      });
      
      if (res.ok) {
        const newAlert = await res.json();
        setAlerts([...alerts, newAlert]);
        toast.success(`Alert set for ${coinId} ${condition} $${targetPrice}`);
        (e.target as HTMLFormElement).reset();
      } else {
        const errorData = await res.json();
        console.error("Alert creation failed:", errorData);
        toast.error(errorData.error || 'Failed to create alert');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to create alert');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground tracking-tight">Price Alerts</h2>
          <p className="text-muted-foreground text-sm mt-1">Get notified when assets hit your target prices.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card border-border/50 md:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">Create New Alert</CardTitle>
            <CardDescription className="text-muted-foreground">Configure parameters for price notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateAlert} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="asset" className="text-foreground">Asset</Label>
                <select id="asset" name="asset" className="flex h-10 w-full items-center justify-between rounded-md border border-border/50 bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                  <option value="bitcoin">Bitcoin (BTC)</option>
                  <option value="ethereum">Ethereum (ETH)</option>
                  <option value="solana">Solana (SOL)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="condition" className="text-foreground">Condition</Label>
                <select id="condition" name="condition" className="flex h-10 w-full items-center justify-between rounded-md border border-border/50 bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                  <option value="above">Goes Above</option>
                  <option value="below">Goes Below</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="price" className="text-foreground">Target Price (USD)</Label>
                <Input id="price" name="price" type="number" step="0.01" placeholder="0.00" className="bg-background border-border/50 text-foreground" required />
              </div>
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground mt-2">
                Set Alert
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50 md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg text-foreground flex items-center">
              <BellRing className="w-5 h-5 mr-2 text-primary" /> Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-card/50">
                <TableRow className="border-border/50">
                  <TableHead className="text-muted-foreground">Asset</TableHead>
                  <TableHead className="text-muted-foreground">Condition</TableHead>
                  <TableHead className="text-muted-foreground text-right">Target Price</TableHead>
                  <TableHead className="text-muted-foreground text-center">Status</TableHead>
                  <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.map((alert) => (
                  <TableRow key={alert.id} className="border-border/50">
                    <TableCell className="font-medium text-foreground capitalize">{alert.coinId}</TableCell>
                    <TableCell className="text-foreground capitalize">{alert.condition}</TableCell>
                    <TableCell className="text-right text-foreground font-mono">${alert.targetPrice.toLocaleString()}</TableCell>
                    <TableCell className="text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${alert.isActive ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'}`}>
                        {alert.isActive ? 'Active' : 'Triggered'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-rose-400 hover:bg-rose-400/10 h-8 w-8">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Alerts;
