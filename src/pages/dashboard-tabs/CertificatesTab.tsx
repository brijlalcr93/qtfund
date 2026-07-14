import { motion } from 'framer-motion';
import { Download, Award } from 'lucide-react';
import type { NavigateFunction } from 'react-router-dom';
import type { TradingAccount } from '../../store/platformStore';

interface CertificatesTabProps {
  selectedAccount: TradingAccount;
  selectedAccountId: string;
  profileName: string;
  setActiveView: React.Dispatch<React.SetStateAction<string>>;
  navigate: NavigateFunction;
}

export default function CertificatesTab({
  selectedAccount,
  selectedAccountId,
  profileName,
  setActiveView,
  navigate
}: CertificatesTabProps) {
  const hasPassed = selectedAccount.status === 'Funded' ||
    (selectedAccount.profitTarget > 0 && selectedAccount.balance >= selectedAccount.initialBalance + selectedAccount.profitTarget);

  return (
    <motion.div
      key="certificates"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
    >
      <div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Official Certificates</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Download or print your proof of professional challenge completion</p>
      </div>

      {hasPassed ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
          <style>{`
            @media print {
              header, footer, nav, button, .dashboard-sidebar, .mobile-only, .dashboard-content > div > *:not(#certificate-print-area) {
                display: none !important;
              }
              body, html {
                background: #0d0d0d !important;
                color: #fff !important;
                margin: 0 !important;
                padding: 0 !important;
                height: 100% !important;
                width: 100% !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              #certificate-print-area {
                position: absolute;
                left: 0;
                top: 0;
                right: 0;
                bottom: 0;
                width: 100% !important;
                height: 100% !important;
                margin: 0 !important;
                padding: 4rem 2rem !important;
                background: radial-gradient(circle, #121212 0%, #050505 100%) !important;
                border: 10px double #d4af37 !important;
                box-sizing: border-box !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: center !important;
                align-items: center !important;
                text-align: center !important;
                visibility: visible !important;
              }
              #certificate-print-area * {
                visibility: visible !important;
              }
            }
          `}</style>

          {/* Printable Certificate Area */}
          <div
            id="certificate-print-area"
            style={{
              width: '100%',
              maxWidth: '850px',
              aspectRatio: '1.414',
              background: 'radial-gradient(circle, rgba(20,20,20,0.95) 0%, rgba(5,5,5,0.98) 100%)',
              border: '6px double #d4af37',
              borderRadius: '24px',
              padding: '3.5rem 3rem',
              position: 'relative',
              boxShadow: '0 20px 50px rgba(212, 175, 55, 0.1), inset 0 0 40px rgba(212, 175, 55, 0.05)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              alignItems: 'center',
              textAlign: 'center',
              overflow: 'hidden'
            }}
          >
            <div style={{ position: 'absolute', top: '15px', left: '15px', width: '30px', height: '30px', borderTop: '2px solid #d4af37', borderLeft: '2px solid #d4af37' }} />
            <div style={{ position: 'absolute', top: '15px', right: '15px', width: '30px', height: '30px', borderTop: '2px solid #d4af37', borderRight: '2px solid #d4af37' }} />
            <div style={{ position: 'absolute', bottom: '15px', left: '15px', width: '30px', height: '30px', borderBottom: '2px solid #d4af37', borderLeft: '2px solid #d4af37' }} />
            <div style={{ position: 'absolute', bottom: '15px', right: '15px', width: '30px', height: '30px', borderBottom: '2px solid #d4af37', borderRight: '2px solid #d4af37' }} />

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
              <span style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '0.2em', color: '#d4af37', textTransform: 'uppercase' }}>APEX FUNDED</span>
              <span style={{ fontSize: '0.7rem', letterSpacing: '0.4em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Institutional Trading Partner</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <span style={{ fontSize: '0.85rem', letterSpacing: '0.3em', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Certificate of Excellence</span>
              <h2 style={{ fontSize: '2.5rem', fontWeight: 400, color: '#fff', fontFamily: 'serif', letterSpacing: '0.05em', margin: 0 }}>CERTIFICATE OF ACHIEVEMENT</h2>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>This document is proudly presented to</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', width: '85%' }}>
              <h1 style={{ fontSize: '2.8rem', fontWeight: 700, color: '#d4af37', borderBottom: '2px solid rgba(212,175,55,0.3)', paddingBottom: '0.5rem', width: '100%', fontFamily: 'serif', margin: 0 }}>
                {profileName}
              </h1>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: '0.8rem' }}>
                For successfully passing the <strong>{selectedAccount.name}</strong> and demonstrating institutional-grade consistency, professional risk management standards, and strict adherence to technical trading objectives.
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%', marginTop: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'left' }}>
                <span>Account Size: <strong style={{ color: '#fff' }}>${selectedAccount.initialBalance.toLocaleString()}</strong></span>
                <span>Verification ID: <strong style={{ color: '#fff', fontFamily: 'monospace' }}>APX-{selectedAccount.id}</strong></span>
                <span>Issued: <strong style={{ color: '#fff' }}>{selectedAccount.createdDate}</strong></span>
              </div>

              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, #f39c12, #d4af37)',
                boxShadow: '0 0 20px rgba(212, 175, 55, 0.4), inset 0 0 10px rgba(0,0,0,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                border: '2px dashed #fff'
              }}>
                <div style={{ color: '#000', fontSize: '0.7rem', fontWeight: 800, textAlign: 'center', lineHeight: 1.1, textTransform: 'uppercase' }}>
                  VERIFIED<br/>PARTNER
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', width: '150px' }}>
                <span style={{ fontFamily: 'cursive', fontSize: '1.2rem', color: '#d4af37' }}>Sarah Jenkins</span>
                <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.2)' }} />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Chief Risk Officer</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => window.print()}
            className="neon-button"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 2rem', fontSize: '1rem', fontWeight: 600 }}
          >
            <Download size={18} />
            Print / Save Certificate
          </button>
        </div>
      ) : (
        <div style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(20px)',
          border: '1px solid var(--glass-border)',
          borderRadius: '24px',
          padding: '4rem 2rem',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.5rem',
          maxWidth: '600px',
          margin: '2rem auto'
        }}>
          <div style={{
            width: '70px',
            height: '70px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ef4444',
            boxShadow: '0 0 15px rgba(239, 68, 68, 0.1)'
          }}>
            <Award size={36} />
          </div>
          <h3 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)' }}>Certificate Locked</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
            To unlock the premium printable gold-bordered Certificate of Excellence, your trading account must be elevated to **Funded Live** status or satisfy your current evaluation phase goals.
          </p>
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--glass-border)',
            borderRadius: '12px',
            padding: '1.2rem',
            width: '100%',
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.8rem'
          }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Requirements for Account #{selectedAccountId}:</span>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Status is 'Funded':</span>
              <span style={{ color: '#ef4444', fontWeight: 600 }}>✖ Locked (Currently {selectedAccount.status})</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Profit Target Reached:</span>
              <span style={{ color: selectedAccount.balance >= selectedAccount.initialBalance + selectedAccount.profitTarget ? 'var(--accent-cyan)' : '#ef4444', fontWeight: 600 }}>
                {selectedAccount.balance >= selectedAccount.initialBalance + selectedAccount.profitTarget ? '✓ Achieved' : `✖ Pending ($${Math.max(0, (selectedAccount.initialBalance + selectedAccount.profitTarget - selectedAccount.balance)).toLocaleString()} left)`}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Trading Days Completed:</span>
              <span style={{ color: selectedAccount.tradingDaysCurrent >= selectedAccount.tradingDaysRequired ? 'var(--accent-cyan)' : '#ef4444', fontWeight: 600 }}>
                {selectedAccount.tradingDaysCurrent >= selectedAccount.tradingDaysRequired ? '✓ Complete' : `✖ ${selectedAccount.tradingDaysCurrent}/${selectedAccount.tradingDaysRequired} Days`}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', width: '100%', marginTop: '0.5rem' }}>
            <button
              onClick={() => setActiveView('Trading Terminal')}
              className="neon-button"
              style={{ flex: 1, padding: '0.8rem' }}
            >
              Go to Terminal
            </button>
            <button
              onClick={() => navigate('/checkout')}
              className="neon-button"
              style={{ flex: 1, padding: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)' }}
            >
              Get New Challenge
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
