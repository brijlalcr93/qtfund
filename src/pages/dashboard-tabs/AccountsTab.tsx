import { motion } from 'framer-motion';
import { PlusCircle, Eye, EyeOff, AlertCircle } from 'lucide-react';
import type { NavigateFunction } from 'react-router-dom';
import type { TradingAccount } from '../../store/platformStore';

interface AccountsTabProps {
  navigate: NavigateFunction;
  notifState: string;
  setNotifState: React.Dispatch<React.SetStateAction<string>>;
  accounts: TradingAccount[];
  selectedAccountId: string;
  showCredentials: Record<string, boolean>;
  setShowCredentials: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  lossAlerts: Record<string, string>;
  setLossAlerts: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export default function AccountsTab({
  navigate,
  notifState,
  setNotifState,
  accounts,
  selectedAccountId,
  showCredentials,
  setShowCredentials,
  lossAlerts,
  setLossAlerts
}: AccountsTabProps) {
  return (
    <motion.div
      key="accounts"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Trading Accounts</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Monitor credentials, leverage, and configure alert settings</p>
        </div>
        <button
          onClick={() => navigate('/checkout')}
          className="neon-button"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 1.5rem', fontSize: '0.95rem', fontWeight: 600 }}
        >
          <PlusCircle size={18} />
          Get New Challenge
        </button>
      </div>

      {/* Live notification when configuring limit */}
      {notifState && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          style={{ background: 'rgba(6, 182, 212, 0.1)', border: '1px solid var(--accent-cyan)', color: 'var(--accent-cyan)', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}
        >
          {notifState}
        </motion.div>
      )}

      {/* Grid of Accounts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
        {accounts.map((acc) => {
          const showPass = showCredentials[acc.id] || false;
          const alertVal = lossAlerts[acc.id] || '2.0';

          return (
            <div
              key={acc.id}
              style={{
                background: 'var(--glass-bg)',
                backdropFilter: 'blur(20px)',
                border: acc.id === selectedAccountId ? '2px solid var(--accent-cyan)' : '1px solid var(--glass-border)',
                borderRadius: '24px',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{acc.name}</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ID: {acc.id}</span>
                </div>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '0.25rem 0.6rem',
                  borderRadius: '999px',
                  background: `rgba(${acc.status === 'Funded' ? '6,182,212' : acc.status === 'Phase 2' ? '168,85,247' : acc.status === 'Phase 1' ? '59,130,246' : '239,68,68'}, 0.15)`,
                  color: acc.status === 'Funded' ? 'var(--accent-cyan)' : acc.status === 'Phase 2' ? '#a855f7' : acc.status === 'Phase 1' ? '#3b82f6' : '#ef4444',
                  border: `1px solid rgba(${acc.status === 'Funded' ? '6,182,212' : acc.status === 'Phase 2' ? '168,85,247' : acc.status === 'Phase 1' ? '59,130,246' : '239,68,68'}, 0.3)`
                }}>
                  {acc.status}
                </span>
              </div>

              {/* MT5 credentials */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--text-primary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>MT5 Credentials</h4>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Server:</span>
                  <span style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>{acc.server}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Login:</span>
                  <span style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>{acc.id}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Password:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                      {showPass ? `quantum_trd_${acc.id}` : '••••••••••••'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowCredentials({ ...showCredentials, [acc.id]: !showPass })}
                      style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', display: 'flex' }}
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Loss settings & actions */}
              {acc.status !== 'Breached' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--text-primary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Custom Risk Alerts</h4>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="number"
                      step="0.1"
                      min="0.5"
                      max="8"
                      value={alertVal}
                      onChange={(e) => setLossAlerts({ ...lossAlerts, [acc.id]: e.target.value })}
                      style={{
                        width: '80px',
                        padding: '0.4rem 0.6rem',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '6px',
                        color: 'var(--text-primary)',
                        textAlign: 'center',
                        outline: 'none'
                      }}
                    />
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>% Daily loss email warning limit</span>
                  </div>
                  <button
                    onClick={() => {
                      setNotifState(`Successfully updated account #${acc.id} daily loss alert to ${alertVal}%!`);
                      setTimeout(() => setNotifState(''), 3000);
                    }}
                    className="neon-button"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', alignSelf: 'flex-start', marginTop: '0.5rem' }}
                  >
                    Save Limit
                  </button>
                </div>
              )}

              {acc.status === 'Breached' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', textAlign: 'center', padding: '1rem', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: '12px' }}>
                  <AlertCircle size={20} style={{ color: '#ef4444', alignSelf: 'center' }} />
                  <span style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: 600 }}>Account Access Suspended</span>
                  <button
                    onClick={() => {
                      alert(`Purchase request generated for Reset Challenge. You are redirected to Checkout.`);
                      navigate('/checkout');
                    }}
                    className="neon-button"
                    style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem', background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444' }}
                    onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 0 10px rgba(239,68,68,0.3)'}
                    onMouseOut={(e) => e.currentTarget.style.boxShadow = 'none'}
                  >
                    Reset Account ($299.00)
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </motion.div>
  );
}
