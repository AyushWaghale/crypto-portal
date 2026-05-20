import { useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { socket } from './lib/socket';
import { useStore, CryptoPrice } from './store';
import { ThemeProvider } from './components/ThemeProvider';
import Dashboard from './pages/Dashboard';
import Layout from './components/Layout';
import { toast } from 'sonner';
import CoinDetails from './pages/CoinDetails';
import Alerts from './pages/Alerts';
import Portfolio from './pages/Portfolio';
import Analytics from './pages/Analytics';
import Login from './pages/Login';
import Register from './pages/Register';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = useStore(state => state.token);
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

function App() {
  const setPrices = useStore(state => state.setPrices);
  const token = useStore(state => state.token);

  useEffect(() => {
    socket.on('prices_update', (prices: CryptoPrice[]) => {
      setPrices(prices);
    });

    socket.on('connect', () => {
      console.log('Connected to WS');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from WS');
    });

    let userId: string | null = null;
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        userId = decoded.id;
      } catch (e) {
        console.error('Failed to decode token for alerts');
      }
    }

    if (userId) {
      socket.on(`alert_${userId}`, (alert: any) => {
        toast.success(`Alert triggered for ${alert.coinId}! Target: $${alert.targetPrice}, Current: $${alert.currentPrice}`);
      });
    }

    return () => {
      socket.off('prices_update');
      socket.off('connect');
      socket.off('disconnect');
      if (userId) socket.off(`alert_${userId}`);
    };
  }, [setPrices, token]);

  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <Router>
        <Layout>
          <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/coin/:id" element={<CoinDetails />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/alerts" element={<ProtectedRoute><Alerts /></ProtectedRoute>} />
          <Route path="/portfolio" element={<ProtectedRoute><Portfolio /></ProtectedRoute>} />
        </Routes>
      </Layout>
      </Router>
    </ThemeProvider>
  );
}

export default App;
