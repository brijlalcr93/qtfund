import { useState } from 'react';
import { useTradingStore } from '../../store/tradingStore';

export default function OrderPanel() {
  const { activeSymbol, openPosition } = useTradingStore();
  const [size, setSize] = useState<number>(0.1);
  const currentPrice = 0; // In a real app, this would be updated from the store
  
  const handleBuy = () => {
    const execPrice = currentPrice || (activeSymbol.includes('USD') && !activeSymbol.includes('BTC') ? 1.1000 : 65000);
    openPosition({
      symbol: activeSymbol,
      type: 'buy',
      entryPrice: execPrice,
      currentPrice: execPrice,
      size: size,
    });
  };

  const handleSell = () => {
    const execPrice = currentPrice || (activeSymbol.includes('USD') && !activeSymbol.includes('BTC') ? 1.1000 : 65000);
    openPosition({
      symbol: activeSymbol,
      type: 'sell',
      entryPrice: execPrice,
      currentPrice: execPrice,
      size: size,
    });
  };

  // We need a way to subscribe to the price to show it in the Buy/Sell buttons
  // To avoid re-rendering the whole panel on every tick, we could use a local state synced with the store,
  // but for simplicity we'll just show the buttons without live prices or use a placeholder.
  
  return (
    <div className="order-panel">
      <div className="order-panel-header">
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>{activeSymbol}</h3>
        <span style={{ fontSize: '12px', color: '#94a3b8' }}>Market</span>
      </div>

      <div className="order-input-group">
        <label className="order-input-label">Volume (Lots / Size)</label>
        <div className="order-input-wrapper">
          <button 
            className="order-btn-small"
            onClick={() => setSize(s => Math.max(0.01, +(s - 0.01).toFixed(2)))}
          >-</button>
          <input 
            type="number" 
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="order-input"
            step="0.01"
            min="0.01"
          />
          <button 
            className="order-btn-small"
            onClick={() => setSize(s => +(s + 0.01).toFixed(2))}
          >+</button>
        </div>
      </div>

      {/* Mock TP/SL */}
      <div className="order-grid">
        <div className="order-input-group">
          <label className="order-input-label">Take Profit</label>
          <input type="text" placeholder="Not set" style={{ background: '#131722', border: '1px solid #2B2B43', borderRadius: '6px', padding: '8px', color: '#fff', fontSize: '14px', outline: 'none' }} />
        </div>
        <div className="order-input-group">
          <label className="order-input-label">Stop Loss</label>
          <input type="text" placeholder="Not set" style={{ background: '#131722', border: '1px solid #2B2B43', borderRadius: '6px', padding: '8px', color: '#fff', fontSize: '14px', outline: 'none' }} />
        </div>
      </div>

      <div className="order-actions">
        <button onClick={handleSell} className="btn-sell">
          <span>Sell</span>
        </button>
        <button onClick={handleBuy} className="btn-buy">
          <span>Buy</span>
        </button>
      </div>

      <div style={{ marginTop: '16px', fontSize: '12px', color: '#64748b', textAlign: 'center' }}>
        Demo Execution Only
      </div>
    </div>
  );
}
