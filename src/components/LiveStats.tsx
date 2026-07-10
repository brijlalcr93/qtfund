import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Hourglass, Landmark, TrendingUp } from 'lucide-react';

export default function LiveStats() {
  const [livePaidOut, setLivePaidOut] = useState<number>(34820980);
  
  // Simulate active count fluctuation
  useEffect(() => {
    const timer = setInterval(() => {
      setLivePaidOut(prev => prev + Math.floor(Math.random() * 80) + 10);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const stats = [
    {
      label: "Active Funded Traders",
      value: "14,842",
      icon: Users,
      color: "var(--accent-cyan)"
    },
    {
      label: "Average Payout Time",
      value: "4.8 Hours",
      icon: Hourglass,
      color: "#a855f7"
    },
    {
      label: "Total Funded Paid Out",
      value: `$${livePaidOut.toLocaleString()}`,
      icon: Landmark,
      color: "#3b82f6"
    },
    {
      label: "Record Single Payout",
      value: "$142,500",
      icon: TrendingUp,
      color: "#10b981"
    }
  ];

  return (
    <div id="live-stats" className="scroll-section" style={{ minHeight: '50vh', gap: '3rem' }}>
      <div style={{ textAlign: 'center', maxWidth: '800px' }}>
        <span style={{ color: 'var(--accent-cyan)', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Institutional Metrics</span>
        <h2 style={{ fontSize: 'clamp(2.2rem, 4vw, 3.5rem)', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.5rem', marginBottom: '1rem', letterSpacing: '-0.02em' }}>
          Platform Execution in Numbers
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.6 }}>
          We maintain full transparency with live audit trails. Check out our high-performance metrics.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '2rem',
        width: '100%',
        maxWidth: '1200px',
        marginTop: '1rem'
      }}>
        {stats.map((st, idx) => {
          const Icon = st.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              style={{
                background: 'var(--glass-bg)',
                backdropFilter: 'blur(10px)',
                border: '1px solid var(--glass-border)',
                borderRadius: '20px',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1rem',
                textAlign: 'center',
                boxShadow: 'inset 0 0 15px rgba(255,255,255,0.01)'
              }}
            >
              <div style={{
                color: st.color,
                background: `rgba(${st.color === 'var(--accent-cyan)' ? '6,182,212' : st.color === '#a855f7' ? '168,85,247' : st.color === '#3b82f6' ? '59,130,246' : '16,185,129'}, 0.08)`,
                border: `1px solid rgba(${st.color === 'var(--accent-cyan)' ? '6,182,212' : st.color === '#a855f7' ? '168,85,247' : st.color === '#3b82f6' ? '59,130,246' : '16,185,129'}, 0.2)`,
                padding: '0.8rem',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Icon size={24} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <span style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                  {st.value}
                </span>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  {st.label}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
