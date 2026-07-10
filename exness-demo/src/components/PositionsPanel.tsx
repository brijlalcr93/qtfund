import React, { useState } from 'react';
import { useTradingStore } from '../store';
import { X, Edit2, Check } from 'lucide-react';

export const PositionsPanel: React.FC = () => {
  const { positions, pendingOrders, history, prices, closePosition, closePositions, updatePosition, cancelPendingOrder } = useTradingStore();
  const [activeTab, setActiveTab] = useState<'open' | 'pending' | 'history'>('open');
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTp, setEditTp] = useState('');
  const [editSl, setEditSl] = useState('');

  const startEditing = (pos: any) => {
    setEditingId(pos.id);
    setEditTp(pos.takeProfit ? pos.takeProfit.toString() : '');
    setEditSl(pos.stopLoss ? pos.stopLoss.toString() : '');
  };

  const saveEditing = (id: string) => {
    const tp = editTp ? parseFloat(editTp) : undefined;
    const sl = editSl ? parseFloat(editSl) : undefined;
    updatePosition(id, { takeProfit: tp, stopLoss: sl });
    setEditingId(null);
  };


  return (
    <div className="positions-panel">
      <div className="tabs" style={{ marginBottom: 0, padding: '0 1rem', marginTop: '0.5rem' }}>
        <div className={`tab ${activeTab === 'open' ? 'active' : ''}`} onClick={() => setActiveTab('open')} style={{ cursor: 'pointer' }}>
          Open Positions ({positions.length})
        </div>
        <div className={`tab ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')} style={{ cursor: 'pointer' }}>
          Pending Orders ({pendingOrders.length})
        </div>
        <div className={`tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')} style={{ cursor: 'pointer' }}>
          History ({history.length})
        </div>
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {activeTab === 'open' && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Type</th>
                <th>Size</th>
                <th>Entry Price</th>
                <th>Current Price</th>
                <th>TP</th>
                <th>SL</th>
                <th>Profit / Loss</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {positions.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                    No open positions
                  </td>
                </tr>
              ) : (
                positions.map(pos => {
                  const currentPrice = prices[pos.symbol] || pos.entryPrice;
                  let pnl = 0;
                  if (pos.type === 'LONG') {
                    pnl = (currentPrice - pos.entryPrice) * pos.size;
                  } else {
                    pnl = (pos.entryPrice - currentPrice) * pos.size;
                  }
                  
                  const isProfit = pnl >= 0;

                  return (
                    <tr key={pos.id} style={{ borderLeft: `3px solid var(--${isProfit ? 'green' : 'red'})` }}>
                      <td style={{ fontWeight: 'bold' }}>{pos.symbol}</td>
                      <td className={pos.type === 'LONG' ? 'text-green' : 'text-red'}>{pos.type}</td>
                      <td>{pos.size}</td>
                      <td>{pos.entryPrice.toFixed(2)}</td>
                      <td>{currentPrice.toFixed(2)}</td>
                      
                      <td>
                        {editingId === pos.id ? (
                          <input type="number" className="input-field" style={{ width: '80px', padding: '0.2rem' }} value={editTp} onChange={e => setEditTp(e.target.value)} />
                        ) : (
                          pos.takeProfit || '-'
                        )}
                      </td>
                      <td>
                        {editingId === pos.id ? (
                          <input type="number" className="input-field" style={{ width: '80px', padding: '0.2rem' }} value={editSl} onChange={e => setEditSl(e.target.value)} />
                        ) : (
                          pos.stopLoss || '-'
                        )}
                      </td>

                      <td className={isProfit ? 'text-green' : 'text-red'} style={{ fontWeight: 'bold' }}>
                        {isProfit ? '+' : ''}{pnl.toFixed(2)} USD
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {editingId === pos.id ? (
                            <button className="btn" style={{ padding: '0.25rem 0.5rem', backgroundColor: 'var(--bg-hover)' }} onClick={() => saveEditing(pos.id)}>
                              <Check size={16} className="text-green" />
                            </button>
                          ) : (
                            <button className="btn" style={{ padding: '0.25rem 0.5rem', backgroundColor: 'var(--bg-hover)' }} onClick={() => startEditing(pos)}>
                              <Edit2 size={16} />
                            </button>
                          )}
                          <button 
                            className="btn" 
                            style={{ padding: '0.25rem 0.5rem', backgroundColor: 'var(--bg-hover)', color: 'var(--text-main)' }}
                            onClick={() => closePosition(pos.id)}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}

        {activeTab === 'pending' && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Type</th>
                <th>Size</th>
                <th>Target Price</th>
                <th>TP</th>
                <th>SL</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                    No pending orders
                  </td>
                </tr>
              ) : (
                pendingOrders.map(ord => (
                  <tr key={ord.id} style={{ borderLeft: `3px solid var(--${ord.type === 'LONG' ? 'green' : 'red'})` }}>
                    <td style={{ fontWeight: 'bold' }}>{ord.symbol}</td>
                    <td className={ord.type === 'LONG' ? 'text-green' : 'text-red'}>{ord.type}</td>
                    <td>{ord.size}</td>
                    <td>{ord.targetPrice.toFixed(2)}</td>
                    <td>{ord.takeProfit || '-'}</td>
                    <td>{ord.stopLoss || '-'}</td>
                    <td>
                      <button 
                        className="btn" 
                        style={{ padding: '0.25rem 0.5rem', backgroundColor: 'var(--bg-hover)', color: 'var(--text-main)' }}
                        onClick={() => cancelPendingOrder(ord.id)}
                      >
                        <X size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {activeTab === 'history' && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Type</th>
                <th>Size</th>
                <th>Entry Price</th>
                <th>Closed Price</th>
                <th>Final PnL</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                    No history
                  </td>
                </tr>
              ) : (
                [...history].reverse().map((pos, idx) => {
                  const isProfit = (pos.pnl || 0) >= 0;
                  return (
                    <tr key={idx} style={{ opacity: 0.8 }}>
                      <td style={{ fontWeight: 'bold' }}>{pos.symbol}</td>
                      <td className={pos.type === 'LONG' ? 'text-green' : 'text-red'}>{pos.type}</td>
                      <td>{pos.size}</td>
                      <td>{pos.entryPrice.toFixed(2)}</td>
                      <td>{pos.closedPrice?.toFixed(2)}</td>
                      <td className={isProfit ? 'text-green' : 'text-red'} style={{ fontWeight: 'bold' }}>
                        {isProfit ? '+' : ''}{pos.pnl?.toFixed(2)} USD
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
};
