import { motion } from 'framer-motion';
import type { AffiliateInfo } from '../../store/platformStore';
import type { AppUser } from '../../contexts/AuthContext';
import { KpiCard, profileInputStyle } from './shared';

interface AffiliateTabProps {
  affiliates: Record<string, AffiliateInfo>;
  user: AppUser | null;
  claimAffiliatePayout: (userId: string) => Promise<void>;
  copiedReferral: boolean;
  setCopiedReferral: React.Dispatch<React.SetStateAction<boolean>>;
  affiliateSuccessMsg: string;
  setAffiliateSuccessMsg: React.Dispatch<React.SetStateAction<string>>;
}

export default function AffiliateTab({
  affiliates,
  user,
  claimAffiliatePayout,
  copiedReferral,
  setCopiedReferral,
  affiliateSuccessMsg,
  setAffiliateSuccessMsg
}: AffiliateTabProps) {
  const affiliateInfo = affiliates[user?.id || ''] || {
    userId: user?.id || 'offline-mock-user',
    referralCode: '',
    commissionPercent: 10,
    referrals: [],
    totalEarned: 0,
    pendingPayout: 0
  };
  const refLink = `https://apexfunded.com/register?ref=${affiliateInfo.referralCode}`;

  const handleCopyRefLink = () => {
    navigator.clipboard.writeText(refLink);
    setCopiedReferral(true);
    setTimeout(() => setCopiedReferral(false), 2000);
  };

  const handleClaimAffEarnings = () => {
    if (affiliateInfo.pendingPayout <= 0) return;
    claimAffiliatePayout(user?.id || 'offline-mock-user');
    setAffiliateSuccessMsg(`Withdrawal of $${affiliateInfo.pendingPayout.toFixed(2)} generated as a Payout Request item!`);
    setTimeout(() => setAffiliateSuccessMsg(''), 4000);
  };

  return (
    <motion.div
      key="affiliate"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
    >
      <div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Affiliate System</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Earn commissions by referring other professional traders to Apex Funded</p>
      </div>

      {affiliateSuccessMsg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ background: 'rgba(6, 182, 212, 0.1)', border: '1px solid var(--accent-cyan)', color: 'var(--accent-cyan)', padding: '1rem', borderRadius: '12px', textAlign: 'center', fontWeight: 600 }}
        >
          {affiliateSuccessMsg}
        </motion.div>
      )}

      {/* Affiliate Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem' }}>
        <KpiCard title="Total Earnings" value={`$${affiliateInfo.totalEarned.toFixed(2)}`} subtext="Lifetime commission" color="var(--accent-cyan)" />
        <KpiCard title="Pending Claim" value={`$${affiliateInfo.pendingPayout.toFixed(2)}`} subtext="Unclaimed balance" color="#a855f7" />
        <KpiCard title="Commission Rate" value={`${affiliateInfo.commissionPercent}%`} subtext="Base package payouts share" color="#3b82f6" />
        <KpiCard title="Total Referrals" value={affiliateInfo.referrals.length.toString()} subtext="Successful registrations" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
        {/* Referral Generator Card */}
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
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Referral Link</h3>

          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Referral Code</label>
            <input
              type="text"
              value={affiliateInfo.referralCode}
              disabled
              style={{ ...profileInputStyle, marginTop: 0 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Unique Referral Link</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={refLink}
                disabled
                style={{ ...profileInputStyle, flex: 1, marginTop: 0 }}
              />
              <button
                onClick={handleCopyRefLink}
                className="neon-button"
                style={{ padding: '0.6rem 1rem', fontSize: '0.85rem' }}
              >
                {copiedReferral ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem' }}>
            <button
              onClick={handleClaimAffEarnings}
              disabled={affiliateInfo.pendingPayout <= 0}
              className="neon-button"
              style={{
                width: '100%',
                padding: '0.8rem',
                fontSize: '0.95rem',
                fontWeight: 600,
                opacity: affiliateInfo.pendingPayout <= 0 ? 0.6 : 1,
                cursor: affiliateInfo.pendingPayout <= 0 ? 'not-allowed' : 'pointer'
              }}
            >
              Claim Affiliate Earnings
            </button>
          </div>
        </div>

        {/* Referrals Table */}
        <div style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(20px)',
          border: '1px solid var(--glass-border)',
          borderRadius: '24px',
          padding: '2rem',
          overflowX: 'auto'
        }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Referral Activity</h3>

          {affiliateInfo.referrals.length === 0 ? (
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', textAlign: 'center', padding: '3.5rem 1rem' }}>
              No referrals yet. Share your code to start earning commissions!
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  <th style={{ padding: '0.8rem 0' }}>Referral Name</th>
                  <th style={{ padding: '0.8rem 0' }}>Date</th>
                  <th style={{ padding: '0.8rem 0' }}>Status</th>
                  <th style={{ padding: '0.8rem 0', textAlign: 'right' }}>Commission</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: '0.9rem' }}>
                {affiliateInfo.referrals.map((r, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'var(--text-primary)' }}>
                    <td style={{ padding: '1rem 0', fontWeight: 500 }}>{r.name}</td>
                    <td style={{ padding: '1rem 0' }}>{r.date}</td>
                    <td style={{ padding: '1rem 0' }}>
                      <span style={{
                        background: r.status === 'Purchased' ? 'rgba(6,182,212,0.1)' : 'rgba(255,255,255,0.05)',
                        color: r.status === 'Purchased' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                        padding: '0.15rem 0.4rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 600
                      }}>
                        {r.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 0', textAlign: 'right', color: r.commission > 0 ? 'var(--accent-cyan)' : 'var(--text-secondary)', fontWeight: 600 }}>
                      ${r.commission.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </motion.div>
  );
}
