import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NotificationCenter from './NotificationCenter';

export default function Navbar() {
  const navItems = [
    { name: 'Home', path: '/', isScroll: true },
    { name: 'Payouts', path: '/payouts', isScroll: false },
    { name: 'FAQ', path: '/faq', isScroll: false },
    { name: 'Blog', path: '/blog', isScroll: false },
    { name: 'Contact', path: '/contact', isScroll: false }
  ];
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, item: typeof navItems[0]) => {
    e.preventDefault();
    if (item.isScroll) {
      if (location.pathname !== '/') {
        navigate('/');
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      navigate(item.path);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <motion.nav 
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="glass-panel nav-container"
    >
      {/* Logo */}
      <div 
        style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
        onClick={() => { navigate('/'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
      >
        <div style={{
          fontSize: '2rem',
          fontWeight: 700,
          color: 'var(--accent-cyan)',
          textShadow: '0 0 10px var(--accent-glow)'
        }}>Q</div>
      </div>

      {/* Nav Links */}
      <div className="nav-links">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <a
              key={item.name}
              href={item.path}
              onClick={(e) => handleNavClick(e, item)}
              style={{
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                textDecoration: 'none',
                fontSize: '0.95rem',
                fontWeight: 500,
                textTransform: 'uppercase',
                position: 'relative',
                transition: 'color 0.3s'
              }}
              onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseOut={(e) => !isActive && (e.currentTarget.style.color = 'var(--text-secondary)')}
            >
              {item.name}
              {isActive && (
                <div style={{
                  position: 'absolute',
                  bottom: '-6px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '24px',
                  height: '2px',
                  backgroundColor: 'var(--accent-cyan)',
                  boxShadow: '0 0 8px var(--accent-glow)'
                }} />
              )}
            </a>
          );
        })}
      </div>

      {/* Action Button */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>


        {user ? (
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <NotificationCenter />
            <button 
              className="neon-button" 
              onClick={() => navigate('/dashboard')}
              style={{ padding: '0.6rem 1.5rem', fontSize: '0.95rem', fontWeight: 500, textTransform: 'uppercase' }}
            >
              Dashboard
            </button>
            <button 
              onClick={() => signOut()}
              style={{ 
                padding: '0.6rem 1.5rem', 
                fontSize: '0.95rem', 
                fontWeight: 500, 
                background: 'none', 
                border: '1px solid var(--glass-border)', 
                color: 'var(--text-secondary)',
                borderRadius: '9999px',
                cursor: 'pointer'
              }}
              onMouseOver={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--text-secondary)'; }}
              onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
            >
              Sign Out
            </button>
          </div>
        ) : (
          <button 
            className="neon-button" 
            onClick={() => navigate('/auth')}
            style={{
              padding: '0.6rem 2rem',
              fontSize: '0.95rem',
              fontWeight: 500,
              textTransform: 'uppercase'
            }}
          >
            Sign In
          </button>
        )}
      </div>
    </motion.nav>
  );
}
