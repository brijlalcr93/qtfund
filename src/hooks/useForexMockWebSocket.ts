import { useEffect, useRef } from 'react';
import { useTradingStore } from '../store/tradingStore';

// Initial mock prices for common forex pairs
const MOCK_PRICES: Record<string, number> = {
  EURUSD: 1.0850,
  GBPUSD: 1.2650,
  USDJPY: 150.20,
  AUDUSD: 0.6540,
};

export const useForexMockWebSocket = (symbol: string, onDataUpdate: (data: any) => void) => {
  const intervalRef = useRef<number | null>(null);
  const updatePrice = useTradingStore(state => state.updatePrice);
  const currentPriceRef = useRef<number>(MOCK_PRICES[symbol] || 1.0000);
  
  // Track the current candle
  const currentCandleRef = useRef<{
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
  } | null>(null);

  useEffect(() => {
    // Only run for non-crypto symbols in our demo (e.g., EURUSD)
    if (symbol.endsWith('USDT')) return;

    const generateMockTick = () => {
      const now = Math.floor(Date.now() / 1000);
      const currentMinute = now - (now % 60);

      // Random price movement (volatility for Forex is small, e.g., 0.0001 or 1 pip)
      const volatility = currentPriceRef.current * 0.0001; 
      const change = (Math.random() - 0.5) * volatility;
      const newPrice = currentPriceRef.current + change;
      currentPriceRef.current = newPrice;

      if (!currentCandleRef.current || currentCandleRef.current.time !== currentMinute) {
        // Start a new candle
        currentCandleRef.current = {
          time: currentMinute,
          open: newPrice,
          high: newPrice,
          low: newPrice,
          close: newPrice,
        };
      } else {
        // Update existing candle
        currentCandleRef.current.close = newPrice;
        if (newPrice > currentCandleRef.current.high) currentCandleRef.current.high = newPrice;
        if (newPrice < currentCandleRef.current.low) currentCandleRef.current.low = newPrice;
      }

      onDataUpdate({ ...currentCandleRef.current });
      updatePrice(symbol, newPrice);
    };

    // Simulate 1 tick every 1-3 seconds
    intervalRef.current = window.setInterval(generateMockTick, 2000);

    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, [symbol, onDataUpdate, updatePrice]);
};
