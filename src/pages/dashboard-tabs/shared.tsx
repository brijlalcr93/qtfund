import { motion } from 'framer-motion';

// Shared small presentational components and style objects used by multiple
// Dashboard tab components. Extracted verbatim from Dashboard.tsx during the
// tab-splitting refactor — no logic/styling changes.

export const KpiCard = ({ title, value, subtext, color = 'var(--text-primary)' }: { title: string, value: string, subtext: string, color?: string }) => (
  <div style={{
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid var(--glass-border)',
    borderRadius: '16px',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    boxShadow: 'inset 0 0 12px rgba(255,255,255,0.01)'
  }}>
    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</span>
    <span style={{ color, fontSize: '1.8rem', fontWeight: 700 }}>{value}</span>
    <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{subtext}</span>
  </div>
);

export const ProgressBar = ({ label, current, max, isCurrency = true }: { label: string, current: number, max: number, isCurrency?: boolean }) => {
  const percentage = Math.max(0, Math.min((current / max) * 100, 100));
  const isDrawdown = current < 0;

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{label}</span>
        <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem' }}>
          {isCurrency ? `$${Math.abs(current).toLocaleString()}` : current} / {isCurrency ? `$${Math.abs(max).toLocaleString()}` : max}
        </span>
      </div>
      <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
          style={{
            height: '100%',
            background: isDrawdown ? '#ef4444' : 'var(--accent-cyan)',
            boxShadow: `0 0 10px ${isDrawdown ? 'rgba(239, 68, 68, 0.5)' : 'var(--accent-glow)'}`
          }}
        />
      </div>
    </div>
  );
};

// Styling elements
export const profileInputStyle = {
  width: '100%',
  padding: '0.8rem 1rem',
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid var(--glass-border)',
  borderRadius: '8px',
  color: 'var(--text-primary)',
  fontSize: '0.95rem',
  outline: 'none',
  marginTop: '0.2rem'
};

export const supportSelectStyle = {
  width: '100%',
  padding: '0.8rem 1rem',
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid var(--glass-border)',
  borderRadius: '8px',
  color: 'var(--text-primary)',
  fontSize: '0.95rem',
  outline: 'none',
  marginTop: '0.2rem',
  cursor: 'pointer'
};

export const supportTextareaStyle = {
  width: '100%',
  padding: '0.8rem 1rem',
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid var(--glass-border)',
  borderRadius: '8px',
  color: 'var(--text-primary)',
  fontSize: '0.95rem',
  outline: 'none',
  marginTop: '0.2rem',
  fontFamily: 'inherit',
  resize: 'vertical' as const
};

export const supportLabelStyle = {
  display: 'block',
  color: 'var(--text-secondary)',
  fontSize: '0.85rem'
};
