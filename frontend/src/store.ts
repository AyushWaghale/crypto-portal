import { create } from 'zustand';

export interface CryptoPrice {
  id: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
}

interface AppState {
  prices: CryptoPrice[];
  token: string | null;
  setPrices: (prices: CryptoPrice[]) => void;
  setToken: (token: string | null) => void;
}

export const useStore = create<AppState>((set) => ({
  prices: [],
  token: localStorage.getItem('token'),
  setPrices: (prices) => set({ prices }),
  setToken: (token) => {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
    set({ token });
  },
}));
