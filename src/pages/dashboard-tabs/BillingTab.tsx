import { motion } from 'framer-motion';
import { Download } from 'lucide-react';

interface BillingTabProps {
  profileName: string;
  invoiceDownloading: string | null;
  handleDownloadInvoice: (id: string) => void;
}

export default function BillingTab({ profileName, invoiceDownloading, handleDownloadInvoice }: BillingTabProps) {
  return (
    <motion.div
      key="billing"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
    >
      <div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Billing & Invoices</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Manage payment profiles, subscriptions, and download statements</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
        {/* Premium Credit Card Display */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '24px',
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: '220px',
          boxShadow: '0 10px 30px rgba(6, 182, 212, 0.15), inset 0 0 20px rgba(255,255,255,0.05)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: '-20%',
            right: '-10%',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(6, 182, 212, 0.2) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payment Method</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.2rem' }}>Quantum Pro Card</span>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'rgba(255,255,255,0.8)', fontStyle: 'italic' }}>VISA</div>
          </div>

          <div style={{ fontSize: '1.4rem', fontFamily: 'monospace', color: 'var(--text-primary)', letterSpacing: '0.15em', wordSpacing: '0.2em', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
            ••••  ••••  ••••  4242
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Cardholder</span>
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{profileName}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Expires</span>
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>12 / 29</span>
            </div>
          </div>
        </div>

        {/* Quick Billing details */}
        <div style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(20px)',
          border: '1px solid var(--glass-border)',
          borderRadius: '24px',
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.2rem',
          justifyContent: 'center'
        }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Active Plan</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0, lineHeight: 1.5 }}>
            You are registered on the premium **Quantum Funded Partner** track. Resets are priced at a discounted flat rate of `$299` with **80/20 profit splits** default.
          </p>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <span style={{ background: 'rgba(6, 182, 212, 0.1)', color: 'var(--accent-cyan)', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600 }}>
              80% profit Split
            </span>
            <span style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600 }}>
              Visa Auto-pay
            </span>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--glass-border)',
        borderRadius: '24px',
        padding: '2rem',
        overflowX: 'auto'
      }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Transaction History</h3>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '500px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              <th style={{ padding: '1rem 0' }}>Transaction ID</th>
              <th style={{ padding: '1rem 0' }}>Date</th>
              <th style={{ padding: '1rem 0' }}>Description</th>
              <th style={{ padding: '1rem 0' }}>Amount</th>
              <th style={{ padding: '1rem 0' }}>Status</th>
              <th style={{ padding: '1rem 0', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody style={{ fontSize: '0.95rem' }}>
            {[
              { id: 'INV-48201', date: 'May 12, 2026', desc: '$100k Evaluation Challenge - Phase 1', amt: '$499.00', status: 'Paid' },
              { id: 'INV-48092', date: 'May 01, 2026', desc: '$50k Evaluation Challenge - Phase 2', amt: '$299.00', status: 'Paid' },
              { id: 'INV-39281', date: 'Apr 01, 2026', desc: '$200k Evaluation Challenge - Funded Live', amt: '$949.00', status: 'Paid' },
              { id: 'INV-31089', date: 'Jan 10, 2026', desc: '$100k Evaluation Challenge - Closed', amt: '$499.00', status: 'Paid' }
            ].map((inv) => (
              <tr key={inv.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'var(--text-primary)' }}>
                <td style={{ padding: '1.2rem 0', fontFamily: 'monospace' }}>{inv.id}</td>
                <td style={{ padding: '1.2rem 0' }}>{inv.date}</td>
                <td style={{ padding: '1.2rem 0', fontWeight: 500 }}>{inv.desc}</td>
                <td style={{ padding: '1.2rem 0', color: 'var(--accent-cyan)', fontWeight: 600 }}>{inv.amt}</td>
                <td style={{ padding: '1.2rem 0' }}>
                  <span style={{ background: 'rgba(38,166,154,0.1)', color: '#26a69a', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                    {inv.status}
                  </span>
                </td>
                <td style={{ padding: '1.2rem 0', textAlign: 'right' }}>
                  <button
                    disabled={invoiceDownloading === inv.id}
                    onClick={() => handleDownloadInvoice(inv.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent-cyan)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      fontSize: '0.85rem',
                      opacity: invoiceDownloading === inv.id ? 0.6 : 1
                    }}
                  >
                    <Download size={14} />
                    {invoiceDownloading === inv.id ? 'Saving...' : 'Invoice'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
