import type { AffiliateItem } from '../../lib/adminApi';

export interface AffiliatesTabProps {
  affiliates: AffiliateItem[];
  handleAffiliateCommission: (userId: string, currentRate: number) => void;
}

export default function AffiliatesTab({ affiliates, handleAffiliateCommission }: AffiliatesTabProps) {
  return (
    <div style={{
      background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
      borderRadius: '24px', padding: '2rem'
    }}>
      <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Affiliate Program Console</h3>
      <div style={{ overflowX: 'auto' }} className="custom-scrollbar">
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              <th style={{ padding: '0.8rem 0' }}>Referrer</th>
              <th style={{ padding: '0.8rem 0' }}>Ref Code</th>
              <th style={{ padding: '0.8rem 0' }}>Comm %</th>
              <th style={{ padding: '0.8rem 0' }}>Referrals</th>
              <th style={{ padding: '0.8rem 0' }}>Earnings</th>
              <th style={{ padding: '0.8rem 0', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {affiliates.map((aff) => (
              <tr key={aff.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.92rem' }}>
                <td style={{ padding: '1rem 0' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{aff.name}</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>{aff.email}</span>
                  </div>
                </td>
                <td style={{ padding: '1rem 0', fontFamily: 'monospace', color: 'var(--text-primary)' }}>{aff.affiliateCode}</td>
                <td style={{ padding: '1rem 0', color: 'var(--text-secondary)' }}>{aff.commissionRate}%</td>
                <td style={{ padding: '1rem 0', color: 'var(--text-secondary)' }}>{aff._count.referrals} referrals</td>
                <td style={{ padding: '1rem 0', color: 'var(--accent-cyan)', fontWeight: 700 }}>${aff.totalEarnings.toFixed(2)}</td>
                <td style={{ padding: '1rem 0', textAlign: 'right' }}>
                  <button
                    onClick={() => handleAffiliateCommission(aff.id, aff.commissionRate)}
                    className="neon-button" style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}
                  >
                    Toggle Rate
                  </button>
                </td>
              </tr>
            ))}
            {affiliates.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-secondary)' }}>No affiliates</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
