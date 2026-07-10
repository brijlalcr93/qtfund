import React, { useEffect, useRef } from 'react';
import { createChart, CandlestickSeries } from 'lightweight-charts';
import type { IChartApi, ISeriesApi, CandlestickData, Time, IPriceLine } from 'lightweight-charts';
import { useTradingStore } from '../store';

export const Chart: React.FC = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const priceLinesRef = useRef<Map<string, IPriceLine>>(new Map());
  
  const activeSymbol = useTradingStore(state => state.activeSymbol);
  const activeInterval = useTradingStore(state => state.activeInterval);
  const updatePrice = useTradingStore(state => state.updatePrice);
  const symbol = activeSymbol.trim().toUpperCase();

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: '#141416' },
        textColor: '#838e9d',
      },
      grid: {
        vertLines: { color: '#2b2d33' },
        horzLines: { color: '#2b2d33' },
      },
      crosshair: {
        mode: 1, // Normal
      },
      rightPriceScale: {
        borderColor: '#2b2d33',
      },
      timeScale: {
        borderColor: '#2b2d33',
        timeVisible: true,
      },
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#0ecb81',
      downColor: '#f6465d',
      borderDownColor: '#f6465d',
      borderUpColor: '#0ecb81',
      wickDownColor: '#f6465d',
      wickUpColor: '#0ecb81',
    });

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  // Handle WebSocket connection
  useEffect(() => {
    if (!seriesRef.current) return;

    // Disconnect old WS if exists
    if (wsRef.current) {
      wsRef.current.close();
    }

    // Clean up old price lines
    if (seriesRef.current) {
      priceLinesRef.current.forEach(line => {
        try { seriesRef.current?.removePriceLine(line); } catch (e) {}
      });
      priceLinesRef.current.clear();
    }

    // Clear chart data
    seriesRef.current.setData([]);

    // Fetch initial historical data (optional, but good for UX)
    fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${activeInterval}&limit=1000`)
      .then(res => res.json())
      .then(data => {
        const cdata: CandlestickData[] = data.map((d: any) => ({
          time: (d[0] / 1000) as Time,
          open: parseFloat(d[1]),
          high: parseFloat(d[2]),
          low: parseFloat(d[3]),
          close: parseFloat(d[4]),
        }));
        seriesRef.current?.setData(cdata);
        // Set initial price
        if (cdata.length > 0) {
          updatePrice(symbol, cdata[cdata.length - 1].close);
        }
      })
      .catch(err => console.error('Failed to fetch historical data', err));

    // Connect WebSocket for live updates
    const wsUrl = `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_${activeInterval}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.e === 'kline') {
        const kline = message.k;
        const tick: CandlestickData = {
          time: (kline.t / 1000) as Time,
          open: parseFloat(kline.o),
          high: parseFloat(kline.h),
          low: parseFloat(kline.l),
          close: parseFloat(kline.c),
        };
        seriesRef.current?.update(tick);
        
        // Update global price state for PnL calculation
        updatePrice(activeSymbol, tick.close);
      }
    };

    return () => {
      ws.close();
    };
  }, [activeSymbol, activeInterval, updatePrice]);

  // Imperative subscription for drawing positions and PnL
  useEffect(() => {
    const unsub = useTradingStore.subscribe((state) => {
      if (!seriesRef.current) return;
      
      const activePositions = state.positions.filter(p => p.symbol === state.activeSymbol);
      
      activePositions.forEach(pos => {
        let line = priceLinesRef.current.get(pos.id);
        const currentPrice = state.prices[pos.symbol] || pos.entryPrice;
        
        let pnl = 0;
        if (pos.type === 'LONG') {
          pnl = (currentPrice - pos.entryPrice) * pos.size;
        } else {
          pnl = (pos.entryPrice - currentPrice) * pos.size;
        }
        
        const title = `${pos.type} ${pos.size} (${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)})`;
        
        if (!line) {
          line = seriesRef.current!.createPriceLine({
            price: pos.entryPrice,
            color: pos.type === 'LONG' ? '#0ecb81' : '#f6465d',
            lineWidth: 1,
            lineStyle: 2, // Dashed
            axisLabelVisible: true,
            title: title,
          });
          priceLinesRef.current.set(pos.id, line);
        } else {
          line.applyOptions({ title });
        }
      });
      
      // Remove closed lines
      for (const [id, line] of priceLinesRef.current.entries()) {
        if (!activePositions.find(p => p.id === id)) {
          try { seriesRef.current.removePriceLine(line); } catch(e) {}
          priceLinesRef.current.delete(id);
        }
      }
    });
    
    return unsub;
  }, []);

  return (
    <div style={{ flex: 1, position: 'relative' }}>
      <div 
        ref={chartContainerRef} 
        style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} 
      />
    </div>
  );
};
