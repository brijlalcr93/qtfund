import type { PaymentItem } from '../../lib/adminApi';

export interface PaymentsTabProps {
  payments: PaymentItem[];
  handleRefundPayment: (id: string) => void;
}

export default function PaymentsTab({ payments, handleRefundPayment }: PaymentsTabProps) {
  return (
    <div style={{
      background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
      borderRadius: '24px', padding: '2rem'
    }}>
      <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Payment Gateway Transactions</h3>
      <div style={{ overflowX: 'auto' }} className="custom-scrollbar">
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              <th style={{ padding: '0.8rem 0' }}>TXN Ref</th>
              <th style={{ padding: '0.8rem 0' }}>Customer</th>
              <th style={{ padding: '0.8rem 0' }}>Fee Paid</th>
              <th style={{ padding: '0.8rem 0' }}>Gateway</th>
              <th style={{ padding: '0.8rem 0' }}>Status</th>
              <th style={{ padding: '0.8rem 0', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((tx) => (
              <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.92rem' }}>
                <td style={{ padding: '1rem 0', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{tx.id.substring(0, 8)}...</td>
                <td style={{ padding: '1rem 0', fontWeight: 600, color: 'var(--text-primary)' }}>{tx.user.name}</td>
                <td style={{ padding: '1rem 0', color: 'var(--text-primary)' }}>${tx.amount.toLocaleString()}</td>
                <td style={{ padding: '1rem 0', color: 'var(--text-secondary)' }}>{tx.gateway}</td>
                <td style={{ padding: '1rem 0' }}>
                  <span style={{
                    padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700,
                    background: tx.status === 'Paid' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.15)',
                    color: tx.status === 'Paid' ? '#10b981' : '#ef4444'
                  }}>{tx.status}</span>
                </td>
                <td style={{ padding: '1rem 0', textAlign: 'right' }}>
                  {tx.status === 'Paid' ? (
                    <button onClick={() => handleRefundPayment(tx.id)} style={{
                      background: 'none', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444',
                      padding: '0.3rem 0.6rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600
                    }}>
                      Refund
                    </button>
                  ) : (
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>{tx.status}</span>
                  )}
                </td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-secondary)' }}>No payment records</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
