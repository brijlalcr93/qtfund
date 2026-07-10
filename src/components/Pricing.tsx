import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

type ChallengeType = '1-Step' | '2-Step' | 'Instant';

const pricingData: Record<ChallengeType, { size: string; price: string }[]> = {
  '1-Step': [
    { size: '$5,000', price: '$49' },
    { size: '$10,000', price: '$99' },
    { size: '$25,000', price: '$199' },
    { size: '$50,000', price: '$299' },
    { size: '$100,000', price: '$499' },
  ],
  '2-Step': [
    { size: '$5,000', price: '$39' },
    { size: '$10,000', price: '$89' },
    { size: '$25,000', price: '$179' },
    { size: '$50,000', price: '$279' },
    { size: '$100,000', price: '$449' },
  ],
  'Instant': [
    { size: '$5,000', price: '$199' },
    { size: '$10,000', price: '$399' },
    { size: '$25,000', price: '$899' },
    { size: '$50,000', price: '$1,699' },
    { size: '$100,000', price: '$3,199' },
  ]
};

export default function Pricing() {
  const [activeTab, setActiveTab] = useState<ChallengeType>('2-Step');
  const navigate = useNavigate();

  const tabs: ChallengeType[] = ['1-Step', '2-Step', 'Instant'];

  const rulesData = {
    '1-Step': [
      { label: 'Profit Target', value: '10%' },
      { label: 'Max Daily Loss', value: '4%' },
      { label: 'Max Overall Loss', value: '6%' },
      { label: 'Minimum Trading Days', value: '0 Days' },
      { label: 'Leverage', value: '1:100' }
    ],
    '2-Step': [
      { label: 'Profit Target', value: '8% (Ph 1) / 5% (Ph 2)' },
      { label: 'Max Daily Loss', value: '5%' },
      { label: 'Max Overall Loss', value: '10%' },
      { label: 'Minimum Trading Days', value: '0 Days' },
      { label: 'Leverage', value: '1:100' }
    ],
    'Instant': [
      { label: 'Profit Target', value: 'None' },
      { label: 'Max Daily Loss', value: '5%' },
      { label: 'Max Overall Loss', value: '10%' },
      { label: 'Minimum Trading Days', value: 'None' },
      { label: 'Leverage', value: '1:50' }
    ]
  };

  return (
    <div id="pricing" className="scroll-section" style={{ minHeight: '100vh' }}>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, margin: "-10%" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{
          width: '100%',
          maxWidth: '1200px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4rem'
        }}
      >
        <h2 style={{
          fontSize: 'clamp(2.5rem, 5vw, 4rem)',
          fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: '-0.02em',
          textAlign: 'center'
        }}>
          Choose Your Path.
        </h2>

        {/* Segmented Control / Tabs */}
        <div className="pricing-tabs" style={{
          display: 'flex',
          background: 'var(--glass-bg)',
          padding: '0.5rem',
          borderRadius: '99px',
          border: '1px solid var(--glass-border)',
          gap: '0.5rem'
        }}>
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '0.8rem 2.5rem',
                borderRadius: '99px',
                border: 'none',
                background: activeTab === tab ? 'var(--accent-cyan)' : 'transparent',
                color: activeTab === tab ? '#000' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '1rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: activeTab === tab ? '0 0 15px rgba(6, 182, 212, 0.4)' : 'none'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Rules Table */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab + "-rules"}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            style={{
              maxWidth: '1000px',
              margin: '0 auto 3rem auto',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--glass-border)',
              borderRadius: '16px',
              padding: '2rem',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '2rem',
              justifyContent: 'center'
            }}
          >
            {rulesData[activeTab].map((rule, idx) => (
              <div key={idx} style={{ textAlign: 'center', minWidth: '150px' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {rule.label}
                </div>
                <div style={{ color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: 600 }}>
                  {rule.value}
                </div>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Pricing Cards */}
        <div style={{ width: '100%', position: 'relative', minHeight: '350px' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1.5rem',
                width: '100%'
              }}
            >
              {pricingData[activeTab].map((plan, index) => (
                <div key={index} style={{
                  background: 'var(--glass-bg)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '24px',
                  padding: '2.5rem 1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '1.5rem',
                  transition: 'transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-10px)';
                  e.currentTarget.style.borderColor = 'var(--accent-cyan)';
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(6, 182, 212, 0.1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'var(--glass-border)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                >
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Account Size
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {plan.size}
                  </div>
                  <div style={{ width: '100%', height: '1px', background: 'var(--glass-border)' }} />
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.2rem' }}>
                    <span style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--accent-cyan)', textShadow: '0 0 15px rgba(6,182,212,0.3)' }}>
                      {plan.price}
                    </span>
                  </div>
                  <button 
                    className="neon-button" 
                    onClick={() => navigate('/checkout', { state: { type: activeTab + ' Challenge', size: plan.size, price: plan.price } })}
                    style={{
                      marginTop: '1rem',
                      padding: '0.8rem 1.5rem',
                      width: '100%',
                      fontSize: '0.9rem',
                      fontWeight: 600
                    }}
                  >
                    Select Plan
                  </button>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

      </motion.div>
    </div>
  );
}
