import { useState } from 'react';
import { Search, Trophy, Wallet, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { usePlatformStore } from '../store/platformStore';
import Footer from '../components/Footer';

const flagEmojiMap: Record<string, string> = {
  US: '🇺🇸',
  DE: '🇩🇪',
  IN: '🇮🇳',
  GB: '🇬🇧',
  JP: '🇯🇵',
  FR: '🇫🇷',
  BR: '🇧🇷',
  ZA: '🇿🇦',
  CA: '🇨🇦'
};

const payoutChartData = [
  { month: 'Jul 25', amount: 1.2 },
  { month: 'Aug 25', amount: 1.5 },
  { month: 'Sep 25', amount: 1.8 },
  { month: 'Oct 25', amount: 2.1 },
  { month: 'Nov 25', amount: 2.4 },
  { month: 'Dec 25', amount: 2.8 },
  { month: 'Jan 26', amount: 3.1 },
  { month: 'Feb 26', amount: 3.5 },
  { month: 'Mar 26', amount: 3.9 },
  { month: 'Apr 26', amount: 4.2 },
  { month: 'May 26', amount: 4.8 },
  { month: 'Jun 26', amount: 5.4 }
];

export default function Payouts() {
  const { leaderboard, recentPayouts } = usePlatformStore();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLeaderboard = leaderboard.filter(trader => 
    trader.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ width: '100%', minHeight: '100vh', paddingTop: '100px', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header Container */}
      <div className="scroll-section" style={{ minHeight: 'auto', paddingBottom: '2rem', gap: '1rem', textAlign: 'center' }}>
        <span style={{ color: 'var(--accent-cyan)', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Audit & Results</span>
        <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
          Traders Paid Out
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', maxWidth: '800px', margin: '0 auto', lineHeight: 1.6 }}>
          We process payouts globally through crypto rails and international wires. Explore verified payouts and leaderboard positions.
        </p>
      </div>

      {/* Main Grid */}
      <div style={{
        maxWidth: '1200px',
        width: '100%',
        margin: '0 auto 5rem auto',
        padding: '0 2rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '2.5rem',
        boxSizing: 'border-box'
      }}>
        
        {/* Left side: Chart and Recent Payouts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          
          {/* Earnings Chart */}
          <div style={{
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--glass-border)',
            borderRadius: '24px',
            padding: '2rem',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', marginBottom: '1.5rem' }}>
              <TrendingUp size={20} style={{ color: 'var(--accent-cyan)' }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Monthly Payout Volumes (Simulated)</h3>
            </div>
            
            <div style={{ height: '240px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={payoutChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="month" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}M`} />
                  <Tooltip 
                    contentStyle={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)' }}
                    itemStyle={{ color: 'var(--accent-cyan)' }}
                    formatter={(val) => [`$${val} Million`, 'Total Payout']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="var(--accent-cyan)" 
                    strokeWidth={3}
                    dot={{ fill: '#030712', stroke: 'var(--accent-cyan)', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: 'var(--accent-cyan)' }}
                    style={{ filter: 'drop-shadow(0 0 6px var(--accent-glow))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Payouts Ticker */}
          <div style={{
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--glass-border)',
            borderRadius: '24px',
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem'
          }}>
            <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
              <Wallet size={20} style={{ color: 'var(--accent-cyan)' }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Recent Payout Activity</h3>
            </div>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              maxHeight: '380px',
              overflowY: 'auto',
              paddingRight: '0.5rem'
            }} className="custom-scrollbar">
              {recentPayouts.map((pay) => (
                <div 
                  key={pay.id}
                  style={{
                    background: 'rgba(255,255,255,0.01)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '12px',
                    padding: '1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.6rem' }}>
                      {flagEmojiMap[pay.country] || '🌐'}
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.95rem' }}>{pay.name}</span>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{pay.time} via {pay.method}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem' }}>
                    <span style={{ color: 'var(--accent-cyan)', fontWeight: 700, fontSize: '1rem' }}>
                      +${pay.amount.toLocaleString()}
                    </span>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '0.1rem 0.4rem',
                      borderRadius: '4px',
                      background: pay.status === 'Paid' ? 'rgba(16,185,129,0.1)' : pay.status === 'Approved' ? 'rgba(6,182,212,0.1)' : 'rgba(239,68,68,0.1)',
                      color: pay.status === 'Paid' ? '#10b981' : pay.status === 'Approved' ? 'var(--accent-cyan)' : '#ef4444'
                    }}>
                      {pay.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right side: Leaderboard */}
        <div style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(20px)',
          border: '1px solid var(--glass-border)',
          borderRadius: '24px',
          padding: '2rem',
          height: 'fit-content',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
              <Trophy size={20} style={{ color: 'var(--accent-cyan)' }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Trader Leaderboard</h3>
            </div>
            
            {/* Search Leaderboard */}
            <div style={{ position: 'relative', width: '100%', maxWidth: '240px' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input
                type="text"
                placeholder="Search trader..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 1rem 0.5rem 2.2rem',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }} className="custom-scrollbar">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '400px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  <th style={{ padding: '0.8rem 0' }}>Rank</th>
                  <th style={{ padding: '0.8rem 0' }}>Trader</th>
                  <th style={{ padding: '0.8rem 0', textAlign: 'right' }}>Win Rate</th>
                  <th style={{ padding: '0.8rem 0', textAlign: 'right' }}>Total Paid</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeaderboard.map((trader) => (
                  <tr key={trader.rank} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.95rem' }}>
                    <td style={{ padding: '1rem 0', fontWeight: 700, color: trader.rank <= 3 ? 'var(--accent-cyan)' : 'var(--text-secondary)' }}>
                      #{trader.rank}
                    </td>
                    <td style={{ padding: '1rem 0' }}>
                      <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                        <span style={{ fontSize: '1.4rem' }}>{flagEmojiMap[trader.country] || '🌐'}</span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{trader.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem 0', textAlign: 'right', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                      {trader.winRate}%
                    </td>
                    <td style={{ padding: '1rem 0', textAlign: 'right', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                      ${trader.payout.toLocaleString()}
                    </td>
                  </tr>
                ))}
                {filteredLeaderboard.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-secondary)' }}>
                      No traders found matching your query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <Footer />
    </div>
  );
}
