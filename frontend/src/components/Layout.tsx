import { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Bell, Briefcase, BarChart2, Sun, Moon, Zap } from 'lucide-react';
import { useStore } from '../store';
import { useTheme } from './ThemeProvider';
import { jwtDecode } from 'jwt-decode';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/ui/alert-dialog";
import { Toaster } from 'sonner';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { token, setToken } = useStore();
  const { theme, setTheme } = useTheme();
  const [username, setUsername] = useState('User');
  useEffect(() => {
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        if (decoded.email) {
          let name = decoded.email.split('@')[0];
          setUsername(name.charAt(0).toUpperCase() + name.slice(1));
        }
      } catch(e) {}
    }
  }, [token]);

  const handleLogout = () => {
    setToken(null);
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Alerts', href: '/alerts', icon: Bell },
    { name: 'Portfolio', href: '/portfolio', icon: Briefcase },
    { name: 'Analytics', href: '/analytics', icon: BarChart2 },
  ];

  return (
    <div className="flex h-screen bg-background text-foreground font-sans overflow-hidden">
      {/* Slim TradingView-style Sidebar */}
      <div className="w-20 md:w-64 bg-card border-r border-border flex flex-col transition-all duration-300 z-20 shadow-sm">
        <div className="h-16 flex items-center justify-center md:justify-start md:px-6 border-b border-border">
          <Link to="/" className="flex items-center space-x-2">
            <Zap className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold tracking-tight text-foreground hidden md:inline-block">
              NovaTrade
            </span>
          </Link>
        </div>
        
        <nav className="flex-1 py-6 flex flex-col items-center md:items-stretch md:px-4 space-y-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center justify-center md:justify-start p-3 md:px-4 md:py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-secondary/80 hover:text-foreground'
                }`}
                title={item.name}
              >
                <item.icon className={`w-5 h-5 md:mr-3 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} />
                <span className="hidden md:inline-block">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-6 bg-card/80 backdrop-blur-md border-b border-border z-10">
          <div className="text-sm font-medium text-muted-foreground hidden sm:block">
            Professional Market Intelligence
          </div>
          <div className="sm:hidden text-sm font-bold text-foreground">NovaTrade</div>
          
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              title="Toggle Theme"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </button>

            {token ? (
              <div className="flex items-center gap-3 border-l border-border/40 pl-4">
                <AlertDialog>
                  <AlertDialogTrigger className="flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none text-left">
                    <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-sm font-semibold text-primary">
                      {username.charAt(0)}
                    </div>
                    <span className="hidden md:inline-block text-sm font-medium text-foreground mr-1">
                      {username}
                    </span>
                  </AlertDialogTrigger>
                  
                  <AlertDialogContent className="bg-card border-border">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-foreground">Are you sure you want to logout?</AlertDialogTitle>
                      <AlertDialogDescription className="text-muted-foreground">
                        This will clear your secure session and return you to the login screen.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-secondary text-foreground hover:bg-secondary/80 border-border">Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleLogout} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Logout</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ) : (
              <div className="flex items-center gap-3 border-l border-border/40 pl-4">
                <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                  Login
                </Link>
                <Link to="/register" className="text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md transition-colors shadow-sm">
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-auto bg-background/50">
          <div className="max-w-7xl mx-auto p-4 md:p-8">
            {children}
          </div>
        </main>
      </div>
      <Toaster position="top-right" richColors theme={theme as any} />
    </div>
  );
};

export default Layout;
