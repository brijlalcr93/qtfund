import { useTradingStore } from '../../store/tradingStore';

export default function PositionsTable() {
  const { positions, closePosition, balance, equity, freeMargin } = useTradingStore();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#1e222d', color: '#fff' }}>
      {/* Account Summary Strip */}
      <div className="positions-summary">
        <div className="summary-item">
          <span className="summary-label">Balance</span>
          <span className="summary-value">${balance.toFixed(2)}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Equity</span>
          <span className="summary-value">${equity.toFixed(2)}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Free Margin</span>
          <span className="summary-value">${freeMargin.toFixed(2)}</span>
        </div>
        <div className="summary-item" style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <span className="summary-label">Total PnL</span>
          <span className={`summary-value ${equity - balance >= 0 ? 'text-green' : 'text-red'}`}>
            ${(equity - balance).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Table header */}
      <div className="positions-table-container">
        <table className="positions-table">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Type</th>
              <th>Volume</th>
              <th>Open Price</th>
              <th>Current Price</th>
              <th style={{ textAlign: 'right' }}>PnL (USD)</th>
              <th style={{ textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {positions.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '32px 0', color: '#64748b' }}>
                  No open positions
                </td>
              </tr>
            ) : (
              positions.map((pos) => (
                <tr key={pos.id}>
                  <td style={{ fontWeight: 500 }}>{pos.symbol}</td>
                  <td className={pos.type === 'buy' ? 'text-green' : 'text-red'} style={{ textTransform: 'capitalize' }}>
                    {pos.type}
                  </td>
                  <td>{pos.size}</td>
                  <td>{pos.entryPrice.toFixed(pos.symbol.includes('USD') && !pos.symbol.includes('BTC') ? 4 : 2)}</td>
                  <td>{pos.currentPrice.toFixed(pos.symbol.includes('USD') && !pos.symbol.includes('BTC') ? 4 : 2)}</td>
                  <td className={`summary-value ${pos.unrealizedPnL >= 0 ? 'text-green' : 'text-red'}`} style={{ textAlign: 'right' }}>
                    ${pos.unrealizedPnL.toFixed(2)}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button 
                      onClick={() => closePosition(pos.id)}
                      className="btn-close"
                    >
                      Close
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
