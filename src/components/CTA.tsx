import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function CTA() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div id="contact" className="scroll-section" style={{ minHeight: '80vh', justifyContent: 'center' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 40 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: false, margin: "-20%" }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        style={{
          textAlign: 'center',
          padding: '5rem 2rem',
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid var(--glass-border)',
          borderRadius: '32px',
          maxWidth: '800px',
          width: '100%',
          margin: '0 auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}
      >
        <h2 style={{
          fontSize: 'clamp(2.5rem, 4vw, 4rem)',
          fontWeight: 700,
          marginBottom: '1.5rem',
          color: 'var(--text-primary)',
          letterSpacing: '-0.02em',
          lineHeight: 1.1
        }}>
          Ready to unleash your potential?
        </h2>
        <p style={{
          fontSize: 'clamp(1.1rem, 2vw, 1.3rem)',
          color: 'var(--text-secondary)',
          marginBottom: '3rem',
          lineHeight: 1.6,
          maxWidth: '600px',
          margin: '0 auto 3rem auto'
        }}>
          Join thousands of elite traders worldwide. Prove your skills, unlock unprecedented capital, and get funded today.
        </p>
        <motion.button 
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="neon-button" 
          onClick={() => navigate(user ? '/dashboard' : '/auth')}
          style={{
            padding: '1.2rem 3.5rem',
            fontSize: '1.1rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            cursor: 'pointer'
          }}
        >
          Start Trading Now
        </motion.button>
      </motion.div>
    </div>
  );
}
