import type { Dispatch, SetStateAction } from 'react';
import { Mail } from 'lucide-react';
import type { UserItem } from '../../lib/adminApi';
import { labelStyle, inputStyle, selectStyle, textareaStyle } from './styles';

export interface EmailTabProps {
  users: UserItem[];
  handleSendEmails: (e: React.FormEvent) => void;
  emailSubject: string;
  setEmailSubject: Dispatch<SetStateAction<string>>;
  emailTemplate: string;
  setEmailTemplate: Dispatch<SetStateAction<string>>;
  emailSending: boolean;
}

export default function EmailTab({
  users,
  handleSendEmails,
  emailSubject, setEmailSubject,
  emailTemplate, setEmailTemplate,
  emailSending,
}: EmailTabProps) {
  return (
    <div style={{
      background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
      borderRadius: '24px', padding: '2.5rem', maxWidth: '700px', margin: '0 auto'
    }}>
      <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', marginBottom: '1.5rem' }}>
        <Mail size={22} style={{ color: 'var(--accent-cyan)' }} />
        <h3 style={{ fontSize: '1.3rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Trigger Automated Bulk Dispatch</h3>
      </div>
      <form onSubmit={handleSendEmails} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
        <div>
          <label style={labelStyle}>Dispatch Target</label>
          <select style={selectStyle} defaultValue="ALL">
            <option value="ALL">All Registered Accounts ({users.length} traders)</option>
            <option value="VERIFIED">Verified Only</option>
            <option value="ACTIVE_CHALLENGE">Active Challenge Holders</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Subject / Header</label>
          <input type="text" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} style={inputStyle} required />
        </div>
        <div>
          <label style={labelStyle}>Message Template Body</label>
          <textarea rows={6} value={emailTemplate} onChange={(e) => setEmailTemplate(e.target.value)} style={textareaStyle} required />
        </div>
        <button type="submit" disabled={emailSending} className="neon-button" style={{
          padding: '0.9rem 2rem', fontSize: '1rem', fontWeight: 600,
          alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem'
        }}>
          {emailSending ? 'Dispatching...' : 'Trigger Automated Send'}
        </button>
      </form>
    </div>
  );
}
