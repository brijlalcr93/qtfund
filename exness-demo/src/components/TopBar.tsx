import React from 'react';
import { useTradingStore } from '../store';
import { ChevronDown } from 'lucide-react';

const ASSETS = ['BTCUSDT', 'ETHUSDT', 'EURUSDT', 'GBPUSDT', 'SOLUSDT'];
const INTERVALS = ['1m', '3m', '5m', '15m', '30m', '1h', '4h', '1d'];

export const TopBar: React.FC = () => {
  const { balance, positions, activeSymbol, activeInterval, setActiveSymbol, setActiveInterval, prices } = useTradingStore();
  const currentPrice = prices[activeSymbol] || 0;

  const totalPnl = positions.reduce((sum, pos) => {
    const current = prices[pos.symbol] || pos.entryPrice;
    const pnl = pos.type === 'LONG'
      ? (current - pos.entryPrice) * pos.size
      : (pos.entryPrice - current) * pos.size;
    return sum + pnl;
  }, 0);
  const pnlColor = totalPnl >= 0 ? 'var(--green)' : 'var(--red)';

  return (
    <div className="topbar">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ position: 'relative' }}>
            <select
              value={activeSymbol}
              onChange={(e) => setActiveSymbol(e.target.value)}
              style={{
                appearance: 'none',
                backgroundColor: 'transparent',
                color: 'var(--text-main)',
                border: 'none',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                outline: 'none',
                paddingRight: '20px'
              }}
            >
              {ASSETS.map(asset => (
                <option key={asset} value={asset} style={{ background: 'var(--bg-panel)' }}>
                  {asset}
                </option>
              ))}
            </select>
            <ChevronDown size={16} style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
          </div>

          <div style={{ position: 'relative' }}>
            <select
              value={activeInterval}
              onChange={(e) => setActiveInterval(e.target.value)}
              style={{
                appearance: 'none',
                backgroundColor: 'transparent',
                color: 'var(--text-main)',
                border: 'none',
                fontSize: '1rem',
                cursor: 'pointer',
                outline: 'none',
                paddingRight: '20px',
              }}
            >
              {INTERVALS.map(interval => (
                <option key={interval} value={interval} style={{ background: 'var(--bg-panel)' }}>
                  {interval}
                </option>
              ))}
            </select>
            <ChevronDown size={16} style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', textAlign: 'right' }}>
          <div>
            <div className="text-muted" style={{ fontSize: '0.8rem' }}>Current Price</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: currentPrice ? 'var(--text-main)' : 'var(--text-muted)' }}>
              {currentPrice ? currentPrice.toFixed(2) : 'Loading...'}
            </div>
          </div>

          <div>
            <div className="text-muted" style={{ fontSize: '0.8rem' }}>Live PnL</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: pnlColor }}>
              {totalPnl >= 0 ? '+' : ''}{totalPnl.toFixed(2)} USD
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '2rem', marginTop: '0.75rem' }}>
        <div>
          <div className="text-muted" style={{ fontSize: '0.8rem' }}>Balance</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--accent)' }}>
            ${balance.toFixed(2)}
          </div>
        </div>

        <button className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>
          Deposit
        </button>
      </div>
    </div>
  );
};
