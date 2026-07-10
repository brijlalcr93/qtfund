import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';

export default function Metrics() {
  const services = [
    "Crypto & Gold Trading",
    "Real-Time Dashboard",
    "Trade Analytics",
    "Secure Data Management"
  ];

  const metrics = [
    { value: "0%", label: "Commission on Indices" },
    { value: "90%", label: "Profit Split" },
    { value: "<1ms", label: "Execution Latency" },
    { value: "24/7", label: "Dedicated Support" },
  ];

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  return (
    <div id="markets" className="scroll-section" style={{ display: 'flex', flexDirection: 'column', gap: '8rem', padding: '10vh 0' }}>
      
      {/* Services Grid with Text Glow Effect */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, margin: "-20%" }}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '3rem 2rem',
          width: '100%',
          maxWidth: '1200px',
          padding: '2rem'
        }}
      >
        {services.map((service, index) => (
          <motion.div key={index} variants={itemVariants} style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: 'clamp(1.2rem, 2.5vw, 1.8rem)',
              fontWeight: 500,
              color: 'var(--accent-cyan)',
              textShadow: '0 0 20px rgba(6, 182, 212, 0.4)',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              lineHeight: 1.4
            }}>
              {service}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Metrics Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, margin: "-20%" }}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '5rem 2rem',
          width: '100%',
          maxWidth: '1200px',
          padding: '2rem'
        }}
      >
        {metrics.map((metric, index) => (
          <motion.div key={index} variants={itemVariants} style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: 'clamp(3rem, 6vw, 5rem)',
              fontWeight: 700,
              color: 'var(--accent-cyan)',
              textShadow: '0 0 20px rgba(6, 182, 212, 0.4)',
              marginBottom: '1rem',
              letterSpacing: '-0.02em'
            }}>
              {metric.value}
            </div>
            <div style={{
              fontSize: '1.1rem',
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              fontWeight: 500
            }}>
              {metric.label}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
