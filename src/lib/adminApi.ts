import { api } from './api';

export interface AdminStats {
  overview: {
    totalUsers: number;
    verifiedUsers: number;
    unverifiedUsers: number;
    activeChallenges: number;
    passedChallenges: number;
    failedChallenges: number;
    totalRevenue: number;
    monthRevenue: number;
    yearRevenue: number;
    pendingPayouts: number;
    pendingKyc: number;
    openTickets: number;
    monthRegistrations: number;
  };
  roleDistribution: { role: string; count: number }[];
  challengePlans: {
    id: string;
    name: string;
    price: number;
    accountSize: number;
    _count: { userChallenges: number };
  }[];
  recentPayments: {
    id: string;
    amount: number;
    currency: string;
    gateway: string;
    status: string;
    createdAt: string;
    user: { id: string; email: string; name: string };
  }[];
  recentRegistrations: {
    id: string;
    email: string;
    name: string;
    createdAt: string;
    isVerified: boolean;
  }[];
}

export interface PaymentItem {
  id: string;
  amount: number;
  currency: string;
  gateway: string;
  status: string;
  description: string | null;
  couponCode: string | null;
  discountAmount: number;
  createdAt: string;
  user: { id: string; email: string; name: string };
}

export interface ChallengeItem {
  id: string;
  status: string;
  currentBalance: number;
  peakBalance: number;
  profit: number;
  trades: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  plan: {
    id: string;
    name: string;
    accountSize: number;
    profitTarget: number;
    maxDrawdown: number;
    durationDays: number;
  };
  user: { id: string; email: string; name: string };
}

export interface PayoutItem {
  id: string;
  amount: number;
  fee: number;
  netAmount: number;
  gateway: string | null;
  accountDetails: string | null;
  status: string;
  adminNote: string | null;
  createdAt: string;
  processedAt: string | null;
  user: { id: string; email: string; name: string };
}

export interface KycItem {
  id: string;
  fullName: string;
  documentType: string;
  documentNumber: string | null;
  status: string;
  adminFeedback: string | null;
  submittedAt: string;
  user: { id: string; email: string; name: string };
}

export interface AffiliateItem {
  id: string;
  email: string;
  name: string;
  affiliateCode: string | null;
  commissionRate: number;
  createdAt: string;
  _count: { referrals: number };
  totalEarnings: number;
}

export interface CouponItem {
  code: string;
  discountType: string;
  discountValue: number;
  minAmount: number | null;
  maxUsage: number | null;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  createdAt: string;
}

export interface UserItem {
  id: string;
  email: string;
  name: string;
  role: string;
  isVerified: boolean;
  isSuspended: boolean;
  isBanned: boolean;
  balance: number;
  totalDeposited: number;
  totalWithdrawn: number;
  affiliateCode: string | null;
  createdAt: string;
  _count: { challenges: number; payments: number; tickets: number };
}

export const adminApi = {
  getStats: () => api.get<AdminStats>('/admin/stats'),
  getPayments: (page = 1, limit = 20, status?: string) =>
    api.get<{ payments: PaymentItem[]; pagination: any }>(`/admin/payments?page=${page}&limit=${limit}${status ? `&status=${status}` : ''}`),
  getChallenges: (page = 1, limit = 20, status?: string) =>
    api.get<{ challenges: ChallengeItem[]; pagination: any }>(`/admin/challenges?page=${page}&limit=${limit}${status ? `&status=${status}` : ''}`),
  upgradeChallenge: (id: string, additionalBalance?: number) =>
    api.post(`/admin/challenges/${id}/upgrade`, { additionalBalance }),
  disableChallenge: (id: string) =>
    api.post(`/admin/challenges/${id}/disable`),
  resetChallenge: (id: string) =>
    api.post(`/challenges/${id}/reset`),
  sendBulkEmail: (subject: string, message: string, target = 'ALL') =>
    api.post<{ message: string; sentCount: number }>('/admin/email/send', { subject, message, target }),
  getCms: () => api.get<Record<string, string>>('/admin/cms'),
  saveCms: (settings: Record<string, string>) =>
    api.post('/admin/cms', { settings }),
  getAnalytics: () => api.get<any>('/admin/analytics'),
  toggleUserStatus: (id: string) =>
    api.post<{ id: string; isSuspended: boolean }>(`/admin/users/${id}/toggle-status`),
  updatePayoutStatus: (id: string, status: string, reason?: string) => {
    if (status === 'APPROVED') return api.put(`/payouts/${id}/approve`);
    if (status === 'REJECTED') return api.put(`/payouts/${id}/reject`, { reason });
    if (status === 'COMPLETED') return api.put(`/payouts/${id}/complete`);
    return Promise.reject(new Error('Invalid status'));
  },
  refundPayment: (paymentId: string) =>
    api.post('/payments/refund', { paymentId }),
  updateKycStatus: (id: string, status: string, feedback?: string) => {
    if (status === 'APPROVED') return api.put(`/kyc/${id}/approve`);
    if (status === 'REJECTED') return api.put(`/kyc/${id}/reject`, { feedback: feedback || 'Documents rejected' });
    return Promise.reject(new Error('Invalid status'));
  },
  updateAffiliateCommission: (userId: string, commissionRate: number) =>
    api.put(`/affiliates/${userId}/commission`, { commissionRate }),
  createCoupon: (data: {
    code: string; discountType: string; discountValue: number;
    validFrom: string; validUntil: string; minAmount?: number; maxUsage?: number;
  }) => api.post('/coupons', data),
  deleteCoupon: (code: string) => api.del(`/coupons/${code}`),
  createChallengePlan: (data: {
    name: string; price: number; accountSize: number;
    profitTarget: number; maxDrawdown: number; durationDays: number;
    description?: string;
  }) => api.post('/challenges', data),
  deleteChallengePlan: (id: string) => api.del(`/challenges/${id}`),
};