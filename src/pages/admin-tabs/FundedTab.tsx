import type { ChallengeItem } from '../../lib/adminApi';

export interface FundedTabProps {
  challenges: ChallengeItem[];
  handleUpgradeAccount: (id: string) => void;
  handleDisableAccount: (id: string) => void;
  handleResetChallenge: (id: string) => void;
}

export default function FundedTab({ challenges, handleUpgradeAccount, handleDisableAccount, handleResetChallenge }: FundedTabProps) {
  return (
    <div style={{
      background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
      borderRadius: '24px', padding: '2rem'
    }}>
      <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Funded Partner Accounts console</h3>
      <div style={{ overflowX: 'auto' }} className="custom-scrollbar">
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              <th style={{ padding: '0.8rem 0' }}>Account ID</th>
              <th style={{ padding: '0.8rem 0' }}>Trader</th>
              <th style={{ padding: '0.8rem 0' }}>Plan</th>
              <th style={{ padding: '0.8rem 0' }}>Balance</th>
              <th style={{ padding: '0.8rem 0' }}>Status</th>
              <th style={{ padding: '0.8rem 0', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {challenges.map((ch) => (
              <tr key={ch.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.92rem' }}>
                <td style={{ padding: '1rem 0', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{ch.id.substring(0, 8)}...</td>
                <td style={{ padding: '1rem 0', fontWeight: 600, color: 'var(--text-primary)' }}>{ch.user.name}</td>
                <td style={{ padding: '1rem 0', color: 'var(--text-secondary)' }}>{ch.plan.name}</td>
                <td style={{ padding: '1rem 0', fontWeight: 600, color: 'var(--text-primary)' }}>${ch.currentBalance.toLocaleString()}</td>
                <td style={{ padding: '1rem 0' }}>
                  <span style={{
                    padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700,
                    background: ch.status !== 'Breached' && ch.status !== 'Funded' ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)',
                    color: ch.status !== 'Breached' && ch.status !== 'Funded' ? '#10b981' : ch.status === 'Funded' ? '#3b82f6' : '#ef4444'
                  }}>{ch.status}</span>
                </td>
                <td style={{ padding: '1rem 0', textAlign: 'right', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  {(ch.status === 'Phase 1' || ch.status === 'Phase 2') && (
                    <>
                      <button onClick={() => handleUpgradeAccount(ch.id)} className="neon-button" style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}>
                        Upgrade size
                      </button>
                      <button onClick={() => handleDisableAccount(ch.id)} style={{
                        background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', color: '#ef4444',
                        padding: '0.3rem 0.6rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600
                      }}>
                        Disable
                      </button>
                    </>
                  )}
                  {ch.status === 'Breached' && (
                    <button onClick={() => handleResetChallenge(ch.id)} style={{
                      background: 'rgba(6,182,212,0.1)', border: '1px solid var(--accent-cyan)', color: 'var(--accent-cyan)',
                      padding: '0.3rem 0.6rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600
                    }}>
                      Reset to Active
                    </button>
                  )}
                  {ch.status === 'Funded' && <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Funded</span>}
                </td>
              </tr>
            ))}
            {challenges.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-secondary)' }}>No funded accounts</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
