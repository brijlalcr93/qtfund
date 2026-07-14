import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import type { LucideIcon } from 'lucide-react';
import type { AdminStats } from '../../lib/adminApi';

const COLORS = ['var(--accent-cyan)', '#a855f7', '#3b82f6', '#10b981', '#ef4444', '#f59e0b'];

export interface OverviewTabProps {
  kpiCards: { title: string; val: string; change: string; icon: LucideIcon; color: string }[];
  stats: AdminStats | null;
}

export default function OverviewTab({ kpiCards, stats }: OverviewTabProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.2rem' }}>
        {kpiCards.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--glass-border)',
              borderRadius: '16px',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
              boxShadow: 'inset 0 0 15px rgba(255,255,255,0.01)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{kpi.title}</span>
                <Icon size={18} style={{ color: kpi.color }} />
              </div>
              <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem' }}>{kpi.val}</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{kpi.change}</span>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
        <div style={{
          background: 'var(--glass-bg)', backdropFilter: 'blur(20px)',
          border: '1px solid var(--glass-border)', borderRadius: '24px', padding: '2rem'
        }}>
          <h4 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem' }}>Annual Revenue Growth</h4>
          <div style={{ height: '260px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[
                { name: 'Jan', rev: 14000, payout: 5000 },
                { name: 'Feb', rev: 25000, payout: 12000 },
                { name: 'Mar', rev: 18000, payout: 9000 },
                { name: 'Apr', rev: 32000, payout: 15000 },
                { name: 'May', rev: 45000, payout: 22000 },
                { name: 'Jun', rev: 64000, payout: 34000 }
              ]}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-cyan)" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="var(--accent-cyan)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} tickLine={false} />
                <YAxis stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} tickLine={false} />
                <Tooltip contentStyle={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: '#fff' }} />
                <Area type="monotone" dataKey="rev" stroke="var(--accent-cyan)" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" name="Revenues ($)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{
          background: 'var(--glass-bg)', backdropFilter: 'blur(20px)',
          border: '1px solid var(--glass-border)', borderRadius: '24px', padding: '2rem'
        }}>
          <h4 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem' }}>Challenge Status Distribution</h4>
          <div style={{ height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Active', value: stats?.overview.activeChallenges || 1 },
                    { name: 'Passed', value: stats?.overview.passedChallenges || 0 },
                    { name: 'Failed', value: stats?.overview.failedChallenges || 0 },
                  ]}
                  cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value"
                >
                  {[0, 1, 2].map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--accent-cyan)' }}>⬤ Active</span>
              <span style={{ color: '#a855f7' }}>⬤ Passed</span>
              <span style={{ color: '#3b82f6' }}>⬤ Failed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
