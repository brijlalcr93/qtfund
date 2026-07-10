import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../lib/api';

export interface ChallengePackage {
  id: string;
  type: '1-Step' | '2-Step' | 'Instant';
  size: string;
  price: string;
  rules: { label: string; value: string }[];
}

export interface TradingAccount {
  id: string;
  name: string;
  status: 'Funded' | 'Phase 1' | 'Phase 2' | 'Breached';
  balance: number;
  initialBalance: number;
  equity: number;
  leverage: string;
  server: string;
  platform: string;
  createdDate: string;
  winRate: number;
  tradesCount: number;
  profitTarget: number;
  dailyDrawdownLimit: number;
  dailyDrawdownCurrent: number;
  maxDrawdownLimit: number;
  maxDrawdownCurrent: number;
  tradingDaysCurrent: number;
  tradingDaysRequired: number;
  equityHistory: { day: string; equity: number }[];
}

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  author: string;
  date: string;
  readTime: string;
}

export interface LeaderboardItem {
  rank: number;
  name: string;
  country: string;
  payout: number;
  winRate: number;
  profitFactor: number;
}

export interface PayoutItem {
  id: string;
  name: string;
  amount: number;
  method: string;
  time: string;
  status: 'Pending' | 'Approved' | 'Paid' | 'Rejected';
  country: string;
}

export interface TransactionItem {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  description: string;
  method: 'Stripe' | 'PayPal' | 'Razorpay' | 'Crypto';
  status: 'Paid' | 'Refunded';
  date: string;
}

export interface KycSubmission {
  userId: string;
  userName: string;
  userEmail: string;
  documentType: 'Passport' | 'Driver License' | 'Aadhaar' | 'PAN';
  documentNumber: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Resubmission Requested';
  submittedAt: string;
  feedback?: string;
}

export interface Coupon {
  code: string;
  discountPercent: number;
  expiryDate: string;
  usageLimit: number;
  usageCount: number;
  active: boolean;
}

export interface AffiliateInfo {
  userId: string;
  referralCode: string;
  commissionPercent: number;
  referrals: { name: string; date: string; status: 'Signed Up' | 'Purchased'; commission: number }[];
  totalEarned: number;
  pendingPayout: number;
}

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  category: string;
  status: 'Open' | 'Awaiting User Response' | 'Closed';
  date: string;
  messages: { sender: string; text: string; time: string }[];
}

export interface CmsConfig {
  homepageTitle: string;
  homepageSubtitle: string;
  pricingTitle: string;
  pricingSubtitle: string;
  announcement: string;
  faqList: { q: string; a: string; category: string }[];
}

interface PlatformState {
  challengePackages: ChallengePackage[];
  blogPosts: BlogPost[];
  leaderboard: LeaderboardItem[];
  recentPayouts: PayoutItem[];
  transactions: TransactionItem[];
  kycSubmissions: KycSubmission[];
  coupons: Coupon[];
  affiliates: Record<string, AffiliateInfo>;
  tickets: SupportTicket[];
  cms: CmsConfig;
  userAccounts: TradingAccount[];
  adminUsersList: { id: string; email: string; full_name: string; role: string; kyc_status: string }[];
  
  // Sync Actions
  syncWithBackend: () => Promise<void>;
  syncAdminWithBackend: () => Promise<void>;
  
  // Package Actions
  addChallengePackage: (pkg: ChallengePackage) => Promise<void>;
  deleteChallengePackage: (id: string) => Promise<void>;
  
  // Blog actions (remains mocked client-side)
  addBlogPost: (post: BlogPost) => void;
  deleteBlogPost: (slug: string) => void;
  
  // Transaction/Payment Actions
  addTransaction: (tx: TransactionItem) => Promise<void>;
  updateTransactionStatus: (id: string, status: 'Paid' | 'Refunded') => Promise<void>;
  
  // KYC Actions
  submitKyc: (kyc: Omit<KycSubmission, 'status' | 'submittedAt'>) => Promise<void>;
  updateKycStatus: (userId: string, status: KycSubmission['status'], feedback?: string) => Promise<void>;
  
  // Coupon Actions
  addCoupon: (coupon: Omit<Coupon, 'usageCount' | 'active'>) => Promise<void>;
  deleteCoupon: (code: string) => Promise<void>;
  useCoupon: (code: string) => Promise<boolean>;
  
  // Affiliate Actions
  getOrCreateAffiliate: (userId: string, email: string) => Promise<AffiliateInfo>;
  claimAffiliatePayout: (userId: string) => Promise<void>;
  approveAffiliatePayout: (userId: string) => Promise<void>;
  updateAffiliateCommissionRate: (userId: string, rate: number) => Promise<void>;
  
  // Support Actions
  addTicket: (subject: string, category: string, messageText: string) => Promise<void>;
  replyToTicket: (id: string, sender: string, text: string) => Promise<void>;
  updateTicketStatus: (id: string, status: SupportTicket['status']) => Promise<void>;
  
  // Payout Actions
  addPayoutRequest: (accountId: string, amount: number, method: string, country: string) => Promise<void>;
  updatePayoutStatus: (id: string, status: PayoutItem['status'], rejectionReason?: string) => Promise<void>;
  
  // Account Actions
  addUserAccount: (packageId: string, couponCode?: string) => Promise<void>;
  resetUserAccount: (id: string) => Promise<void>;
  updateUserAccount: (id: string, updated: Partial<TradingAccount>) => Promise<void>;
  simulateTrade: (id: string, profitAmount: number, isWin: boolean) => Promise<void>;
}

const defaultFAQ = [
  { q: 'How is maximum drawdown calculated?', a: 'Maximum drawdown is calculated based on the maximum equity balance achieved. If your equity falls below the initial balance minus the limit (e.g. -$10,000 on a $100k account), the account is breached.', category: 'Rules' },
  { q: 'What is the daily loss threshold reset time?', a: 'Daily loss resets daily at 00:00 UTC (Server Time). The daily loss limit is calculated as 5% of the starting equity balance of the respective day.', category: 'Rules' },
  { q: 'How fast do profit withdrawals process?', a: 'Withdrawals are processed instantly in USDC/USDT or within 24-48 business hours via bank wire, directly through the billing dashboard.', category: 'Billing' },
  { q: 'Can I trade crypto over the weekends?', a: 'Yes, crypto assets (like BTCUSDT, ETHUSDT) are fully available for simulated live execution 24/7. Forex assets trade standard hours.', category: 'Tech' },
  { q: 'What instruments are supported on the platform?', a: 'We support simulated execution on major and minor Forex pairs, Gold and Silver commodities, major Stock Indices (US30, GER30, SPX500), Cryptocurrencies, and Crude Oil.', category: 'General' },
  { q: 'Is there a consistency rule for withdrawals?', a: 'We promote professional risk practices. We require traders to avoid speculative lot sizing; average trade sizes should not deviate more than 2x from the baseline.', category: 'Rules' }
];

export const usePlatformStore = create<PlatformState>()(
  persist(
    (set, get) => ({
      userAccounts: [],
      challengePackages: [],
      blogPosts: [
        {
          slug: 'mastering-drawdown-rules-prop-firm',
          title: 'Mastering Drawdown Rules in Prop Firm Trading',
          excerpt: 'Drawdown violations are the #1 reason traders fail evaluations. Discover actionable risk-management strategies to stay compliant.',
          content: 'Proprietary trading evaluations represent a highly rewarding but strict test of a trader\'s risk disciplines. The two major constraints are the Daily Drawdown and the Maximum Overall Drawdown. Under our standard models, a daily limit of 5% means that if a trader\'s equity drops by 5% of the starting balance of the day, their account is locked. This guide outlines how to size positions dynamically, apply appropriate hard-stop orders, and maintain a calm psychology so you never breach these limits. Focus on keeping your risk-per-trade below 1% and average risk-to-reward ratio above 1:2 to ensure mathematical longevity.',
          category: 'Risk Management',
          tags: ['Drawdown', 'Strategy', 'Rules'],
          author: 'Brijlal CR (Funded Expert)',
          date: 'May 28, 2026',
          readTime: '6 min read'
        },
        {
          slug: 'funded-trader-checklist-scale-capital',
          title: 'The Funded Trader Checklist: Scaling to $1 Million',
          excerpt: 'Passing the challenge is just the beginning. Learn the consistency standards required to unlock our $1M premium scaling plan.',
          content: 'Unlocking funded capital of up to $1M with a 90% profit share requires more than just high-performance streaks. It requires institutional consistency. Once you transition to a Funded Live partner account, you are trading simulated capital where profits translate directly to real-world payouts. To scale your account size, you must maintain a profitable month-on-month record of at least 10% gain over 3 months without any rule flags. This article covers advanced trading psychology, coping with drawdowns under pressure, and how to file formal payout and scaling requests.',
          category: 'Capital Scaling',
          tags: ['Scaling', 'Consistency', 'Funded Account'],
          author: 'Sarah Jenkins (Chief Risk Analyst)',
          date: 'May 15, 2026',
          readTime: '8 min read'
        }
      ],
      leaderboard: [
        { rank: 1, name: 'Brijlal CR', country: 'IN', payout: 154820.00, winRate: 72.1, profitFactor: 2.85 },
        { rank: 2, name: 'Niklas Brandt', country: 'DE', payout: 98450.00, winRate: 68.4, profitFactor: 2.42 }
      ],
      recentPayouts: [],
      transactions: [],
      kycSubmissions: [],
      coupons: [],
      affiliates: {},
      tickets: [],
      adminUsersList: [],
      cms: {
        homepageTitle: 'Institutional-Grade Funding.',
        homepageSubtitle: 'Unlock up to $1M in institutional trading capital. Keep up to 90% of the profits with zero drawdown liability.',
        pricingTitle: 'Choose Your Challenge.',
        pricingSubtitle: 'Select from our evaluation frameworks designed to measure consistency and reward professional risk parameters.',
        announcement: '🔥 FLASH SALE: Use coupon WELCOME15 for 15% off all 2-Step challenges! Ending soon.',
        faqList: defaultFAQ
      },
      
      // Sync Actions
      syncWithBackend: async () => {
        try {
          const packages = await api.get<ChallengePackage[]>('/dashboard/packages');
          const accounts = await api.get<TradingAccount[]>('/dashboard/accounts');
          const payouts = await api.get<PayoutItem[]>('/payouts');
          const kyc = await api.get<KycSubmission>('/kyc');
          const tickets = await api.get<SupportTicket[]>('/support/tickets');
          const affiliateProfile = await api.get<AffiliateInfo>('/affiliates/profile');
          const txHistory = await api.get<TransactionItem[]>('/payments/history');

          set({
            challengePackages: packages,
            userAccounts: accounts.map(a => ({
              id: a.id,
              name: a.name,
              status: a.status,
              balance: parseFloat(a.balance as any),
              initialBalance: parseFloat(a.initialBalance as any),
              equity: parseFloat(a.equity as any),
              leverage: a.leverage,
              server: a.server,
              platform: a.platform,
              createdDate: new Date(a.createdDate || (a as any).created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              winRate: parseFloat(a.winRate as any),
              tradesCount: a.tradesCount,
              profitTarget: parseFloat(a.profitTarget as any),
              dailyDrawdownLimit: parseFloat(a.dailyDrawdownLimit as any),
              dailyDrawdownCurrent: parseFloat(a.dailyDrawdownCurrent as any),
              maxDrawdownLimit: parseFloat(a.maxDrawdownLimit as any),
              maxDrawdownCurrent: parseFloat(a.maxDrawdownCurrent as any),
              tradingDaysCurrent: a.tradingDaysCurrent,
              tradingDaysRequired: a.tradingDaysRequired,
              equityHistory: (a as any).equity_history || a.equityHistory || []
            })),
            recentPayouts: payouts.map(p => ({
              id: p.id,
              name: p.name,
              amount: parseFloat(p.amount as any),
              method: p.method,
              time: new Date((p as any).created_at).toLocaleDateString('en-US'),
              status: p.status,
              country: p.country
            })),
            kycSubmissions: kyc ? [kyc] : [],
            tickets: tickets.map(t => ({
              id: t.id,
              userId: t.userId,
              subject: t.subject,
              category: t.category,
              status: t.status,
              date: new Date((t as any).created_at).toLocaleDateString('en-US'),
              messages: t.messages || []
            })),
            affiliates: affiliateProfile ? { [affiliateProfile.userId]: affiliateProfile } : {},
            transactions: txHistory.map(t => ({
              id: t.id,
              userId: t.userId,
              userName: t.userName,
              userEmail: t.userEmail,
              amount: parseFloat(t.amount as any),
              description: t.description,
              method: t.method,
              status: t.status,
              date: new Date((t as any).date).toLocaleDateString('en-US')
            }))
          });
        } catch (error) {
          console.warn('Sync failed: backend offline or server unreachable, running with mock cache', error);
        }
      },

      syncAdminWithBackend: async () => {
        try {
          const users = await api.get<any[]>('/admin/users');
          const kycList = await api.get<KycSubmission[]>('/admin/kyc');
          const payouts = await api.get<PayoutItem[]>('/admin/payouts');
          const coupons = await api.get<Coupon[]>('/admin/coupons');
          const metrics = await api.get<any>('/admin/metrics');

          set({
            adminUsersList: users,
            kycSubmissions: kycList,
            recentPayouts: payouts.map(p => ({
              id: p.id,
              name: p.name,
              amount: parseFloat(p.amount as any),
              method: p.method,
              time: new Date((p as any).created_at || Date.now()).toLocaleDateString('en-US'),
              status: p.status,
              country: p.country
            })),
            coupons: coupons.map(c => ({
              code: c.code,
              discountPercent: parseFloat(c.discountPercent as any || (c as any).discount_percent),
              expiryDate: new Date((c as any).expiry_date || c.expiryDate).toLocaleDateString('en-US'),
              usageLimit: c.usageLimit || (c as any).usage_limit,
              usageCount: c.usageCount || (c as any).usage_count,
              active: c.active
            }))
          });
        } catch (error) {
          console.warn('Admin Sync failed', error);
        }
      },

      // Package Actions
      addChallengePackage: async (pkg) => {
        try {
          await api.post('/admin/plans', pkg);
          await get().syncWithBackend();
        } catch (error) {
          console.error('Failed to add package:', error);
        }
      },

      deleteChallengePackage: async (id) => {
        try {
          await api.del(`/admin/plans/${id}`);
          await get().syncWithBackend();
        } catch (error) {
          console.error('Failed to delete package:', error);
        }
      },

      // Blog (Mock client-side)
      addBlogPost: (post) => set((state) => ({
        blogPosts: [post, ...state.blogPosts]
      })),
      deleteBlogPost: (slug) => set((state) => ({
        blogPosts: state.blogPosts.filter((post) => post.slug !== slug)
      })),

      // Transaction/Payment Actions
      addTransaction: async (tx) => {
        // Backend handles transactional items automatically during checkout, but mock fallback
        set((state) => ({ transactions: [tx, ...state.transactions] }));
      },

      updateTransactionStatus: async (id, status) => {
        // Typically triggered via Stripe webhooks or admin panel refund override
        try {
          await api.put(`/admin/transactions/${id}`, { status });
          await get().syncWithBackend();
        } catch {
          set((state) => ({
            transactions: state.transactions.map((tx) => tx.id === id ? { ...tx, status } : tx)
          }));
        }
      },

      // KYC Actions
      submitKyc: async (kyc) => {
        try {
          await api.post('/kyc', kyc);
          await get().syncWithBackend();
        } catch (error) {
          console.error('KYC submission failed:', error);
        }
      },

      updateKycStatus: async (userId, status, feedback) => {
        try {
          await api.put(`/admin/kyc/${userId}`, { status, feedback });
          await get().syncAdminWithBackend();
        } catch (error) {
          console.error('Failed updating KYC:', error);
        }
      },

      // Coupon Actions
      addCoupon: async (coupon) => {
        try {
          await api.post('/admin/coupons', coupon);
          await get().syncAdminWithBackend();
        } catch (error) {
          console.error('Coupon add failed:', error);
        }
      },

      deleteCoupon: async (code) => {
        try {
          await api.del(`/admin/coupons/${code}`);
          await get().syncAdminWithBackend();
        } catch (error) {
          console.error('Coupon delete failed:', error);
        }
      },

      useCoupon: async (code) => {
        try {
          const res = await api.get<{ active: boolean }>(`/admin/coupons/check/${code}`);
          return res.active;
        } catch {
          // Client-side fallback checks
          const c = get().coupons.find(coupon => coupon.code === code && coupon.active);
          return !!c;
        }
      },

      // Affiliate Actions
      getOrCreateAffiliate: async (userId, email) => {
        try {
          const profile = await api.get<AffiliateInfo>('/affiliates/profile');
          set((state) => ({ affiliates: { ...state.affiliates, [userId]: profile } }));
          return profile;
        } catch {
          // Fallback mockup
          const fallback = {
            userId,
            referralCode: email.split('@')[0].toUpperCase() + '_QTM',
            commissionPercent: 10,
            referrals: [],
            totalEarned: 0,
            pendingPayout: 0
          };
          return fallback;
        }
      },

      claimAffiliatePayout: async (userId) => {
        try {
          await api.post('/affiliates/claim-payout');
          await get().syncWithBackend();
        } catch (error) {
          console.error('Affiliate claim failed:', error);
        }
      },

      approveAffiliatePayout: async (userId) => {
        try {
          await api.put(`/admin/affiliates/payouts/${userId}`, { status: 'Paid' });
          await get().syncAdminWithBackend();
        } catch (error) {
          console.error('Approve affiliate payout failed:', error);
        }
      },

      updateAffiliateCommissionRate: async (userId, rate) => {
        try {
          await api.put(`/admin/affiliates/rate/${userId}`, { rate });
          await get().syncAdminWithBackend();
        } catch (error) {
          console.error('Update affiliate rate failed:', error);
        }
      },

      // Support Actions
      addTicket: async (subject, category, messageText) => {
        try {
          await api.post('/support/tickets', { subject, category, messageText });
          await get().syncWithBackend();
        } catch (error) {
          console.error('Support ticket creation failed:', error);
        }
      },

      replyToTicket: async (id, sender, text) => {
        try {
          await api.post(`/support/tickets/${id}/messages`, { text });
          await get().syncWithBackend();
        } catch (error) {
          console.error('Post ticket reply failed:', error);
        }
      },

      updateTicketStatus: async (id, status) => {
        try {
          await api.put(`/support/tickets/${id}/status`, { status });
          await get().syncWithBackend();
        } catch (error) {
          console.error('Update ticket status failed:', error);
        }
      },

      // Payout Actions
      addPayoutRequest: async (accountId, amount, method, country) => {
        try {
          await api.post('/payouts', { accountId, amount, method, country });
          await get().syncWithBackend();
        } catch (error) {
          console.error('Payout request failed:', error);
          throw error;
        }
      },

      updatePayoutStatus: async (id, status, rejectionReason) => {
        try {
          await api.put(`/admin/payouts/${id}`, { status, rejectionReason });
          await get().syncAdminWithBackend();
        } catch (error) {
          console.error('Payout update failed:', error);
        }
      },

      // Account Actions
      addUserAccount: async (packageId, couponCode) => {
        try {
          await api.post('/dashboard/accounts', { packageId, couponCode });
          await get().syncWithBackend();
        } catch (error) {
          console.error('Account purchase failed:', error);
        }
      },

      resetUserAccount: async (id) => {
        try {
          await api.post(`/dashboard/accounts/${id}/reset`);
          await get().syncWithBackend();
        } catch (error) {
          console.error('Account reset failed:', error);
        }
      },

      updateUserAccount: async (id, updated) => {
        // Perform direct simulation on server
        try {
          await api.put(`/dashboard/accounts/${id}`, updated);
          await get().syncWithBackend();
        } catch {
          // Client-side fallback state adjustment
          set((state) => ({
            userAccounts: state.userAccounts.map(acc => acc.id === id ? { ...acc, ...updated } : acc)
          }));
        }
      },

      simulateTrade: async (id, profitAmount, isWin) => {
        try {
          await api.post(`/dashboard/accounts/${id}/simulate-trade`, { profitAmount, isWin });
          await get().syncWithBackend();
        } catch (error) {
          console.error('Trade simulation failed:', error);
        }
      }
    }),
    {
      name: 'quantum_platform_storage',
    }
  )
);
