import {
  BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import type { AdminStats } from '../../lib/adminApi';

export interface AnalyticsTabProps {
  stats: AdminStats | null;
}

export default function AnalyticsTab({ stats }: AnalyticsTabProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
        <div style={{
          background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
          borderRadius: '24px', padding: '2rem'
        }}>
          <h4 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem' }}>Traffic Sources (Audits)</h4>
          <div style={{ height: '240px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={[
                { name: 'Organic', views: 8200 },
                { name: 'YouTube', views: 5600 },
                { name: 'Twitter', views: 4200 },
                { name: 'Affiliates', views: 12500 },
                { name: 'Direct', views: 7100 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} tickLine={false} />
                <YAxis stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} tickLine={false} />
                <Tooltip contentStyle={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: '#fff' }} />
                <Bar dataKey="views" fill="var(--accent-cyan)" radius={[4, 4, 0, 0]} />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{
          background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
          borderRadius: '24px', padding: '2.5rem',
          display: 'flex', flexDirection: 'column', gap: '1.5rem', justifyContent: 'center'
        }}>
          <h4 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>Conversion Metrics</h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              <span>Challenge conversion rate:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{stats ? ((stats.overview.activeChallenges / Math.max(stats.overview.totalUsers, 1)) * 100).toFixed(1) : '...'}%</strong>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{
                width: `${stats ? Math.min((stats.overview.activeChallenges / Math.max(stats.overview.totalUsers, 1)) * 100, 100) : 0}%`,
                height: '100%', background: 'var(--accent-cyan)'
              }} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              <span>Pass rate (Challenges):</span>
              <strong style={{ color: '#a855f7' }}>
                {stats && (stats.overview.passedChallenges + stats.overview.failedChallenges) > 0
                  ? ((stats.overview.passedChallenges / (stats.overview.passedChallenges + stats.overview.failedChallenges)) * 100).toFixed(1)
                  : '...'}%
              </strong>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{
                width: `${stats && (stats.overview.passedChallenges + stats.overview.failedChallenges) > 0 ? Math.min((stats.overview.passedChallenges / (stats.overview.passedChallenges + stats.overview.failedChallenges)) * 100, 100) : 0}%`,
                height: '100%', background: '#a855f7'
              }} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              <span>Verified users:</span>
              <strong style={{ color: '#3b82f6' }}>
                {stats ? `${stats.overview.verifiedUsers} / ${stats.overview.totalUsers}` : '...'}
              </strong>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{
                width: `${stats ? Math.min((stats.overview.verifiedUsers / Math.max(stats.overview.totalUsers, 1)) * 100, 100) : 0}%`,
                height: '100%', background: '#3b82f6'
              }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
