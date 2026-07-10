import { motion } from 'framer-motion';
import { Target, Zap, TrendingUp, HeartHandshake, Globe2 } from 'lucide-react';

export default function WhyChooseUs() {
  const points = [
    {
      title: "Extensive Asset Support",
      icon: Globe2,
      description: "Trade Forex pairs, Gold/Silver commodities, Crypto, Indices, and energy markets all on a single unified terminal."
    },
    {
      title: "Zero-Latency Routing",
      icon: Zap,
      description: "Direct bridge execution through major liquidity pools. Average execution speeds are clocked under 12 milliseconds."
    },
    {
      title: "Keep Up to 90% Profits",
      icon: TrendingUp,
      description: "Default payouts start at a generous 80/20 split, scaling up to 90% profit share for certified consistent traders."
    },
    {
      title: "No Time Limits",
      icon: Target,
      description: "Take as much time as you need. There are no maximum or minimum trading day restrictions on standard challenges."
    },
    {
      title: "24/7 Dedicated Support",
      icon: HeartHandshake,
      description: "Access our institutional support desk. Log tickets, chat live with developers, or read our extensive documentation."
    }
  ];

  return (
    <div id="why-choose-us" className="scroll-section" style={{ minHeight: '80vh', gap: '3rem' }}>
      <div style={{ textAlign: 'center', maxWidth: '800px' }}>
        <span style={{ color: 'var(--accent-cyan)', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Key Advantages</span>
        <h2 style={{ fontSize: 'clamp(2.2rem, 4vw, 3.5rem)', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.5rem', marginBottom: '1rem', letterSpacing: '-0.02em' }}>
          Engineered for Professional Performance
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.6 }}>
          Designed by institutional risk managers, our infrastructure supports your edge at every trade execution.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '2rem',
        width: '100%',
        maxWidth: '1200px',
        marginTop: '2rem'
      }}>
        {points.map((pt, idx) => {
          const Icon = pt.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              style={{
                background: 'var(--glass-bg)',
                backdropFilter: 'blur(10px)',
                border: '1px solid var(--glass-border)',
                borderRadius: '20px',
                padding: '2rem',
                display: 'flex',
                gap: '1.2rem',
                alignItems: 'flex-start',
                transition: 'all 0.3s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = 'rgba(6,182,212,0.4)';
                e.currentTarget.style.boxShadow = '0 0 15px rgba(6,182,212,0.05)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = 'var(--glass-border)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{
                color: 'var(--accent-cyan)',
                background: 'rgba(6,182,212,0.05)',
                padding: '0.8rem',
                borderRadius: '12px',
                border: '1px solid rgba(6,182,212,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Icon size={22} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)' }}>{pt.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>{pt.description}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
