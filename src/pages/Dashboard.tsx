import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart as RechartsBarChart, Bar, Cell } from 'recharts';
import { 
  LayoutDashboard, 
  WalletCards, 
  CreditCard, 
  UserCircle, 
  HelpCircle, 
  LogOut, 
  Menu, 
  X,
  Monitor,
  AlertCircle,
  Eye,
  EyeOff,
  PlusCircle,
  Download,
  Send,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  ShieldAlert,
  BarChart3,
  Award,
  ArrowUpRight,
  Percent
} from 'lucide-react';
import TradingTerminal from './TradingTerminal';
import { useTradingStore } from '../store/tradingStore';
import { usePlatformStore } from '../store/platformStore';
import type { SupportTicket, PayoutItem } from '../store/platformStore';



const KpiCard = ({ title, value, subtext, color = 'var(--text-primary)' }: { title: string, value: string, subtext: string, color?: string }) => (
  <div style={{
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid var(--glass-border)',
    borderRadius: '16px',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    boxShadow: 'inset 0 0 12px rgba(255,255,255,0.01)'
  }}>
    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</span>
    <span style={{ color, fontSize: '1.8rem', fontWeight: 700 }}>{value}</span>
    <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{subtext}</span>
  </div>
);

const ProgressBar = ({ label, current, max, isCurrency = true }: { label: string, current: number, max: number, isCurrency?: boolean }) => {
  const percentage = Math.max(0, Math.min((current / max) * 100, 100));
  const isDrawdown = current < 0;
  
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{label}</span>
        <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem' }}>
          {isCurrency ? `$${Math.abs(current).toLocaleString()}` : current} / {isCurrency ? `$${Math.abs(max).toLocaleString()}` : max}
        </span>
      </div>
      <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', overflow: 'hidden' }}>
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
          style={{ 
            height: '100%', 
            background: isDrawdown ? '#ef4444' : 'var(--accent-cyan)',
            boxShadow: `0 0 10px ${isDrawdown ? 'rgba(239, 68, 68, 0.5)' : 'var(--accent-glow)'}`
          }}
        />
      </div>
    </div>
  );
};

export default function Dashboard() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('Overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Dashboard Multi-Account State Management from Zustand Store
  const { 
    userAccounts, 
    addPayoutRequest, 
    recentPayouts, 
    submitKyc, 
    kycSubmissions, 
    getOrCreateAffiliate, 
    claimAffiliatePayout,
    tickets: storeTickets,
    addTicket,
    replyToTicket,
    updateUserAccount,
    syncWithBackend
  } = usePlatformStore();
  
  const accounts = userAccounts;
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');

  const selectedAccount = accounts.find(acc => acc.id === selectedAccountId) || accounts[0];

  // Load account data from database on mount
  useEffect(() => {
    if (user) {
      syncWithBackend();
    }
  }, [user]);

  // Set default selected account if empty
  useEffect(() => {
    if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  // Syncing selected account with the Trading Terminal Store
  useEffect(() => {
    if (selectedAccount) {
      useTradingStore.setState({
        balance: selectedAccount.balance,
        equity: selectedAccount.equity,
        freeMargin: selectedAccount.equity
      });
    }
  }, [selectedAccountId, selectedAccount]);

  // Sidebar Menu Items
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(localStorage.getItem('quantum_user_role') || '');
  const menuItems = [
    { name: 'Overview', icon: LayoutDashboard },
    { name: 'Trading Terminal', icon: Monitor },
    { name: 'Trading Accounts', icon: WalletCards },
    { name: 'Statistics', icon: BarChart3 },
    { name: 'Certificates', icon: Award },
    { name: 'Payout Requests', icon: ArrowUpRight },
    { name: 'Affiliate Program', icon: Percent },
    { name: 'Billing', icon: CreditCard },
    { name: 'Profile', icon: UserCircle },
    { name: 'Support', icon: HelpCircle },
    ...(isAdmin ? [{ name: 'Admin Panel', icon: ShieldAlert }] : []),
  ];

  // Sub-view component states
  // 1. Trading Accounts view credentials toggle passwords
  const [showCredentials, setShowCredentials] = useState<Record<string, boolean>>({});
  // 2. Risk loss alert inputs
  const [lossAlerts, setLossAlerts] = useState<Record<string, string>>({
    '84920183': '3.0',
    '19827402': '2.0',
    '57293810': '2.5'
  });
  const [notifState, setNotifState] = useState<string>('');

  // 3. Billing custom actions
  const [invoiceDownloading, setInvoiceDownloading] = useState<string | null>(null);

  // 4. Profile Forms state
  const [profileName, setProfileName] = useState(user?.fullName || 'Brijlal CR');
  const [profileEmail, setProfileEmail] = useState(user?.email || 'brijlalcr@yahoo.com');
  const [profilePhone, setProfilePhone] = useState('+91 98765 43210');
  const [profileCountry, setProfileCountry] = useState('India');
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);
  const [isTwoFactorActive, setIsTwoFactorActive] = useState(localStorage.getItem('quantum_2fa_active') === 'true');

  // 5. Support Form & Chat Simulator State
  const [faqActive, setFaqActive] = useState<number | null>(null);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketCategory, setTicketCategory] = useState('Technical');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketSuccess, setTicketSuccess] = useState(false);
  const tickets = storeTickets.filter(t => t.userId === user?.id);

  // 6. KYC Upload States
  const [kycDocType, setKycDocType] = useState<'Passport' | 'Driver License' | 'Aadhaar' | 'PAN'>('Passport');
  const [kycDocNum, setKycDocNum] = useState('');
  const [kycSuccessMsg, setKycSuccessMsg] = useState('');
  const activeKyc = kycSubmissions.find(k => k.userId === user?.id);

  // 7. Payout Request States
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('USDT (TRC20)');
  const [payoutAddress, setPayoutAddress] = useState('');
  const [payoutSuccessMsg, setPayoutSuccessMsg] = useState('');

  // 8. Affiliate States
  const [copiedReferral, setCopiedReferral] = useState(false);
  const [affiliateSuccessMsg, setAffiliateSuccessMsg] = useState('');

  const handlePayoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(payoutAmount);
    const profit = selectedAccount.balance - selectedAccount.initialBalance;
    
    if (selectedAccount.status !== 'Funded') {
      alert('Only Funded accounts are eligible for payouts.');
      return;
    }
    if (isNaN(amt) || amt < 100) {
      alert('Minimum payout amount is $100.');
      return;
    }
    if (amt > profit) {
      alert(`Maximum payout amount is the total profit of $${profit.toLocaleString()}.`);
      return;
    }
    if (!payoutAddress) {
      alert('Please enter your destination address or bank details.');
      return;
    }

    const payoutId = 'PAY-' + Math.floor(1000 + Math.random() * 9000);
    const newPayout: PayoutItem = {
      id: payoutId,
      name: profileName,
      amount: amt,
      method: payoutMethod,
      time: 'Just now',
      status: 'Pending',
      country: profileCountry === 'India' ? 'IN' : 'US'
    };

    addPayoutRequest(newPayout);
    
    const newBalance = selectedAccount.balance - amt;
    const newEquity = selectedAccount.equity - amt;
    updateUserAccount(selectedAccount.id, {
      balance: newBalance,
      equity: newEquity,
      equityHistory: [
        ...selectedAccount.equityHistory,
        { day: (selectedAccount.equityHistory.length + 1).toString(), equity: newEquity }
      ]
    });

    setPayoutAmount('');
    setPayoutAddress('');
    setPayoutSuccessMsg(`Payout request of $${amt.toLocaleString()} submitted successfully. Under review by Billing Department.`);
    setTimeout(() => setPayoutSuccessMsg(''), 4000);
  };

  if (loading) {
    return (
      <div className="scroll-section" style={{ minHeight: '100vh', justifyContent: 'center', flexDirection: 'column', gap: '1.2rem' }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(6, 182, 212, 0.15)',
          borderTopColor: 'var(--accent-cyan)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          boxShadow: '0 0 15px rgba(6, 182, 212, 0.2)'
        }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', letterSpacing: '0.05em' }}>Establishing secure connection...</p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Handle invoice simulation download
  const handleDownloadInvoice = (id: string) => {
    setInvoiceDownloading(id);
    setTimeout(() => {
      setInvoiceDownloading(null);
      alert(`Successfully downloaded invoice #${id}.pdf`);
    }, 1500);
  };

  // Handle support ticket submit & mock reply simulation
  const handleSupportTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject || !ticketMessage) return;

    const ticketId = 'TKT-' + Math.floor(1000 + Math.random() * 9000);
    const newTicket: SupportTicket = {
      id: ticketId,
      userId: user?.id || 'offline-mock-user',
      subject: ticketSubject,
      category: ticketCategory,
      status: 'Open',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      messages: [{ sender: 'User', text: ticketMessage, time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) }]
    };

    addTicket(newTicket);
    setTicketSubject('');
    setTicketMessage('');
    setTicketSuccess(true);
    setTimeout(() => setTicketSuccess(false), 3000);

    // Dynamic mock support reply after 2.5 seconds!
    setTimeout(() => {
      replyToTicket(ticketId, 'Quantum Bot', `Hello ${profileName}, thank you for reaching out regarding your ${ticketCategory} request. A ticket coordinator is reviewing your details under ID ${ticketId}. Our average response time is currently 15 minutes.`);
    }, 2500);
  };

  const renderView = () => {
    const noAccountPlaceholder = (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem', color: 'var(--text-secondary)' }}>
        <p style={{ fontSize: '1.2rem' }}>No trading accounts found.</p>
        <p style={{ fontSize: '0.95rem' }}>Purchase a challenge to get started.</p>
      </div>
    );
    switch (activeView) {
      case 'Overview':
        if (!selectedAccount) return noAccountPlaceholder;
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

      case 'Trading Terminal':
        if (!selectedAccount) return noAccountPlaceholder;
        return (
          <motion.div
            key="terminal"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            style={{ width: '100%', height: 'calc(100vh - 120px)', minHeight: '600px' }}
          >
            {/* Terminal Top Info Banner */}
            <div style={{
              background: 'rgba(6, 182, 212, 0.05)',
              border: '1px solid rgba(6, 182, 212, 0.2)',
              borderRadius: '12px',
              padding: '0.8rem 1.2rem',
              marginBottom: '1.2rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <Monitor size={18} style={{ color: 'var(--accent-cyan)' }} />
                <span style={{ color: 'var(--text-primary)', fontSize: '0.95rem', fontWeight: 600 }}>
                  Active MT5 Account Simulator: <span style={{ color: 'var(--accent-cyan)', fontFamily: 'monospace' }}>#{selectedAccountId}</span> ({selectedAccount.name})
                </span>
              </div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Your terminal balance and margin update in real time with your selected account.
              </span>
            </div>
            
            <TradingTerminal />
          </motion.div>
        );

      case 'Trading Accounts':
        return (
          <motion.div
            key="accounts"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Trading Accounts</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Monitor credentials, leverage, and configure alert settings</p>
              </div>
              <button 
                onClick={() => navigate('/checkout')}
                className="neon-button"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 1.5rem', fontSize: '0.95rem', fontWeight: 600 }}
              >
                <PlusCircle size={18} />
                Get New Challenge
              </button>
            </div>

            {/* Live notification when configuring limit */}
            {notifState && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{ background: 'rgba(6, 182, 212, 0.1)', border: '1px solid var(--accent-cyan)', color: 'var(--accent-cyan)', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}
              >
                {notifState}
              </motion.div>
            )}

            {/* Grid of Accounts */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
              {accounts.map((acc) => {
                const showPass = showCredentials[acc.id] || false;
                const alertVal = lossAlerts[acc.id] || '2.0';
                
                return (
                  <div 
                    key={acc.id}
                    style={{
                      background: 'var(--glass-bg)',
                      backdropFilter: 'blur(20px)',
                      border: acc.id === selectedAccountId ? '2px solid var(--accent-cyan)' : '1px solid var(--glass-border)',
                      borderRadius: '24px',
                      padding: '2rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1.5rem',
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{acc.name}</h3>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ID: {acc.id}</span>
                      </div>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '0.25rem 0.6rem',
                        borderRadius: '999px',
                        background: `rgba(${acc.status === 'Funded' ? '6,182,212' : acc.status === 'Phase 2' ? '168,85,247' : acc.status === 'Phase 1' ? '59,130,246' : '239,68,68'}, 0.15)`,
                        color: acc.status === 'Funded' ? 'var(--accent-cyan)' : acc.status === 'Phase 2' ? '#a855f7' : acc.status === 'Phase 1' ? '#3b82f6' : '#ef4444',
                        border: `1px solid rgba(${acc.status === 'Funded' ? '6,182,212' : acc.status === 'Phase 2' ? '168,85,247' : acc.status === 'Phase 1' ? '59,130,246' : '239,68,68'}, 0.3)`
                      }}>
                        {acc.status}
                      </span>
                    </div>

                    {/* MT5 credentials */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <h4 style={{ fontSize: '0.9rem', color: 'var(--text-primary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>MT5 Credentials</h4>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Server:</span>
                        <span style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>{acc.server}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Login:</span>
                        <span style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>{acc.id}</span>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Password:</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                            {showPass ? `quantum_trd_${acc.id}` : '••••••••••••'}
                          </span>
                          <button 
                            type="button"
                            onClick={() => setShowCredentials({ ...showCredentials, [acc.id]: !showPass })}
                            style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', display: 'flex' }}
                          >
                            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Loss settings & actions */}
                    {acc.status !== 'Breached' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        <h4 style={{ fontSize: '0.9rem', color: 'var(--text-primary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Custom Risk Alerts</h4>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <input 
                            type="number"
                            step="0.1"
                            min="0.5"
                            max="8"
                            value={alertVal}
                            onChange={(e) => setLossAlerts({ ...lossAlerts, [acc.id]: e.target.value })}
                            style={{
                              width: '80px',
                              padding: '0.4rem 0.6rem',
                              background: 'rgba(255,255,255,0.05)',
                              border: '1px solid var(--glass-border)',
                              borderRadius: '6px',
                              color: 'var(--text-primary)',
                              textAlign: 'center',
                              outline: 'none'
                            }}
                          />
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>% Daily loss email warning limit</span>
                        </div>
                        <button 
                          onClick={() => {
                            setNotifState(`Successfully updated account #${acc.id} daily loss alert to ${alertVal}%!`);
                            setTimeout(() => setNotifState(''), 3000);
                          }}
                          className="neon-button" 
                          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', alignSelf: 'flex-start', marginTop: '0.5rem' }}
                        >
                          Save Limit
                        </button>
                      </div>
                    )}

                    {acc.status === 'Breached' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', textAlign: 'center', padding: '1rem', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: '12px' }}>
                        <AlertCircle size={20} style={{ color: '#ef4444', alignSelf: 'center' }} />
                        <span style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: 600 }}>Account Access Suspended</span>
                        <button 
                          onClick={() => {
                            alert(`Purchase request generated for Reset Challenge. You are redirected to Checkout.`);
                            navigate('/checkout');
                          }}
                          className="neon-button"
                          style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem', background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444' }}
                          onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 0 10px rgba(239,68,68,0.3)'}
                          onMouseOut={(e) => e.currentTarget.style.boxShadow = 'none'}
                        >
                          Reset Account ($299.00)
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </motion.div>
        );

      case 'Billing':
        return (
          <motion.div
            key="billing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
          >
            <div>
              <h1 style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Billing & Invoices</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Manage payment profiles, subscriptions, and download statements</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
              {/* Premium Credit Card Display */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '24px',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: '220px',
                boxShadow: '0 10px 30px rgba(6, 182, 212, 0.15), inset 0 0 20px rgba(255,255,255,0.05)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-20%',
                  right: '-10%',
                  width: '200px',
                  height: '200px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(6, 182, 212, 0.2) 0%, transparent 70%)',
                  pointerEvents: 'none'
                }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payment Method</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.2rem' }}>Quantum Pro Card</span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'rgba(255,255,255,0.8)', fontStyle: 'italic' }}>VISA</div>
                </div>

                <div style={{ fontSize: '1.4rem', fontFamily: 'monospace', color: 'var(--text-primary)', letterSpacing: '0.15em', wordSpacing: '0.2em', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                  ••••  ••••  ••••  4242
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Cardholder</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{profileName}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Expires</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>12 / 29</span>
                  </div>
                </div>
              </div>

              {/* Quick Billing details */}
              <div style={{
                background: 'var(--glass-bg)',
                backdropFilter: 'blur(20px)',
                border: '1px solid var(--glass-border)',
                borderRadius: '24px',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.2rem',
                justifyContent: 'center'
              }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Active Plan</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0, lineHeight: 1.5 }}>
                  You are registered on the premium **Quantum Funded Partner** track. Resets are priced at a discounted flat rate of `$299` with **80/20 profit splits** default.
                </p>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <span style={{ background: 'rgba(6, 182, 212, 0.1)', color: 'var(--accent-cyan)', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600 }}>
                    80% profit Split
                  </span>
                  <span style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600 }}>
                    Visa Auto-pay
                  </span>
                </div>
              </div>
            </div>

            {/* Invoices Table */}
            <div style={{
              background: 'var(--glass-bg)',
              backdropFilter: 'blur(20px)',
              border: '1px solid var(--glass-border)',
              borderRadius: '24px',
              padding: '2rem',
              overflowX: 'auto'
            }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Transaction History</h3>
              
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '500px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    <th style={{ padding: '1rem 0' }}>Transaction ID</th>
                    <th style={{ padding: '1rem 0' }}>Date</th>
                    <th style={{ padding: '1rem 0' }}>Description</th>
                    <th style={{ padding: '1rem 0' }}>Amount</th>
                    <th style={{ padding: '1rem 0' }}>Status</th>
                    <th style={{ padding: '1rem 0', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody style={{ fontSize: '0.95rem' }}>
                  {[
                    { id: 'INV-48201', date: 'May 12, 2026', desc: '$100k Evaluation Challenge - Phase 1', amt: '$499.00', status: 'Paid' },
                    { id: 'INV-48092', date: 'May 01, 2026', desc: '$50k Evaluation Challenge - Phase 2', amt: '$299.00', status: 'Paid' },
                    { id: 'INV-39281', date: 'Apr 01, 2026', desc: '$200k Evaluation Challenge - Funded Live', amt: '$949.00', status: 'Paid' },
                    { id: 'INV-31089', date: 'Jan 10, 2026', desc: '$100k Evaluation Challenge - Closed', amt: '$499.00', status: 'Paid' }
                  ].map((inv) => (
                    <tr key={inv.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'var(--text-primary)' }}>
                      <td style={{ padding: '1.2rem 0', fontFamily: 'monospace' }}>{inv.id}</td>
                      <td style={{ padding: '1.2rem 0' }}>{inv.date}</td>
                      <td style={{ padding: '1.2rem 0', fontWeight: 500 }}>{inv.desc}</td>
                      <td style={{ padding: '1.2rem 0', color: 'var(--accent-cyan)', fontWeight: 600 }}>{inv.amt}</td>
                      <td style={{ padding: '1.2rem 0' }}>
                        <span style={{ background: 'rgba(38,166,154,0.1)', color: '#26a69a', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                          {inv.status}
                        </span>
                      </td>
                      <td style={{ padding: '1.2rem 0', textAlign: 'right' }}>
                        <button
                          disabled={invoiceDownloading === inv.id}
                          onClick={() => handleDownloadInvoice(inv.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--accent-cyan)',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            fontSize: '0.85rem',
                            opacity: invoiceDownloading === inv.id ? 0.6 : 1
                          }}
                        >
                          <Download size={14} />
                          {invoiceDownloading === inv.id ? 'Saving...' : 'Invoice'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        );

      case 'Profile':
        return (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
          >
            <div>
              <h1 style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Profile Settings</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Manage personal credentials, security keys, and KYC verification</p>
            </div>

            {profileSaveSuccess && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ background: 'rgba(38, 166, 154, 0.1)', border: '1px solid #26a69a', color: '#26a69a', padding: '1rem', borderRadius: '12px', textAlign: 'center', fontWeight: 600 }}
              >
                ✓ Profile changes successfully saved to your cloud session!
              </motion.div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
              {/* Account Form panel */}
              <div style={{
                background: 'var(--glass-bg)',
                backdropFilter: 'blur(20px)',
                border: '1px solid var(--glass-border)',
                borderRadius: '24px',
                padding: '2rem'
              }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Personal Info</h3>
                
                <form onSubmit={(e) => {
                  e.preventDefault();
                  setProfileSaveSuccess(true);
                  setTimeout(() => setProfileSaveSuccess(false), 3000);
                }} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Full Name</label>
                    <input 
                      type="text" 
                      value={profileName} 
                      onChange={(e) => setProfileName(e.target.value)}
                      style={profileInputStyle} 
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Email Address</label>
                    <input 
                      type="email" 
                      value={profileEmail} 
                      onChange={(e) => setProfileEmail(e.target.value)}
                      style={profileInputStyle} 
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Phone Number</label>
                    <input 
                      type="text" 
                      value={profilePhone} 
                      onChange={(e) => setProfilePhone(e.target.value)}
                      style={profileInputStyle} 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Country</label>
                    <input 
                      type="text" 
                      value={profileCountry} 
                      onChange={(e) => setProfileCountry(e.target.value)}
                      style={profileInputStyle} 
                    />
                  </div>

                  <button type="submit" className="neon-button" style={{ padding: '0.8rem 1.5rem', fontSize: '0.95rem', fontWeight: 600, marginTop: '0.5rem', alignSelf: 'flex-start' }}>
                    Save Profile Details
                  </button>
                </form>
              </div>

              {/* KYC Verification & Security Panels */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* KYC Panel */}
                <div style={{
                  background: 'var(--glass-bg)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '24px',
                  padding: '2rem'
                }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem' }}>Verification State</h3>
                  
                  {activeKyc?.status === 'Approved' ? (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(38,166,154,0.05)', border: '1px solid rgba(38,166,154,0.2)', padding: '1rem', borderRadius: '12px', marginBottom: '1rem' }}>
                        <ShieldCheck size={28} style={{ color: '#26a69a' }} />
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ color: '#26a69a', fontWeight: 700, fontSize: '0.95rem' }}>KYC Verified (Level 2)</span>
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Limits fully unlocked for withdrawals</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <span>• ID Verification: <strong>Approved</strong></span>
                        <span>• Type: <strong>{activeKyc.documentType}</strong></span>
                        <span>• Serial: <strong>{activeKyc.documentNumber}</strong></span>
                        <span>• Verified Date: <strong>{activeKyc.submittedAt}</strong></span>
                      </div>
                    </>
                  ) : activeKyc?.status === 'Pending' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)', padding: '1.5rem', borderRadius: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <AlertCircle size={28} style={{ color: '#f59e0b' }} />
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: '0.95rem' }}>Review in Progress</span>
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Identity documents are being audited</span>
                        </div>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        We are verifying your **{activeKyc.documentType}** (#{activeKyc.documentNumber}). Audits generally resolve in under 12-24 hours.
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {activeKyc?.status === 'Rejected' && (
                        <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', padding: '1rem', borderRadius: '12px', fontSize: '0.85rem', lineHeight: 1.4 }}>
                          🔴 KYC Rejected: <strong>{activeKyc.feedback || 'Document resolution is too low.'}</strong>. Please upload again.
                        </div>
                      )}
                      
                      {kycSuccessMsg && (
                        <div style={{ background: 'rgba(6, 182, 212, 0.1)', border: '1px solid var(--accent-cyan)', color: 'var(--accent-cyan)', padding: '1rem', borderRadius: '12px', fontSize: '0.85rem', textAlign: 'center' }}>
                          {kycSuccessMsg}
                        </div>
                      )}

                      <form onSubmit={(e) => {
                        e.preventDefault();
                        if (!kycDocNum) return;
                        submitKyc({
                          userId: user?.id || 'offline-mock-user',
                          userName: profileName,
                          userEmail: profileEmail,
                          documentType: kycDocType,
                          documentNumber: kycDocNum,
                          status: 'Pending',
                          submittedAt: new Date().toLocaleDateString('en-US')
                        });
                        setKycSuccessMsg('Documents submitted. Under review by Risk Desk.');
                        setTimeout(() => setKycSuccessMsg(''), 4000);
                      }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                          <label style={{ display: 'block', marginBottom: '0.3rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Select ID Document Type</label>
                          <select 
                            value={kycDocType} 
                            onChange={(e) => setKycDocType(e.target.value as any)} 
                            style={{
                              width: '100%',
                              padding: '0.6rem 0.8rem',
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid var(--glass-border)',
                              borderRadius: '8px',
                              color: 'var(--text-primary)',
                              fontSize: '0.9rem',
                              outline: 'none',
                              cursor: 'pointer'
                            }}
                          >
                            <option value="Passport">Passport</option>
                            <option value="Driver License">Driver License</option>
                            <option value="Aadhaar">Aadhaar Card</option>
                            <option value="PAN">PAN Card</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '0.3rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Document Serial Number</label>
                          <input 
                            type="text" 
                            placeholder="e.g. J190284X" 
                            value={kycDocNum} 
                            onChange={(e) => setKycDocNum(e.target.value)}
                            style={profileInputStyle} 
                            required 
                          />
                        </div>
                        <button type="submit" className="neon-button" style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem' }}>
                          Submit KYC Documents
                        </button>
                      </form>
                    </div>
                  )}
                </div>

                {/* 2FA Panel */}
                <div style={{
                  background: 'var(--glass-bg)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '24px',
                  padding: '2rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem'
                }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)' }}>Security Configuration</h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>Two-Factor Security (2FA)</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>Authenticate logins via Google Authenticator</span>
                    </div>
                    {/* Glowing toggle button */}
                    <button 
                      onClick={() => {
                        const next = !isTwoFactorActive;
                        setIsTwoFactorActive(next);
                        localStorage.setItem('quantum_2fa_active', next ? 'true' : 'false');
                      }}
                      style={{
                        width: '50px',
                        height: '26px',
                        borderRadius: '999px',
                        background: isTwoFactorActive ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.1)',
                        border: 'none',
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'background-color 0.3s',
                        boxShadow: isTwoFactorActive ? '0 0 10px var(--accent-glow)' : 'none'
                      }}
                    >
                      <motion.div 
                        animate={{ x: isTwoFactorActive ? 24 : 2 }}
                        style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          background: '#fff',
                          position: 'absolute',
                          top: '2px',
                          left: 0
                        }}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 'Support':
        return (
          <motion.div
            key="support"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
          >
            <div>
              <h1 style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Support Desk</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Browse FAQs, look up solutions, or log live helpdesk tickets</p>
            </div>

            {ticketSuccess && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ background: 'rgba(6, 182, 212, 0.1)', border: '1px solid var(--accent-cyan)', color: 'var(--accent-cyan)', padding: '1rem', borderRadius: '12px', textAlign: 'center', fontWeight: 600 }}
              >
                ✓ Ticket submitted successfully! A virtual support specialist is reviewing your request.
              </motion.div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
              
              {/* FAQ Accordion Panel */}
              <div style={{
                background: 'var(--glass-bg)',
                backdropFilter: 'blur(20px)',
                border: '1px solid var(--glass-border)',
                borderRadius: '24px',
                padding: '2rem'
              }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Frequently Asked Questions</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {[
                    { q: 'How is maximum drawdown calculated?', a: 'Maximum drawdown is calculated based on the maximum equity balance achieved. If your equity falls below the initial balance minus the limit (e.g. -$10,000 on a $100k account), the account is breached.' },
                    { q: 'What is the daily loss threshold reset time?', a: 'Daily loss resets daily at 00:00 UTC (Server Time). The daily loss limit is calculated as 5% of the starting equity balance of the respective day.' },
                    { q: 'How fast do profit withdrawals process?', a: 'Withdrawals are processed instantly in USDC/USDT or within 24-48 business hours via bank wire, directly through the billing dashboard.' },
                    { q: 'Can I trade crypto over the weekends?', a: 'Yes, crypto assets (like BTCUSDT, ETHUSDT) are fully available for simulated live execution 24/7. Forex assets trade standard hours.' }
                  ].map((faq, index) => {
                    const isOpen = faqActive === index;
                    return (
                      <div 
                        key={index} 
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.8rem' }}
                      >
                        <button
                          onClick={() => setFaqActive(isOpen ? null : index)}
                          style={{
                            width: '100%',
                            background: 'none',
                            border: 'none',
                            textAlign: 'left',
                            color: 'var(--text-primary)',
                            fontSize: '1rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0.4rem 0'
                          }}
                        >
                          <span>{faq.q}</span>
                          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              style={{ overflow: 'hidden' }}
                            >
                              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, marginTop: '0.5rem', paddingRight: '1rem' }}>
                                {faq.a}
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Submit Ticket and Log Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* Submit Ticket Form */}
                <div style={{
                  background: 'var(--glass-bg)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '24px',
                  padding: '2rem'
                }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Create Support Ticket</h3>
                  <form onSubmit={handleSupportTicketSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={supportLabelStyle}>Category</label>
                        <select 
                          value={ticketCategory} 
                          onChange={(e) => setTicketCategory(e.target.value)}
                          style={supportSelectStyle}
                        >
                          <option value="Technical">Technical</option>
                          <option value="Billing">Billing</option>
                          <option value="Risk & Drawdown">Risk & Drawdown</option>
                          <option value="Partner Program">Partner Program</option>
                        </select>
                      </div>
                      <div>
                        <label style={supportLabelStyle}>Subject</label>
                        <input 
                          type="text" 
                          placeholder="e.g. MT5 reset request" 
                          value={ticketSubject}
                          onChange={(e) => setTicketSubject(e.target.value)}
                          style={profileInputStyle}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label style={supportLabelStyle}>Message details</label>
                      <textarea 
                        rows={4} 
                        placeholder="Provide details about your query here..." 
                        value={ticketMessage}
                        onChange={(e) => setTicketMessage(e.target.value)}
                        style={supportTextareaStyle}
                        required
                      />
                    </div>
                    <button type="submit" className="neon-button" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 1.5rem', fontSize: '0.95rem', alignSelf: 'flex-start' }}>
                      <Send size={16} />
                      Log Ticket
                    </button>
                  </form>
                </div>

                {/* Ticket Logs List */}
                <div style={{
                  background: 'var(--glass-bg)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '24px',
                  padding: '2rem'
                }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.2rem' }}>Active Support Tickets</h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {tickets.map((t) => (
                      <div 
                        key={t.id}
                        style={{
                          background: 'rgba(255,255,255,0.01)',
                          border: '1px solid var(--glass-border)',
                          borderRadius: '12px',
                          padding: '1rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.5rem'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{t.id}</span>
                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            background: t.status === 'Closed' ? 'rgba(255,255,255,0.05)' : t.status === 'Open' ? 'rgba(6,182,212,0.1)' : 'rgba(168,85,247,0.1)',
                            color: t.status === 'Closed' ? 'var(--text-secondary)' : t.status === 'Open' ? 'var(--accent-cyan)' : '#a855f7'
                          }}>
                            {t.status}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>{t.subject}</span>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                          <span>Cat: <strong>{t.category}</strong></span>
                          <span>Replies: <strong>{Math.max(0, t.messages.length - 1)}</strong></span>
                        </div>
                        
                        {/* Render active dialogue if ticket has messages */}
                        {t.messages && t.messages.length > 0 && (
                          <div style={{ marginTop: '0.8rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            {t.messages.map((m: any, idx: number) => (
                              <div key={idx} style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', background: m.sender === 'User' ? 'rgba(255,255,255,0.02)' : 'rgba(6,182,212,0.05)', padding: '0.6rem', borderRadius: '8px' }}>
                                <span style={{ fontWeight: 600, color: m.sender === 'User' ? 'var(--text-primary)' : 'var(--accent-cyan)', fontSize: '0.8rem' }}>
                                  {m.sender} ({m.time})
                                </span>
                                <span style={{ marginTop: '0.2rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{m.text}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 'Statistics': {
        if (!selectedAccount) return noAccountPlaceholder;
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

      case 'Certificates': {
        if (!selectedAccount) return noAccountPlaceholder;
        const hasPassed = selectedAccount.status === 'Funded' ||
          (selectedAccount.profitTarget > 0 && selectedAccount.balance >= selectedAccount.initialBalance + selectedAccount.profitTarget);

        return (
          <motion.div
            key="certificates"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
          >
            <div>
              <h1 style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Official Certificates</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Download or print your proof of professional challenge completion</p>
            </div>

            {hasPassed ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
                <style>{`
                  @media print {
                    header, footer, nav, button, .dashboard-sidebar, .mobile-only, .dashboard-content > div > *:not(#certificate-print-area) {
                      display: none !important;
                    }
                    body, html {
                      background: #0d0d0d !important;
                      color: #fff !important;
                      margin: 0 !important;
                      padding: 0 !important;
                      height: 100% !important;
                      width: 100% !important;
                      -webkit-print-color-adjust: exact !important;
                      print-color-adjust: exact !important;
                    }
                    #certificate-print-area {
                      position: absolute;
                      left: 0;
                      top: 0;
                      right: 0;
                      bottom: 0;
                      width: 100% !important;
                      height: 100% !important;
                      margin: 0 !important;
                      padding: 4rem 2rem !important;
                      background: radial-gradient(circle, #121212 0%, #050505 100%) !important;
                      border: 10px double #d4af37 !important;
                      box-sizing: border-box !important;
                      display: flex !important;
                      flex-direction: column !important;
                      justify-content: center !important;
                      align-items: center !important;
                      text-align: center !important;
                      visibility: visible !important;
                    }
                    #certificate-print-area * {
                      visibility: visible !important;
                    }
                  }
                `}</style>

                {/* Printable Certificate Area */}
                <div 
                  id="certificate-print-area"
                  style={{
                    width: '100%',
                    maxWidth: '850px',
                    aspectRatio: '1.414',
                    background: 'radial-gradient(circle, rgba(20,20,20,0.95) 0%, rgba(5,5,5,0.98) 100%)',
                    border: '6px double #d4af37',
                    borderRadius: '24px',
                    padding: '3.5rem 3rem',
                    position: 'relative',
                    boxShadow: '0 20px 50px rgba(212, 175, 55, 0.1), inset 0 0 40px rgba(212, 175, 55, 0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    textAlign: 'center',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ position: 'absolute', top: '15px', left: '15px', width: '30px', height: '30px', borderTop: '2px solid #d4af37', borderLeft: '2px solid #d4af37' }} />
                  <div style={{ position: 'absolute', top: '15px', right: '15px', width: '30px', height: '30px', borderTop: '2px solid #d4af37', borderRight: '2px solid #d4af37' }} />
                  <div style={{ position: 'absolute', bottom: '15px', left: '15px', width: '30px', height: '30px', borderBottom: '2px solid #d4af37', borderLeft: '2px solid #d4af37' }} />
                  <div style={{ position: 'absolute', bottom: '15px', right: '15px', width: '30px', height: '30px', borderBottom: '2px solid #d4af37', borderRight: '2px solid #d4af37' }} />

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
                    <span style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '0.2em', color: '#d4af37', textTransform: 'uppercase' }}>APEX FUNDED</span>
                    <span style={{ fontSize: '0.7rem', letterSpacing: '0.4em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Institutional Trading Partner</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <span style={{ fontSize: '0.85rem', letterSpacing: '0.3em', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Certificate of Excellence</span>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 400, color: '#fff', fontFamily: 'serif', letterSpacing: '0.05em', margin: 0 }}>CERTIFICATE OF ACHIEVEMENT</h2>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>This document is proudly presented to</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', width: '85%' }}>
                    <h1 style={{ fontSize: '2.8rem', fontWeight: 700, color: '#d4af37', borderBottom: '2px solid rgba(212,175,55,0.3)', paddingBottom: '0.5rem', width: '100%', fontFamily: 'serif', margin: 0 }}>
                      {profileName}
                    </h1>
                    <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: '0.8rem' }}>
                      For successfully passing the <strong>{selectedAccount.name}</strong> and demonstrating institutional-grade consistency, professional risk management standards, and strict adherence to technical trading objectives.
                    </p>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%', marginTop: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'left' }}>
                      <span>Account Size: <strong style={{ color: '#fff' }}>${selectedAccount.initialBalance.toLocaleString()}</strong></span>
                      <span>Verification ID: <strong style={{ color: '#fff', fontFamily: 'monospace' }}>APX-{selectedAccount.id}</strong></span>
                      <span>Issued: <strong style={{ color: '#fff' }}>{selectedAccount.createdDate}</strong></span>
                    </div>

                    <div style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      background: 'radial-gradient(circle, #f39c12, #d4af37)',
                      boxShadow: '0 0 20px rgba(212, 175, 55, 0.4), inset 0 0 10px rgba(0,0,0,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      border: '2px dashed #fff'
                    }}>
                      <div style={{ color: '#000', fontSize: '0.7rem', fontWeight: 800, textAlign: 'center', lineHeight: 1.1, textTransform: 'uppercase' }}>
                        VERIFIED<br/>PARTNER
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', width: '150px' }}>
                      <span style={{ fontFamily: 'cursive', fontSize: '1.2rem', color: '#d4af37' }}>Sarah Jenkins</span>
                      <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.2)' }} />
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Chief Risk Officer</span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => window.print()}
                  className="neon-button" 
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 2rem', fontSize: '1rem', fontWeight: 600 }}
                >
                  <Download size={18} />
                  Print / Save Certificate
                </button>
              </div>
            ) : (
              <div style={{
                background: 'var(--glass-bg)',
                backdropFilter: 'blur(20px)',
                border: '1px solid var(--glass-border)',
                borderRadius: '24px',
                padding: '4rem 2rem',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1.5rem',
                maxWidth: '600px',
                margin: '2rem auto'
              }}>
                <div style={{
                  width: '70px',
                  height: '70px',
                  borderRadius: '50%',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ef4444',
                  boxShadow: '0 0 15px rgba(239, 68, 68, 0.1)'
                }}>
                  <Award size={36} />
                </div>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)' }}>Certificate Locked</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
                  To unlock the premium printable gold-bordered Certificate of Excellence, your trading account must be elevated to **Funded Live** status or satisfy your current evaluation phase goals.
                </p>
                <div style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '12px',
                  padding: '1.2rem',
                  width: '100%',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.8rem'
                }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Requirements for Account #{selectedAccountId}:</span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Status is 'Funded':</span>
                    <span style={{ color: '#ef4444', fontWeight: 600 }}>✖ Locked (Currently {selectedAccount.status})</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Profit Target Reached:</span>
                    <span style={{ color: selectedAccount.balance >= selectedAccount.initialBalance + selectedAccount.profitTarget ? 'var(--accent-cyan)' : '#ef4444', fontWeight: 600 }}>
                      {selectedAccount.balance >= selectedAccount.initialBalance + selectedAccount.profitTarget ? '✓ Achieved' : `✖ Pending ($${Math.max(0, (selectedAccount.initialBalance + selectedAccount.profitTarget - selectedAccount.balance)).toLocaleString()} left)`}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Trading Days Completed:</span>
                    <span style={{ color: selectedAccount.tradingDaysCurrent >= selectedAccount.tradingDaysRequired ? 'var(--accent-cyan)' : '#ef4444', fontWeight: 600 }}>
                      {selectedAccount.tradingDaysCurrent >= selectedAccount.tradingDaysRequired ? '✓ Complete' : `✖ ${selectedAccount.tradingDaysCurrent}/${selectedAccount.tradingDaysRequired} Days`}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', width: '100%', marginTop: '0.5rem' }}>
                  <button 
                    onClick={() => setActiveView('Trading Terminal')} 
                    className="neon-button" 
                    style={{ flex: 1, padding: '0.8rem' }}
                  >
                    Go to Terminal
                  </button>
                  <button 
                    onClick={() => navigate('/checkout')} 
                    className="neon-button" 
                    style={{ flex: 1, padding: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)' }}
                  >
                    Get New Challenge
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        );
      }

      case 'Payout Requests': {
        if (!selectedAccount) return noAccountPlaceholder;
        const isFunded = selectedAccount.status === 'Funded';
        const profit = selectedAccount.balance - selectedAccount.initialBalance;

        const userPayouts = recentPayouts.filter(p => 
          p.name.toLowerCase().includes(profileName.toLowerCase()) || 
          p.name.toLowerCase().includes(user?.id?.toLowerCase() || '') ||
          p.name.toLowerCase().includes('affiliate')
        );

        return (
          <motion.div
            key="payouts"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
          >
            <div>
              <h1 style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Payout Board</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Withdraw your simulated live trading profits directly to Crypto or Wire</p>
            </div>

            {payoutSuccessMsg && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ background: 'rgba(6, 182, 212, 0.1)', border: '1px solid var(--accent-cyan)', color: 'var(--accent-cyan)', padding: '1rem', borderRadius: '12px', textAlign: 'center', fontWeight: 600 }}
              >
                {payoutSuccessMsg}
              </motion.div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
              {/* Form Card */}
              <div style={{
                background: 'var(--glass-bg)',
                backdropFilter: 'blur(20px)',
                border: '1px solid var(--glass-border)',
                borderRadius: '24px',
                padding: '2rem'
              }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Request Payout</h3>

                {!isFunded ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '1.5rem', borderRadius: '12px', color: '#ef4444', fontSize: '0.9rem', lineHeight: 1.5 }}>
                    <AlertCircle size={24} style={{ color: '#ef4444' }} />
                    <span>Payouts are only available for Funded Live accounts. Evaluation accounts (Phase 1 & Phase 2) are not eligible for profit withdrawals.</span>
                  </div>
                ) : profit < 100 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)', padding: '1.5rem', borderRadius: '12px', color: '#f59e0b', fontSize: '0.9rem', lineHeight: 1.5 }}>
                    <AlertCircle size={24} style={{ color: '#f59e0b' }} />
                    <span>No profits available to withdraw. Your current balance is <strong>${selectedAccount.balance.toLocaleString()}</strong> (Initial: ${selectedAccount.initialBalance.toLocaleString()}). Reach a minimum of $100 profit to request withdrawal.</span>
                  </div>
                ) : (
                  <form onSubmit={handlePayoutSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(6,182,212,0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(6,182,212,0.15)' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Available Profits:</span>
                      <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>${profit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Withdrawal Amount ($)</label>
                      <input 
                        type="number" 
                        min="100"
                        max={profit}
                        step="0.01"
                        value={payoutAmount} 
                        onChange={(e) => setPayoutAmount(e.target.value)}
                        placeholder="e.g. 1500" 
                        style={profileInputStyle} 
                        required
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Withdrawal Method</label>
                      <select 
                        value={payoutMethod} 
                        onChange={(e) => setPayoutMethod(e.target.value)}
                        style={supportSelectStyle}
                      >
                        <option value="USDT (TRC20)">USDT (TRC20)</option>
                        <option value="USDC (ERC20)">USDC (ERC20)</option>
                        <option value="USDC (Polygon)">USDC (Polygon)</option>
                        <option value="Bank Wire">Bank Wire</option>
                        <option value="PayPal">PayPal</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Payout Destination Address / Details</label>
                      <input 
                        type="text" 
                        value={payoutAddress} 
                        onChange={(e) => setPayoutAddress(e.target.value)}
                        placeholder="TRX Wallet Address or Bank details" 
                        style={profileInputStyle} 
                        required
                      />
                    </div>

                    <button type="submit" className="neon-button" style={{ padding: '0.8rem 1.5rem', fontSize: '0.95rem', fontWeight: 600, marginTop: '0.5rem' }}>
                      Request Profit Payout
                    </button>
                  </form>
                )}
              </div>

              {/* History Card */}
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
                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Payout History</h3>

                {userPayouts.length === 0 ? (
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', textAlign: 'center', padding: '3rem 1rem' }}>
                    No payout logs found. Request a payout to log history.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '420px', overflowY: 'auto' }} className="custom-scrollbar">
                    {userPayouts.map((p) => (
                      <div 
                        key={p.id}
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
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                          <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            ${p.amount.toLocaleString()} ({p.method})
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            ID: {p.id} • {p.time}
                          </span>
                        </div>
                        <span style={{
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          padding: '0.25rem 0.6rem',
                          borderRadius: '4px',
                          background: 
                            p.status === 'Paid' ? 'rgba(38,166,154,0.1)' :
                            p.status === 'Approved' ? 'rgba(6,182,212,0.1)' :
                            p.status === 'Pending' ? 'rgba(245,158,11,0.1)' :
                            'rgba(239,68,68,0.1)',
                          color: 
                            p.status === 'Paid' ? '#26a69a' :
                            p.status === 'Approved' ? 'var(--accent-cyan)' :
                            p.status === 'Pending' ? '#f59e0b' :
                            '#ef4444'
                        }}>
                          {p.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        );
      }

      case 'Affiliate Program': {
        const affiliateInfo = getOrCreateAffiliate(user?.id || 'offline-mock-user', profileEmail);
        const refLink = `https://apexfunded.com/register?ref=${affiliateInfo.referralCode}`;

        const handleCopyRefLink = () => {
          navigator.clipboard.writeText(refLink);
          setCopiedReferral(true);
          setTimeout(() => setCopiedReferral(false), 2000);
        };

        const handleClaimAffEarnings = () => {
          if (affiliateInfo.pendingPayout <= 0) return;
          claimAffiliatePayout(user?.id || 'offline-mock-user');
          setAffiliateSuccessMsg(`Withdrawal of $${affiliateInfo.pendingPayout.toFixed(2)} generated as a Payout Request item!`);
          setTimeout(() => setAffiliateSuccessMsg(''), 4000);
        };

        return (
          <motion.div
            key="affiliate"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
          >
            <div>
              <h1 style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Affiliate System</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Earn commissions by referring other professional traders to Apex Funded</p>
            </div>

            {affiliateSuccessMsg && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ background: 'rgba(6, 182, 212, 0.1)', border: '1px solid var(--accent-cyan)', color: 'var(--accent-cyan)', padding: '1rem', borderRadius: '12px', textAlign: 'center', fontWeight: 600 }}
              >
                {affiliateSuccessMsg}
              </motion.div>
            )}

            {/* Affiliate Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem' }}>
              <KpiCard title="Total Earnings" value={`$${affiliateInfo.totalEarned.toFixed(2)}`} subtext="Lifetime commission" color="var(--accent-cyan)" />
              <KpiCard title="Pending Claim" value={`$${affiliateInfo.pendingPayout.toFixed(2)}`} subtext="Unclaimed balance" color="#a855f7" />
              <KpiCard title="Commission Rate" value={`${affiliateInfo.commissionPercent}%`} subtext="Base package payouts share" color="#3b82f6" />
              <KpiCard title="Total Referrals" value={affiliateInfo.referrals.length.toString()} subtext="Successful registrations" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
              {/* Referral Generator Card */}
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
                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Referral Link</h3>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Referral Code</label>
                  <input 
                    type="text" 
                    value={affiliateInfo.referralCode} 
                    disabled
                    style={{ ...profileInputStyle, marginTop: 0 }} 
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Unique Referral Link</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input 
                      type="text" 
                      value={refLink} 
                      disabled
                      style={{ ...profileInputStyle, flex: 1, marginTop: 0 }} 
                    />
                    <button 
                      onClick={handleCopyRefLink}
                      className="neon-button" 
                      style={{ padding: '0.6rem 1rem', fontSize: '0.85rem' }}
                    >
                      {copiedReferral ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem' }}>
                  <button 
                    onClick={handleClaimAffEarnings}
                    disabled={affiliateInfo.pendingPayout <= 0}
                    className="neon-button"
                    style={{
                      width: '100%',
                      padding: '0.8rem',
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      opacity: affiliateInfo.pendingPayout <= 0 ? 0.6 : 1,
                      cursor: affiliateInfo.pendingPayout <= 0 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Claim Affiliate Earnings
                  </button>
                </div>
              </div>

              {/* Referrals Table */}
              <div style={{
                background: 'var(--glass-bg)',
                backdropFilter: 'blur(20px)',
                border: '1px solid var(--glass-border)',
                borderRadius: '24px',
                padding: '2rem',
                overflowX: 'auto'
              }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Referral Activity</h3>
                
                {affiliateInfo.referrals.length === 0 ? (
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', textAlign: 'center', padding: '3.5rem 1rem' }}>
                    No referrals yet. Share your code to start earning commissions!
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        <th style={{ padding: '0.8rem 0' }}>Referral Name</th>
                        <th style={{ padding: '0.8rem 0' }}>Date</th>
                        <th style={{ padding: '0.8rem 0' }}>Status</th>
                        <th style={{ padding: '0.8rem 0', textAlign: 'right' }}>Commission</th>
                      </tr>
                    </thead>
                    <tbody style={{ fontSize: '0.9rem' }}>
                      {affiliateInfo.referrals.map((r, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'var(--text-primary)' }}>
                          <td style={{ padding: '1rem 0', fontWeight: 500 }}>{r.name}</td>
                          <td style={{ padding: '1rem 0' }}>{r.date}</td>
                          <td style={{ padding: '1rem 0' }}>
                            <span style={{ 
                              background: r.status === 'Purchased' ? 'rgba(6,182,212,0.1)' : 'rgba(255,255,255,0.05)', 
                              color: r.status === 'Purchased' ? 'var(--accent-cyan)' : 'var(--text-secondary)', 
                              padding: '0.15rem 0.4rem', 
                              borderRadius: '4px', 
                              fontSize: '0.75rem', 
                              fontWeight: 600 
                            }}>
                              {r.status}
                            </span>
                          </td>
                          <td style={{ padding: '1rem 0', textAlign: 'right', color: r.commission > 0 ? 'var(--accent-cyan)' : 'var(--text-secondary)', fontWeight: 600 }}>
                            ${r.commission.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </motion.div>
        );
      }

      default:
        return (
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{
              background: 'var(--glass-bg)',
              backdropFilter: 'blur(20px)',
              border: '1px solid var(--glass-border)',
              borderRadius: '24px',
              padding: '3rem',
              textAlign: 'center',
              minHeight: '60vh',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <h2 style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem' }}>{activeView}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>This section is currently under development.</p>
          </motion.div>
        );
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%', paddingTop: '80px', position: 'relative', zIndex: 10, pointerEvents: 'auto' }}>
      
      {/* Mobile Menu Toggle */}
      <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 50, display: 'block' }} className="mobile-only">
         <button 
           onClick={() => setIsSidebarOpen(!isSidebarOpen)}
           className="neon-button"
           style={{ padding: '1rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
         >
           {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
         </button>
      </div>

      {/* Sidebar */}
      <div 
        style={{
          width: '280px',
          background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(30px)',
          borderRight: '1px solid var(--glass-border)',
          height: 'calc(100vh - 80px)',
          position: 'fixed',
          left: 0,
          top: '80px',
          padding: '2rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          transition: 'transform 0.3s ease',
          transform: `translateX(${isSidebarOpen ? '0' : '0'})`,
          zIndex: 30
        }}
        className={`dashboard-sidebar ${isSidebarOpen ? 'open' : ''}`}
      >
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.name;
            return (
              <button
                key={item.name}
                onClick={() => { 
                  if (item.name === 'Admin Panel') {
                    navigate('/admin');
                  } else {
                    setActiveView(item.name); 
                  }
                  setIsSidebarOpen(false); 
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  width: '100%',
                  padding: '1rem 1.5rem',
                  background: isActive ? 'rgba(6, 182, 212, 0.1)' : 'transparent',
                  border: isActive ? '1px solid rgba(6, 182, 212, 0.2)' : '1px solid transparent',
                  borderRadius: '12px',
                  color: isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontSize: '1rem',
                  fontWeight: isActive ? 600 : 500,
                  textAlign: 'left'
                }}
                onMouseOver={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }
                }}
              >
                <Icon size={20} />
                {item.name}
              </button>
            )
          })}
        </div>
        
        {/* Sign Out Button */}
        <button
          onClick={() => { signOut(); navigate('/'); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            width: '100%',
            padding: '1rem 1.5rem',
            background: 'transparent',
            border: '1px solid transparent',
            color: '#ef4444',
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontSize: '1rem',
            fontWeight: 500,
            textAlign: 'left'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <LogOut size={20} />
          Sign Out
        </button>
      </div>

      {/* Main Content Area */}
      <div 
        style={{ 
          flex: 1, 
          marginLeft: '280px',
          padding: '2rem 3rem',
          width: 'calc(100% - 280px)',
          overflowY: 'auto',
          overflowX: 'hidden'
        }}
        className="dashboard-content"
      >
        <AnimatePresence mode="wait">
          {renderView()}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Styling elements
const profileInputStyle = {
  width: '100%',
  padding: '0.8rem 1rem',
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid var(--glass-border)',
  borderRadius: '8px',
  color: 'var(--text-primary)',
  fontSize: '0.95rem',
  outline: 'none',
  marginTop: '0.2rem'
};

const supportSelectStyle = {
  width: '100%',
  padding: '0.8rem 1rem',
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid var(--glass-border)',
  borderRadius: '8px',
  color: 'var(--text-primary)',
  fontSize: '0.95rem',
  outline: 'none',
  marginTop: '0.2rem',
  cursor: 'pointer'
};

const supportTextareaStyle = {
  width: '100%',
  padding: '0.8rem 1rem',
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid var(--glass-border)',
  borderRadius: '8px',
  color: 'var(--text-primary)',
  fontSize: '0.95rem',
  outline: 'none',
  marginTop: '0.2rem',
  fontFamily: 'inherit',
  resize: 'vertical' as const
};

const supportLabelStyle = {
  display: 'block',
  color: 'var(--text-secondary)',
  fontSize: '0.85rem'
};
