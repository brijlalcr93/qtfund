import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert, Users, Coins, Landmark, CheckCircle, XCircle, RotateCcw
} from 'lucide-react';
import { adminApi } from '../lib/adminApi';
import type { AdminStats, PaymentItem, ChallengeItem, PayoutItem, KycItem, AffiliateItem, CouponItem, UserItem } from '../lib/adminApi';
import OverviewTab from './admin-tabs/OverviewTab';
import UsersTab from './admin-tabs/UsersTab';
import ChallengesTab from './admin-tabs/ChallengesTab';
import FundedTab from './admin-tabs/FundedTab';
import PayoutsTab from './admin-tabs/PayoutsTab';
import PaymentsTab from './admin-tabs/PaymentsTab';
import KycTab from './admin-tabs/KycTab';
import EmailTab from './admin-tabs/EmailTab';
import AffiliatesTab from './admin-tabs/AffiliatesTab';
import CouponsTab from './admin-tabs/CouponsTab';
import CmsTab from './admin-tabs/CmsTab';
import AnalyticsTab from './admin-tabs/AnalyticsTab';

type AdminTab = 'Overview' | 'Users' | 'Challenges' | 'Funded' | 'Payouts' | 'Payments' | 'KYC' | 'Email' | 'Affiliates' | 'Coupons' | 'CMS' | 'Analytics';

export default function AdminPanel() {
  const navigate = useNavigate();

  // Data state
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [challenges, setChallenges] = useState<ChallengeItem[]>([]);
  const [payouts, setPayouts] = useState<PayoutItem[]>([]);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [kycList, setKycList] = useState<KycItem[]>([]);
  const [affiliates, setAffiliates] = useState<AffiliateItem[]>([]);
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [cms, setCms] = useState<Record<string, string>>({});

  // UI state
  const [activeTab, setActiveTab] = useState<AdminTab>('Overview');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(true);

  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, usersData, payoutsData, paymentsData, kycData, affiliatesData, couponsData, cmsData, challengesData] = await Promise.allSettled([
        adminApi.getStats(),
        adminApi.getUsers(),
        adminApi.getAllPayouts(),
        adminApi.getPayments(1, 100),
        adminApi.getAllKyc(),
        adminApi.getAllAffiliates(),
        adminApi.getAllCoupons(),
        adminApi.getCms(),
        adminApi.getChallenges(1, 100),
      ]);

      if (statsData.status === 'fulfilled') setStats(statsData.value);
      if (usersData.status === 'fulfilled') setUsers(usersData.value);
      if (payoutsData.status === 'fulfilled') setPayouts(payoutsData.value);
      if (paymentsData.status === 'fulfilled') setPayments(paymentsData.value.payments || []);
      if (kycData.status === 'fulfilled') setKycList(kycData.value);
      if (affiliatesData.status === 'fulfilled') setAffiliates(affiliatesData.value);
      if (couponsData.status === 'fulfilled') setCoupons(couponsData.value);
      if (cmsData.status === 'fulfilled') setCms(cmsData.value);
      if (challengesData.status === 'fulfilled') setChallenges(challengesData.value.challenges || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Overview metric calculations
  const totalPayouts = payouts.filter(p => p.status === 'Paid').reduce((a, p) => a + p.amount, 0);

  // CMS Edit State
  const [editHpTitle, setEditHpTitle] = useState(cms.homepageTitle || '');
  const [editHpSubtitle, setEditHpSubtitle] = useState(cms.homepageSubtitle || '');
  const [editPrTitle, setEditPrTitle] = useState(cms.pricingTitle || '');
  const [editPrSubtitle, setEditPrSubtitle] = useState(cms.pricingSubtitle || '');
  const [editNotice, setEditNotice] = useState(cms.announcement || '');

  const [newFaqQ, setNewFaqQ] = useState('');
  const [newFaqA, setNewFaqA] = useState('');
  const [newFaqCat, setNewFaqCat] = useState('General');

  // Challenge Builder State
  const [challType, setChallType] = useState<'1-Step' | '2-Step' | 'Instant'>('2-Step');
  const [challSize, setChallSize] = useState('50000');
  const [challPrice, setChallPrice] = useState('279');
  const [challProfit, setChallProfit] = useState('8');
  const [challDaily, setChallDaily] = useState('5');
  const [challMax, setChallMax] = useState('10');
  const [challDays, setChallDays] = useState('30');
  const [challName, setChallName] = useState('');

  // Coupon Builder State
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(10);
  const [couponExpiry, setCouponExpiry] = useState('2026-12-31');
  const [couponLimit, setCouponLimit] = useState(100);
  const [couponType, setCouponType] = useState<'PERCENT'>('PERCENT');

  // Email Builder State
  const [emailSubject, setEmailSubject] = useState('Notice: Drawdown Threshold Reset');
  const [emailTemplate, setEmailTemplate] = useState('Dear Trader,\n\nWe have successfully optimized our MT5 server bridging latency. Your account credentials remain active.\n\nBest regards,\nQuantum Risk Team');
  const [emailSending, setEmailSending] = useState(false);

  const handleCMSUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.saveCms({
        homepageTitle: editHpTitle,
        homepageSubtitle: editHpSubtitle,
        pricingTitle: editPrTitle,
        pricingSubtitle: editPrSubtitle,
        announcement: editNotice,
      });
      showNotification('CMS Homepage configurations updated!');
    } catch { showNotification('Failed to update CMS'); }
  };

  const handleAddFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFaqQ || !newFaqA) return;
    const faqList = JSON.parse(cms.faqList || '[]');
    faqList.push({ q: newFaqQ, a: newFaqA, category: newFaqCat });
    try {
      await adminApi.saveCms({ ...cms, faqList: JSON.stringify(faqList) });
      setNewFaqQ('');
      setNewFaqA('');
      showNotification('New FAQ accordion card published!');
    } catch { showNotification('Failed to add FAQ'); }
  };

  const handleDeleteFaq = async (q: string) => {
    const faqList = JSON.parse(cms.faqList || '[]').filter((f: any) => f.q !== q);
    try {
      await adminApi.saveCms({ ...cms, faqList: JSON.stringify(faqList) });
      showNotification('FAQ accordion deleted successfully.');
    } catch { showNotification('Failed to delete FAQ'); }
  };

  const handleAddChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.createChallengePlan({
        name: challName || `${challType} $${parseInt(challSize).toLocaleString()}`,
        price: parseFloat(challPrice),
        accountSize: parseFloat(challSize),
        profitTarget: parseFloat(challProfit),
        maxDrawdown: parseFloat(challMax),
        durationDays: parseInt(challDays),
        type: challType,
        dailyLoss: parseFloat(challDaily),
      });
      showNotification(`New Challenge $${parseInt(challSize).toLocaleString()} created!`);
      loadData();
    } catch { showNotification('Failed to create challenge'); }
  };

  const handleDeleteChallenge = async (id: string, name: string) => {
    try {
      await adminApi.deleteChallengePlan(id);
      showNotification(`Challenge "${name}" deactivated.`);
      loadData();
    } catch { showNotification('Failed to delete challenge'); }
  };

  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode) return;
    try {
      await adminApi.createCoupon({
        code: couponCode.toUpperCase(),
        discountType: couponType,
        discountValue: couponDiscount,
        validFrom: new Date().toISOString(),
        validUntil: new Date(couponExpiry).toISOString(),
        maxUsage: couponLimit,
      });
      setCouponCode('');
      showNotification(`Coupon ${couponCode.toUpperCase()} successfully deployed!`);
      loadData();
    } catch { showNotification('Failed to create coupon'); }
  };

  const handleDeleteCoupon = async (code: string) => {
    try {
      await adminApi.deleteCoupon(code);
      showNotification(`Coupon ${code} deleted.`);
      loadData();
    } catch { showNotification('Failed to delete coupon'); }
  };

  const handleSendEmails = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailSending(true);
    try {
      const result = await adminApi.sendBulkEmail(emailSubject, emailTemplate);
      showNotification(`Notification dispatched to ${result.sentCount} traders!`);
    } catch {
      showNotification('Failed to send emails');
    } finally {
      setEmailSending(false);
    }
  };

  const handleToggleUser = async (id: string, name: string) => {
    try {
      const result = await adminApi.toggleUserStatus(id);
      setUsers(users.map(u => u.id === id ? { ...u, isSuspended: result.isSuspended } : u));
      showNotification(`Toggled user account status for ${name}!`);
    } catch { showNotification('Failed to toggle user status'); }
  };

  const handlePayoutAction = async (id: string, status: string) => {
    try {
      await adminApi.updatePayoutStatus(id, status);
      showNotification(`Payout ${status.toLowerCase()}!`);
      loadData();
    } catch { showNotification(`Failed to ${status.toLowerCase()} payout`); }
  };

  const handleRefundPayment = async (id: string) => {
    try {
      await adminApi.refundPayment(id);
      showNotification(`Refund issued for transaction #${id}!`);
      loadData();
    } catch { showNotification('Failed to refund payment'); }
  };

  const handleKycAction = async (id: string, status: string, userName: string) => {
    try {
      await adminApi.updateKycStatus(id, status);
      showNotification(`${status === 'APPROVED' ? 'Approved' : 'Rejected'} KYC for ${userName}!`);
      loadData();
    } catch { showNotification(`Failed to ${status.toLowerCase()} KYC`); }
  };

  const handleAffiliateCommission = async (userId: string, currentRate: number) => {
    const newRate = currentRate === 10 ? 15 : 10;
    try {
      await adminApi.updateAffiliateCommission(userId, newRate);
      setAffiliates(affiliates.map(a => a.id === userId ? { ...a, commissionRate: newRate } : a));
      showNotification(`Commission adjusted to ${newRate}%!`);
    } catch { showNotification('Failed to update commission'); }
  };

  const handleUpgradeAccount = async (id: string) => {
    try {
      await adminApi.upgradeChallenge(id, 50000);
      showNotification(`Upgraded account #${id} (+$50k)!`);
      loadData();
    } catch { showNotification('Failed to upgrade account'); }
  };

  const handleDisableAccount = async (id: string) => {
    try {
      await adminApi.disableChallenge(id);
      showNotification(`Disabled account #${id}!`);
      loadData();
    } catch { showNotification('Failed to disable account'); }
  };

  const handleResetChallenge = async (id: string) => {
    try {
      await adminApi.resetChallenge(id);
      showNotification(`Reset challenge #${id} to active!`);
      loadData();
    } catch { showNotification('Failed to reset challenge'); }
  };

  const kpiCards = stats ? [
    { title: 'Total Revenue', val: `$${stats.overview.totalRevenue.toLocaleString()}`, change: `$${stats.overview.monthRevenue.toLocaleString()} this month`, icon: Coins, color: 'var(--accent-cyan)' },
    { title: 'Active Live Traders', val: stats.overview.activeChallenges.toString(), change: `${stats.overview.passedChallenges} passed / ${stats.overview.failedChallenges} failed`, icon: Users, color: '#a855f7' },
    { title: 'Passed Challenges', val: stats.overview.passedChallenges.toString(), change: 'Phase Upgrade pending', icon: CheckCircle, color: '#10b981' },
    { title: 'Failed Challenges', val: stats.overview.failedChallenges.toString(), change: 'Breached limits log', icon: XCircle, color: '#ef4444' },
    { title: 'Total Payouts', val: `$${totalPayouts.toLocaleString()}`, change: `${stats.overview.pendingPayouts} pending audit`, icon: Landmark, color: '#3b82f6' },
  ] : [];

  const renderTab = () => {
    switch (activeTab) {
      case 'Overview':
        return <OverviewTab kpiCards={kpiCards} stats={stats} />;

      case 'Users':
        return <UsersTab users={users} kycList={kycList} handleToggleUser={handleToggleUser} />;

      case 'Challenges':
        return (
          <ChallengesTab
            handleAddChallenge={handleAddChallenge}
            challName={challName} setChallName={setChallName}
            challType={challType} setChallType={setChallType}
            challSize={challSize} setChallSize={setChallSize}
            challPrice={challPrice} setChallPrice={setChallPrice}
            challProfit={challProfit} setChallProfit={setChallProfit}
            challMax={challMax} setChallMax={setChallMax}
            challDays={challDays} setChallDays={setChallDays}
            challDaily={challDaily} setChallDaily={setChallDaily}
            stats={stats}
            handleDeleteChallenge={handleDeleteChallenge}
          />
        );

      case 'Funded':
        return (
          <FundedTab
            challenges={challenges}
            handleUpgradeAccount={handleUpgradeAccount}
            handleDisableAccount={handleDisableAccount}
            handleResetChallenge={handleResetChallenge}
          />
        );

      case 'Payouts':
        return <PayoutsTab payouts={payouts} handlePayoutAction={handlePayoutAction} />;

      case 'Payments':
        return <PaymentsTab payments={payments} handleRefundPayment={handleRefundPayment} />;

      case 'KYC':
        return <KycTab kycList={kycList} handleKycAction={handleKycAction} />;

      case 'Email':
        return (
          <EmailTab
            users={users}
            handleSendEmails={handleSendEmails}
            emailSubject={emailSubject} setEmailSubject={setEmailSubject}
            emailTemplate={emailTemplate} setEmailTemplate={setEmailTemplate}
            emailSending={emailSending}
          />
        );

      case 'Affiliates':
        return <AffiliatesTab affiliates={affiliates} handleAffiliateCommission={handleAffiliateCommission} />;

      case 'Coupons':
        return (
          <CouponsTab
            handleAddCoupon={handleAddCoupon}
            couponCode={couponCode} setCouponCode={setCouponCode}
            couponType={couponType} setCouponType={setCouponType}
            couponDiscount={couponDiscount} setCouponDiscount={setCouponDiscount}
            couponLimit={couponLimit} setCouponLimit={setCouponLimit}
            couponExpiry={couponExpiry} setCouponExpiry={setCouponExpiry}
            coupons={coupons}
            handleDeleteCoupon={handleDeleteCoupon}
          />
        );

      case 'CMS':
        return (
          <CmsTab
            handleCMSUpdate={handleCMSUpdate}
            editHpTitle={editHpTitle} setEditHpTitle={setEditHpTitle}
            editHpSubtitle={editHpSubtitle} setEditHpSubtitle={setEditHpSubtitle}
            editPrTitle={editPrTitle} setEditPrTitle={setEditPrTitle}
            editNotice={editNotice} setEditNotice={setEditNotice}
            editPrSubtitle={editPrSubtitle} setEditPrSubtitle={setEditPrSubtitle}
            handleAddFaq={handleAddFaq}
            newFaqCat={newFaqCat} setNewFaqCat={setNewFaqCat}
            newFaqQ={newFaqQ} setNewFaqQ={setNewFaqQ}
            newFaqA={newFaqA} setNewFaqA={setNewFaqA}
            cms={cms}
            handleDeleteFaq={handleDeleteFaq}
          />
        );

      case 'Analytics':
        return <AnalyticsTab stats={stats} />;

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex', minHeight: '100vh', width: '100%', paddingTop: '80px',
        alignItems: 'center', justifyContent: 'center'
      }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>Loading admin panel...</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%', paddingTop: '80px', position: 'relative', zIndex: 10, pointerEvents: 'auto' }}>
      <div style={{
        width: '280px', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(30px)',
        borderRight: '1px solid var(--glass-border)', height: 'calc(100vh - 80px)',
        position: 'fixed', left: 0, top: '80px', padding: '2rem 1rem',
        display: 'flex', flexDirection: 'column', zIndex: 30
      }} className="dashboard-sidebar">
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.8rem',
          padding: '0 1rem 1.5rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '1.5rem'
        }}>
          <div style={{
            color: '#ef4444', background: 'rgba(239,68,68,0.1)',
            padding: '0.5rem', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <ShieldAlert size={20} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.95rem' }}>Super Admin Panel</span>
            <span style={{ color: '#10b981', fontSize: '0.78rem', fontWeight: 600 }}>Live Database Mode</span>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem', overflowY: 'auto' }} className="custom-scrollbar">
          {(['Overview', 'Users', 'Challenges', 'Funded', 'Payouts', 'Payments', 'KYC', 'Email', 'Affiliates', 'Coupons', 'CMS', 'Analytics'] as AdminTab[]).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.8rem',
                  width: '100%', padding: '0.8rem 1.2rem',
                  background: isActive ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                  border: isActive ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid transparent',
                  borderRadius: '10px',
                  color: isActive ? '#ef4444' : 'var(--text-secondary)',
                  cursor: 'pointer', transition: 'all 0.2s',
                  fontSize: '0.92rem', fontWeight: isActive ? 600 : 500, textAlign: 'left'
                }}
                onMouseOver={(e) => {
                  if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = 'var(--text-primary)'; }
                }}
                onMouseOut={(e) => {
                  if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }
                }}
              >
                {tab}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => navigate('/dashboard')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.8rem',
            width: '100%', padding: '0.8rem 1.2rem',
            background: 'transparent', border: '1px solid var(--glass-border)',
            borderRadius: '10px', color: 'var(--text-primary)',
            cursor: 'pointer', transition: 'all 0.2s',
            fontSize: '0.92rem', fontWeight: 600, textAlign: 'left', marginTop: '1rem'
          }}
          onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
          onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
        >
          <RotateCcw size={16} />
          Exit Admin Panel
        </button>
      </div>

      <div style={{
        flex: 1, marginLeft: '280px', padding: '2rem 3rem',
        width: 'calc(100% - 280px)', overflowY: 'auto', overflowX: 'hidden'
      }} className="dashboard-content">
        <AnimatePresence>
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                background: 'rgba(16,185,129,0.1)', border: '1px solid #10b981',
                color: '#10b981', padding: '1rem', borderRadius: '12px',
                textAlign: 'center', fontWeight: 600, fontSize: '0.95rem', marginBottom: '2rem'
              }}
            >
              {successMsg}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem', letterSpacing: '-0.02em' }}>
                  {activeTab} Management
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
                  Super Admin terminal access to perform database queries and edits
                </p>
              </div>

              <div style={{
                background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
                color: '#10b981', padding: '0.4rem 1rem', borderRadius: '999px',
                fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase',
                display: 'flex', alignItems: 'center', gap: '0.4rem'
              }}>
                <CheckCircle size={14} /> Live Database: Connected
              </div>
            </div>

            {renderTab()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}