import React, { useState, useEffect } from 'react';
import { useTradingStore } from '../store';

export const OrderPanel: React.FC = () => {
  const { activeSymbol, prices, openPosition, addPendingOrder } = useTradingStore();
  const currentPrice = prices[activeSymbol] || 0;
  
  const [isPending, setIsPending] = useState(false);
  const [size, setSize] = useState('0.1');
  const [targetPrice, setTargetPrice] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [stopLoss, setStopLoss] = useState('');

  useEffect(() => {
    if (isPending && !targetPrice && currentPrice) {
      setTargetPrice(currentPrice.toFixed(2));
    }
  }, [isPending, currentPrice]);

  useEffect(() => {
    setTargetPrice(currentPrice ? currentPrice.toFixed(2) : '');
    setTakeProfit('');
    setStopLoss('');
  }, [activeSymbol]);

  const handleTrade = (type: 'LONG' | 'SHORT') => {
    if (!currentPrice) return;
    const numSize = parseFloat(size);
    if (isNaN(numSize) || numSize <= 0) return;
    
    const tp = takeProfit ? parseFloat(takeProfit) : undefined;
    const sl = stopLoss ? parseFloat(stopLoss) : undefined;

    if (isPending) {
      const target = parseFloat(targetPrice);
      if (isNaN(target) || target <= 0) return;
      addPendingOrder(activeSymbol, type, numSize, target, tp, sl);
    } else {
      openPosition(activeSymbol, type, numSize, currentPrice, tp, sl);
    }
    
    setTakeProfit('');
    setStopLoss('');
  };

  return (
    <div className="order-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="tabs" style={{ flexShrink: 0 }}>
        <div className={`tab ${!isPending ? 'active' : ''}`} onClick={() => setIsPending(false)} style={{ flex: 1, textAlign: 'center', cursor: 'pointer' }}>Market</div>
        <div className={`tab ${isPending ? 'active' : ''}`} onClick={() => setIsPending(true)} style={{ flex: 1, textAlign: 'center', cursor: 'pointer' }}>Pending</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="input-group">
          <label className="input-label">Volume (Lots)</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              className="btn" 
              style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-main)' }}
              onClick={() => setSize(s => Math.max(0.01, (parseFloat(s) - 0.01)).toFixed(2))}
            >-</button>
            <input 
              type="number" 
              className="input-field" 
              value={size} 
              onChange={(e) => setSize(e.target.value)}
              style={{ textAlign: 'center' }}
              step="0.01"
              min="0.01"
            />
            <button 
              className="btn" 
              style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-main)' }}
              onClick={() => setSize(s => (parseFloat(s) + 0.01).toFixed(2))}
            >+</button>
          </div>
        </div>

        {isPending && (
          <div className="input-group">
            <label className="input-label">Target Price</label>
            <input 
              type="number" 
              className="input-field" 
              value={targetPrice} 
              onChange={(e) => setTargetPrice(e.target.value)}
              placeholder={currentPrice.toFixed(2)}
            />
          </div>
        )}

        <div className="input-group">
          <label className="input-label">Take Profit</label>
          <input 
            type="number" 
            className="input-field" 
            value={takeProfit} 
            onChange={(e) => setTakeProfit(e.target.value)}
            placeholder="Optional"
          />
        </div>

        <div className="input-group">
          <label className="input-label">Stop Loss</label>
          <input 
            type="number" 
            className="input-field" 
            value={stopLoss} 
            onChange={(e) => setStopLoss(e.target.value)}
            placeholder="Optional"
          />
        </div>
      </div>

      <div style={{ marginTop: 'auto', paddingTop: '1rem', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <span>Margin</span>
          <span>~ ${(parseFloat(size) * currentPrice * 0.01).toFixed(2) || '0.00'}</span>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            className="btn bg-red" 
            style={{ flex: 1, flexDirection: 'column' }}
            onClick={() => handleTrade('SHORT')}
          >
            <span style={{ fontSize: '1.1rem' }}>{isPending ? 'Pending Sell' : 'Sell'}</span>
            <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>{isPending ? targetPrice : currentPrice.toFixed(2)}</span>
          </button>
          <button 
            className="btn bg-green" 
            style={{ flex: 1, flexDirection: 'column' }}
            onClick={() => handleTrade('LONG')}
          >
            <span style={{ fontSize: '1.1rem' }}>{isPending ? 'Pending Buy' : 'Buy'}</span>
            <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>{isPending ? targetPrice : currentPrice.toFixed(2)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
