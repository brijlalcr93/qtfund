import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { TradingAccount } from '../../store/platformStore';
import { KpiCard, ProgressBar } from './shared';

interface OverviewTabProps {
  profileName: string;
  accounts: TradingAccount[];
  selectedAccount: TradingAccount;
  selectedAccountId: string;
  setSelectedAccountId: React.Dispatch<React.SetStateAction<string>>;
  handleSimulateTrade: (accountId: string, result: 'win' | 'loss') => Promise<void>;
  isSimulating: boolean;
  simulateMessage: string;
}

export default function OverviewTab({
  profileName,
  accounts,
  selectedAccount,
  selectedAccountId,
  setSelectedAccountId,
  handleSimulateTrade,
  isSimulating,
  simulateMessage
}: OverviewTabProps) {
  return (
    <motion.div
      key="overview"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Overview
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
            Welcome back, {profileName}
          </p>
        </div>

        {/* Active selected account status badge */}
        <div style={{
          background: `rgba(${selectedAccount.status === 'Funded' ? '6,182,212' : selectedAccount.status === 'Phase 2' ? '168,85,247' : selectedAccount.status === 'Phase 1' ? '59,130,246' : '239,68,68'}, 0.1)`,
          border: `1px solid ${selectedAccount.status === 'Funded' ? 'var(--accent-cyan)' : selectedAccount.status === 'Phase 2' ? '#a855f7' : selectedAccount.status === 'Phase 1' ? '#3b82f6' : '#ef4444'}`,
          padding: '0.5rem 1.2rem',
          borderRadius: '999px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: selectedAccount.status === 'Funded' ? 'var(--accent-cyan)' : selectedAccount.status === 'Phase 2' ? '#a855f7' : selectedAccount.status === 'Phase 1' ? '#3b82f6' : '#ef4444',
            boxShadow: `0 0 8px ${selectedAccount.status === 'Funded' ? 'var(--accent-cyan)' : selectedAccount.status === 'Phase 2' ? '#a855f7' : selectedAccount.status === 'Phase 1' ? '#3b82f6' : '#ef4444'}`
          }} />
          <span style={{
            color: selectedAccount.status === 'Funded' ? 'var(--accent-cyan)' : selectedAccount.status === 'Phase 2' ? '#a855f7' : selectedAccount.status === 'Phase 1' ? '#3b82f6' : '#ef4444',
            fontWeight: 600,
            fontSize: '0.9rem',
            textTransform: 'uppercase'
          }}>
            {selectedAccount.status} Active ({selectedAccount.name})
          </span>
        </div>
      </div>

      {/* Account Selector Cards Carousel */}
      <div>
        <h3 style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Trading Accounts</h3>
        <div style={{
          display: 'flex',
          gap: '1.2rem',
          overflowX: 'auto',
          padding: '0.5rem 0.2rem 1.5rem 0.2rem',
          scrollbarWidth: 'thin',
          scrollbarColor: 'var(--glass-border) transparent'
        }} className="custom-scrollbar">
          {accounts.map((acc) => {
            const isSelected = acc.id === selectedAccountId;
            const statusColor =
              acc.status === 'Funded' ? 'var(--accent-cyan)' :
              acc.status === 'Phase 2' ? '#a855f7' :
              acc.status === 'Phase 1' ? '#3b82f6' :
              '#ef4444';

            const shadowColor =
              acc.status === 'Funded' ? 'rgba(6, 182, 212, 0.3)' :
              acc.status === 'Phase 2' ? 'rgba(168, 85, 247, 0.3)' :
              acc.status === 'Phase 1' ? 'rgba(59, 130, 246, 0.3)' :
              'rgba(239, 68, 68, 0.3)';

            return (
              <motion.div
                key={acc.id}
                whileHover={{ y: -6, scale: 1.02 }}
                onClick={() => setSelectedAccountId(acc.id)}
                style={{
                  flex: '0 0 280px',
                  background: isSelected ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                  border: isSelected ? `2px solid ${statusColor}` : '1px solid var(--glass-border)',
                  borderRadius: '20px',
                  padding: '1.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  boxShadow: isSelected ? `0 0 20px ${shadowColor}` : 'none',
                  position: 'relative',
                  overflow: 'hidden',
                  userSelect: 'none'
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.03) 0%, transparent 50%)',
                  pointerEvents: 'none'
                }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{acc.name}</span>
                    <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', marginTop: '0.2rem' }}>ID: {acc.id}</span>
                  </div>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '0.25rem 0.6rem',
                    borderRadius: '999px',
                    background: `rgba(${acc.status === 'Funded' ? '6,182,212' : acc.status === 'Phase 2' ? '168,85,247' : acc.status === 'Phase 1' ? '59,130,246' : '239,68,68'}, 0.15)`,
                    color: statusColor,
                    border: `1px solid rgba(${acc.status === 'Funded' ? '6,182,212' : acc.status === 'Phase 2' ? '168,85,247' : acc.status === 'Phase 1' ? '59,130,246' : '239,68,68'}, 0.3)`
                  }}>
                    {acc.status}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Account Balance</span>
                  <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                    ${acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <span>Leverage: <strong>{acc.leverage}</strong></span>
                  <span>Win Rate: <strong style={{ color: acc.winRate > 60 ? 'var(--accent-cyan)' : 'var(--text-primary)' }}>{acc.winRate}%</strong></span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* KPIs Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        <KpiCard
          title="Account Balance"
          value={`$${selectedAccount.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          subtext={`Initial: $${selectedAccount.initialBalance.toLocaleString('en-US')}`}
        />
        <KpiCard
          title="Current Equity"
          value={`$${selectedAccount.equity.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          subtext="Simulated live pricing"
        />
        <KpiCard
          title="Overall P/L"
          value={`${selectedAccount.balance >= selectedAccount.initialBalance ? '+' : ''}${(selectedAccount.balance - selectedAccount.initialBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          subtext={`${((selectedAccount.balance - selectedAccount.initialBalance) / selectedAccount.initialBalance * 100).toFixed(2)}% Return`}
          color={selectedAccount.balance >= selectedAccount.initialBalance ? 'var(--accent-cyan)' : '#ef4444'}
        />
        <KpiCard
          title="Win Rate"
          value={`${selectedAccount.winRate}%`}
          subtext={`Across ${selectedAccount.tradesCount} trades`}
        />
      </div>

      {/* Main Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>

        {/* Chart Panel */}
        <div style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(20px)',
          border: '1px solid var(--glass-border)',
          borderRadius: '24px',
          padding: '2rem',
          gridColumn: '1 / -1',
          minWidth: 0,
          overflow: 'hidden'
        }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Equity Curve</h3>
          <div style={{ height: '350px', width: '100%', minWidth: 0 }}>
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

        {/* Objectives Panel */}
        <div style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(20px)',
          border: '1px solid var(--glass-border)',
          borderRadius: '24px',
          padding: '2rem'
        }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Trading Objectives</h3>

          {/* Profit Target Objective */}
          {selectedAccount.profitTarget > 0 ? (
            <ProgressBar
              label="Profit Target"
              current={Math.max(0, selectedAccount.balance - selectedAccount.initialBalance)}
              max={selectedAccount.profitTarget}
            />
          ) : (
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Profit Target (Funded Live)</span>
                <span style={{ color: 'var(--accent-cyan)', fontWeight: 600, fontSize: '0.9rem' }}>No Target / Live Profit-Split</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'rgba(6, 182, 212, 0.1)', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(6,182,212,0.2)' }}>
                <div style={{ width: '100%', height: '100%', background: 'var(--accent-cyan)', boxShadow: '0 0 10px var(--accent-glow)' }} />
              </div>
            </div>
          )}

          {/* Daily Loss limits */}
          <ProgressBar
            label="Daily Drawdown Limit"
            current={selectedAccount.dailyDrawdownCurrent}
            max={selectedAccount.dailyDrawdownLimit}
          />

          {/* Maximum Drawdown limits */}
          <ProgressBar
            label="Max Overall Drawdown Limit"
            current={selectedAccount.maxDrawdownCurrent}
            max={selectedAccount.maxDrawdownLimit}
          />

          {/* Minimum days limits */}
          {selectedAccount.tradingDaysRequired > 0 ? (
            <ProgressBar
              label="Minimum Trading Days"
              current={selectedAccount.tradingDaysCurrent}
              max={selectedAccount.tradingDaysRequired}
              isCurrency={false}
            />
          ) : (
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Trading Period Duration</span>
                <span style={{ color: 'var(--accent-cyan)', fontWeight: 600, fontSize: '0.9rem' }}>Unlimited / Consistent trading</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'rgba(6, 182, 212, 0.1)', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(6,182,212,0.2)' }}>
                <div style={{ width: '100%', height: '100%', background: 'var(--accent-cyan)' }} />
              </div>
            </div>
          )}

          <div style={{
            marginTop: '2rem',
            padding: '1rem',
            background: selectedAccount.status === 'Breached' ? 'rgba(239, 68, 68, 0.05)' : 'rgba(6, 182, 212, 0.05)',
            border: `1px solid ${selectedAccount.status === 'Breached' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(6, 182, 212, 0.2)'}`,
            borderRadius: '12px'
          }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              {selectedAccount.status === 'Breached' ? (
                <span style={{ color: '#ef4444' }}>
                  🔴 Account closed due to daily drawdown breach. You can request a reset or purchase a new challenge in the Accounts panel.
                </span>
              ) : selectedAccount.status === 'Funded' ? (
                <span>
                  🟢 You are active on a <strong>Funded Quantum Live</strong> account. Maintain steady risk management. Profit splits are available every 14 days!
                </span>
              ) : selectedAccount.balance >= selectedAccount.initialBalance + selectedAccount.profitTarget && selectedAccount.tradingDaysCurrent >= selectedAccount.tradingDaysRequired ? (
                <span>
                  ✨ <strong>Evaluation Completed!</strong> You have successfully hit all profit targets and risk thresholds. Click <strong>Trading Accounts</strong> to request phase upgrade!
                </span>
              ) : (
                <span>
                  ⚡ You are currently <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>passing</span> all trading objectives. Maintain your risk management and reach the profit target to advance!
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Simulate Trade Panel (demo trading — real backend win/loss simulation) */}
        {selectedAccount.status !== 'Breached' && (
          <div style={{
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--glass-border)',
            borderRadius: '24px',
            padding: '2rem'
          }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Simulate Trade</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.2rem' }}>
              Execute a simulated demo trade against this account to test drawdown limits and phase progression.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => handleSimulateTrade(selectedAccount.id, 'win')}
                disabled={isSimulating}
                className="neon-button"
                style={{ flex: 1, padding: '0.8rem', fontWeight: 600, opacity: isSimulating ? 0.6 : 1, cursor: isSimulating ? 'not-allowed' : 'pointer' }}
              >
                Simulate Win
              </button>
              <button
                onClick={() => handleSimulateTrade(selectedAccount.id, 'loss')}
                disabled={isSimulating}
                style={{
                  flex: 1,
                  padding: '0.8rem',
                  fontWeight: 600,
                  borderRadius: '8px',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  background: 'rgba(239, 68, 68, 0.08)',
                  color: '#ef4444',
                  cursor: isSimulating ? 'not-allowed' : 'pointer',
                  opacity: isSimulating ? 0.6 : 1
                }}
              >
                Simulate Loss
              </button>
            </div>
            {simulateMessage && (
              <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{simulateMessage}</p>
            )}
          </div>
        )}

        {/* Account Details Panel */}
        <div style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(20px)',
          border: '1px solid var(--glass-border)',
          borderRadius: '24px',
          padding: '2rem'
        }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Account Details</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.8rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Login ID</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 500, fontFamily: 'monospace' }}>{selectedAccount.id}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.8rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Server</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{selectedAccount.server}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.8rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Leverage</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{selectedAccount.leverage}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.8rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Platform</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{selectedAccount.platform}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.8rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Created On</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{selectedAccount.createdDate}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Trading Period</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Indefinite / No Limit</span>
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
