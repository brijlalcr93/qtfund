import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, MessageSquare, Bot } from 'lucide-react';
import { usePlatformStore } from '../store/platformStore';
import { useAuth } from '../contexts/AuthContext';
import Footer from '../components/Footer';

interface Message {
  sender: 'User' | 'Agent';
  text: string;
  time: string;
}

export default function ContactPage() {
  const { user } = useAuth();
  const { addTicket } = usePlatformStore();
  
  // Contact Form State
  const [formName, setFormName] = useState(user?.fullName || '');
  const [formEmail, setFormEmail] = useState(user?.email || '');
  const [formSubject, setFormSubject] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [formCategory, setFormCategory] = useState('Technical');
  const [formSuccess, setFormSuccess] = useState(false);
  const [formError, setFormError] = useState('');

  // Live Chat Simulator State

  const [chatMessages, setChatMessages] = useState<Message[]>([
    { sender: 'Agent', text: 'Hello! Welcome to Quantum Live Support. I am Quantum Bot. How can I assist you with your evaluation, payouts, or terminal settings today?', time: 'Just now' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [agentTyping, setAgentTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, agentTyping]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!user) {
      setFormError('Please sign in to submit a support ticket.');
      return;
    }

    try {
      await addTicket(formSubject, formCategory, formMessage);
      setFormSuccess(true);
      setFormSubject('');
      setFormMessage('');
      setTimeout(() => setFormSuccess(false), 4000);
    } catch {
      setFormError('Failed to submit ticket. Please try again.');
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput;
    const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    
    const newMessages = [...chatMessages, { sender: 'User' as const, text: userText, time: timeStr }];
    setChatMessages(newMessages);
    setChatInput('');
    setAgentTyping(true);

    // Simulated chatbot intelligence logic
    setTimeout(() => {
      let replyText = "Thank you for reaching out. A client support coordinator is reviewing this. In the meantime, you can review our rules under the FAQ panel.";
      
      const query = userText.toLowerCase();
      if (query.includes('drawdown') || query.includes('limit') || query.includes('breach')) {
        replyText = "Drawdown rules are calculated based on your starting balance of the day (5% daily drawdown) and 10% maximum overall equity drawdown. Daily reset is at 00:00 UTC.";
      } else if (query.includes('payout') || query.includes('withdraw') || query.includes('money')) {
        replyText = "Funded partners can request payouts every 14 days. We support instant USDC/USDT transfers or standard bank wires which take 24 hours.";
      } else if (query.includes('platform') || query.includes('mt5') || query.includes('terminal')) {
        replyText = "We offer simulated MT5 access. The credentials for your purchased evaluation accounts are located on your dashboard's Accounts panel.";
      } else if (query.includes('price') || query.includes('cost') || query.includes('fee')) {
        replyText = "We offer evaluations starting from $39 (for $5k challenges) up to $449 (for $100k challenges). You can view details on our Homepage pricing table.";
      } else if (query.includes('leverage')) {
        replyText = "Our leverage is 1:100 for evaluation models (1-step and 2-step) and 1:50 for Instant funding tracks.";
      } else if (query.includes('hello') || query.includes('hi') || query.includes('hey')) {
        replyText = "Hello! Let me know if you have questions regarding challenge rules, certificate downloads, or withdrawal steps.";
      }

      setAgentTyping(false);
      setChatMessages(prev => [...prev, { sender: 'Agent' as const, text: replyText, time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) }]);
    }, 1500);
  };

  return (
    <div style={{ width: '100%', minHeight: '100vh', paddingTop: '100px', display: 'flex', flexDirection: 'column' }}>
      
      {/* Page Header */}
      <div className="scroll-section" style={{ minHeight: 'auto', paddingBottom: '2rem', gap: '1rem', textAlign: 'center' }}>
        <span style={{ color: 'var(--accent-cyan)', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Get In Touch</span>
        <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
          Contact & Live Support
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', maxWidth: '800px', margin: '0 auto', lineHeight: 1.6 }}>
          Reach out directly to our support engineers. Log a trouble ticket, drop an email, or initiate a live chat.
        </p>
      </div>

      {/* Main Content Grid */}
      <div style={{
        maxWidth: '1200px',
        width: '100%',
        margin: '0 auto 5rem auto',
        padding: '0 2rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '2.5rem',
        boxSizing: 'border-box'
      }}>
        
        {/* Left Side: Contact details & Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          
          {/* Info cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.2rem'
          }}>
            {[
              { label: 'Support Email', val: 'support@quantumprop.com', icon: Mail, color: 'var(--accent-cyan)' },
              { label: 'Direct Hotline', val: '+1 (800) 240-9020', icon: Phone, color: '#a855f7' },
              { label: 'HQ Address', val: 'One World Trade, NY, USA', icon: MapPin, color: '#3b82f6' }
            ].map((inf, i) => {
              const Icon = inf.icon;
              return (
                <div key={i} style={{
                  background: 'var(--glass-bg)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '16px',
                  padding: '1.2rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}>
                  <div style={{
                    color: inf.color,
                    background: `rgba(${inf.color === 'var(--accent-cyan)' ? '6,182,212' : inf.color === '#a855f7' ? '168,85,247' : '59,130,246'}, 0.08)`,
                    padding: '0.6rem',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Icon size={18} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{inf.label}</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{inf.val}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Ticket/Contact Form */}
          <div style={{
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--glass-border)',
            borderRadius: '24px',
            padding: '2.5rem'
          }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.5rem', letterSpacing: '-0.01em' }}>
              Create Support Ticket
            </h3>

            {formSuccess && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  background: 'rgba(6, 182, 212, 0.1)',
                  border: '1px solid var(--accent-cyan)',
                  color: 'var(--accent-cyan)',
                  padding: '1rem',
                  borderRadius: '12px',
                  marginBottom: '1.5rem',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  textAlign: 'center'
                }}
              >
                ✓ Ticket submitted successfully! Review it in your Dashboard logs.
              </motion.div>
            )}

            {formError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid #ef4444',
                  color: '#ef4444',
                  padding: '1rem',
                  borderRadius: '12px',
                  marginBottom: '1.5rem',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  textAlign: 'center'
                }}
              >
                {formError}
              </motion.div>
            )}

            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Your Name</label>
                  <input type="text" placeholder="John Doe" value={formName} onChange={(e) => setFormName(e.target.value)} style={inputStyle} required />
                </div>
                <div>
                  <label style={labelStyle}>Email Address</label>
                  <input type="email" placeholder="john@example.com" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} style={inputStyle} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Category</label>
                  <select 
                    value={formCategory} 
                    onChange={(e) => setFormCategory(e.target.value)}
                    style={selectStyle}
                  >
                    <option value="Technical">Technical</option>
                    <option value="Billing">Billing & Checkout</option>
                    <option value="Risk & Drawdown">Risk & Drawdown</option>
                    <option value="Affiliates">Affiliate Program</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Subject</label>
                  <input type="text" placeholder="e.g. Server connection latency" value={formSubject} onChange={(e) => setFormSubject(e.target.value)} style={inputStyle} required />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Message Details</label>
                <textarea 
                  rows={5} 
                  placeholder="Detail your request. Provide logs or server numbers if applicable..." 
                  value={formMessage} 
                  onChange={(e) => setFormMessage(e.target.value)} 
                  style={textareaStyle} 
                  required 
                />
              </div>

              <button type="submit" className="neon-button" style={{
                padding: '0.9rem 2rem',
                fontSize: '1rem',
                fontWeight: 600,
                alignSelf: 'flex-start',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginTop: '0.5rem'
              }}>
                <Send size={16} /> Log Support Ticket
              </button>
            </form>
          </div>

        </div>

        {/* Right Side: Floating-style Live Chat UI */}
        <div style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(30px)',
          border: '1px solid var(--glass-border)',
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          height: '620px'
        }}>
          {/* Chat Header */}
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            padding: '1.2rem 1.8rem',
            borderBottom: '1px solid var(--glass-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'rgba(6,182,212,0.1)',
                border: '1px solid rgba(6,182,212,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-cyan)'
              }}>
                <Bot size={20} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.95rem' }}>Quantum Assistant</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                  <span style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: 600 }}>Active Online</span>
                </div>
              </div>
            </div>
            <MessageSquare size={20} style={{ color: 'var(--text-secondary)' }} />
          </div>

          {/* Chat Messages */}
          <div style={{
            flex: 1,
            padding: '1.5rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.2rem',
            background: 'rgba(0,0,0,0.2)'
          }} className="custom-scrollbar">
            {chatMessages.map((msg, idx) => {
              const isUser = msg.sender === 'User';
              return (
                <div 
                  key={idx}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                    maxWidth: '80%',
                    alignItems: isUser ? 'flex-end' : 'flex-start'
                  }}
                >
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.2rem', padding: '0 0.2rem' }}>
                    {msg.sender === 'User' ? 'You' : 'Quantum Bot'} • {msg.time}
                  </span>
                  <div style={{
                    padding: '0.8rem 1.2rem',
                    borderRadius: '16px',
                    borderTopRightRadius: isUser ? '4px' : '16px',
                    borderTopLeftRadius: isUser ? '16px' : '4px',
                    background: isUser ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.03)',
                    border: isUser ? 'none' : '1px solid var(--glass-border)',
                    color: isUser ? '#000' : 'var(--text-primary)',
                    fontSize: '0.92rem',
                    lineHeight: 1.4,
                    boxShadow: isUser ? '0 4px 10px rgba(6,182,212,0.15)' : 'none'
                  }}>
                    {msg.text}
                  </div>
                </div>
              );
            })}
            
            {agentTyping && (
              <div style={{ alignSelf: 'flex-start', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Quantum Bot is typing...</span>
                <div style={{
                  padding: '0.8rem 1.2rem',
                  borderRadius: '16px',
                  borderTopLeftRadius: '4px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--glass-border)',
                  display: 'flex',
                  gap: '0.3rem',
                  alignItems: 'center',
                  height: '38px',
                  boxSizing: 'border-box'
                }}>
                  <span className="dot" style={{ width: '6px', height: '6px', background: 'var(--text-secondary)', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out' }} />
                  <span className="dot" style={{ width: '6px', height: '6px', background: 'var(--text-secondary)', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out 0.2s' }} />
                  <span className="dot" style={{ width: '6px', height: '6px', background: 'var(--text-secondary)', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out 0.4s' }} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendMessage} style={{
            background: 'rgba(255,255,255,0.01)',
            borderTop: '1px solid var(--glass-border)',
            padding: '1rem',
            display: 'flex',
            gap: '0.5rem'
          }}>
            <input
              type="text"
              placeholder="Ask rules, payout dates, terminal logins..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              style={{
                flex: 1,
                padding: '0.8rem 1.2rem',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--glass-border)',
                borderRadius: '12px',
                color: 'var(--text-primary)',
                fontSize: '0.95rem',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              style={{
                padding: '0.8rem',
                borderRadius: '12px',
                background: 'var(--accent-cyan)',
                border: 'none',
                color: '#000',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
            >
              <Send size={18} />
            </button>
          </form>
        </div>

      </div>

      <Footer />

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1.0); }
        }
      `}</style>
    </div>
  );
}

const labelStyle = {
  display: 'block',
  marginBottom: '0.4rem',
  color: 'var(--text-secondary)',
  fontSize: '0.85rem'
};

const inputStyle = {
  width: '100%',
  padding: '0.8rem 1.2rem',
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid var(--glass-border)',
  borderRadius: '8px',
  color: 'var(--text-primary)',
  fontSize: '0.95rem',
  outline: 'none',
  marginTop: '0.2rem',
  boxSizing: 'border-box' as const
};

const selectStyle = {
  width: '100%',
  padding: '0.8rem 1.2rem',
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid var(--glass-border)',
  borderRadius: '8px',
  color: 'var(--text-primary)',
  fontSize: '0.95rem',
  outline: 'none',
  marginTop: '0.2rem',
  cursor: 'pointer',
  boxSizing: 'border-box' as const
};

const textareaStyle = {
  width: '100%',
  padding: '0.8rem 1.2rem',
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid var(--glass-border)',
  borderRadius: '8px',
  color: 'var(--text-primary)',
  fontSize: '0.95rem',
  outline: 'none',
  marginTop: '0.2rem',
  fontFamily: 'inherit',
  resize: 'vertical' as const,
  boxSizing: 'border-box' as const
};
