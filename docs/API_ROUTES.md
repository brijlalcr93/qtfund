# API Reference

Base URL: `/api`

Authentication: `Authorization: Bearer <accessToken>`

---

## Auth (`/api/auth`)

### POST `/register`
Create a new user account.

- **Auth**: None
- **Role**: Any

**Request Body:**
```ts
{
  email: string;    // valid email
  password: string;  // min 8 characters
  name: string;      // min 1 character
}
```

**Response** `201`:
```ts
{
  message: "Registration successful. Please check your email to verify your account.";
  userId: string;
}
```

**Example:**
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"trader@example.com","password":"securePass123","name":"John Doe"}'
```

---

### POST `/login`
Authenticate user credentials.

- **Auth**: None
- **Role**: Any

**Request Body:**
```ts
{
  email: string;
  password: string;
}
```

**Response** `200` (without 2FA):
```ts
{
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: "USER" | "ADMIN" | "SUPER_ADMIN";
  };
}
```

**Response** `200` (with 2FA enabled):
```ts
{
  requiresTwoFactor: true;
  userId: string;
}
```

**Example:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"trader@example.com","password":"securePass123"}'
```

---

### POST `/refresh`
Rotate access token using a valid refresh token.

- **Auth**: None
- **Role**: Any

**Request Body:**
```ts
{
  refreshToken: string;
}
```

**Response** `200`:
```ts
{
  accessToken: string;
  refreshToken: string;
}
```

**Example:**
```bash
curl -X POST http://localhost:3001/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"eyJhbGciOiJIUzI1NiIs..."}'
```

---

### POST `/logout`
Invalidate refresh token.

- **Auth**: None
- **Role**: Any

**Request Body:**
```ts
{
  refreshToken?: string;
}
```

**Response** `200`:
```ts
{
  message: "Logged out successfully";
}
```

---

### POST `/forgot-password`
Request a password reset email.

- **Auth**: None
- **Role**: Any

**Request Body:**
```ts
{
  email: string;
}
```

**Response** `200`:
```ts
{
  message: "If that email is registered, a reset link has been sent.";
}
```

---

### POST `/reset-password`
Reset password using token from email.

- **Auth**: None
- **Role**: Any

**Request Body:**
```ts
{
  token: string;
  password: string;  // min 8 characters
}
```

**Response** `200`:
```ts
{
  message: "Password reset successful";
}
```

---

### GET `/verify-email/:token`
Verify email address using token.

- **Auth**: None
- **Role**: Any

**Response** `200`:
```ts
{
  message: "Email verified successfully";
}
```

---

### GET `/me`
Get authenticated user profile.

- **Auth**: Required
- **Role**: Any

**Response** `200`:
```ts
{
  id: string;
  email: string;
  name: string;
  role: "USER" | "ADMIN" | "SUPER_ADMIN";
  isVerified: boolean;
  twoFactorEnabled: boolean;
  balance: number;
  totalDeposited: number;
  totalWithdrawn: number;
  affiliateCode: string | null;
  commissionRate: number;
  createdAt: string;
}
```

**Example:**
```bash
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

---

### PUT `/me`
Update profile (name).

- **Auth**: Required
- **Role**: Any

**Request Body:**
```ts
{
  name?: string;
}
```

**Response** `200`:
```ts
{
  id: string;
  email: string;
  name: string;
  role: "USER" | "ADMIN" | "SUPER_ADMIN";
}
```

---

### POST `/2fa/enable`
Initialize 2FA setup (generates secret).

- **Auth**: Required
- **Role**: Any

**Response** `200`:
```ts
{
  message: "2FA setup initiated";
  secret: string;
  otpauthUrl: string;
}
```

---

### POST `/2fa/verify`
Verify and enable 2FA with TOTP token.

- **Auth**: Required
- **Role**: Any

**Request Body:**
```ts
{
  token: string;
}
```

**Response** `200`:
```ts
{
  message: "2FA enabled successfully";
}
```

---

### POST `/2fa/disable`
Disable 2FA for the authenticated user.

- **Auth**: Required
- **Role**: Any

**Response** `200`:
```ts
{
  message: "2FA disabled successfully";
}
```

---

## Users (`/api/users`)

### GET `/`
List users with pagination, search, and filters.

- **Auth**: Required
- **Role**: `ADMIN`, `SUPER_ADMIN`

**Query Parameters:**
```ts
page?: number;     // default 1
limit?: number;    // default 20
search?: string;   // searches email and name
role?: string;     // filter by role
status?: string;   // "active" | "suspended" | "banned"
```

**Response** `200`:
```ts
{
  users: Array<{
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
    _count: {
      challenges: number;
      payments: number;
      tickets: number;
    };
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

**Example:**
```bash
curl -X GET "http://localhost:3001/api/users?page=1&limit=10&status=active" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

---

### GET `/:id`
Get user details by ID.

- **Auth**: Required
- **Role**: `ADMIN`, `SUPER_ADMIN`

**Response** `200`:
```ts
{
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
  commissionRate: number;
  referredBy: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    challenges: number;
    payments: number;
    payouts: number;
    kycSubmissions: number;
    tickets: number;
  };
}
```

---

### PUT `/:id`
Update user details.

- **Auth**: Required
- **Role**: `ADMIN`, `SUPER_ADMIN`

**Request Body:**
```ts
{
  name?: string;
  role?: "USER" | "ADMIN" | "SUPER_ADMIN";
  commissionRate?: number;  // 0-100
}
```

**Response** `200`:
```ts
{
  id: string;
  email: string;
  name: string;
  role: string;
  commissionRate: number;
}
```

---

### DELETE `/:id`
Permanently delete a user.

- **Auth**: Required
- **Role**: `SUPER_ADMIN`

**Response** `200`:
```ts
{
  message: "User deleted successfully";
}
```

---

### POST `/:id/suspend`
Suspend a user account.

- **Auth**: Required
- **Role**: `ADMIN`, `SUPER_ADMIN`

**Response** `200`:
```ts
{
  id: string;
  isSuspended: true;
}
```

---

### POST `/:id/ban`
Ban a user account (also suspends and revokes refresh tokens).

- **Auth**: Required
- **Role**: `SUPER_ADMIN`

**Response** `200`:
```ts
{
  id: string;
  isBanned: true;
}
```

---

### POST `/:id/balance`
Adjust user balance.

- **Auth**: Required
- **Role**: `ADMIN`, `SUPER_ADMIN`

**Request Body:**
```ts
{
  amount: number;
  type: "ADD" | "SUBTRACT" | "SET";
  reason?: string;
}
```

**Response** `200`:
```ts
{
  balance: number;
}
```

**Example:**
```bash
curl -X POST http://localhost:3001/api/users/user123/balance \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{"amount":500,"type":"ADD","reason":"Promotional credit"}'
```

---

## Challenges (`/api/challenges`)

### GET `/`
List active challenge plans (public).

- **Auth**: None
- **Role**: Any

**Response** `200`:
```ts
Array<{
  id: string;
  name: string;
  description: string | null;
  price: number;
  accountSize: number;
  profitTarget: number;
  maxDrawdown: number;
  durationDays: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}>
```

---

### POST `/`
Create a new challenge plan.

- **Auth**: Required
- **Role**: `ADMIN`, `SUPER_ADMIN`

**Request Body:**
```ts
{
  name: string;
  description?: string;
  price: number;          // >= 0
  accountSize: number;     // >= 0
  profitTarget: number;    // >= 0
  maxDrawdown: number;     // >= 0
  durationDays: number;    // >= 1
}
```

**Response** `201`: ChallengePlan object

---

### PUT `/:id`
Update a challenge plan.

- **Auth**: Required
- **Role**: `ADMIN`, `SUPER_ADMIN`

**Request Body:** (partial)
```ts
{
  name?: string;
  description?: string;
  price?: number;
  accountSize?: number;
  profitTarget?: number;
  maxDrawdown?: number;
  durationDays?: number;
  isActive?: boolean;
}
```

**Response** `200`: Updated ChallengePlan object

---

### DELETE `/:id`
Deactivate a challenge plan (soft delete).

- **Auth**: Required
- **Role**: `ADMIN`, `SUPER_ADMIN`

**Response** `200`:
```ts
{
  message: "Challenge plan deactivated";
}
```

---

### GET `/user`
Get authenticated user's purchased challenges.

- **Auth**: Required
- **Role**: Any

**Response** `200`:
```ts
Array<{
  id: string;
  userId: string;
  planId: string;
  status: "ACTIVE" | "PASSED" | "FAILED" | "EXPIRED" | "RESET";
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
  plan: ChallengePlan;
}>
```

---

### POST `/purchase`
Purchase a challenge plan.

- **Auth**: Required
- **Role**: Any

**Request Body:**
```ts
{
  planId: string;
  paymentId: string;  // must be COMPLETED and belong to user
}
```

**Response** `201`:
```ts
{
  id: string;
  userId: string;
  planId: string;
  status: "ACTIVE";
  currentBalance: number;
  peakBalance: number;
  startDate: string;
  endDate: string;
  lastActivityDate: string;
  plan: ChallengePlan;
}
```

---

### POST `/:id/reset`
Reset a user's challenge (admin only).

- **Auth**: Required
- **Role**: `ADMIN`, `SUPER_ADMIN`

**Response** `200`: Updated UserChallenge object

---

## Payments (`/api/payments`)

### POST `/create-order`
Create a payment order via gateway.

- **Auth**: Required
- **Role**: Any

**Request Body:**
```ts
{
  amount: number;                    // >= 1
  currency?: string;                 // default "INR"
  gateway: "razorpay" | "stripe";
  challengePlanId?: string;
  couponCode?: string;
}
```

**Response** `200` (Razorpay):
```ts
{
  gateway: "razorpay";
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  paymentId: string;
}
```

**Response** `200` (Stripe):
```ts
{
  gateway: "stripe";
  clientSecret: string;
  paymentId: string;
}
```

**Example:**
```bash
curl -X POST http://localhost:3001/api/payments/create-order \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{"amount":99,"gateway":"stripe","currency":"usd"}'
```

---

### POST `/verify`
Verify a completed payment.

- **Auth**: Required
- **Role**: Any

**Request Body:**
```ts
{
  paymentId: string;
  gateway: "razorpay" | "stripe";
  gatewayPaymentId?: string;
  gatewaySignature?: string;  // required for Razorpay
}
```

**Response** `200`:
```ts
{
  message: "Payment verified successfully";
  payment: {
    ...Payment,
    status: "COMPLETED";
  };
}
```

---

### POST `/refund`
Refund a completed payment (admin).

- **Auth**: Required
- **Role**: `ADMIN`, `SUPER_ADMIN`

**Request Body:**
```ts
{
  paymentId: string;
}
```

**Response** `200`:
```ts
{
  message: "Payment refunded successfully";
}
```

---

### GET `/history`
Get authenticated user's payment history.

- **Auth**: Required
- **Role**: Any

**Query Parameters:**
```ts
page?: number;   // default 1
limit?: number;  // default 20
```

**Response** `200`:
```ts
{
  payments: Payment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

---

### POST `/webhook/razorpay`
Razorpay webhook handler (payment.captured event).

- **Auth**: None (signature-verified)
- **Role**: Any

**Response** `200`:
```ts
{
  received: true;
}
```

---

### POST `/webhook/stripe`
Stripe webhook handler (payment_intent.succeeded event).

- **Auth**: None (signature-verified)
- **Role**: Any

**Response** `200`:
```ts
{
  received: true;
}
```

---

## Payouts (`/api/payouts`)

### POST `/request`
Request a payout.

- **Auth**: Required
- **Role**: Any

**Request Body:**
```ts
{
  amount: number;          // >= 10
  gateway?: string;
  accountDetails: string;  // payout destination
}
```

**Response** `201`:
```ts
{
  id: string;
  userId: string;
  amount: number;
  fee: number;         // 2% processing fee
  netAmount: number;
  gateway: string | null;
  accountDetails: string;
  status: "PENDING";
  createdAt: string;
  updatedAt: string;
}
```

**Example:**
```bash
curl -X POST http://localhost:3001/api/payouts/request \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{"amount":500,"accountDetails":"USDT TRC20: TXyz..."}'
```

---

### GET `/`
List all payouts with pagination (admin).

- **Auth**: Required
- **Role**: `ADMIN`, `SUPER_ADMIN`

**Query Parameters:**
```ts
page?: number;
limit?: number;
status?: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";
```

**Response** `200`:
```ts
{
  payouts: Array<{
    ...Payout;
    user: { id: string; email: string; name: string };
  }>;
  pagination: { page: number; limit: number; total: number; totalPages: number };
}
```

---

### GET `/user`
Get authenticated user's payout requests.

- **Auth**: Required
- **Role**: Any

**Response** `200`:
```ts
{
  payouts: Payout[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}
```

---

### PUT `/:id/approve`
Approve a pending payout.

- **Auth**: Required
- **Role**: `ADMIN`, `SUPER_ADMIN`

**Response** `200`:
```ts
{
  message: "Payout approved";
}
```

---

### PUT `/:id/reject`
Reject a pending payout (refunds balance).

- **Auth**: Required
- **Role**: `ADMIN`, `SUPER_ADMIN`

**Request Body:**
```ts
{
  reason?: string;
}
```

**Response** `200`:
```ts
{
  message: "Payout rejected";
}
```

---

### PUT `/:id/complete`
Mark an approved payout as completed.

- **Auth**: Required
- **Role**: `ADMIN`, `SUPER_ADMIN`

**Response** `200`:
```ts
{
  message: "Payout completed";
}
```

---

### GET `/export`
Export payouts as CSV.

- **Auth**: Required
- **Role**: `ADMIN`, `SUPER_ADMIN`

**Query Parameters:**
```ts
status?: string;
```

**Response** `200` (text/csv):
```
ID,User,Email,Amount,Fee,Net Amount,Status,Account Details,Created At,Processed At
```

---

## KYC (`/api/kyc`)

### POST `/submit`
Submit KYC documents.

- **Auth**: Required
- **Role**: Any

**Request Body:** (multipart/form-data)
```ts
documentFront: File;     // required - image/pdf
documentBack?: File;     // optional
selfie?: File;           // optional
fullName: string;
documentType: "PASSPORT" | "DRIVERS_LICENSE" | "NATIONAL_ID" | "RESIDENCE_PERMIT";
documentNumber?: string;
dateOfBirth?: string;
nationality?: string;
address?: string;
city?: string;
state?: string;
postalCode?: string;
country?: string;
```

**Response** `201`:
```ts
{
  message: "KYC documents submitted successfully";
  kycId: string;
}
```

**Example:**
```bash
curl -X POST http://localhost:3001/api/kyc/submit \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -F "documentFront=@passport.jpg" \
  -F "fullName=John Doe" \
  -F "documentType=PASSPORT"
```

---

### GET `/status`
Get authenticated user's KYC status.

- **Auth**: Required
- **Role**: Any

**Response** `200`:
```ts
{
  status: "NOT_SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED";
  adminFeedback?: string;
  submittedAt?: string;
  reviewedAt?: string;
}
```

---

### GET `/`
List all KYC submissions (admin).

- **Auth**: Required
- **Role**: `ADMIN`, `SUPER_ADMIN`

**Query Parameters:**
```ts
page?: number;
limit?: number;
status?: "PENDING" | "APPROVED" | "REJECTED";
```

**Response** `200`:
```ts
{
  submissions: Array<{
    ...Kyc;
    user: { id: string; email: string; name: string };
  }>;
  pagination: { page: number; limit: number; total: number; totalPages: number };
}
```

---

### PUT `/:id/approve`
Approve a KYC submission.

- **Auth**: Required
- **Role**: `ADMIN`, `SUPER_ADMIN`

**Response** `200`:
```ts
{
  message: "KYC approved successfully";
}
```

---

### PUT `/:id/reject`
Reject a KYC submission with feedback.

- **Auth**: Required
- **Role**: `ADMIN`, `SUPER_ADMIN`

**Request Body:**
```ts
{
  feedback: string;
}
```

**Response** `200`:
```ts
{
  message: "KYC rejected with feedback";
}
```

---

## Tickets (`/api/tickets`)

### POST `/`
Create a support ticket.

- **Auth**: Required
- **Role**: Any

**Request Body:**
```ts
{
  subject: string;
  description: string;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";  // default MEDIUM
}
```

**Response** `201`: Ticket object with initial message

---

### GET `/`
List authenticated user's tickets.

- **Auth**: Required
- **Role**: Any

**Query Parameters:**
```ts
page?: number;
limit?: number;
```

**Response** `200`:
```ts
{
  tickets: Array<{
    ...Ticket;
    messages: [{ message: string; createdAt: string }];  // last message
    _count: { messages: number };
  }>;
  pagination: { page: number; limit: number; total: number; totalPages: number };
}
```

---

### GET `/all`
List all tickets (admin).

- **Auth**: Required
- **Role**: `ADMIN`, `SUPER_ADMIN`

**Query Parameters:**
```ts
page?: number;
limit?: number;
status?: string;
priority?: string;
```

**Response** `200`:
```ts
{
  tickets: Array<{
    ...Ticket;
    user: { id: string; email: string; name: string };
    _count: { messages: number };
  }>;
  pagination: { ... };
}
```

---

### GET `/:id`
Get ticket details with all messages.

- **Auth**: Required
- **Role**: Any (user owns ticket OR admin)

**Response** `200`:
```ts
{
  ...Ticket;
  user: { id: string; email: string; name: string };
  messages: Array<{
    ...TicketMessage;
    user: { id: string; email: string; name: string; role: string };
  }>;
}
```

---

### POST `/:id/reply`
Reply to a ticket.

- **Auth**: Required
- **Role**: Any (user owns ticket OR admin)

**Request Body:**
```ts
{
  message: string;
}
```

**Response** `201`:
```ts
{
  ...TicketMessage;
  user: { id: string; email: string; name: string; role: string };
}
```

---

### PUT `/:id/status`
Update ticket status (admin).

- **Auth**: Required
- **Role**: `ADMIN`, `SUPER_ADMIN`

**Request Body:**
```ts
{
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
}
```

**Response** `200`: Updated Ticket object

---

### PUT `/:id/assign`
Assign ticket to an admin.

- **Auth**: Required
- **Role**: `ADMIN`, `SUPER_ADMIN`

**Request Body:**
```ts
{
  assignedTo?: string;  // admin user ID, null to unassign
}
```

**Response** `200`: Updated Ticket object

---

## Affiliates (`/api/affiliates`)

### GET `/dashboard`
Get affiliate dashboard data.

- **Auth**: Required
- **Role**: Any

**Response** `200`:
```ts
{
  affiliateCode: string;
  commissionRate: number;
  referredBy: string | null;
  stats: {
    totalReferrals: number;
    convertedReferrals: number;
    totalEarnings: number;
    pendingEarnings: number;
  };
  referrals: Array<{
    id: string;
    referrerId: string;
    referredEmail: string;
    referredId: string | null;
    commission: number;
    isConverted: boolean;
    createdAt: string;
  }>;
}
```

---

### POST `/claim`
Claim affiliate earnings.

- **Auth**: Required
- **Role**: Any

**Request Body:**
```ts
{
  amount: number;  // >= 1, must not exceed pending earnings
}
```

**Response** `200`:
```ts
{
  message: "Successfully claimed $X.XX";
}
```

---

### GET `/referrals`
List authenticated user's referrals.

- **Auth**: Required
- **Role**: Any

**Response** `200`: Array of Referral objects with referrer info

---

### GET `/`
List all affiliates (admin).

- **Auth**: Required
- **Role**: `ADMIN`, `SUPER_ADMIN`

**Query Parameters:**
```ts
page?: number;
limit?: number;
```

**Response** `200`:
```ts
{
  affiliates: Array<{
    id: string;
    email: string;
    name: string;
    affiliateCode: string;
    commissionRate: number;
    createdAt: string;
    _count: { referrals: number };
    totalEarnings: number;
  }>;
  pagination: { ... };
}
```

---

### PUT `/:userId/commission`
Update affiliate commission rate.

- **Auth**: Required
- **Role**: `ADMIN`, `SUPER_ADMIN`

**Request Body:**
```ts
{
  commissionRate: number;  // 0-100
}
```

**Response** `200`:
```ts
{
  id: string;
  email: string;
  commissionRate: number;
}
```

---

## Coupons (`/api/coupons`)

### POST `/`
Create a coupon.

- **Auth**: Required
- **Role**: `ADMIN`, `SUPER_ADMIN`

**Request Body:**
```ts
{
  code: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;   // percentage (0-100) or fixed amount
  validFrom: string;       // ISO 8601
  validUntil: string;      // ISO 8601
  minAmount?: number;      // minimum order amount
  maxUsage?: number;       // max redemptions
}
```

**Response** `201`: Coupon object

---

### GET `/`
List all coupons.

- **Auth**: Required
- **Role**: `ADMIN`, `SUPER_ADMIN`

**Response** `200`: Array of Coupon objects

---

### DELETE `/:code`
Deactivate a coupon (soft delete).

- **Auth**: Required
- **Role**: `ADMIN`, `SUPER_ADMIN`

**Response** `200`:
```ts
{
  message: "Coupon deactivated";
}
```

---

### POST `/validate`
Validate a coupon code.

- **Auth**: None
- **Role**: Any

**Request Body:**
```ts
{
  code: string;
  amount?: number;  // order amount for calculating discount
}
```

**Response** `200`:
```ts
{
  valid: true;
  coupon: {
    code: string;
    discountType: string;
    discountValue: number;
    discountAmount: number;
  };
}
```

**Example:**
```bash
curl -X POST http://localhost:3001/api/coupons/validate \
  -H "Content-Type: application/json" \
  -d '{"code":"WELCOME15","amount":99}'
```

---

## Notifications (`/api/notifications`)

### GET `/`
List authenticated user's notifications.

- **Auth**: Required
- **Role**: Any

**Query Parameters:**
```ts
page?: number;
limit?: number;
unreadOnly?: boolean;
```

**Response** `200`:
```ts
{
  notifications: Array<{
    id: string;
    userId: string;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    link: string | null;
    createdAt: string;
  }>;
  unreadCount: number;
  pagination: { page: number; limit: number; total: number; totalPages: number };
}
```

---

### PUT `/:id/read`
Mark a notification as read.

- **Auth**: Required
- **Role**: Any

**Response** `200`:
```ts
{
  message: "Notification marked as read";
}
```

---

### PUT `/read-all`
Mark all notifications as read.

- **Auth**: Required
- **Role**: Any

**Response** `200`:
```ts
{
  message: "All notifications marked as read";
}
```

---

## Admin (`/api/admin`)

### GET `/stats`
Get platform dashboard statistics.

- **Auth**: Required
- **Role**: `ADMIN`, `SUPER_ADMIN`

**Response** `200`:
```ts
{
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
  roleDistribution: Array<{ role: string; count: number }>;
  challengePlans: Array<{
    id: string;
    name: string;
    price: number;
    accountSize: number;
    _count: { userChallenges: number };
  }>;
  recentPayments: Array<{
    ...Payment;
    user: { id: string; email: string; name: string };
  }>;
  recentRegistrations: Array<{
    id: string;
    email: string;
    name: string;
    createdAt: string;
    isVerified: boolean;
  }>;
}
```

**Example:**
```bash
curl -X GET http://localhost:3001/api/admin/stats \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

---

## Health

### GET `/api/health`
Server health check.

- **Auth**: None
- **Role**: Any

**Response** `200`:
```ts
{
  status: "ok";
  timestamp: string;  // ISO 8601
}
```
