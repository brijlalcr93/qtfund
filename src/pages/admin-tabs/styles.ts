// Shared inline style objects used by several AdminPanel tab components.
// Moved verbatim (unchanged) from src/pages/AdminPanel.tsx during the tab-split refactor.

export const labelStyle = {
  display: 'block',
  marginBottom: '0.3rem',
  color: 'var(--text-secondary)',
  fontSize: '0.85rem'
};

export const inputStyle = {
  width: '100%',
  padding: '0.7rem 1rem',
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid var(--glass-border)',
  borderRadius: '8px',
  color: 'var(--text-primary)',
  fontSize: '0.95rem',
  outline: 'none',
  marginTop: '0.1rem',
  boxSizing: 'border-box' as const
};

export const selectStyle = {
  width: '100%',
  padding: '0.7rem 1rem',
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid var(--glass-border)',
  borderRadius: '8px',
  color: 'var(--text-primary)',
  fontSize: '0.95rem',
  outline: 'none',
  marginTop: '0.1rem',
  cursor: 'pointer',
  boxSizing: 'border-box' as const
};

export const textareaStyle = {
  width: '100%',
  padding: '0.7rem 1rem',
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid var(--glass-border)',
  borderRadius: '8px',
  color: 'var(--text-primary)',
  fontSize: '0.95rem',
  outline: 'none',
  marginTop: '0.1rem',
  fontFamily: 'inherit',
  resize: 'vertical' as const,
  boxSizing: 'border-box' as const
};
