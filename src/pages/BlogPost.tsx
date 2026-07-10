import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Clock, ChevronLeft, User, Share2 } from 'lucide-react';
import { usePlatformStore } from '../store/platformStore';
import Footer from '../components/Footer';

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { blogPosts } = usePlatformStore();

  const post = blogPosts.find((p) => p.slug === slug);

  if (!post) {
    return (
      <div style={{ width: '100%', minHeight: '100vh', paddingTop: '100px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', color: 'var(--text-secondary)' }}>
          <h2>Article Not Found</h2>
          <p>The post you are trying to reach does not exist or has been removed.</p>
          <button onClick={() => navigate('/blog')} className="neon-button" style={{ padding: '0.6rem 1.5rem' }}>
            Return to Blog
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Article URL copied to clipboard!');
  };

  return (
    <div style={{ width: '100%', minHeight: '100vh', paddingTop: '120px', display: 'flex', flexDirection: 'column' }}>
      
      {/* Article Container */}
      <div style={{
        maxWidth: '800px',
        width: '100%',
        margin: '0 auto 5rem auto',
        padding: '0 2rem',
        boxSizing: 'border-box',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '2.5rem'
      }}>
        
        {/* Back Link */}
        <button 
          onClick={() => navigate('/blog')} 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '0.95rem',
            alignSelf: 'flex-start',
            padding: 0
          }}
        >
          <ChevronLeft size={16} /> Back to Blog
        </button>

        {/* Article Metadata & Title */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Category */}
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
          <h1 style={{
            fontSize: 'clamp(2rem, 5vw, 3.2rem)',
            fontWeight: 800,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            lineHeight: 1.15
          }}>
            {post.title}
          </h1>

          {/* Meta Row */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            paddingBottom: '1.5rem',
            marginTop: '0.5rem',
            fontSize: '0.9rem',
            color: 'var(--text-secondary)'
          }}>
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <User size={16} style={{ color: 'var(--accent-cyan)' }} /> {post.author}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Calendar size={16} /> {post.date}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Clock size={16} /> {post.readTime}
              </span>
            </div>
            
            <button
              onClick={handleShare}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'none',
                border: 'none',
                color: 'var(--accent-cyan)',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600
              }}
            >
              <Share2 size={16} /> Copy URL
            </button>
          </div>
        </div>

        {/* Article Body Content */}
        <div style={{
          fontSize: '1.15rem',
          lineHeight: 1.8,
          color: 'var(--text-primary)',
          textAlign: 'justify',
          letterSpacing: '0.01em',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem'
        }}>
          {post.content.split('\n\n').map((para, i) => (
            <p key={i} style={{ margin: 0 }}>
              {para}
            </p>
          ))}
        </div>

        {/* Tag blocks */}
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.5rem', marginTop: '2rem' }}>
          {post.tags.map((tag) => (
            <span 
              key={tag}
              style={{
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--glass-border)',
                padding: '0.3rem 0.8rem',
                borderRadius: '6px'
              }}
            >
              #{tag}
            </span>
          ))}
        </div>

      </div>

      <Footer />
    </div>
  );
}
