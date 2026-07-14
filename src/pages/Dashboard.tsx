import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
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
  ShieldAlert,
  BarChart3,
  Award,
  ArrowUpRight,
  Percent
} from 'lucide-react';
import { useTradingStore } from '../store/tradingStore';
import { usePlatformStore } from '../store/platformStore';
import OverviewTab from './dashboard-tabs/OverviewTab';
import TerminalTab from './dashboard-tabs/TerminalTab';
import AccountsTab from './dashboard-tabs/AccountsTab';
import BillingTab from './dashboard-tabs/BillingTab';
import ProfileTab from './dashboard-tabs/ProfileTab';
import SupportTab from './dashboard-tabs/SupportTab';
import StatisticsTab from './dashboard-tabs/StatisticsTab';
import CertificatesTab from './dashboard-tabs/CertificatesTab';
import PayoutsTab from './dashboard-tabs/PayoutsTab';
import AffiliateTab from './dashboard-tabs/AffiliateTab';

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
    affiliates,
    getOrCreateAffiliate,
    claimAffiliatePayout,
    tickets: storeTickets,
    addTicket,
    simulateTrade,
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

  // Fetch/create the affiliate profile on mount — getOrCreateAffiliate is async, so it can't be
  // called synchronously inside the render-time view switch (it previously was, which meant
  // affiliateInfo was actually a Promise object, not the resolved data).
  useEffect(() => {
    if (user) {
      getOrCreateAffiliate(user.id, user.email);
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
  const isAdmin = ['Super Admin', 'Admin', 'Support Agent', 'Finance Manager', 'Affiliate Manager'].includes(localStorage.getItem('quantum_user_role') || '');
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

  // 9. Simulate Trade (demo trading) states
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulateMessage, setSimulateMessage] = useState('');

  const handleSimulateTrade = async (accountId: string, result: 'win' | 'loss') => {
    setIsSimulating(true);
    setSimulateMessage('');
    try {
      await simulateTrade(accountId, result);
      setSimulateMessage(result === 'win' ? 'Trade executed: simulated profit applied.' : 'Trade executed: simulated loss applied.');
    } catch {
      setSimulateMessage('Trade simulation failed. Please try again.');
    } finally {
      setIsSimulating(false);
    }
  };

  const handlePayoutSubmit = async (e: React.FormEvent) => {
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

    try {
      await addPayoutRequest(selectedAccount.id, amt, payoutMethod, profileCountry === 'India' ? 'IN' : 'US');
      setPayoutAmount('');
      setPayoutAddress('');
      setPayoutSuccessMsg(`Payout request of $${amt.toLocaleString()} submitted successfully. Under review by Billing Department.`);
      setTimeout(() => setPayoutSuccessMsg(''), 4000);
    } catch (err: any) {
      alert(err?.message || 'Payout request failed. Please try again.');
    }
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

  // Handle support ticket submit
  const handleSupportTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject || !ticketMessage) return;

    try {
      await addTicket(ticketSubject, ticketCategory, ticketMessage);
      setTicketSubject('');
      setTicketMessage('');
      setTicketSuccess(true);
      setTimeout(() => setTicketSuccess(false), 3000);
    } catch {
      alert('Failed to submit ticket. Please try again.');
    }
  };

  const renderView = () => {
    // A brand-new user has zero purchased accounts, so `selectedAccount` is undefined. Views
    // below all assume a real account (selectedAccount.status/.balance/etc without a null check),
    // so show an empty-state prompt instead of letting them crash the whole render tree.
    const accountDependentViews = ['Overview', 'Trading Terminal', 'Statistics', 'Certificates', 'Payout Requests'];
    if (!selectedAccount && accountDependentViews.includes(activeView)) {
      return (
        <motion.div
          key="no-accounts"
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
            alignItems: 'center',
            gap: '1.5rem'
          }}
        >
          <h2 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)' }}>No Trading Accounts Yet</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '480px' }}>
            Purchase a challenge to unlock your trading dashboard, terminal, and statistics.
          </p>
          <button onClick={() => navigate('/checkout')} className="neon-button" style={{ padding: '1rem 2rem', fontWeight: 700 }}>
            Browse Challenges
          </button>
        </motion.div>
      );
    }

    switch (activeView) {
      case 'Overview':
        return (
          <OverviewTab
            key="overview"
            profileName={profileName}
            accounts={accounts}
            selectedAccount={selectedAccount}
            selectedAccountId={selectedAccountId}
            setSelectedAccountId={setSelectedAccountId}
            handleSimulateTrade={handleSimulateTrade}
            isSimulating={isSimulating}
            simulateMessage={simulateMessage}
          />
        );

      case 'Trading Terminal':
        return (
          <TerminalTab
            key="terminal"
            selectedAccountId={selectedAccountId}
            selectedAccount={selectedAccount}
          />
        );

      case 'Trading Accounts':
        return (
          <AccountsTab
            key="accounts"
            navigate={navigate}
            notifState={notifState}
            setNotifState={setNotifState}
            accounts={accounts}
            selectedAccountId={selectedAccountId}
            showCredentials={showCredentials}
            setShowCredentials={setShowCredentials}
            lossAlerts={lossAlerts}
            setLossAlerts={setLossAlerts}
          />
        );

      case 'Billing':
        return (
          <BillingTab
            key="billing"
            profileName={profileName}
            invoiceDownloading={invoiceDownloading}
            handleDownloadInvoice={handleDownloadInvoice}
          />
        );

      case 'Profile':
        return (
          <ProfileTab
            key="profile"
            profileSaveSuccess={profileSaveSuccess}
            setProfileSaveSuccess={setProfileSaveSuccess}
            profileName={profileName}
            setProfileName={setProfileName}
            profileEmail={profileEmail}
            setProfileEmail={setProfileEmail}
            profilePhone={profilePhone}
            setProfilePhone={setProfilePhone}
            profileCountry={profileCountry}
            setProfileCountry={setProfileCountry}
            activeKyc={activeKyc}
            kycSuccessMsg={kycSuccessMsg}
            setKycSuccessMsg={setKycSuccessMsg}
            kycDocType={kycDocType}
            setKycDocType={setKycDocType}
            kycDocNum={kycDocNum}
            setKycDocNum={setKycDocNum}
            submitKyc={submitKyc}
            user={user}
            isTwoFactorActive={isTwoFactorActive}
            setIsTwoFactorActive={setIsTwoFactorActive}
          />
        );

      case 'Support':
        return (
          <SupportTab
            key="support"
            ticketSuccess={ticketSuccess}
            faqActive={faqActive}
            setFaqActive={setFaqActive}
            ticketCategory={ticketCategory}
            setTicketCategory={setTicketCategory}
            ticketSubject={ticketSubject}
            setTicketSubject={setTicketSubject}
            ticketMessage={ticketMessage}
            setTicketMessage={setTicketMessage}
            handleSupportTicketSubmit={handleSupportTicketSubmit}
            tickets={tickets}
          />
        );

      case 'Statistics':
        return (
          <StatisticsTab
            key="statistics"
            selectedAccount={selectedAccount}
            selectedAccountId={selectedAccountId}
          />
        );

      case 'Certificates':
        return (
          <CertificatesTab
            key="certificates"
            selectedAccount={selectedAccount}
            selectedAccountId={selectedAccountId}
            profileName={profileName}
            setActiveView={setActiveView}
            navigate={navigate}
          />
        );

      case 'Payout Requests':
        return (
          <PayoutsTab
            key="payouts"
            selectedAccount={selectedAccount}
            recentPayouts={recentPayouts}
            profileName={profileName}
            user={user}
            payoutSuccessMsg={payoutSuccessMsg}
            handlePayoutSubmit={handlePayoutSubmit}
            payoutAmount={payoutAmount}
            setPayoutAmount={setPayoutAmount}
            payoutMethod={payoutMethod}
            setPayoutMethod={setPayoutMethod}
            payoutAddress={payoutAddress}
            setPayoutAddress={setPayoutAddress}
          />
        );

      case 'Affiliate Program':
        return (
          <AffiliateTab
            key="affiliate"
            affiliates={affiliates}
            user={user}
            claimAffiliatePayout={claimAffiliatePayout}
            copiedReferral={copiedReferral}
            setCopiedReferral={setCopiedReferral}
            affiliateSuccessMsg={affiliateSuccessMsg}
            setAffiliateSuccessMsg={setAffiliateSuccessMsg}
          />
        );

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
