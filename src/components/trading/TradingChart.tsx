import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, CandlestickSeries } from 'lightweight-charts';
import type { IChartApi, ISeriesApi, CandlestickData, Time } from 'lightweight-charts';
import { useBinanceWebSocket } from '../../hooks/useBinanceWebSocket';
import { useForexMockWebSocket } from '../../hooks/useForexMockWebSocket';
import { useTradingStore } from '../../store/tradingStore';

export default function TradingChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  
  const { activeSymbol, activeType } = useTradingStore();
  const [isLoading, setIsLoading] = useState(true);

  // We need a stable callback reference for our WebSocket hooks to update the chart
  const handleDataUpdate = (candle: CandlestickData) => {
    if (candlestickSeriesRef.current) {
      candlestickSeriesRef.current.update(candle);
    }
  };

  // Conditionally use hooks based on asset type
  useBinanceWebSocket(activeType === 'crypto' ? activeSymbol : '', handleDataUpdate);
  useForexMockWebSocket(activeType === 'forex' ? activeSymbol : '', handleDataUpdate);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Initialize chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#131722' },
        textColor: '#d1d4dc',
      },
      grid: {
        vertLines: { color: '#2B2B43' },
        horzLines: { color: '#2B2B43' },
      },
      crosshair: {
        mode: 0,
      },
      rightPriceScale: {
        borderColor: '#2B2B43',
      },
      timeScale: {
        borderColor: '#2B2B43',
        timeVisible: true,
        secondsVisible: false,
      },
      autoSize: true,
    });

    chartRef.current = chart;

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    candlestickSeriesRef.current = candlestickSeries;

    // Fetch initial historical data for Crypto
    if (activeType === 'crypto') {
      setIsLoading(true);
      fetch(`https://api.binance.com/api/v3/klines?symbol=${activeSymbol}&interval=1m&limit=100`)
        .then(res => res.json())
        .then(data => {
          const formattedData: CandlestickData[] = data.map((d: any) => ({
            time: (d[0] / 1000) as Time,
            open: parseFloat(d[1]),
            high: parseFloat(d[2]),
            low: parseFloat(d[3]),
            close: parseFloat(d[4]),
          }));
          candlestickSeries.setData(formattedData);
          setIsLoading(false);
        })
        .catch(err => {
          console.error("Error fetching historical data:", err);
          setIsLoading(false);
        });
    } else {
      // Mock historical data for Forex
      setIsLoading(true);
      const mockData: CandlestickData[] = [];
      const now = Math.floor(Date.now() / 1000);
      let currentPrice = activeSymbol === 'EURUSD' ? 1.0850 : 1.2650;
      
      for (let i = 100; i >= 0; i--) {
        const time = (now - (now % 60) - (i * 60)) as Time;
        const change = (Math.random() - 0.5) * 0.002;
        currentPrice += change;
        mockData.push({
          time,
          open: currentPrice,
          high: currentPrice + 0.0005,
          low: currentPrice - 0.0005,
          close: currentPrice + (Math.random() - 0.5) * 0.001,
        });
      }
      candlestickSeries.setData(mockData);
      setIsLoading(false);
    }

    return () => {
      chart.remove();
    };
  }, [activeSymbol, activeType]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(19, 23, 34, 0.8)',
          zIndex: 10
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: '4px solid #26a69a',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}
      <div ref={chartContainerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
