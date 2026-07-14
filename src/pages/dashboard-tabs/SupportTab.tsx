import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Send } from 'lucide-react';
import type { SupportTicket } from '../../store/platformStore';
import { profileInputStyle, supportSelectStyle, supportTextareaStyle, supportLabelStyle } from './shared';

interface SupportTabProps {
  ticketSuccess: boolean;
  faqActive: number | null;
  setFaqActive: React.Dispatch<React.SetStateAction<number | null>>;
  ticketCategory: string;
  setTicketCategory: React.Dispatch<React.SetStateAction<string>>;
  ticketSubject: string;
  setTicketSubject: React.Dispatch<React.SetStateAction<string>>;
  ticketMessage: string;
  setTicketMessage: React.Dispatch<React.SetStateAction<string>>;
  handleSupportTicketSubmit: (e: React.FormEvent) => void;
  tickets: SupportTicket[];
}

export default function SupportTab({
  ticketSuccess,
  faqActive,
  setFaqActive,
  ticketCategory,
  setTicketCategory,
  ticketSubject,
  setTicketSubject,
  ticketMessage,
  setTicketMessage,
  handleSupportTicketSubmit,
  tickets
}: SupportTabProps) {
  return (
    <motion.div
      key="support"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
    >
      <div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Support Desk</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Browse FAQs, look up solutions, or log live helpdesk tickets</p>
      </div>

      {ticketSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ background: 'rgba(6, 182, 212, 0.1)', border: '1px solid var(--accent-cyan)', color: 'var(--accent-cyan)', padding: '1rem', borderRadius: '12px', textAlign: 'center', fontWeight: 600 }}
        >
          ✓ Ticket submitted successfully! A virtual support specialist is reviewing your request.
        </motion.div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>

        {/* FAQ Accordion Panel */}
        <div style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(20px)',
          border: '1px solid var(--glass-border)',
          borderRadius: '24px',
          padding: '2rem'
        }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Frequently Asked Questions</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { q: 'How is maximum drawdown calculated?', a: 'Maximum drawdown is calculated based on the maximum equity balance achieved. If your equity falls below the initial balance minus the limit (e.g. -$10,000 on a $100k account), the account is breached.' },
              { q: 'What is the daily loss threshold reset time?', a: 'Daily loss resets daily at 00:00 UTC (Server Time). The daily loss limit is calculated as 5% of the starting equity balance of the respective day.' },
              { q: 'How fast do profit withdrawals process?', a: 'Withdrawals are processed instantly in USDC/USDT or within 24-48 business hours via bank wire, directly through the billing dashboard.' },
              { q: 'Can I trade crypto over the weekends?', a: 'Yes, crypto assets (like BTCUSDT, ETHUSDT) are fully available for simulated live execution 24/7. Forex assets trade standard hours.' }
            ].map((faq, index) => {
              const isOpen = faqActive === index;
              return (
                <div
                  key={index}
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.8rem' }}
                >
                  <button
                    onClick={() => setFaqActive(isOpen ? null : index)}
                    style={{
                      width: '100%',
                      background: 'none',
                      border: 'none',
                      textAlign: 'left',
                      color: 'var(--text-primary)',
                      fontSize: '1rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.4rem 0'
                    }}
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ overflow: 'hidden' }}
                      >
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, marginTop: '0.5rem', paddingRight: '1rem' }}>
                          {faq.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        </div>

        {/* Submit Ticket and Log Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Submit Ticket Form */}
          <div style={{
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--glass-border)',
            borderRadius: '24px',
            padding: '2rem'
          }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Create Support Ticket</h3>
            <form onSubmit={handleSupportTicketSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={supportLabelStyle}>Category</label>
                  <select
                    value={ticketCategory}
                    onChange={(e) => setTicketCategory(e.target.value)}
                    style={supportSelectStyle}
                  >
                    <option value="Technical">Technical</option>
                    <option value="Billing">Billing</option>
                    <option value="Risk & Drawdown">Risk & Drawdown</option>
                    <option value="Partner Program">Partner Program</option>
                  </select>
                </div>
                <div>
                  <label style={supportLabelStyle}>Subject</label>
                  <input
                    type="text"
                    placeholder="e.g. MT5 reset request"
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    style={profileInputStyle}
                    required
                  />
                </div>
              </div>
              <div>
                <label style={supportLabelStyle}>Message details</label>
                <textarea
                  rows={4}
                  placeholder="Provide details about your query here..."
                  value={ticketMessage}
                  onChange={(e) => setTicketMessage(e.target.value)}
                  style={supportTextareaStyle}
                  required
                />
              </div>
              <button type="submit" className="neon-button" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 1.5rem', fontSize: '0.95rem', alignSelf: 'flex-start' }}>
                <Send size={16} />
                Log Ticket
              </button>
            </form>
          </div>

          {/* Ticket Logs List */}
          <div style={{
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--glass-border)',
            borderRadius: '24px',
            padding: '2rem'
          }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.2rem' }}>Active Support Tickets</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {tickets.map((t) => (
                <div
                  key={t.id}
                  style={{
                    background: 'rgba(255,255,255,0.01)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '12px',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{t.id}</span>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      background: t.status === 'Closed' ? 'rgba(255,255,255,0.05)' : t.status === 'Open' ? 'rgba(6,182,212,0.1)' : 'rgba(168,85,247,0.1)',
                      color: t.status === 'Closed' ? 'var(--text-secondary)' : t.status === 'Open' ? 'var(--accent-cyan)' : '#a855f7'
                    }}>
                      {t.status}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>{t.subject}</span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                    <span>Cat: <strong>{t.category}</strong></span>
                    <span>Replies: <strong>{Math.max(0, t.messages.length - 1)}</strong></span>
                  </div>

                  {/* Render active dialogue if ticket has messages */}
                  {t.messages && t.messages.length > 0 && (
                    <div style={{ marginTop: '0.8rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      {t.messages.map((m: any, idx: number) => (
                        <div key={idx} style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', background: m.sender === 'User' ? 'rgba(255,255,255,0.02)' : 'rgba(6,182,212,0.05)', padding: '0.6rem', borderRadius: '8px' }}>
                          <span style={{ fontWeight: 600, color: m.sender === 'User' ? 'var(--text-primary)' : 'var(--accent-cyan)', fontSize: '0.8rem' }}>
                            {m.sender} ({m.time})
                          </span>
                          <span style={{ marginTop: '0.2rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{m.text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
