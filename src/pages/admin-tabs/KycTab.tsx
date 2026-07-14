import type { KycItem } from '../../lib/adminApi';

export interface KycTabProps {
  kycList: KycItem[];
  handleKycAction: (id: string, status: string, userName: string) => void;
}

export default function KycTab({ kycList, handleKycAction }: KycTabProps) {
  return (
    <div style={{
      background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
      borderRadius: '24px', padding: '2rem'
    }}>
      <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>KYC Approvals Queue</h3>
      <div style={{ overflowX: 'auto' }} className="custom-scrollbar">
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              <th style={{ padding: '0.8rem 0' }}>Trader</th>
              <th style={{ padding: '0.8rem 0' }}>Document</th>
              <th style={{ padding: '0.8rem 0' }}>Status</th>
              <th style={{ padding: '0.8rem 0', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {kycList.map((sub) => (
              <tr key={sub.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.92rem' }}>
                <td style={{ padding: '1rem 0' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{sub.user.name}</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>{sub.user.email}</span>
                  </div>
                </td>
                <td style={{ padding: '1rem 0', color: 'var(--text-primary)' }}>{sub.documentType}</td>
                <td style={{ padding: '1rem 0' }}>
                  <span style={{
                    padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700,
                    background: sub.status === 'Approved' ? 'rgba(16,185,129,0.1)' : sub.status === 'Pending' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                    color: sub.status === 'Approved' ? '#10b981' : sub.status === 'Pending' ? '#f59e0b' : '#ef4444'
                  }}>{sub.status}</span>
                </td>
                <td style={{ padding: '1rem 0', textAlign: 'right', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  {sub.status === 'Pending' && (
                    <>
                      <button onClick={() => handleKycAction(sub.user.id, 'APPROVED', sub.user.name)} className="neon-button" style={{ padding: '0.2rem 0.6rem', fontSize: '0.78rem' }}>
                        Approve
                      </button>
                      <button onClick={() => handleKycAction(sub.user.id, 'REJECTED', sub.user.name)} style={{
                        background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', color: '#ef4444',
                        padding: '0.2rem 0.6rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem'
                      }}>
                        Reject
                      </button>
                    </>
                  )}
                  {sub.status === 'Approved' && <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Verified Partner</span>}
                  {sub.status === 'Rejected' && <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>Rejected</span>}
                </td>
              </tr>
            ))}
            {kycList.length === 0 && (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-secondary)' }}>No KYC submissions</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
