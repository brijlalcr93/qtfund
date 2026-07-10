import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart as RechartsBarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  ShieldAlert, Users, Coins, Mail, Landmark, Trash, Plus, CheckCircle, XCircle, RotateCcw, AlertTriangle
} from 'lucide-react';
import { adminApi } from '../lib/adminApi';
import type { AdminStats, PaymentItem, ChallengeItem, PayoutItem, KycItem, AffiliateItem, CouponItem, UserItem } from '../lib/adminApi';

type AdminTab = 'Overview' | 'Users' | 'Challenges' | 'Funded' | 'Payouts' | 'Payments' | 'KYC' | 'Email' | 'Affiliates' | 'Coupons' | 'CMS' | 'Analytics';

const COLORS = ['var(--accent-cyan)', '#a855f7', '#3b82f6', '#10b981', '#ef4444', '#f59e0b'];

export default function AdminPanel() {
  const navigate = useNavigate();

  // Data state
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [challengePlans, setChallengePlans] = useState<any[]>([]);
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
        adminApi.get<{ users: UserItem[]; pagination: any }>('/users?limit=100'),
        adminApi.get<{ payouts: PayoutItem[]; pagination: any }>('/payouts?limit=100'),
        adminApi.get<{ payments: PaymentItem[]; pagination: any }>('/admin/payments?limit=100'),
        adminApi.get<{ submissions: KycItem[]; pagination: any }>('/kyc?limit=100'),
        adminApi.get<{ affiliates: AffiliateItem[]; pagination: any }>('/affiliates?limit=100'),
        adminApi.get<CouponItem[]>('/coupons'),
        adminApi.get<Record<string, string>>('/admin/cms'),
        adminApi.get<{ challenges: ChallengeItem[]; pagination: any }>('/admin/challenges?limit=100'),
      ]);

      if (statsData.status === 'fulfilled') setStats(statsData.value);
      if (usersData.status === 'fulfilled') setUsers(usersData.value.users || []);
      if (payoutsData.status === 'fulfilled') setPayouts(payoutsData.value.payouts || []);
      if (paymentsData.status === 'fulfilled') setPayments(paymentsData.value.payments || []);
      if (kycData.status === 'fulfilled') setKycList(kycData.value.submissions || []);
      if (affiliatesData.status === 'fulfilled') setAffiliates(affiliatesData.value.affiliates || []);
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
  const totalRevenue = stats?.overview.totalRevenue ?? payments.filter(p => p.status === 'COMPLETED').reduce((a, p) => a + p.amount, 0);
  const totalPayouts = payouts.filter(p => p.status === 'COMPLETED').reduce((a, p) => a + p.amount, 0);
  const activeTraders = challenges.filter(c => c.status === 'ACTIVE').length;
  const failedChallenges = challenges.filter(c => c.status === 'FAILED').length;
  const passedChallenges = challenges.filter(c => c.status === 'PASSED').length;

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
  const [couponType, setCouponType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');

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

      case 'Users':
        return (
          <div style={{
            background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
            borderRadius: '24px', padding: '2rem'
          }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>User Directory</h3>
            <div style={{ overflowX: 'auto' }} className="custom-scrollbar">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    <th style={{ padding: '0.8rem 0' }}>User ID</th>
                    <th style={{ padding: '0.8rem 0' }}>Name</th>
                    <th style={{ padding: '0.8rem 0' }}>Email</th>
                    <th style={{ padding: '0.8rem 0' }}>KYC State</th>
                    <th style={{ padding: '0.8rem 0' }}>Status</th>
                    <th style={{ padding: '0.8rem 0', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((usr) => {
                    const kyc = kycList.find(k => k.user.id === usr.id);
                    const kycStatus = kyc?.status || 'NOT_SUBMITTED';
                    const isActive = !usr.isSuspended && !usr.isBanned;
                    return (
                      <tr key={usr.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.92rem' }}>
                        <td style={{ padding: '1rem 0', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{usr.id.substring(0, 12)}...</td>
                        <td style={{ padding: '1rem 0', fontWeight: 600, color: 'var(--text-primary)' }}>{usr.name}</td>
                        <td style={{ padding: '1rem 0', color: 'var(--text-secondary)' }}>{usr.email}</td>
                        <td style={{ padding: '1rem 0' }}>
                          <span style={{
                            padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700,
                            background: kycStatus === 'APPROVED' ? 'rgba(16,185,129,0.1)' : kycStatus === 'PENDING' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                            color: kycStatus === 'APPROVED' ? '#10b981' : kycStatus === 'PENDING' ? '#f59e0b' : '#ef4444'
                          }}>{kycStatus}</span>
                        </td>
                        <td style={{ padding: '1rem 0' }}>
                          <span style={{
                            padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700,
                            background: isActive ? 'rgba(6,182,212,0.1)' : 'rgba(239,68,68,0.15)',
                            color: isActive ? 'var(--accent-cyan)' : '#ef4444'
                          }}>{isActive ? 'Active' : 'Suspended'}</span>
                        </td>
                        <td style={{ padding: '1rem 0', textAlign: 'right' }}>
                          <button
                            onClick={() => handleToggleUser(usr.id, usr.name)}
                            style={{
                              background: 'none', border: '1px solid var(--glass-border)',
                              color: isActive ? '#ef4444' : 'var(--accent-cyan)',
                              padding: '0.3rem 0.8rem', borderRadius: '6px', cursor: 'pointer',
                              fontSize: '0.8rem', fontWeight: 600
                            }}
                          >
                            {isActive ? 'Suspend' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {users.length === 0 && (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-secondary)' }}>No users found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'Challenges':
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

      case 'Funded':
        return (
          <div style={{
            background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
            borderRadius: '24px', padding: '2rem'
          }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Funded Partner Accounts console</h3>
            <div style={{ overflowX: 'auto' }} className="custom-scrollbar">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    <th style={{ padding: '0.8rem 0' }}>Account ID</th>
                    <th style={{ padding: '0.8rem 0' }}>Trader</th>
                    <th style={{ padding: '0.8rem 0' }}>Plan</th>
                    <th style={{ padding: '0.8rem 0' }}>Balance</th>
                    <th style={{ padding: '0.8rem 0' }}>Status</th>
                    <th style={{ padding: '0.8rem 0', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {challenges.map((ch) => (
                    <tr key={ch.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.92rem' }}>
                      <td style={{ padding: '1rem 0', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{ch.id.substring(0, 8)}...</td>
                      <td style={{ padding: '1rem 0', fontWeight: 600, color: 'var(--text-primary)' }}>{ch.user.name}</td>
                      <td style={{ padding: '1rem 0', color: 'var(--text-secondary)' }}>{ch.plan.name}</td>
                      <td style={{ padding: '1rem 0', fontWeight: 600, color: 'var(--text-primary)' }}>${ch.currentBalance.toLocaleString()}</td>
                      <td style={{ padding: '1rem 0' }}>
                        <span style={{
                          padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700,
                          background: ch.status === 'ACTIVE' ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)',
                          color: ch.status === 'ACTIVE' ? '#10b981' : ch.status === 'PASSED' ? '#3b82f6' : '#ef4444'
                        }}>{ch.status}</span>
                      </td>
                      <td style={{ padding: '1rem 0', textAlign: 'right', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        {ch.status === 'ACTIVE' && (
                          <>
                            <button onClick={() => handleUpgradeAccount(ch.id)} className="neon-button" style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}>
                              Upgrade size
                            </button>
                            <button onClick={() => handleDisableAccount(ch.id)} style={{
                              background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', color: '#ef4444',
                              padding: '0.3rem 0.6rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600
                            }}>
                              Disable
                            </button>
                          </>
                        )}
                        {ch.status === 'FAILED' && (
                          <button onClick={() => handleResetChallenge(ch.id)} style={{
                            background: 'rgba(6,182,212,0.1)', border: '1px solid var(--accent-cyan)', color: 'var(--accent-cyan)',
                            padding: '0.3rem 0.6rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600
                          }}>
                            Reset to Active
                          </button>
                        )}
                        {ch.status === 'PASSED' && <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Funded</span>}
                      </td>
                    </tr>
                  ))}
                  {challenges.length === 0 && (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-secondary)' }}>No funded accounts</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'Payouts':
        return (
          <div style={{
            background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
            borderRadius: '24px', padding: '2rem'
          }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Trader Payout Audit List</h3>
            <div style={{ overflowX: 'auto' }} className="custom-scrollbar">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    <th style={{ padding: '0.8rem 0' }}>Request ID</th>
                    <th style={{ padding: '0.8rem 0' }}>Trader</th>
                    <th style={{ padding: '0.8rem 0' }}>Amount</th>
                    <th style={{ padding: '0.8rem 0' }}>Net Amount</th>
                    <th style={{ padding: '0.8rem 0' }}>Status</th>
                    <th style={{ padding: '0.8rem 0', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((pay) => (
                    <tr key={pay.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.92rem' }}>
                      <td style={{ padding: '1rem 0', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{pay.id.substring(0, 8)}...</td>
                      <td style={{ padding: '1rem 0', fontWeight: 600, color: 'var(--text-primary)' }}>{pay.user.name}</td>
                      <td style={{ padding: '1rem 0', color: 'var(--accent-cyan)', fontWeight: 700 }}>${pay.amount.toLocaleString()}</td>
                      <td style={{ padding: '1rem 0', color: 'var(--text-secondary)' }}>${pay.netAmount.toLocaleString()}</td>
                      <td style={{ padding: '1rem 0' }}>
                        <span style={{
                          padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700,
                          background: pay.status === 'COMPLETED' ? 'rgba(16,185,129,0.1)' : pay.status === 'PENDING' ? 'rgba(245,158,11,0.1)' : pay.status === 'APPROVED' ? 'rgba(59,130,246,0.1)' : 'rgba(239,68,68,0.1)',
                          color: pay.status === 'COMPLETED' ? '#10b981' : pay.status === 'PENDING' ? '#f59e0b' : pay.status === 'APPROVED' ? '#3b82f6' : '#ef4444'
                        }}>{pay.status}</span>
                      </td>
                      <td style={{ padding: '1rem 0', textAlign: 'right', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        {pay.status === 'PENDING' && (
                          <>
                            <button onClick={() => handlePayoutAction(pay.id, 'APPROVED')} className="neon-button" style={{ padding: '0.2rem 0.6rem', fontSize: '0.78rem' }}>
                              Approve
                            </button>
                            <button onClick={() => handlePayoutAction(pay.id, 'REJECTED')} style={{
                              background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', color: '#ef4444',
                              padding: '0.2rem 0.6rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem'
                            }}>
                              Reject
                            </button>
                          </>
                        )}
                        {pay.status === 'APPROVED' && (
                          <button onClick={() => handlePayoutAction(pay.id, 'COMPLETED')} className="neon-button" style={{ padding: '0.2rem 0.6rem', fontSize: '0.78rem' }}>
                            Mark Paid
                          </button>
                        )}
                        {pay.status === 'COMPLETED' && <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Settled</span>}
                        {pay.status === 'REJECTED' && <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>Rejected</span>}
                      </td>
                    </tr>
                  ))}
                  {payouts.length === 0 && (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-secondary)' }}>No payout requests</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'Payments':
        return (
          <div style={{
            background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
            borderRadius: '24px', padding: '2rem'
          }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Payment Gateway Transactions</h3>
            <div style={{ overflowX: 'auto' }} className="custom-scrollbar">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    <th style={{ padding: '0.8rem 0' }}>TXN Ref</th>
                    <th style={{ padding: '0.8rem 0' }}>Customer</th>
                    <th style={{ padding: '0.8rem 0' }}>Fee Paid</th>
                    <th style={{ padding: '0.8rem 0' }}>Gateway</th>
                    <th style={{ padding: '0.8rem 0' }}>Status</th>
                    <th style={{ padding: '0.8rem 0', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((tx) => (
                    <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.92rem' }}>
                      <td style={{ padding: '1rem 0', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{tx.id.substring(0, 8)}...</td>
                      <td style={{ padding: '1rem 0', fontWeight: 600, color: 'var(--text-primary)' }}>{tx.user.name}</td>
                      <td style={{ padding: '1rem 0', color: 'var(--text-primary)' }}>${tx.amount.toLocaleString()}</td>
                      <td style={{ padding: '1rem 0', color: 'var(--text-secondary)' }}>{tx.gateway}</td>
                      <td style={{ padding: '1rem 0' }}>
                        <span style={{
                          padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700,
                          background: tx.status === 'COMPLETED' ? 'rgba(16,185,129,0.1)' : tx.status === 'PENDING' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.15)',
                          color: tx.status === 'COMPLETED' ? '#10b981' : tx.status === 'PENDING' ? '#f59e0b' : '#ef4444'
                        }}>{tx.status}</span>
                      </td>
                      <td style={{ padding: '1rem 0', textAlign: 'right' }}>
                        {tx.status === 'COMPLETED' ? (
                          <button onClick={() => handleRefundPayment(tx.id)} style={{
                            background: 'none', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444',
                            padding: '0.3rem 0.6rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600
                          }}>
                            Refund
                          </button>
                        ) : (
                          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>{tx.status === 'REFUNDED' ? 'Refunded' : tx.status}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {payments.length === 0 && (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-secondary)' }}>No payment records</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'KYC':
        return (
          <div style={{
            background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
            borderRadius: '24px', padding: '2rem'
          }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>KYC Approvals Queue</h3>
            <div style={{ overflowX: 'auto' }} className="custom-scrollbar">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    <th style={{ padding: '0.8rem 0' }}>Trader</th>
                    <th style={{ padding: '0.8rem 0' }}>Document</th>
                    <th style={{ padding: '0.8rem 0' }}>Status</th>
                    <th style={{ padding: '0.8rem 0', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {kycList.map((sub) => (
                    <tr key={sub.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.92rem' }}>
                      <td style={{ padding: '1rem 0' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{sub.user.name}</span>
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>{sub.user.email}</span>
                        </div>
                      </td>
                      <td style={{ padding: '1rem 0', color: 'var(--text-primary)' }}>{sub.documentType}</td>
                      <td style={{ padding: '1rem 0' }}>
                        <span style={{
                          padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700,
                          background: sub.status === 'APPROVED' ? 'rgba(16,185,129,0.1)' : sub.status === 'PENDING' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                          color: sub.status === 'APPROVED' ? '#10b981' : sub.status === 'PENDING' ? '#f59e0b' : '#ef4444'
                        }}>{sub.status}</span>
                      </td>
                      <td style={{ padding: '1rem 0', textAlign: 'right', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        {sub.status === 'PENDING' && (
                          <>
                            <button onClick={() => handleKycAction(sub.id, 'APPROVED', sub.user.name)} className="neon-button" style={{ padding: '0.2rem 0.6rem', fontSize: '0.78rem' }}>
                              Approve
                            </button>
                            <button onClick={() => handleKycAction(sub.id, 'REJECTED', sub.user.name)} style={{
                              background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', color: '#ef4444',
                              padding: '0.2rem 0.6rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem'
                            }}>
                              Reject
                            </button>
                          </>
                        )}
                        {sub.status === 'APPROVED' && <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Verified Partner</span>}
                        {sub.status === 'REJECTED' && <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>Rejected</span>}
                      </td>
                    </tr>
                  ))}
                  {kycList.length === 0 && (
                    <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-secondary)' }}>No KYC submissions</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'Email':
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

      case 'Affiliates':
        return (
          <div style={{
            background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
            borderRadius: '24px', padding: '2rem'
          }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Affiliate Program Console</h3>
            <div style={{ overflowX: 'auto' }} className="custom-scrollbar">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    <th style={{ padding: '0.8rem 0' }}>Referrer</th>
                    <th style={{ padding: '0.8rem 0' }}>Ref Code</th>
                    <th style={{ padding: '0.8rem 0' }}>Comm %</th>
                    <th style={{ padding: '0.8rem 0' }}>Referrals</th>
                    <th style={{ padding: '0.8rem 0' }}>Earnings</th>
                    <th style={{ padding: '0.8rem 0', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {affiliates.map((aff) => (
                    <tr key={aff.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.92rem' }}>
                      <td style={{ padding: '1rem 0' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{aff.name}</span>
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>{aff.email}</span>
                        </div>
                      </td>
                      <td style={{ padding: '1rem 0', fontFamily: 'monospace', color: 'var(--text-primary)' }}>{aff.affiliateCode}</td>
                      <td style={{ padding: '1rem 0', color: 'var(--text-secondary)' }}>{aff.commissionRate}%</td>
                      <td style={{ padding: '1rem 0', color: 'var(--text-secondary)' }}>{aff._count.referrals} referrals</td>
                      <td style={{ padding: '1rem 0', color: 'var(--accent-cyan)', fontWeight: 700 }}>${aff.totalEarnings.toFixed(2)}</td>
                      <td style={{ padding: '1rem 0', textAlign: 'right' }}>
                        <button
                          onClick={() => handleAffiliateCommission(aff.id, aff.commissionRate)}
                          className="neon-button" style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}
                        >
                          Toggle Rate
                        </button>
                      </td>
                    </tr>
                  ))}
                  {affiliates.length === 0 && (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-secondary)' }}>No affiliates</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'Coupons':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
            <div style={{
              background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
              borderRadius: '24px', padding: '2rem', height: 'fit-content'
            }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Create Promo Code</h3>
              <form onSubmit={handleAddCoupon} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div>
                  <label style={labelStyle}>Coupon Name (Code)</label>
                  <input type="text" placeholder="e.g. FIFTYOFF" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} style={inputStyle} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={labelStyle}>Discount Type</label>
                    <select value={couponType} onChange={(e) => setCouponType(e.target.value as any)} style={selectStyle}>
                      <option value="PERCENTAGE">Percentage (%)</option>
                      <option value="FIXED">Fixed ($)</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Discount Value</label>
                    <input type="number" min={1} value={couponDiscount} onChange={(e) => setCouponDiscount(Number(e.target.value))} style={inputStyle} required />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={labelStyle}>Usage Limit</label>
                    <input type="number" min={1} value={couponLimit} onChange={(e) => setCouponLimit(Number(e.target.value))} style={inputStyle} required />
                  </div>
                  <div>
                    <label style={labelStyle}>Expiry Date</label>
                    <input type="date" value={couponExpiry} onChange={(e) => setCouponExpiry(e.target.value)} style={inputStyle} required />
                  </div>
                </div>
                <button type="submit" className="neon-button" style={{
                  padding: '0.8rem 1.5rem', fontSize: '0.95rem', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: '0.4rem', alignSelf: 'flex-start', marginTop: '0.5rem'
                }}>
                  <Plus size={16} /> Deploy Promo Code
                </button>
              </form>
            </div>

            <div style={{
              background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
              borderRadius: '24px', padding: '2rem'
            }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Active Promo Codes</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '420px', overflowY: 'auto' }} className="custom-scrollbar">
                {coupons.map((c) => (
                  <div key={c.code} style={{
                    background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)',
                    borderRadius: '12px', padding: '1rem',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <div>
                      <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{c.code}</h4>
                      <span style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                        {c.discountType === 'PERCENTAGE' ? `${c.discountValue}% OFF` : `$${c.discountValue} OFF`} • Exp: {new Date(c.validUntil).toLocaleDateString()}
                      </span>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
                        Used: {c.usedCount} / {c.maxUsage || '∞'} times
                      </p>
                    </div>
                    <button onClick={() => handleDeleteCoupon(c.code)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                      <Trash size={18} />
                    </button>
                  </div>
                ))}
                {coupons.length === 0 && (
                  <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>No promo codes yet</p>
                )}
              </div>
            </div>
          </div>
        );

      case 'CMS':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
            <div style={{
              background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
              borderRadius: '24px', padding: '2rem', height: 'fit-content'
            }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Configure Site Content</h3>
              <form onSubmit={handleCMSUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div>
                  <label style={labelStyle}>Homepage Headline</label>
                  <input type="text" value={editHpTitle} onChange={(e) => setEditHpTitle(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Homepage Subtitle</label>
                  <textarea rows={2} value={editHpSubtitle} onChange={(e) => setEditHpSubtitle(e.target.value)} style={textareaStyle} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={labelStyle}>Pricing Headline</label>
                    <input type="text" value={editPrTitle} onChange={(e) => setEditPrTitle(e.target.value)} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Announcement Notice</label>
                    <input type="text" value={editNotice} onChange={(e) => setEditNotice(e.target.value)} style={inputStyle} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Pricing Subtitle</label>
                  <textarea rows={2} value={editPrSubtitle} onChange={(e) => setEditPrSubtitle(e.target.value)} style={textareaStyle} />
                </div>
                <button type="submit" className="neon-button" style={{
                  padding: '0.8rem 1.5rem', fontSize: '0.95rem', fontWeight: 600, alignSelf: 'flex-start', marginTop: '0.5rem'
                }}>
                  Publish CMS Configurations
                </button>
              </form>
            </div>

            <div style={{
              background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
              borderRadius: '24px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem'
            }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Add FAQ Entry</h3>
              <form onSubmit={handleAddFaq} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div>
                  <label style={labelStyle}>Category</label>
                  <select value={newFaqCat} onChange={(e) => setNewFaqCat(e.target.value)} style={selectStyle}>
                    <option value="General">General</option>
                    <option value="Rules">Rules</option>
                    <option value="Billing">Billing</option>
                    <option value="Tech">Tech</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Question</label>
                  <input type="text" placeholder="e.g. Can I run hedging bots?" value={newFaqQ} onChange={(e) => setNewFaqQ(e.target.value)} style={inputStyle} required />
                </div>
                <div>
                  <label style={labelStyle}>Detailed Answer</label>
                  <textarea rows={4} placeholder="Provide descriptive answer..." value={newFaqA} onChange={(e) => setNewFaqA(e.target.value)} style={textareaStyle} required />
                </div>
                <button type="submit" className="neon-button" style={{ padding: '0.7rem 1.2rem', fontSize: '0.9rem', alignSelf: 'flex-start' }}>
                  Publish FAQ
                </button>
              </form>

              <div style={{ width: '100%', height: '1px', background: 'var(--glass-border)' }} />

              <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>FAQ list preview</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', maxHeight: '200px', overflowY: 'auto' }} className="custom-scrollbar">
                {(JSON.parse(cms.faqList || '[]') as { q: string; a: string; category: string }[]).map((faq: any, i: number) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'rgba(255,255,255,0.01)', padding: '0.6rem 0.8rem',
                    border: '1px solid var(--glass-border)', borderRadius: '8px'
                  }}>
                    <span style={{
                      fontSize: '0.85rem', color: 'var(--text-primary)',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '80%'
                    }}>{faq.q}</span>
                    <button onClick={() => handleDeleteFaq(faq.q)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                      <Trash size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'Analytics':
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

const labelStyle = {
  display: 'block',
  marginBottom: '0.3rem',
  color: 'var(--text-secondary)',
  fontSize: '0.85rem'
};

const inputStyle = {
  width: '100%',
  padding: '0.7rem 1rem',
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid var(--glass-border)',
  borderRadius: '8px',
  color: 'var(--text-primary)',
  fontSize: '0.95rem',
  outline: 'none',
  marginTop: '0.1rem',
  boxSizing: 'border-box' as const
};

const selectStyle = {
  width: '100%',
  padding: '0.7rem 1rem',
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid var(--glass-border)',
  borderRadius: '8px',
  color: 'var(--text-primary)',
  fontSize: '0.95rem',
  outline: 'none',
  marginTop: '0.1rem',
  cursor: 'pointer',
  boxSizing: 'border-box' as const
};

const textareaStyle = {
  width: '100%',
  padding: '0.7rem 1rem',
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid var(--glass-border)',
  borderRadius: '8px',
  color: 'var(--text-primary)',
  fontSize: '0.95rem',
  outline: 'none',
  marginTop: '0.1rem',
  fontFamily: 'inherit',
  resize: 'vertical' as const,
  boxSizing: 'border-box' as const
};