import { useEffect, useRef } from 'react';
import { useTradingStore } from '../store/tradingStore';

export const useBinanceWebSocket = (symbol: string, onDataUpdate: (data: any) => void) => {
  const wsRef = useRef<WebSocket | null>(null);
  const updatePrice = useTradingStore(state => state.updatePrice);

  useEffect(() => {
    // We only use this hook for Crypto pairs (which in our demo are always formatted like BTCUSDT)
    if (!symbol.endsWith('USDT') && !symbol.endsWith('USD')) return;

    const lowerSymbol = symbol.toLowerCase();
    const wsUrl = `wss://stream.binance.com:9443/ws/${lowerSymbol}@kline_1m`;
    
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.e === 'kline') {
        const kline = message.k;
        const newCandle = {
          time: kline.t / 1000, // Lightweight Charts expects seconds
          open: parseFloat(kline.o),
          high: parseFloat(kline.h),
          low: parseFloat(kline.l),
          close: parseFloat(kline.c),
        };
        
        onDataUpdate(newCandle);
        // Update the current price in our trading store for PnL calculation
        updatePrice(symbol, newCandle.close);
      }
    };

    wsRef.current.onerror = (error) => {
      console.error('Binance WebSocket error:', error);
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [symbol, onDataUpdate, updatePrice]);
};
