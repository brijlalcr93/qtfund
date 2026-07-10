import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PositionType = 'LONG' | 'SHORT';

export interface Position {
  id: string;
  symbol: string;
  type: PositionType;
  entryPrice: number;
  size: number;
  timestamp: number;
  takeProfit?: number;
  stopLoss?: number;
  closedPrice?: number;
  pnl?: number;
}

export interface PendingOrder {
  id: string;
  symbol: string;
  type: PositionType;
  targetPrice: number;
  size: number;
  timestamp: number;
  takeProfit?: number;
  stopLoss?: number;
}

interface TradingStore {
  balance: number;
  positions: Position[];
  pendingOrders: PendingOrder[];
  history: Position[];
  prices: Record<string, number>;
  activeSymbol: string;
  activeInterval: string;
  
  // Actions
  setActiveSymbol: (symbol: string) => void;
  setActiveInterval: (interval: string) => void;
  updatePrice: (symbol: string, price: number) => void;
  openPosition: (symbol: string, type: PositionType, size: number, price: number, tp?: number, sl?: number) => void;
  updatePosition: (id: string, updates: Partial<Position>) => void;
  closePosition: (id: string) => void;
  closePositions: (ids: string[]) => void;
  addPendingOrder: (symbol: string, type: PositionType, size: number, targetPrice: number, tp?: number, sl?: number) => void;
  cancelPendingOrder: (id: string) => void;
}

export const useTradingStore = create<TradingStore>()(
  persist(
    (set, get) => ({
      balance: 10000.00,
      positions: [],
      pendingOrders: [],
      history: [],
      prices: {},
      activeSymbol: 'BTCUSDT',
      activeInterval: '1m',

      setActiveSymbol: (symbol) => set({ activeSymbol: symbol.trim().toUpperCase() }),
      setActiveInterval: (interval) => set({ activeInterval: interval }),
  
  updatePrice: (symbol, price) => {
    set((state) => {
      const newPrices = { ...state.prices, [symbol]: price };
      
      // Auto-execute logic
      let updatedPositions = [...state.positions];
      let updatedPending = [...state.pendingOrders];
      let updatedHistory = [...state.history];
      let updatedBalance = state.balance;
      let stateChanged = false;

      // 1. Check Pending Orders
      for (const po of state.pendingOrders) {
        if (po.symbol !== symbol) continue;
        
        let triggered = false;
        const oldPrice = state.prices[symbol] || price;
        
        if ((oldPrice >= po.targetPrice && price <= po.targetPrice) || 
            (oldPrice <= po.targetPrice && price >= po.targetPrice) ||
            oldPrice === po.targetPrice) {
          triggered = true;
        }

        if (triggered) {
          stateChanged = true;
          // Remove from pending
          updatedPending = updatedPending.filter(p => p.id !== po.id);
          // Add to positions
          updatedPositions.push({
            id: Math.random().toString(36).substr(2, 9),
            symbol: po.symbol,
            type: po.type,
            entryPrice: po.targetPrice, // execute at target price
            size: po.size,
            timestamp: Date.now(),
            takeProfit: po.takeProfit,
            stopLoss: po.stopLoss
          });
        }
      }

      // 2. Check Active Positions for TP/SL
      const positionsToClose: Position[] = [];
      for (const pos of updatedPositions) {
        if (pos.symbol !== symbol) continue;
        
        let shouldClose = false;
        if (pos.type === 'LONG') {
          if (pos.takeProfit && price >= pos.takeProfit) shouldClose = true;
          if (pos.stopLoss && price <= pos.stopLoss) shouldClose = true;
        } else {
          if (pos.takeProfit && price <= pos.takeProfit) shouldClose = true;
          if (pos.stopLoss && price >= pos.stopLoss) shouldClose = true;
        }

        if (shouldClose) {
          positionsToClose.push(pos);
        }
      }

      if (positionsToClose.length > 0) {
        stateChanged = true;
        for (const pos of positionsToClose) {
          updatedPositions = updatedPositions.filter(p => p.id !== pos.id);
          
          let pnl = 0;
          if (pos.type === 'LONG') {
            pnl = (price - pos.entryPrice) * pos.size;
          } else {
            pnl = (pos.entryPrice - price) * pos.size;
          }

          updatedBalance += pnl;
          updatedHistory.push({
            ...pos,
            closedPrice: price,
            pnl
          });
        }
      }

      if (stateChanged) {
        return {
          prices: newPrices,
          positions: updatedPositions,
          pendingOrders: updatedPending,
          history: updatedHistory,
          balance: updatedBalance
        };
      }

      return { prices: newPrices };
    });
  },

  openPosition: (symbol, type, size, price, tp, sl) => {
    const newPosition: Position = {
      id: Math.random().toString(36).substr(2, 9),
      symbol,
      type,
      entryPrice: price,
      size,
      timestamp: Date.now(),
      takeProfit: tp,
      stopLoss: sl
    };
    set((state) => ({
      positions: [...state.positions, newPosition]
    }));
  },

  updatePosition: (id, updates) => {
    set((state) => ({
      positions: state.positions.map(p => p.id === id ? { ...p, ...updates } : p)
    }));
  },

  closePosition: (id) => {
    const { positions, prices, balance, history } = get();
    const position = positions.find(p => p.id === id);
    if (!position) return;

    const currentPrice = prices[position.symbol] || position.entryPrice;
    
    // Calculate PnL
    let pnl = 0;
    if (position.type === 'LONG') {
      pnl = (currentPrice - position.entryPrice) * position.size;
    } else {
      pnl = (position.entryPrice - currentPrice) * position.size;
    }

    set({
      positions: positions.filter(p => p.id !== id),
      balance: balance + pnl,
      history: [...history, { ...position, closedPrice: currentPrice, pnl }]
    });
  },

  closePositions: (ids) => {
    const { positions, prices, balance, history } = get();
    const toClose = positions.filter((pos) => ids.includes(pos.id));
    if (toClose.length === 0) return;

    let updatedBalance = balance;
    const updatedHistory = [...history];

    for (const position of toClose) {
      const currentPrice = prices[position.symbol] || position.entryPrice;
      let pnl = 0;
      if (position.type === 'LONG') {
        pnl = (currentPrice - position.entryPrice) * position.size;
      } else {
        pnl = (position.entryPrice - currentPrice) * position.size;
      }
      updatedBalance += pnl;
      updatedHistory.push({ ...position, closedPrice: currentPrice, pnl });
    }

    set({
      positions: positions.filter((pos) => !ids.includes(pos.id)),
      balance: updatedBalance,
      history: updatedHistory,
    });
  },

  addPendingOrder: (symbol, type, size, targetPrice, tp, sl) => {
    const newOrder: PendingOrder = {
      id: Math.random().toString(36).substr(2, 9),
      symbol,
      type,
      targetPrice,
      size,
      timestamp: Date.now(),
      takeProfit: tp,
      stopLoss: sl
    };
    set((state) => ({
      pendingOrders: [...state.pendingOrders, newOrder]
    }));
  },

  cancelPendingOrder: (id) => {
    set((state) => ({
      pendingOrders: state.pendingOrders.filter(o => o.id !== id)
    }));
  }
}),
{
  name: 'trading-store',
  partialize: (state) => ({
    balance: state.balance,
    positions: state.positions,
    pendingOrders: state.pendingOrders,
    history: state.history,
    prices: state.prices,
    activeSymbol: state.activeSymbol,
    activeInterval: state.activeInterval,
  }),
}
)
);
