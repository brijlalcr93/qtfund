import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, ChevronUp, MessageCircle, HelpCircle } from 'lucide-react';
import { usePlatformStore } from '../store/platformStore';
import Footer from '../components/Footer';

export default function FAQPage() {
  const { cms } = usePlatformStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const categories = ['All', 'General', 'Rules', 'Billing', 'Tech'];

  const filteredFaqs = cms.faqList.filter((faq) => {
    const matchesSearch = 
      faq.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
      faq.a.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || faq.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div style={{ width: '100%', minHeight: '100vh', paddingTop: '100px', display: 'flex', flexDirection: 'column' }}>
      
      {/* Hero Header */}
      <div className="scroll-section" style={{ minHeight: 'auto', paddingBottom: '2rem', gap: '1rem', textAlign: 'center' }}>
        <span style={{ color: 'var(--accent-cyan)', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Knowledge Hub</span>
        <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
          Searchable FAQs
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', maxWidth: '800px', margin: '0 auto', lineHeight: 1.6 }}>
          Find answers about drawdown limits, evaluation phases, payouts, and platforms. Can't find what you need? Open a live chat or log a support ticket.
        </p>
      </div>

      {/* Control Area */}
      <div style={{
        maxWidth: '850px',
        width: '100%',
        margin: '0 auto 4rem auto',
        padding: '0 2rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
        boxSizing: 'border-box'
      }}>
        {/* Search Bar */}
        <div style={{ position: 'relative', width: '100%' }}>
          <Search size={20} style={{ position: 'absolute', left: '1.2rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            type="text"
            placeholder="Search for questions, rules, payouts, leverage, platforms..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setActiveIdx(null); }}
            style={{
              width: '100%',
              padding: '1rem 1.5rem 1rem 3.2rem',
              background: 'var(--glass-bg)',
              backdropFilter: 'blur(10px)',
              border: '1px solid var(--glass-border)',
              borderRadius: '16px',
              color: 'var(--text-primary)',
              fontSize: '1.05rem',
              outline: 'none',
              boxSizing: 'border-box',
              boxShadow: 'inset 0 0 15px rgba(255,255,255,0.01)'
            }}
          />
        </div>

        {/* Category filters */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.6rem',
          justifyContent: 'center'
        }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setActiveIdx(null); }}
              style={{
                padding: '0.6rem 1.5rem',
                borderRadius: '99px',
                border: '1px solid var(--glass-border)',
                background: activeCategory === cat ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.02)',
                color: activeCategory === cat ? '#000' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.3s',
                boxShadow: activeCategory === cat ? '0 0 12px rgba(6, 182, 212, 0.35)' : 'none'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Accordions */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          marginTop: '1rem'
        }}>
          {filteredFaqs.map((faq, index) => {
            const isOpen = activeIdx === index;
            return (
              <div
                key={index}
                style={{
                  background: 'var(--glass-bg)',
                  backdropFilter: 'blur(20px)',
                  border: isOpen ? '1px solid var(--accent-cyan)' : '1px solid var(--glass-border)',
                  borderRadius: '16px',
                  padding: '1.2rem 1.8rem',
                  transition: 'border-color 0.3s, box-shadow 0.3s',
                  boxShadow: isOpen ? '0 0 15px rgba(6, 182, 212, 0.05)' : 'none'
                }}
              >
                <button
                  onClick={() => setActiveIdx(isOpen ? null : index)}
                  style={{
                    width: '100%',
                    background: 'none',
                    border: 'none',
                    textAlign: 'left',
                    color: 'var(--text-primary)',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.4rem 0',
                    gap: '1rem'
                  }}
                >
                  <span style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                    <HelpCircle size={18} style={{ color: isOpen ? 'var(--accent-cyan)' : 'var(--text-secondary)', flexShrink: 0 }} />
                    {faq.q}
                  </span>
                  {isOpen ? <ChevronUp size={18} style={{ flexShrink: 0 }} /> : <ChevronDown size={18} style={{ flexShrink: 0 }} />}
                </button>
                
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{ width: '100%', height: '1px', background: 'var(--glass-border)', margin: '1rem 0' }} />
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem', lineHeight: 1.6, paddingBottom: '0.5rem' }}>
                        {faq.a}
                      </p>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', padding: '0.2rem 0.6rem', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Category: {faq.category}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
          
          {filteredFaqs.length === 0 && (
            <div style={{
              background: 'var(--glass-bg)',
              border: '1px dashed var(--glass-border)',
              borderRadius: '16px',
              padding: '3rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <MessageCircle size={32} style={{ color: 'var(--text-secondary)' }} />
              <span style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: 600 }}>No results found</span>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '400px', margin: 0 }}>
                We couldn't find any FAQs matching "{searchQuery}". Try searching other keywords or contact support.
              </p>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
