import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Calendar, Clock, Plus, X } from 'lucide-react';
import { usePlatformStore } from '../store/platformStore';
import type { BlogPost } from '../store/platformStore';
import Footer from '../components/Footer';

export default function Blog() {
  const navigate = useNavigate();
  const { blogPosts, addBlogPost } = usePlatformStore();
  
  // Search / Category filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Write blog post modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newExcerpt, setNewExcerpt] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('Risk Management');
  const [newTags, setNewTags] = useState('');
  const [newAuthor, setNewAuthor] = useState('Quantum Editorial');

  const categories = ['All', 'Risk Management', 'Capital Scaling', 'Market Strategy'];

  const filteredPosts = blogPosts.filter((post) => {
    const matchesSearch = 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newExcerpt || !newContent) return;

    const slug = newTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const tagsArr = newTags.split(',').map((t) => t.trim()).filter(Boolean);

    const post: BlogPost = {
      slug,
      title: newTitle,
      excerpt: newExcerpt,
      content: newContent,
      category: newCategory,
      tags: tagsArr.length ? tagsArr : ['Trading'],
      author: newAuthor,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      readTime: `${Math.ceil(newContent.split(' ').length / 200)} min read`
    };

    addBlogPost(post);
    setNewTitle('');
    setNewExcerpt('');
    setNewContent('');
    setNewTags('');
    setModalOpen(false);
  };

  return (
    <div style={{ width: '100%', minHeight: '100vh', paddingTop: '100px', display: 'flex', flexDirection: 'column' }}>
      
      {/* Blog Header */}
      <div className="scroll-section" style={{ minHeight: 'auto', paddingBottom: '2rem', gap: '1rem', textAlign: 'center' }}>
        <span style={{ color: 'var(--accent-cyan)', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Quantum Journal</span>
        <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
          Trading Blog
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', maxWidth: '800px', margin: '0 auto', lineHeight: 1.6 }}>
          Stay updated with technical market strategy reviews, daily risk parameters advice, and scaling announcements.
        </p>
      </div>

      {/* Toolbar / Actions */}
      <div style={{
        maxWidth: '1200px',
        width: '100%',
        margin: '0 auto 4rem auto',
        padding: '0 2rem',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
        flex: 1
      }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          
          {/* Search bar */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '350px' }}>
            <Search size={18} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem 1rem 0.6rem 2.4rem',
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '0.95rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Write Article trigger (for testing / admin mock presentation) */}
          <button
            onClick={() => setModalOpen(true)}
            className="neon-button"
            style={{
              padding: '0.6rem 1.2rem',
              fontSize: '0.9rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <Plus size={16} /> Write Article
          </button>
        </div>

        {/* Categories Bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '0.5rem 1.2rem',
                borderRadius: '99px',
                border: '1px solid var(--glass-border)',
                background: selectedCategory === cat ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.02)',
                color: selectedCategory === cat ? '#000' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Blog Post Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2rem',
          marginTop: '1rem'
        }}>
          {filteredPosts.map((post) => (
            <motion.div
              key={post.slug}
              whileHover={{ y: -6 }}
              onClick={() => navigate(`/blog/${post.slug}`)}
              style={{
                background: 'var(--glass-bg)',
                backdropFilter: 'blur(20px)',
                border: '1px solid var(--glass-border)',
                borderRadius: '20px',
                padding: '2rem',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.2rem',
                transition: 'all 0.3s'
              }}
              onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--accent-cyan)'}
              onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--glass-border)'}
            >
              {/* Category tag */}
              <span style={{
                alignSelf: 'flex-start',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.2rem 0.6rem',
                borderRadius: '4px',
                background: 'rgba(6,182,212,0.1)',
                color: 'var(--accent-cyan)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {post.category}
              </span>

              {/* Title */}
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, lineHeight: 1.3 }}>
                {post.title}
              </h3>

              {/* Excerpt */}
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.5, margin: 0 }}>
                {post.excerpt}
              </p>

              {/* Bottom metadata */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem', marginTop: 'auto' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Calendar size={14} /> {post.date}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Clock size={14} /> {post.readTime}
                </span>
              </div>
            </motion.div>
          ))}

          {filteredPosts.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
              No blog posts match your filter. Write a new article above to populate the feed!
            </div>
          )}
        </div>

      </div>

      <Footer />

      {/* Editor Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(10px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            boxSizing: 'border-box'
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                background: 'var(--bg-gradient-start)',
                border: '1px solid var(--glass-border)',
                borderRadius: '24px',
                width: '100%',
                maxWidth: '650px',
                padding: '2.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                boxSizing: 'border-box',
                position: 'relative'
              }}
            >
              <button
                onClick={() => setModalOpen(false)}
                style={{
                  position: 'absolute',
                  top: '1.5rem',
                  right: '1.5rem',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                <X size={20} />
              </button>

              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>Write New Article</h2>

              <form onSubmit={handleCreatePost} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '70vh', overflowY: 'auto', paddingRight: '0.3rem' }} className="custom-scrollbar">
                <div>
                  <label style={labelStyle}>Article Title</label>
                  <input type="text" placeholder="e.g. Trading EURUSD under volatility" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} style={inputStyle} required />
                </div>
                <div>
                  <label style={labelStyle}>Short Summary (Excerpt)</label>
                  <input type="text" placeholder="Provide a brief teaser for the grid card..." value={newExcerpt} onChange={(e) => setNewExcerpt(e.target.value)} style={inputStyle} required />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={labelStyle}>Category</label>
                    <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} style={selectStyle}>
                      <option value="Risk Management">Risk Management</option>
                      <option value="Capital Scaling">Capital Scaling</option>
                      <option value="Market Strategy">Market Strategy</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Tags (comma separated)</label>
                    <input type="text" placeholder="e.g. forex, limits, mt5" value={newTags} onChange={(e) => setNewTags(e.target.value)} style={inputStyle} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={labelStyle}>Author Name</label>
                    <input type="text" value={newAuthor} onChange={(e) => setNewAuthor(e.target.value)} style={inputStyle} required />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Full Content</label>
                  <textarea rows={8} placeholder="Write your full article body here..." value={newContent} onChange={(e) => setNewContent(e.target.value)} style={textareaStyle} required />
                </div>

                <button type="submit" className="neon-button" style={{
                  padding: '0.8rem 1.5rem',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  marginTop: '1rem',
                  alignSelf: 'flex-start'
                }}>
                  Publish Article
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

const labelStyle = {
  display: 'block',
  marginBottom: '0.3rem',
  color: 'var(--text-secondary)',
  fontSize: '0.85rem'
};

const inputStyle = {
  width: '100%',
  padding: '0.7rem 1rem',
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid var(--glass-border)',
  borderRadius: '8px',
  color: 'var(--text-primary)',
  fontSize: '0.95rem',
  outline: 'none',
  marginTop: '0.1rem',
  boxSizing: 'border-box' as const
};

const selectStyle = {
  width: '100%',
  padding: '0.7rem 1rem',
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid var(--glass-border)',
  borderRadius: '8px',
  color: 'var(--text-primary)',
  fontSize: '0.95rem',
  outline: 'none',
  marginTop: '0.1rem',
  cursor: 'pointer',
  boxSizing: 'border-box' as const
};

const textareaStyle = {
  width: '100%',
  padding: '0.7rem 1rem',
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid var(--glass-border)',
  borderRadius: '8px',
  color: 'var(--text-primary)',
  fontSize: '0.95rem',
  outline: 'none',
  marginTop: '0.1rem',
  fontFamily: 'inherit',
  resize: 'vertical' as const,
  boxSizing: 'border-box' as const
};
