import type { UserItem, KycItem } from '../../lib/adminApi';

export interface UsersTabProps {
  users: UserItem[];
  kycList: KycItem[];
  handleToggleUser: (id: string, name: string) => void;
}

export default function UsersTab({ users, kycList, handleToggleUser }: UsersTabProps) {
  return (
    <div style={{
      background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
      borderRadius: '24px', padding: '2rem'
    }}>
      <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>User Directory</h3>
      <div style={{ overflowX: 'auto' }} className="custom-scrollbar">
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              <th style={{ padding: '0.8rem 0' }}>User ID</th>
              <th style={{ padding: '0.8rem 0' }}>Name</th>
              <th style={{ padding: '0.8rem 0' }}>Email</th>
              <th style={{ padding: '0.8rem 0' }}>KYC State</th>
              <th style={{ padding: '0.8rem 0' }}>Status</th>
              <th style={{ padding: '0.8rem 0', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((usr) => {
              const kyc = kycList.find(k => k.user.id === usr.id);
              const kycStatus = kyc?.status || 'Not Submitted';
              const isActive = !usr.isSuspended && !usr.isBanned;
              return (
                <tr key={usr.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.92rem' }}>
                  <td style={{ padding: '1rem 0', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{usr.id.substring(0, 12)}...</td>
                  <td style={{ padding: '1rem 0', fontWeight: 600, color: 'var(--text-primary)' }}>{usr.name}</td>
                  <td style={{ padding: '1rem 0', color: 'var(--text-secondary)' }}>{usr.email}</td>
                  <td style={{ padding: '1rem 0' }}>
                    <span style={{
                      padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700,
                      background: kycStatus === 'Approved' ? 'rgba(16,185,129,0.1)' : kycStatus === 'Pending' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                      color: kycStatus === 'Approved' ? '#10b981' : kycStatus === 'Pending' ? '#f59e0b' : '#ef4444'
                    }}>{kycStatus}</span>
                  </td>
                  <td style={{ padding: '1rem 0' }}>
                    <span style={{
                      padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700,
                      background: isActive ? 'rgba(6,182,212,0.1)' : 'rgba(239,68,68,0.15)',
                      color: isActive ? 'var(--accent-cyan)' : '#ef4444'
                    }}>{isActive ? 'Active' : 'Suspended'}</span>
                  </td>
                  <td style={{ padding: '1rem 0', textAlign: 'right' }}>
                    <button
                      onClick={() => handleToggleUser(usr.id, usr.name)}
                      style={{
                        background: 'none', border: '1px solid var(--glass-border)',
                        color: isActive ? '#ef4444' : 'var(--accent-cyan)',
                        padding: '0.3rem 0.8rem', borderRadius: '6px', cursor: 'pointer',
                        fontSize: '0.8rem', fontWeight: 600
                      }}
                    >
                      {isActive ? 'Suspend' : 'Activate'}
                    </button>
                  </td>
                </tr>
              );
            })}
            {users.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-secondary)' }}>No users found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
