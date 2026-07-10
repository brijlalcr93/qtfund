import { useParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, Scale, FileText, BadgeAlert, Coins, Sparkles } from 'lucide-react';
import Footer from '../components/Footer';

const legalDocs: Record<string, { title: string; icon: any; content: string[] }> = {
  terms: {
    title: "Terms & Conditions",
    icon: Scale,
    content: [
      "1. Introduction: These Terms and Conditions govern the use of our simulated evaluation services. By registering an account and paying the evaluation fee, you agree to comply with all rules.",
      "2. Simulated Trading: The trader acknowledges that the accounts provided are fully simulated. No real money or actual trades are executed in public markets. Profit split metrics are calculated mathematically based on the mock terminal data.",
      "3. Consistency Guidelines: To ensure traders practice professional risk techniques, we require that average trade sizes and transaction frequencies remain stable. Speculative position spikes or lot sizing deviation above 2.0x are flag violations.",
      "4. Evaluation Success: Once a challenge is completed and targets are verified, the user will be upgraded to a Funded account model subject to KYC completion.",
      "5. Account Termination: We reserve the right to suspend or terminate accounts that breach the drawdown rules, exploit platform latency, or violate general code of conduct."
    ]
  },
  privacy: {
    title: "Privacy Policy",
    icon: ShieldCheck,
    content: [
      "1. Data Collection: We collect account profile information, email addresses, order details, and uploaded KYC documents (such as passports, Aadhaar cards, driver licenses) during platform use.",
      "2. Secure Storage: All profile records and identity documents are encrypted in transit and at rest. We never share, sell, or rent your private financial profiles to third-party advertising companies.",
      "3. Local Cache: We use local storage and cookies to maintain active login sessions, persistent custom dashboard colors, and active chat states.",
      "4. Compliance Audits: Data may be shared with certified risk auditors or payment processors solely to verify transaction legitimacy or prevent affiliate fraud."
    ]
  },
  risk: {
    title: "Risk Disclosure",
    icon: BadgeAlert,
    content: [
      "1. General Risk: Trading financial instruments (Forex, Gold, Cryptocurrencies, Indices) involves substantial risk of loss and is not suitable for every investor.",
      "2. Simulated Performance: Performance metrics achieved on simulated evaluation accounts do not guarantee similar results on live markets. Past hypothetical returns are not indicators of future profitability.",
      "3. Leverage Warnings: Trading with leverage (up to 1:100) increases volatility and risk. Sudden macroeconomic announcements can cause simulated slippage resulting in immediate drawdown breaches.",
      "4. Capital Liability: The trader does not bear real-world liabilities for simulated losses on their accounts. All financial risk is fully absorbed by the firm."
    ]
  },
  refund: {
    title: "Refund Policy",
    icon: Coins,
    content: [
      "1. Fee Refundability: The evaluation fee paid by the trader is fully refundable. The refund is processed automatically along with the trader's first profit split payout after passing both evaluation phases.",
      "2. Breached Accounts: If an account violates daily loss limits or maximum drawdown rules, it is breached. In this case, the evaluation fee is strictly non-refundable.",
      "3. Double Charges: Any technical double billing or checkout errors will be refunded immediately upon support ticket submission.",
      "4. Chargebacks: Initiating credit card chargebacks without contacting support first will result in immediate permanent account suspension and ban from the platform."
    ]
  },
  aml: {
    title: "AML Policy",
    icon: FileText,
    content: [
      "1. Verification Mandate: All traders requesting payouts above $500 must complete identity verification to prevent money laundering and terrorist financing.",
      "2. Restricted Regions: We do not accept clients or process payouts to individuals residing in countries blacklisted by the OFAC or high-risk jurisdictions.",
      "3. Withdrawal Alignment: Payouts must be sent to addresses/bank accounts matching the verified name on the trader's profile. Third-party payout routing is prohibited.",
      "4. Transaction Auditing: We inspect withdrawal requests for consistency anomalies. Suspicious transactions will be flagged and held pending documentation audits."
    ]
  },
  kyc: {
    title: "KYC Policy",
    icon: Sparkles,
    content: [
      "1. Required Documents: To verify identity, users must upload one photo ID (Passport, National ID, Aadhaar, PAN) and one document showing proof of address (utility bill or bank statement less than 3 months old).",
      "2. Document Quality: Uploads must be clear, high-resolution color photographs with all edges visible. Scanned black-and-white documents are rejected.",
      "3. Approval Timeline: Our risk desk audits uploads within 12-24 business hours. Users are notified via email and profile state.",
      "4. Resubmission: In the event of illegible text, cropped edges, or expired IDs, the user will be asked to resubmit details via the profile dashboard."
    ]
  }
};

export default function Legal() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const currentSlug = slug || 'terms';
  const doc = legalDocs[currentSlug] || legalDocs.terms;
  const Icon = doc.icon;

  return (
    <div style={{ width: '100%', minHeight: '100vh', paddingTop: '100px', display: 'flex', flexDirection: 'column' }}>
      
      {/* Grid Layout */}
      <div style={{
        maxWidth: '1200px',
        width: '100%',
        margin: '0 auto 5rem auto',
        padding: '0 2rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '3rem',
        boxSizing: 'border-box',
        flex: 1
      }}>
        
        {/* Left Side: Document Menu */}
        <div style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(20px)',
          border: '1px solid var(--glass-border)',
          borderRadius: '24px',
          padding: '2rem',
          height: 'fit-content',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.8rem'
        }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Legal Agreements</h3>
          {Object.entries(legalDocs).map(([key, item]) => {
            const ItemIcon = item.icon;
            const isActive = key === currentSlug;
            return (
              <button
                key={key}
                onClick={() => {
                  navigate(`/legal/${key}`);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.8rem',
                  width: '100%',
                  padding: '1rem 1.2rem',
                  background: isActive ? 'rgba(6, 182, 212, 0.1)' : 'transparent',
                  border: isActive ? '1px solid rgba(6, 182, 212, 0.2)' : '1px solid transparent',
                  borderRadius: '12px',
                  color: isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontSize: '0.95rem',
                  fontWeight: isActive ? 600 : 500,
                  textAlign: 'left'
                }}
                onMouseOver={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }
                }}
              >
                <ItemIcon size={18} />
                {item.title}
              </button>
            );
          })}
        </div>

        {/* Right Side: Document Content */}
        <div style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(20px)',
          border: '1px solid var(--glass-border)',
          borderRadius: '24px',
          padding: '3rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem'
        }}>
          {/* Doc Title & Icon */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1.5rem' }}>
            <div style={{
              color: 'var(--accent-cyan)',
              background: 'rgba(6,182,212,0.05)',
              border: '1px solid rgba(6,182,212,0.15)',
              padding: '0.8rem',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Icon size={24} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.01em' }}>
                {doc.title}
              </h1>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Last updated: June 01, 2026
              </span>
            </div>
          </div>

          {/* Clauses list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.8rem' }}>
            {doc.content.map((clause, idx) => {
              const [title, body] = clause.split(':');
              return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)' }}>{title}</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, textAlign: 'justify' }}>
                    {body.trim()}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      <Footer />
    </div>
  );
}
