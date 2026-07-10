import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';

export default function Testimonials() {
  const reviews = [
    {
      name: "Brijlal CR",
      role: "Funded Live Trader ($200k)",
      payout: "$154,820 Total Payouts",
      quote: "The low latency execution is unparalleled. I've requested five payouts now, and each one was processed in USDT within 12 hours. Best prop firm in the market.",
      rating: 5,
      avatarBg: "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)"
    },
    {
      name: "Niklas Brandt",
      role: "Funded Partner ($100k)",
      payout: "$98,450 Total Payouts",
      quote: "No time limits meant I could take my time during Phase 1. Passing both phases felt stress-free, and support is extremely helpful when setting up credentials.",
      rating: 5,
      avatarBg: "linear-gradient(135deg, #a855f7 0%, #06b6d4 100%)"
    },
    {
      name: "James Carter",
      role: "Certified Scaling Partner",
      payout: "$74,210 Total Payouts",
      quote: "The interface makes tracking your drawdown limits in real-time incredibly clean. Highly transparent rules and no hidden consistency clauses.",
      rating: 5,
      avatarBg: "linear-gradient(135deg, #3b82f6 0%, #a855f7 100%)"
    }
  ];

  const [activeIdx, setActiveIdx] = useState(0);

  const handleNext = () => {
    setActiveIdx((prev) => (prev + 1) % reviews.length);
  };

  const handlePrev = () => {
    setActiveIdx((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  // Auto-scroll testimonials
  useEffect(() => {
    const interval = setInterval(handleNext, 6000);
    return () => clearInterval(interval);
  }, []);

  const cur = reviews[activeIdx];

  return (
    <div id="testimonials" className="scroll-section" style={{ minHeight: '60vh', gap: '2rem' }}>
      <div style={{ textAlign: 'center', maxWidth: '800px' }}>
        <span style={{ color: 'var(--accent-cyan)', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Success Stories</span>
        <h2 style={{ fontSize: 'clamp(2.2rem, 4vw, 3.5rem)', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.5rem', marginBottom: '1rem', letterSpacing: '-0.02em' }}>
          What Our Traders Say
        </h2>
      </div>

      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '850px',
        minHeight: '280px',
        marginTop: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {/* Testimonial Box */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIdx}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.4 }}
            style={{
              width: '100%',
              background: 'var(--glass-bg)',
              backdropFilter: 'blur(20px)',
              border: '1px solid var(--glass-border)',
              borderRadius: '24px',
              padding: '3rem',
              position: 'relative',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem'
            }}
          >
            {/* Quote Icon */}
            <Quote size={48} style={{ color: 'var(--accent-cyan)', opacity: 0.15, position: 'absolute', top: '2rem', right: '3rem' }} />

            {/* Stars */}
            <div style={{ display: 'flex', gap: '0.2rem' }}>
              {Array.from({ length: cur.rating }).map((_, i) => (
                <Star key={i} size={18} fill="var(--accent-cyan)" stroke="var(--accent-cyan)" />
              ))}
            </div>

            {/* Quote Text */}
            <p style={{
              fontSize: 'clamp(1.1rem, 2vw, 1.4rem)',
              color: 'var(--text-primary)',
              lineHeight: 1.6,
              fontWeight: 400,
              fontStyle: 'italic'
            }}>
              "{cur.quote}"
            </p>

            {/* Profile Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: cur.avatarBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '1.2rem',
                fontWeight: 700,
                boxShadow: '0 0 10px rgba(6,182,212,0.3)'
              }}>
                {cur.name[0]}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '1.1rem' }}>{cur.name}</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{cur.role}</span>
                <span style={{ color: 'var(--accent-cyan)', fontSize: '0.85rem', fontWeight: 600, marginTop: '0.1rem' }}>{cur.payout}</span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Carousel buttons absolute left/right on desktops */}
        <div style={{
          position: 'absolute',
          bottom: '-4rem',
          display: 'flex',
          gap: '1.5rem',
          zIndex: 20
        }}>
          <button
            onClick={handlePrev}
            style={{
              padding: '0.8rem',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--accent-cyan)'; }}
            onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={handleNext}
            style={{
              padding: '0.8rem',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--accent-cyan)'; }}
            onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
