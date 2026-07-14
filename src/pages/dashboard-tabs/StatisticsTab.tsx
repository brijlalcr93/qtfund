import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart as RechartsBarChart, Bar, Cell } from 'recharts';
import type { TradingAccount } from '../../store/platformStore';
import { KpiCard } from './shared';

interface StatisticsTabProps {
  selectedAccount: TradingAccount;
  selectedAccountId: string;
}

export default function StatisticsTab({ selectedAccount, selectedAccountId }: StatisticsTabProps) {
  const pf = selectedAccount.winRate > 0 ? (selectedAccount.winRate / (100 - selectedAccount.winRate + 5) * 1.5).toFixed(2) : '0.00';
  const rr = "1:1.75";
  const avgWin = (selectedAccount.initialBalance * 0.012).toLocaleString('en-US', { maximumFractionDigits: 0 });
  const avgLoss = (selectedAccount.initialBalance * 0.007).toLocaleString('en-US', { maximumFractionDigits: 0 });

  const monthlyPerformance = [
    { month: 'Jan', return: 4.2 },
    { month: 'Feb', return: -1.5 },
    { month: 'Mar', return: 8.9 },
    { month: 'Apr', return: 12.4 },
    { month: 'May', return: 6.8 },
    { month: 'Jun', return: 5.1 },
  ];

  return (
    <motion.div
      key="statistics"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
    >
      <div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Advanced Statistics</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Detailed breakdown of performance indicators for account #{selectedAccountId}</p>
      </div>

      {/* Stats Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem' }}>
        <KpiCard title="Win Rate" value={`${selectedAccount.winRate}%`} subtext="Ratio of profitable trades" color="var(--accent-cyan)" />
        <KpiCard title="Profit Factor" value={pf} subtext="Gross Profits / Gross Losses" color="#a855f7" />
        <KpiCard title="Average R:R" value={rr} subtext="Risk to Reward Ratio" color="#3b82f6" />
        <KpiCard title="Total Trades" value={selectedAccount.tradesCount.toString()} subtext="Completed order cycles" />
        <KpiCard title="Average Win" value={`+$${avgWin}`} subtext="Average profit per win" color="var(--accent-cyan)" />
        <KpiCard title="Average Loss" value={`-$${avgLoss}`} subtext="Average drawdown per loss" color="#ef4444" />
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
        {/* Detailed Equity Curve */}
        <div style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(20px)',
          border: '1px solid var(--glass-border)',
          borderRadius: '24px',
          padding: '2rem',
          minWidth: 0
        }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Equity Trajectory</h3>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={selectedAccount.equityHistory} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="day" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} tickLine={false} axisLine={false} />
                <YAxis domain={[(dataMin: number) => dataMin - (selectedAccount.initialBalance * 0.05), (dataMax: number) => dataMax + (selectedAccount.initialBalance * 0.05)]} stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value/1000}k`} />
                <Tooltip
                  contentStyle={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)' }}
                  itemStyle={{ color: 'var(--accent-cyan)' }}
                  formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Equity']}
                />
                <Line
                  type="monotone"
                  dataKey="equity"
                  stroke="var(--accent-cyan)"
                  strokeWidth={3}
                  dot={{ fill: 'var(--bg-primary)', stroke: 'var(--accent-cyan)', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: 'var(--accent-cyan)' }}
                  style={{ filter: 'drop-shadow(0 0 8px var(--accent-glow))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Performance Bar Chart */}
        <div style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(20px)',
          border: '1px solid var(--glass-border)',
          borderRadius: '24px',
          padding: '2rem',
          minWidth: 0
        }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Monthly Return (%)</h3>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={monthlyPerformance} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  contentStyle={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)' }}
                  formatter={(value: any) => [`${value}%`, 'Return']}
                />
                <Bar dataKey="return" radius={[4, 4, 0, 0]}>
                  {monthlyPerformance.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.return >= 0 ? 'var(--accent-cyan)' : '#ef4444'} />
                  ))}
                </Bar>
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
