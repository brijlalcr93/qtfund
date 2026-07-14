import type { PayoutItem } from '../../lib/adminApi';

export interface PayoutsTabProps {
  payouts: PayoutItem[];
  handlePayoutAction: (id: string, status: string) => void;
}

export default function PayoutsTab({ payouts, handlePayoutAction }: PayoutsTabProps) {
  return (
    <div style={{
      background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
      borderRadius: '24px', padding: '2rem'
    }}>
      <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Trader Payout Audit List</h3>
      <div style={{ overflowX: 'auto' }} className="custom-scrollbar">
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              <th style={{ padding: '0.8rem 0' }}>Request ID</th>
              <th style={{ padding: '0.8rem 0' }}>Trader</th>
              <th style={{ padding: '0.8rem 0' }}>Amount</th>
              <th style={{ padding: '0.8rem 0' }}>Net Amount</th>
              <th style={{ padding: '0.8rem 0' }}>Status</th>
              <th style={{ padding: '0.8rem 0', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {payouts.map((pay) => (
              <tr key={pay.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.92rem' }}>
                <td style={{ padding: '1rem 0', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{pay.id.substring(0, 8)}...</td>
                <td style={{ padding: '1rem 0', fontWeight: 600, color: 'var(--text-primary)' }}>{pay.user.name}</td>
                <td style={{ padding: '1rem 0', color: 'var(--accent-cyan)', fontWeight: 700 }}>${pay.amount.toLocaleString()}</td>
                <td style={{ padding: '1rem 0', color: 'var(--text-secondary)' }}>${pay.netAmount.toLocaleString()}</td>
                <td style={{ padding: '1rem 0' }}>
                  <span style={{
                    padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700,
                    background: pay.status === 'Paid' ? 'rgba(16,185,129,0.1)' : pay.status === 'Pending' ? 'rgba(245,158,11,0.1)' : pay.status === 'Approved' ? 'rgba(59,130,246,0.1)' : 'rgba(239,68,68,0.1)',
                    color: pay.status === 'Paid' ? '#10b981' : pay.status === 'Pending' ? '#f59e0b' : pay.status === 'Approved' ? '#3b82f6' : '#ef4444'
                  }}>{pay.status}</span>
                </td>
                <td style={{ padding: '1rem 0', textAlign: 'right', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  {pay.status === 'Pending' && (
                    <>
                      <button onClick={() => handlePayoutAction(pay.id, 'APPROVED')} className="neon-button" style={{ padding: '0.2rem 0.6rem', fontSize: '0.78rem' }}>
                        Approve
                      </button>
                      <button onClick={() => handlePayoutAction(pay.id, 'REJECTED')} style={{
                        background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', color: '#ef4444',
                        padding: '0.2rem 0.6rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem'
                      }}>
                        Reject
                      </button>
                    </>
                  )}
                  {pay.status === 'Approved' && (
                    <button onClick={() => handlePayoutAction(pay.id, 'COMPLETED')} className="neon-button" style={{ padding: '0.2rem 0.6rem', fontSize: '0.78rem' }}>
                      Mark Paid
                    </button>
                  )}
                  {pay.status === 'Paid' && <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Settled</span>}
                  {pay.status === 'Rejected' && <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>Rejected</span>}
                </td>
              </tr>
            ))}
            {payouts.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-secondary)' }}>No payout requests</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
