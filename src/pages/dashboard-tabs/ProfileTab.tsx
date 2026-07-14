import { motion } from 'framer-motion';
import { ShieldCheck, AlertCircle } from 'lucide-react';
import type { KycSubmission } from '../../store/platformStore';
import type { AppUser } from '../../contexts/AuthContext';
import { profileInputStyle } from './shared';

interface ProfileTabProps {
  profileSaveSuccess: boolean;
  setProfileSaveSuccess: React.Dispatch<React.SetStateAction<boolean>>;
  profileName: string;
  setProfileName: React.Dispatch<React.SetStateAction<string>>;
  profileEmail: string;
  setProfileEmail: React.Dispatch<React.SetStateAction<string>>;
  profilePhone: string;
  setProfilePhone: React.Dispatch<React.SetStateAction<string>>;
  profileCountry: string;
  setProfileCountry: React.Dispatch<React.SetStateAction<string>>;
  activeKyc: KycSubmission | undefined;
  kycSuccessMsg: string;
  setKycSuccessMsg: React.Dispatch<React.SetStateAction<string>>;
  kycDocType: 'Passport' | 'Driver License' | 'Aadhaar' | 'PAN';
  setKycDocType: React.Dispatch<React.SetStateAction<'Passport' | 'Driver License' | 'Aadhaar' | 'PAN'>>;
  kycDocNum: string;
  setKycDocNum: React.Dispatch<React.SetStateAction<string>>;
  submitKyc: (kyc: Omit<KycSubmission, 'status' | 'submittedAt'>) => Promise<void>;
  user: AppUser | null;
  isTwoFactorActive: boolean;
  setIsTwoFactorActive: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function ProfileTab({
  profileSaveSuccess,
  setProfileSaveSuccess,
  profileName,
  setProfileName,
  profileEmail,
  setProfileEmail,
  profilePhone,
  setProfilePhone,
  profileCountry,
  setProfileCountry,
  activeKyc,
  kycSuccessMsg,
  setKycSuccessMsg,
  kycDocType,
  setKycDocType,
  kycDocNum,
  setKycDocNum,
  submitKyc,
  user,
  isTwoFactorActive,
  setIsTwoFactorActive
}: ProfileTabProps) {
  return (
    <motion.div
      key="profile"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
    >
      <div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Profile Settings</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Manage personal credentials, security keys, and KYC verification</p>
      </div>

      {profileSaveSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ background: 'rgba(38, 166, 154, 0.1)', border: '1px solid #26a69a', color: '#26a69a', padding: '1rem', borderRadius: '12px', textAlign: 'center', fontWeight: 600 }}
        >
          ✓ Profile changes successfully saved to your cloud session!
        </motion.div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
        {/* Account Form panel */}
        <div style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(20px)',
          border: '1px solid var(--glass-border)',
          borderRadius: '24px',
          padding: '2rem'
        }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Personal Info</h3>

          <form onSubmit={(e) => {
            e.preventDefault();
            setProfileSaveSuccess(true);
            setTimeout(() => setProfileSaveSuccess(false), 3000);
          }} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Full Name</label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                style={profileInputStyle}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Email Address</label>
              <input
                type="email"
                value={profileEmail}
                onChange={(e) => setProfileEmail(e.target.value)}
                style={profileInputStyle}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Phone Number</label>
              <input
                type="text"
                value={profilePhone}
                onChange={(e) => setProfilePhone(e.target.value)}
                style={profileInputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Country</label>
              <input
                type="text"
                value={profileCountry}
                onChange={(e) => setProfileCountry(e.target.value)}
                style={profileInputStyle}
              />
            </div>

            <button type="submit" className="neon-button" style={{ padding: '0.8rem 1.5rem', fontSize: '0.95rem', fontWeight: 600, marginTop: '0.5rem', alignSelf: 'flex-start' }}>
              Save Profile Details
            </button>
          </form>
        </div>

        {/* KYC Verification & Security Panels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* KYC Panel */}
          <div style={{
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--glass-border)',
            borderRadius: '24px',
            padding: '2rem'
          }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem' }}>Verification State</h3>

            {activeKyc?.status === 'Approved' ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(38,166,154,0.05)', border: '1px solid rgba(38,166,154,0.2)', padding: '1rem', borderRadius: '12px', marginBottom: '1rem' }}>
                  <ShieldCheck size={28} style={{ color: '#26a69a' }} />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ color: '#26a69a', fontWeight: 700, fontSize: '0.95rem' }}>KYC Verified (Level 2)</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Limits fully unlocked for withdrawals</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <span>• ID Verification: <strong>Approved</strong></span>
                  <span>• Type: <strong>{activeKyc.documentType}</strong></span>
                  <span>• Serial: <strong>{activeKyc.documentNumber}</strong></span>
                  <span>• Verified Date: <strong>{activeKyc.submittedAt}</strong></span>
                </div>
              </>
            ) : activeKyc?.status === 'Pending' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)', padding: '1.5rem', borderRadius: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <AlertCircle size={28} style={{ color: '#f59e0b' }} />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: '0.95rem' }}>Review in Progress</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Identity documents are being audited</span>
                  </div>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  We are verifying your **{activeKyc.documentType}** (#{activeKyc.documentNumber}). Audits generally resolve in under 12-24 hours.
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {activeKyc?.status === 'Rejected' && (
                  <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', padding: '1rem', borderRadius: '12px', fontSize: '0.85rem', lineHeight: 1.4 }}>
                    🔴 KYC Rejected: <strong>{activeKyc.feedback || 'Document resolution is too low.'}</strong>. Please upload again.
                  </div>
                )}

                {kycSuccessMsg && (
                  <div style={{ background: 'rgba(6, 182, 212, 0.1)', border: '1px solid var(--accent-cyan)', color: 'var(--accent-cyan)', padding: '1rem', borderRadius: '12px', fontSize: '0.85rem', textAlign: 'center' }}>
                    {kycSuccessMsg}
                  </div>
                )}

                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (!kycDocNum) return;
                  submitKyc({
                    userId: user?.id || 'offline-mock-user',
                    userName: profileName,
                    userEmail: profileEmail,
                    documentType: kycDocType,
                    documentNumber: kycDocNum
                  });
                  setKycSuccessMsg('Documents submitted. Under review by Risk Desk.');
                  setTimeout(() => setKycSuccessMsg(''), 4000);
                }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.3rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Select ID Document Type</label>
                    <select
                      value={kycDocType}
                      onChange={(e) => setKycDocType(e.target.value as any)}
                      style={{
                        width: '100%',
                        padding: '0.6rem 0.8rem',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '8px',
                        color: 'var(--text-primary)',
                        fontSize: '0.9rem',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="Passport">Passport</option>
                      <option value="Driver License">Driver License</option>
                      <option value="Aadhaar">Aadhaar Card</option>
                      <option value="PAN">PAN Card</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.3rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Document Serial Number</label>
                    <input
                      type="text"
                      placeholder="e.g. J190284X"
                      value={kycDocNum}
                      onChange={(e) => setKycDocNum(e.target.value)}
                      style={profileInputStyle}
                      required
                    />
                  </div>
                  <button type="submit" className="neon-button" style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem' }}>
                    Submit KYC Documents
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* 2FA Panel */}
          <div style={{
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--glass-border)',
            borderRadius: '24px',
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)' }}>Security Configuration</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>Two-Factor Security (2FA)</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>Authenticate logins via Google Authenticator</span>
              </div>
              {/* Glowing toggle button */}
              <button
                onClick={() => {
                  const next = !isTwoFactorActive;
                  setIsTwoFactorActive(next);
                  localStorage.setItem('quantum_2fa_active', next ? 'true' : 'false');
                }}
                style={{
                  width: '50px',
                  height: '26px',
                  borderRadius: '999px',
                  background: isTwoFactorActive ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.1)',
                  border: 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'background-color 0.3s',
                  boxShadow: isTwoFactorActive ? '0 0 10px var(--accent-glow)' : 'none'
                }}
              >
                <motion.div
                  animate={{ x: isTwoFactorActive ? 24 : 2 }}
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: '#fff',
                    position: 'absolute',
                    top: '2px',
                    left: 0
                  }}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
