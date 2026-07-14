import type { Dispatch, SetStateAction } from 'react';
import { Trash } from 'lucide-react';
import { labelStyle, inputStyle, selectStyle, textareaStyle } from './styles';

export interface CmsTabProps {
  handleCMSUpdate: (e: React.FormEvent) => void;
  editHpTitle: string;
  setEditHpTitle: Dispatch<SetStateAction<string>>;
  editHpSubtitle: string;
  setEditHpSubtitle: Dispatch<SetStateAction<string>>;
  editPrTitle: string;
  setEditPrTitle: Dispatch<SetStateAction<string>>;
  editNotice: string;
  setEditNotice: Dispatch<SetStateAction<string>>;
  editPrSubtitle: string;
  setEditPrSubtitle: Dispatch<SetStateAction<string>>;
  handleAddFaq: (e: React.FormEvent) => void;
  newFaqCat: string;
  setNewFaqCat: Dispatch<SetStateAction<string>>;
  newFaqQ: string;
  setNewFaqQ: Dispatch<SetStateAction<string>>;
  newFaqA: string;
  setNewFaqA: Dispatch<SetStateAction<string>>;
  cms: Record<string, string>;
  handleDeleteFaq: (q: string) => void;
}

export default function CmsTab({
  handleCMSUpdate,
  editHpTitle, setEditHpTitle,
  editHpSubtitle, setEditHpSubtitle,
  editPrTitle, setEditPrTitle,
  editNotice, setEditNotice,
  editPrSubtitle, setEditPrSubtitle,
  handleAddFaq,
  newFaqCat, setNewFaqCat,
  newFaqQ, setNewFaqQ,
  newFaqA, setNewFaqA,
  cms,
  handleDeleteFaq,
}: CmsTabProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
      <div style={{
        background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
        borderRadius: '24px', padding: '2rem', height: 'fit-content'
      }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Configure Site Content</h3>
        <form onSubmit={handleCMSUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div>
            <label style={labelStyle}>Homepage Headline</label>
            <input type="text" value={editHpTitle} onChange={(e) => setEditHpTitle(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Homepage Subtitle</label>
            <textarea rows={2} value={editHpSubtitle} onChange={(e) => setEditHpSubtitle(e.target.value)} style={textareaStyle} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Pricing Headline</label>
              <input type="text" value={editPrTitle} onChange={(e) => setEditPrTitle(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Announcement Notice</label>
              <input type="text" value={editNotice} onChange={(e) => setEditNotice(e.target.value)} style={inputStyle} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Pricing Subtitle</label>
            <textarea rows={2} value={editPrSubtitle} onChange={(e) => setEditPrSubtitle(e.target.value)} style={textareaStyle} />
          </div>
          <button type="submit" className="neon-button" style={{
            padding: '0.8rem 1.5rem', fontSize: '0.95rem', fontWeight: 600, alignSelf: 'flex-start', marginTop: '0.5rem'
          }}>
            Publish CMS Configurations
          </button>
        </form>
      </div>

      <div style={{
        background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
        borderRadius: '24px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem'
      }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Add FAQ Entry</h3>
        <form onSubmit={handleAddFaq} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div>
            <label style={labelStyle}>Category</label>
            <select value={newFaqCat} onChange={(e) => setNewFaqCat(e.target.value)} style={selectStyle}>
              <option value="General">General</option>
              <option value="Rules">Rules</option>
              <option value="Billing">Billing</option>
              <option value="Tech">Tech</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Question</label>
            <input type="text" placeholder="e.g. Can I run hedging bots?" value={newFaqQ} onChange={(e) => setNewFaqQ(e.target.value)} style={inputStyle} required />
          </div>
          <div>
            <label style={labelStyle}>Detailed Answer</label>
            <textarea rows={4} placeholder="Provide descriptive answer..." value={newFaqA} onChange={(e) => setNewFaqA(e.target.value)} style={textareaStyle} required />
          </div>
          <button type="submit" className="neon-button" style={{ padding: '0.7rem 1.2rem', fontSize: '0.9rem', alignSelf: 'flex-start' }}>
            Publish FAQ
          </button>
        </form>

        <div style={{ width: '100%', height: '1px', background: 'var(--glass-border)' }} />

        <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>FAQ list preview</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', maxHeight: '200px', overflowY: 'auto' }} className="custom-scrollbar">
          {(JSON.parse(cms.faqList || '[]') as { q: string; a: string; category: string }[]).map((faq: any, i: number) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'rgba(255,255,255,0.01)', padding: '0.6rem 0.8rem',
              border: '1px solid var(--glass-border)', borderRadius: '8px'
            }}>
              <span style={{
                fontSize: '0.85rem', color: 'var(--text-primary)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '80%'
              }}>{faq.q}</span>
              <button onClick={() => handleDeleteFaq(faq.q)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                <Trash size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
