import { useNavigate } from 'react-router-dom';
import { Send, MessageSquare } from 'lucide-react';

const TwitterIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

const LinkedinIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

export default function Footer() {
  const navigate = useNavigate();

  const handleLinkClick = (path: string) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer style={{
      background: 'rgba(2, 6, 17, 0.95)',
      backdropFilter: 'blur(30px)',
      borderTop: '1px solid var(--glass-border)',
      padding: '5rem 4rem 2rem 4rem',
      position: 'relative',
      zIndex: 10,
      width: '100%',
      boxSizing: 'border-box'
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '3rem',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Brand Block */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleLinkClick('/')}>
            <span style={{
              fontSize: '2rem',
              fontWeight: 700,
              color: 'var(--accent-cyan)',
              textShadow: '0 0 10px var(--accent-glow)'
            }}>QUANTUM</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
            Proprietary trading capital for disciplined strategy managers. Trade with deep institutional liquidity and scale up to $1M.
          </p>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            {[
              { icon: TwitterIcon, url: 'https://twitter.com' },
              { icon: GithubIcon, url: 'https://github.com' },
              { icon: LinkedinIcon, url: 'https://linkedin.com' },
              { icon: MessageSquare, url: 'https://discord.com' }
            ].map((soc, i) => {
              const Icon = soc.icon;
              return (
                <a
                  key={i}
                  href={soc.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    color: 'var(--text-secondary)',
                    padding: '0.6rem',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    textDecoration: 'none'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--accent-cyan)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
                >
                  <Icon size={16} />
                </a>
              );
            })}
          </div>
        </div>

        {/* Sitemap Link Blocks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h4 style={{ color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Platform</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.9rem' }}>
            <span onClick={() => handleLinkClick('/')} className="footer-link">Challenges</span>
            <span onClick={() => handleLinkClick('/payouts')} className="footer-link">Leaderboard</span>
            <span onClick={() => handleLinkClick('/payouts')} className="footer-link">Recent Payouts</span>
            <span onClick={() => handleLinkClick('/blog')} className="footer-link">Blog News</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h4 style={{ color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Support</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.9rem' }}>
            <span onClick={() => handleLinkClick('/faq')} className="footer-link">Searchable FAQs</span>
            <span onClick={() => handleLinkClick('/contact')} className="footer-link">Submit a Ticket</span>
            <span onClick={() => handleLinkClick('/contact')} className="footer-link">Live Helpdesk</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h4 style={{ color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Legal</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.9rem' }}>
            <span onClick={() => handleLinkClick('/legal/terms')} className="footer-link">Terms & Conditions</span>
            <span onClick={() => handleLinkClick('/legal/privacy')} className="footer-link">Privacy Policy</span>
            <span onClick={() => handleLinkClick('/legal/risk')} className="footer-link">Risk Disclosure</span>
            <span onClick={() => handleLinkClick('/legal/refund')} className="footer-link">Refund Policy</span>
            <span onClick={() => handleLinkClick('/legal/aml')} className="footer-link">AML Policy</span>
            <span onClick={() => handleLinkClick('/legal/kyc')} className="footer-link">KYC Policy</span>
          </div>
        </div>

        {/* Newsletter */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h4 style={{ color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Newsletter</h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.4 }}>
            Subscribe to receive scaling alerts, promotional coupons, and market briefs.
          </p>
          <form 
            onSubmit={(e) => { e.preventDefault(); alert('Subscribed!'); }}
            style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}
          >
            <input
              type="email"
              placeholder="Your email"
              required
              style={{
                flex: 1,
                padding: '0.6rem 0.8rem',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              style={{
                padding: '0.6rem 1rem',
                borderRadius: '8px',
                background: 'var(--accent-cyan)',
                border: 'none',
                color: '#000',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      </div>

      <div style={{ width: '100%', height: '1px', background: 'var(--glass-border)', margin: '3rem 0 2rem 0' }} />

      {/* Disclosures & Copyright */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', lineHeight: 1.5, textAlign: 'justify' }}>
          <strong>Risk Warning:</strong> All financial products and accounts provided on this website are simulated evaluation accounts. Under no circumstances is real live capital traded in the customer accounts. Profits shown on the leaderboards and payouts are simulated rewards based on performance target achievement, and represent simulated contract payouts. None of the services provided constitute investment advice or solicitation of public savings. Trading carries significant risk.
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginTop: '0.5rem' }}>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>
            © {new Date().getFullYear()} Quantum Prop Firm. All rights reserved.
          </span>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>
            Designed for Apple-grade presentation.
          </span>
        </div>
      </div>
    </footer>
  );
}


