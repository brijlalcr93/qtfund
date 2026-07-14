import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../lib/api';

type PollStatus = 'waiting' | 'paid' | 'failed';

export default function CryptoReturn() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderRef = searchParams.get('ref');
  const [status, setStatus] = useState<PollStatus>('waiting');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!orderRef) {
      setStatus('failed');
      return;
    }

    const poll = async () => {
      try {
        const data = await api.get<{ status: string }>(`/payments/crypto/status-by-ref/${orderRef}`);
        if (data.status === 'paid') {
          setStatus('paid');
          if (intervalRef.current) clearInterval(intervalRef.current);
        } else if (['expired', 'invalid'].includes(data.status)) {
          setStatus('failed');
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      } catch {
        // Keep polling — a transient network error shouldn't flip the UI to failed.
      }
    };

    poll();
    intervalRef.current = setInterval(poll, 4000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [orderRef]);

  return (
    <div className="scroll-section" style={{ minHeight: '100vh', justifyContent: 'center', paddingTop: '100px' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{
          maxWidth: '550px',
          width: '100%',
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(20px)',
          border: `2px solid ${status === 'failed' ? '#ef4444' : 'var(--accent-cyan)'}`,
          borderRadius: '24px',
          padding: '4rem 3rem',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.5rem',
          boxShadow: '0 0 30px rgba(6,182,212,0.15)'
        }}
      >
        {status === 'waiting' && (
          <>
            <div style={{
              width: '48px',
              height: '48px',
              border: '3px solid rgba(6, 182, 212, 0.15)',
              borderTopColor: 'var(--accent-cyan)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite'
            }} />
            <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>Confirming Your Payment</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.6 }}>
              We're waiting for your crypto transaction to confirm on-chain. This usually takes a few minutes depending on network congestion — this page will update automatically.
            </p>
          </>
        )}

        {status === 'paid' && (
          <>
            <div style={{
              width: '70px', height: '70px', borderRadius: '50%',
              background: 'rgba(6,182,212,0.1)', border: '2px solid var(--accent-cyan)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--accent-cyan)', fontSize: '2rem', boxShadow: '0 0 20px var(--accent-glow)'
            }}>
              ✓
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)' }}>Payment Confirmed</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6 }}>
              Your crypto payment was confirmed and your trading account has been provisioned.
            </p>
            <button onClick={() => navigate('/dashboard')} className="neon-button" style={{ width: '100%', padding: '1rem', fontSize: '1rem', fontWeight: 700, marginTop: '1rem' }}>
              Go to Trader Dashboard
            </button>
          </>
        )}

        {status === 'failed' && (
          <>
            <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#ef4444' }}>Payment Not Confirmed</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6 }}>
              We couldn't confirm this payment, or the invoice expired. If you completed the transfer, please contact support with your transaction details.
            </p>
            <button onClick={() => navigate('/checkout')} className="neon-button" style={{ width: '100%', padding: '1rem', fontSize: '1rem', fontWeight: 700, marginTop: '1rem' }}>
              Return to Checkout
            </button>
          </>
        )}

        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </motion.div>
    </div>
  );
}
