import { motion } from 'framer-motion';

export default function Features() {
  const features = [
    {
      title: "Institutional Grade Infrastructure.",
      description: "Experience zero-latency execution and deep liquidity routing designed specifically for professional traders.",
    },
    {
      title: "Unmatched Capital Scaling.",
      description: "Prove your edge in the markets. We provide up to $1M in funded capital, allowing you to keep up to 90% of your profits.",
    }
  ];

  return (
    <div id="services" className="scroll-section" style={{ gap: '10vh', padding: '8vh 0' }}>
      {features.map((feature, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: "-20%" }}
          transition={{ duration: 1.2, delay: 0.15 * index, ease: [0.16, 1, 0.3, 1] }}
          style={{
            maxWidth: '800px',
            textAlign: index % 2 === 0 ? 'left' : 'right',
            alignSelf: index % 2 === 0 ? 'flex-start' : 'flex-end',
            padding: '0 10vw'
          }}
        >
          <h2 style={{
            fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            marginBottom: '1.5rem',
            color: 'var(--text-primary)'
          }}>
            {feature.title}
          </h2>
          <p style={{
            fontSize: 'clamp(1.1rem, 2vw, 1.5rem)',
            color: 'var(--text-secondary)',
            fontWeight: 400,
            lineHeight: 1.6
          }}>
            {feature.description}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
