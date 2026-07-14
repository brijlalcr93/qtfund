import type { Dispatch, SetStateAction } from 'react';
import { Plus, Trash } from 'lucide-react';
import type { AdminStats } from '../../lib/adminApi';
import { labelStyle, inputStyle } from './styles';

export interface ChallengesTabProps {
  handleAddChallenge: (e: React.FormEvent) => void;
  challName: string;
  setChallName: Dispatch<SetStateAction<string>>;
  challType: '1-Step' | '2-Step' | 'Instant';
  setChallType: Dispatch<SetStateAction<'1-Step' | '2-Step' | 'Instant'>>;
  challSize: string;
  setChallSize: Dispatch<SetStateAction<string>>;
  challPrice: string;
  setChallPrice: Dispatch<SetStateAction<string>>;
  challProfit: string;
  setChallProfit: Dispatch<SetStateAction<string>>;
  challMax: string;
  setChallMax: Dispatch<SetStateAction<string>>;
  challDays: string;
  setChallDays: Dispatch<SetStateAction<string>>;
  challDaily: string;
  setChallDaily: Dispatch<SetStateAction<string>>;
  stats: AdminStats | null;
  handleDeleteChallenge: (id: string, name: string) => void;
}

export default function ChallengesTab({
  handleAddChallenge,
  challName, setChallName,
  challType, setChallType,
  challSize, setChallSize,
  challPrice, setChallPrice,
  challProfit, setChallProfit,
  challMax, setChallMax,
  challDays, setChallDays,
  challDaily, setChallDaily,
  stats,
  handleDeleteChallenge,
}: ChallengesTabProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
      <div style={{
        background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
        borderRadius: '24px', padding: '2rem', height: 'fit-content'
      }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Create New Challenge Offering</h3>
        <form onSubmit={handleAddChallenge} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div>
            <label style={labelStyle}>Challenge Name</label>
            <input type="text" placeholder="e.g. Standard 50k" value={challName} onChange={(e) => setChallName(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Challenge Type</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              {(['1-Step', '2-Step', 'Instant'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setChallType(t)}
                  style={{
                    padding: '0.5rem', border: '1px solid var(--glass-border)', borderRadius: '8px',
                    cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
                    background: challType === t ? 'var(--accent-cyan)' : 'transparent',
                    color: challType === t ? '#000' : 'var(--text-secondary)'
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Account Size ($)</label>
              <input type="number" placeholder="e.g. 50000" value={challSize} onChange={(e) => setChallSize(e.target.value)} style={inputStyle} required />
            </div>
            <div>
              <label style={labelStyle}>Price ($)</label>
              <input type="number" placeholder="e.g. 279" value={challPrice} onChange={(e) => setChallPrice(e.target.value)} style={inputStyle} required />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Profit Target (%)</label>
              <input type="number" placeholder="e.g. 8" value={challProfit} onChange={(e) => setChallProfit(e.target.value)} style={inputStyle} required />
            </div>
            <div>
              <label style={labelStyle}>Max Drawdown (%)</label>
              <input type="number" placeholder="e.g. 10" value={challMax} onChange={(e) => setChallMax(e.target.value)} style={inputStyle} required />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Duration (days)</label>
              <input type="number" placeholder="e.g. 30" value={challDays} onChange={(e) => setChallDays(e.target.value)} style={inputStyle} required />
            </div>
            <div>
              <label style={labelStyle}>Max Daily Loss (%)</label>
              <input type="number" placeholder="e.g. 5" value={challDaily} onChange={(e) => setChallDaily(e.target.value)} style={inputStyle} />
            </div>
          </div>
          <button type="submit" className="neon-button" style={{
            padding: '0.8rem 1.5rem', fontSize: '0.95rem', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            alignSelf: 'flex-start', marginTop: '0.5rem'
          }}>
            <Plus size={16} /> Deploy Challenge
          </button>
        </form>
      </div>

      <div style={{
        background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
        borderRadius: '24px', padding: '2rem'
      }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Active offerings</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '420px', overflowY: 'auto' }} className="custom-scrollbar">
          {(stats?.challengePlans || []).map((plan) => (
            <div key={plan.id} style={{
              background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)',
              borderRadius: '12px', padding: '1rem',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{plan.name}</span>
                <h4 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0.1rem 0' }}>${plan.accountSize.toLocaleString()}</h4>
                <span style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>${plan.price} Fee</span>
              </div>
              <button
                onClick={() => handleDeleteChallenge(plan.id, plan.name)}
                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
              >
                <Trash size={18} />
              </button>
            </div>
          ))}
          {(stats?.challengePlans || []).length === 0 && (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>No challenge plans yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
