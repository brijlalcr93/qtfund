import { motion } from 'framer-motion';
import { Monitor } from 'lucide-react';
import TradingTerminal from '../TradingTerminal';
import type { TradingAccount } from '../../store/platformStore';

interface TerminalTabProps {
  selectedAccountId: string;
  selectedAccount: TradingAccount;
}

export default function TerminalTab({ selectedAccountId, selectedAccount }: TerminalTabProps) {
  return (
    <motion.div
      key="terminal"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      style={{ width: '100%', height: 'calc(100vh - 120px)', minHeight: '600px' }}
    >
      {/* Terminal Top Info Banner */}
      <div style={{
        background: 'rgba(6, 182, 212, 0.05)',
        border: '1px solid rgba(6, 182, 212, 0.2)',
        borderRadius: '12px',
        padding: '0.8rem 1.2rem',
        marginBottom: '1.2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <Monitor size={18} style={{ color: 'var(--accent-cyan)' }} />
          <span style={{ color: 'var(--text-primary)', fontSize: '0.95rem', fontWeight: 600 }}>
            Active MT5 Account Simulator: <span style={{ color: 'var(--accent-cyan)', fontFamily: 'monospace' }}>#{selectedAccountId}</span> ({selectedAccount.name})
          </span>
        </div>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Your terminal balance and margin update in real time with your selected account.
        </span>
      </div>

      <TradingTerminal />
    </motion.div>
  );
}
