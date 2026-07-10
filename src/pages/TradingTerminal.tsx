import { useState } from 'react';
import { useTradingStore } from '../store/tradingStore';
import TradingChart from '../components/trading/TradingChart';
import OrderPanel from '../components/trading/OrderPanel';
import PositionsTable from '../components/trading/PositionsTable';
import { Search, Star, Bitcoin, DollarSign } from 'lucide-react';
import '../components/trading/trading.css'; // Import the new styles

const CRYPTO_PAIRS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT'];
const FOREX_PAIRS = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD'];

export default function TradingTerminal() {
  const { activeSymbol, setActiveSymbol } = useTradingStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'crypto' | 'forex'>('crypto');
  const [mobileTab, setMobileTab] = useState<'watchlist' | 'chart' | 'order' | 'positions'>('chart');

  const pairs = activeTab === 'crypto' ? CRYPTO_PAIRS : FOREX_PAIRS;
  const filteredPairs = pairs.filter(p => p.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="trading-container">
      
      {/* Mobile Top Navigation Tabs - Only visible on mobile */}
      <div className="trading-mobile-nav">
        <button 
          className={mobileTab === 'watchlist' ? 'active' : ''} 
          onClick={() => setMobileTab('watchlist')}
        >
          Watchlist
        </button>
        <button 
          className={mobileTab === 'chart' ? 'active' : ''} 
          onClick={() => setMobileTab('chart')}
        >
          Chart
        </button>
        <button 
          className={mobileTab === 'order' ? 'active' : ''} 
          onClick={() => setMobileTab('order')}
        >
          Order
        </button>
        <button 
          className={mobileTab === 'positions' ? 'active' : ''} 
          onClick={() => setMobileTab('positions')}
        >
          Positions
        </button>
      </div>

      {/* Left Sidebar - Watchlist */}
      <div className={`trading-sidebar-left ${mobileTab === 'watchlist' ? 'mobile-visible' : 'mobile-hidden'}`}>
        <div className="trading-search-container">
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', width: '16px', height: '16px' }} />
            <input 
              type="text" 
              placeholder="Search instruments..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="trading-search-input"
            />
          </div>
        </div>

        <div className="trading-tabs">
          <button 
            className={`trading-tab ${activeTab === 'crypto' ? 'active' : ''}`}
            onClick={() => setActiveTab('crypto')}
          >
            <Bitcoin style={{ width: '16px', height: '16px' }} /> Crypto
          </button>
          <button 
            className={`trading-tab ${activeTab === 'forex' ? 'active' : ''}`}
            onClick={() => setActiveTab('forex')}
          >
            <DollarSign style={{ width: '16px', height: '16px' }} /> Forex
          </button>
        </div>

        <div className="trading-pairs-list">
          {filteredPairs.map((pair) => (
            <div 
              key={pair}
              onClick={() => {
                setActiveSymbol(pair, activeTab);
                // Auto switch to chart view on mobile when selecting a pair
                setMobileTab('chart');
              }}
              className={`trading-pair-item ${activeSymbol === pair ? 'active' : ''}`}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Star style={{ width: '16px', height: '16px', color: '#94a3b8' }} />
                <span style={{ fontWeight: 600, fontSize: '14px' }}>{pair}</span>
              </div>
              <span style={{ fontSize: '12px', color: '#26a69a' }}>Live</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`trading-main ${mobileTab === 'chart' || mobileTab === 'positions' ? 'mobile-visible' : 'mobile-hidden'}`}>
        
        {/* Top Header for Chart */}
        <div className="trading-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>{activeSymbol}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
              <span style={{ color: '#94a3b8' }}>Timeframe:</span>
              <span style={{ backgroundColor: '#2B2B43', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>1m</span>
            </div>
            <div style={{ padding: '4px 12px', backgroundColor: 'rgba(38, 166, 154, 0.1)', color: '#26a69a', fontSize: '12px', fontWeight: 600, borderRadius: '9999px', marginLeft: '8px' }} className="market-badge-hide">
              Market Open
            </div>
          </div>
        </div>

        {/* Chart Area */}
        <div className={`trading-chart-area ${mobileTab === 'chart' ? 'mobile-visible' : 'mobile-hidden'}`}>
          <TradingChart />
        </div>

        {/* Bottom Positions Panel */}
        <div className={`trading-bottom-panel ${mobileTab === 'positions' ? 'mobile-visible' : 'mobile-hidden'}`}>
          <div className="trading-bottom-tabs">
            <button className="trading-bottom-tab active">Open Positions</button>
            <button className="trading-bottom-tab">Pending Orders</button>
            <button className="trading-bottom-tab">History</button>
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
             <PositionsTable />
          </div>
        </div>
      </div>

      {/* Right Sidebar - Order Panel */}
      <div className={`trading-sidebar-right ${mobileTab === 'order' ? 'mobile-visible' : 'mobile-hidden'}`}>
        <OrderPanel />
      </div>
    </div>
  );
}
