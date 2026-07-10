import { create } from 'zustand';

export interface Position {
  id: string;
  symbol: string;
  type: 'buy' | 'sell';
  entryPrice: number;
  currentPrice: number;
  size: number; // Volume
  unrealizedPnL: number;
  openTime: number;
}

interface TradingState {
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  positions: Position[];
  activeSymbol: string;
  activeType: 'crypto' | 'forex';
  setActiveSymbol: (symbol: string, type: 'crypto' | 'forex') => void;
  updatePrice: (symbol: string, price: number) => void;
  openPosition: (position: Omit<Position, 'id' | 'unrealizedPnL' | 'openTime' | 'currentPrice'> & { currentPrice: number }) => void;
  closePosition: (id: string) => void;
}

export const useTradingStore = create<TradingState>((set) => ({
  balance: 10000,
  equity: 10000,
  margin: 0,
  freeMargin: 10000,
  positions: [],
  activeSymbol: 'BTCUSDT',
  activeType: 'crypto',

  setActiveSymbol: (symbol, type) => set({ activeSymbol: symbol, activeType: type }),

  updatePrice: (symbol, price) => set((state) => {
    // Check if we need to update any positions
    const hasPosition = state.positions.some(p => p.symbol === symbol);
    if (!hasPosition) return state;

    const newPositions = state.positions.map((pos) => {
      if (pos.symbol === symbol) {
        // Calculate diff: if buy, price going up is profit. If sell, price going down is profit.
        // For crypto, standard PnL = (Exit Price - Entry Price) * Quantity.
        const diff = pos.type === 'buy' ? price - pos.entryPrice : pos.entryPrice - price;
        const unrealizedPnL = diff * pos.size;
        return { ...pos, currentPrice: price, unrealizedPnL };
      }
      return pos;
    });

    const totalPnL = newPositions.reduce((acc, pos) => acc + pos.unrealizedPnL, 0);
    const newEquity = state.balance + totalPnL;

    return {
      positions: newPositions,
      equity: newEquity,
      freeMargin: newEquity - state.margin
    };
  }),

  openPosition: (posData) => set((state) => {
    const newPosition: Position = {
      ...posData,
      id: Math.random().toString(36).substring(2, 11),
      unrealizedPnL: 0,
      openTime: Date.now(),
    };
    
    // Simplified margin calculation (100x leverage equivalent for demo)
    const requiredMargin = (posData.entryPrice * posData.size) / 100; 
    
    return {
      positions: [...state.positions, newPosition],
      margin: state.margin + requiredMargin,
      freeMargin: state.equity - (state.margin + requiredMargin)
    };
  }),

  closePosition: (id) => set((state) => {
    const position = state.positions.find(p => p.id === id);
    if (!position) return state;

    const newBalance = state.balance + position.unrealizedPnL;
    const requiredMargin = (position.entryPrice * position.size) / 100;
    const remainingPositions = state.positions.filter(p => p.id !== id);
    const newTotalPnL = remainingPositions.reduce((acc, p) => acc + p.unrealizedPnL, 0);
    const newEquity = newBalance + newTotalPnL;
    
    return {
      positions: remainingPositions,
      balance: newBalance,
      margin: state.margin - requiredMargin,
      equity: newEquity,
      freeMargin: newEquity - (state.margin - requiredMargin)
    };
  }),
}));
