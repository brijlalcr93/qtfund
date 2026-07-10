import { motion } from 'framer-motion';
import { Shield, Award, Landmark } from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    {
      step: "01",
      title: "Evaluation Phase",
      icon: Shield,
      description: "Demonstrate your trading consistency. Select a challenge account size and hit the target rules while adhering to drawdown limits.",
      color: "var(--accent-cyan)",
      badge: "8% Target"
    },
    {
      step: "02",
      title: "Verification Phase",
      icon: Award,
      description: "Confirm your performance on a second shorter evaluation phase. Work under relaxed targets to prove your strategy is replicable.",
      color: "#a855f7",
      badge: "5% Target"
    },
    {
      step: "03",
      title: "Funded Partner",
      icon: Landmark,
      description: "Receive your Funded Account credentials. Trade our capital with deep liquidity and keep up to 90% of the profits you generate.",
      color: "#3b82f6",
      badge: "Up to 90% Profit Share"
    }
  ];

  return (
    <div id="how-it-works" className="scroll-section" style={{ minHeight: '80vh', gap: '3rem' }}>
      <div style={{ textAlign: 'center', maxWidth: '800px' }}>
        <span style={{ color: 'var(--accent-cyan)', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Process Path</span>
        <h2 style={{ fontSize: 'clamp(2.2rem, 4vw, 3.5rem)', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.5rem', marginBottom: '1rem', letterSpacing: '-0.02em' }}>
          Three Steps to Institutional Capital
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.6 }}>
          Our straightforward evaluation is designed to reward disciplined risk managers. Follow the rules and start trading live funds.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '2.5rem',
        width: '100%',
        maxWidth: '1200px',
        marginTop: '2rem'
      }}>
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.15, ease: 'easeOut' }}
              whileHover={{ y: -8 }}
              style={{
                background: 'var(--glass-bg)',
                backdropFilter: 'blur(10px)',
                border: '1px solid var(--glass-border)',
                borderRadius: '24px',
                padding: '2.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: 'inset 0 0 20px rgba(255,255,255,0.01)'
              }}
            >
              {/* Highlight bar */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '3px',
                background: `linear-gradient(90deg, ${step.color}, transparent)`
              }} />

              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '14px',
                  background: `rgba(${step.color === 'var(--accent-cyan)' ? '6,182,212' : step.color === '#a855f7' ? '168,85,247' : '59,130,246'}, 0.1)`,
                  border: `1px solid rgba(${step.color === 'var(--accent-cyan)' ? '6,182,212' : step.color === '#a855f7' ? '168,85,247' : '59,130,246'}, 0.2)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: step.color
                }}>
                  <Icon size={24} />
                </div>
                <span style={{ fontSize: '3rem', fontWeight: 800, opacity: 0.1, color: 'var(--text-primary)' }}>{step.step}</span>
              </div>

              {/* Content */}
              <div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{step.title}</h3>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.5rem',
                  borderRadius: '4px',
                  background: `rgba(${step.color === 'var(--accent-cyan)' ? '6,182,212' : step.color === '#a855f7' ? '168,85,247' : '59,130,246'}, 0.15)`,
                  color: step.color,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  {step.badge}
                </span>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginTop: '1rem' }}>
                  {step.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
