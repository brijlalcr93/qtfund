export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  isVerified: boolean;
  isSuspended: boolean;
  isBanned: boolean;
  balance: number;
  totalDeposited: number;
  totalWithdrawn: number;
  affiliateCode?: string;
  commissionRate: number;
  referredBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChallengePlan {
  id: string;
  name: string;
  description?: string;
  price: number;
  accountSize: number;
  profitTarget: number;
  maxDrawdown: number;
  durationDays: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ChallengeStatus = 'ACTIVE' | 'PASSED' | 'FAILED' | 'EXPIRED' | 'RESET';

export interface UserChallenge {
  id: string;
  userId: string;
  planId: string;
  plan?: ChallengePlan;
  status: ChallengeStatus;
  currentBalance: number;
  peakBalance: number;
  profit: number;
  trades: number;
  startDate: string;
  endDate: string;
  lastActivityDate: string;
  resetCount: number;
  createdAt: string;
  updatedAt: string;
}

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  gateway: string;
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  gatewaySignature?: string;
  status: PaymentStatus;
  description?: string;
  challengePlanId?: string;
  couponCode?: string;
  discountAmount: number;
  createdAt: string;
  updatedAt: string;
}

export type PayoutStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';

export interface Payout {
  id: string;
  userId: string;
  amount: number;
  fee: number;
  netAmount: number;
  gateway?: string;
  accountDetails?: string;
  status: PayoutStatus;
  adminNote?: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type KycStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface KycSubmission {
  id: string;
  userId: string;
  fullName: string;
  dateOfBirth?: string;
  nationality?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  documentType: string;
  documentNumber?: string;
  documentFront: string;
  documentBack?: string;
  selfie?: string;
  status: KycStatus;
  adminFeedback?: string;
  submittedAt: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface Ticket {
  id: string;
  userId: string;
  subject: string;
  description: string;
  priority: string;
  status: TicketStatus;
  assignedTo?: string;
  messages?: TicketMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  userId: string;
  message: string;
  isStaff: boolean;
  createdAt: string;
}

export type NotificationType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'PAYOUT' | 'CHALLENGE' | 'KYC' | 'TRADE' | 'AFFILIATE';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface AffiliateInfo {
  userId: string;
  referralCode: string;
  commissionPercent: number;
  referrals: { name: string; date: string; status: 'Signed Up' | 'Purchased'; commission: number }[];
  totalEarned: number;
  pendingPayout: number;
}

export interface Coupon {
  code: string;
  discountType: string;
  discountValue: number;
  minAmount?: number;
  maxUsage?: number;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  createdAt: string;
}

export interface AdminStats {
  totalUsers: number;
  activeChallenges: number;
  totalRevenue: number;
  totalPayouts: number;
  pendingKyc: number;
  openTickets: number;
  recentRegistrations: { date: string; count: number }[];
  revenueByDay: { date: string; amount: number }[];
  challengeSuccessRate: number;
  averagePayoutTime: number;
  topPerformers: { name: string; profit: number; payout: number }[];
}
