import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import type { TradingAccount, PayoutItem } from '../../store/platformStore';
import type { AppUser } from '../../contexts/AuthContext';
import { profileInputStyle, supportSelectStyle } from './shared';

interface PayoutsTabProps {
  selectedAccount: TradingAccount;
  recentPayouts: PayoutItem[];
  profileName: string;
  user: AppUser | null;
  payoutSuccessMsg: string;
  handlePayoutSubmit: (e: React.FormEvent) => void;
  payoutAmount: string;
  setPayoutAmount: React.Dispatch<React.SetStateAction<string>>;
  payoutMethod: string;
  setPayoutMethod: React.Dispatch<React.SetStateAction<string>>;
  payoutAddress: string;
  setPayoutAddress: React.Dispatch<React.SetStateAction<string>>;
}

export default function PayoutsTab({
  selectedAccount,
  recentPayouts,
  profileName,
  user,
  payoutSuccessMsg,
  handlePayoutSubmit,
  payoutAmount,
  setPayoutAmount,
  payoutMethod,
  setPayoutMethod,
  payoutAddress,
  setPayoutAddress
}: PayoutsTabProps) {
  const isFunded = selectedAccount.status === 'Funded';
  const profit = selectedAccount.balance - selectedAccount.initialBalance;

  const userPayouts = recentPayouts.filter(p =>
    p.name.toLowerCase().includes(profileName.toLowerCase()) ||
    p.name.toLowerCase().includes(user?.id?.toLowerCase() || '') ||
    p.name.toLowerCase().includes('affiliate')
  );

  return (
    <motion.div
      key="payouts"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
    >
      <div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Payout Board</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Withdraw your simulated live trading profits directly to Crypto or Wire</p>
      </div>

      {payoutSuccessMsg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ background: 'rgba(6, 182, 212, 0.1)', border: '1px solid var(--accent-cyan)', color: 'var(--accent-cyan)', padding: '1rem', borderRadius: '12px', textAlign: 'center', fontWeight: 600 }}
        >
          {payoutSuccessMsg}
        </motion.div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
        {/* Form Card */}
        <div style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(20px)',
          border: '1px solid var(--glass-border)',
          borderRadius: '24px',
          padding: '2rem'
        }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Request Payout</h3>

          {!isFunded ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '1.5rem', borderRadius: '12px', color: '#ef4444', fontSize: '0.9rem', lineHeight: 1.5 }}>
              <AlertCircle size={24} style={{ color: '#ef4444' }} />
              <span>Payouts are only available for Funded Live accounts. Evaluation accounts (Phase 1 & Phase 2) are not eligible for profit withdrawals.</span>
            </div>
          ) : profit < 100 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)', padding: '1.5rem', borderRadius: '12px', color: '#f59e0b', fontSize: '0.9rem', lineHeight: 1.5 }}>
              <AlertCircle size={24} style={{ color: '#f59e0b' }} />
              <span>No profits available to withdraw. Your current balance is <strong>${selectedAccount.balance.toLocaleString()}</strong> (Initial: ${selectedAccount.initialBalance.toLocaleString()}). Reach a minimum of $100 profit to request withdrawal.</span>
            </div>
          ) : (
            <form onSubmit={handlePayoutSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(6,182,212,0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(6,182,212,0.15)' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Available Profits:</span>
                <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>${profit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Withdrawal Amount ($)</label>
                <input
                  type="number"
                  min="100"
                  max={profit}
                  step="0.01"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  placeholder="e.g. 1500"
                  style={profileInputStyle}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Withdrawal Method</label>
                <select
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value)}
                  style={supportSelectStyle}
                >
                  <option value="USDT (TRC20)">USDT (TRC20)</option>
                  <option value="USDC (ERC20)">USDC (ERC20)</option>
                  <option value="USDC (Polygon)">USDC (Polygon)</option>
                  <option value="Bank Wire">Bank Wire</option>
                  <option value="PayPal">PayPal</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Payout Destination Address / Details</label>
                <input
                  type="text"
                  value={payoutAddress}
                  onChange={(e) => setPayoutAddress(e.target.value)}
                  placeholder="TRX Wallet Address or Bank details"
                  style={profileInputStyle}
                  required
                />
              </div>

              <button type="submit" className="neon-button" style={{ padding: '0.8rem 1.5rem', fontSize: '0.95rem', fontWeight: 600, marginTop: '0.5rem' }}>
                Request Profit Payout
              </button>
            </form>
          )}
        </div>

        {/* History Card */}
        <div style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(20px)',
          border: '1px solid var(--glass-border)',
          borderRadius: '24px',
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem'
        }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Payout History</h3>

          {userPayouts.length === 0 ? (
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', textAlign: 'center', padding: '3rem 1rem' }}>
              No payout logs found. Request a payout to log history.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '420px', overflowY: 'auto' }} className="custom-scrollbar">
              {userPayouts.map((p) => (
                <div
                  key={p.id}
                  style={{
                    background: 'rgba(255,255,255,0.01)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '12px',
                    padding: '1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      ${p.amount.toLocaleString()} ({p.method})
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      ID: {p.id} • {p.time}
                    </span>
                  </div>
                  <span style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    padding: '0.25rem 0.6rem',
                    borderRadius: '4px',
                    background:
                      p.status === 'Paid' ? 'rgba(38,166,154,0.1)' :
                      p.status === 'Approved' ? 'rgba(6,182,212,0.1)' :
                      p.status === 'Pending' ? 'rgba(245,158,11,0.1)' :
                      'rgba(239,68,68,0.1)',
                    color:
                      p.status === 'Paid' ? '#26a69a' :
                      p.status === 'Approved' ? 'var(--accent-cyan)' :
                      p.status === 'Pending' ? '#f59e0b' :
                      '#ef4444'
                  }}>
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
