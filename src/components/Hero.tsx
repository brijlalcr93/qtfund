import { motion, useScroll, useTransform } from 'framer-motion';

export default function Hero() {
  const { scrollY } = useScroll();
  
  // Fade out and scale down as user scrolls down
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);
  const scale = useTransform(scrollY, [0, 400], [1, 0.9]);
  const y = useTransform(scrollY, [0, 400], [0, -100]);

  return (
    <motion.div 
      id="home"
      className="scroll-section"
      style={{ opacity, scale, y, position: 'relative' }}
    >
      <motion.h1
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="neon-text"
        style={{
          fontSize: 'clamp(3.5rem, 8vw, 6.5rem)',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
          marginBottom: '1.5rem',
          color: 'var(--text-primary)',
          textAlign: 'center'
        }}
      >
        QUANTUM<br />
        TRADING FUND
      </motion.h1>
      
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
        style={{
          fontSize: 'clamp(0.9rem, 1.5vw, 1.1rem)',
          fontWeight: 500,
          letterSpacing: '0.15em',
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          textAlign: 'center'
        }}
      >
        UNLEASH YOUR CAPITAL. EXPLORE THE MARKETS.
      </motion.p>
      
    </motion.div>
  );
}
