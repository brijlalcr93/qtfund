# Folder Structure

```
antigravity/
├── server/                          # Express.js backend
│   ├── prisma/
│   │   └── schema.prisma            # Database schema (User, ChallengePlan, UserChallenge, Payment, Payout, Kyc, Ticket, Coupon, Notification, Referral, AffiliateEarning, RefreshToken)
│   ├── src/
│   │   ├── config/
│   │   │   └── prisma.ts            # Prisma client singleton (global caching for dev)
│   │   ├── middleware/
│   │   │   ├── auth.ts              # JWT authentication & role-based authorization (USER, ADMIN, SUPER_ADMIN)
│   │   │   ├── errorHandler.ts      # Centralized error handling (AppError class, Multer errors)
│   │   │   ├── upload.ts            # Multer config: file filter (images/PDFs), 10MB limit, UUID filenames
│   │   │   └── validate.ts          # express-validator result handler
│   │   ├── routes/
│   │   │   ├── admin.ts             # Dashboard stats endpoint
│   │   │   ├── affiliates.ts        # Affiliate dashboard, claim earnings, referrals, admin list/commission
│   │   │   ├── auth.ts              # Register, login, refresh, logout, forgot-password, reset-password, verify-email, profile, 2FA
│   │   │   ├── challenges.ts        # Challenge plans CRUD, user challenges, purchase, reset
│   │   │   ├── coupons.ts           # Coupon CRUD, validation
│   │   │   ├── kyc.ts               # KYC submit (file upload), status, admin list/approve/reject
│   │   │   ├── notifications.ts     # List notifications, mark read, mark all read
│   │   │   ├── payments.ts          # Create order (Razorpay/Stripe), verify, refund, history, webhooks
│   │   │   ├── payouts.ts           # Request payout, admin list, user list, approve/reject/complete, export CSV
│   │   │   ├── tickets.ts           # CRUD tickets, reply, status update, assign
│   │   │   └── users.ts             # List/get/update/delete users, suspend, ban, adjust balance
│   │   ├── templates/
│   │   │   ├── reset-password.html  # Password reset email template (Handlebars-style {{resetUrl}})
│   │   │   └── verify-email.html    # Email verification template (Handlebars-style {{verifyUrl}})
│   │   ├── utils/
│   │   │   ├── email.ts             # Nodemailer transporter (SMTP or Mailpit for dev/test)
│   │   │   ├── jwt.ts               # JWT generation (access + refresh) and verification
│   │   │   └── logger.ts            # Winston logger (file transports + console in dev)
│   │   ├── index.ts                 # Express app entry point: helmet, cors, rate-limit, morgan, routes, graceful shutdown
│   │   └── seed.ts                  # DB seeder: admin user + challenge plans (Starter/Standard/Premium/Elite/Ultimate)
│   ├── uploads/                     # KYC document uploads directory
│   │   └── .gitkeep
│   ├── logs/                        # Winston log files (error.log, combined.log)
│   ├── .env.example                 # Environment variable template
│   ├── tsconfig.json
│   └── package.json                 # Dependencies: express, prisma, bcryptjs, jsonwebtoken, razorpay, stripe, multer, etc.
│
├── src/                             # React frontend (Vite + TypeScript)
│   ├── assets/                      # Static images (hero.png, react.svg, vite.svg)
│   ├── components/
│   │   ├── trading/
│   │   │   ├── OrderPanel.tsx        # Buy/Sell order entry with sl/tp
│   │   │   ├── PositionsTable.tsx    # Open positions list with PnL
│   │   │   ├── TradingChart.tsx      # Lightweight Charts candlestick chart
│   │   │   └── trading.css           # Trading terminal styles
│   │   ├── CTA.tsx                   # Call-to-action section
│   │   ├── Features.tsx              # Platform features grid
│   │   ├── Footer.tsx                # Site footer with links
│   │   ├── Globe.tsx                 # 3D globe animation (Three.js/R3F)
│   │   ├── Hero.tsx                  # Hero section with headline
│   │   ├── HowItWorks.tsx            # Steps/how-to section
│   │   ├── LiveStats.tsx             # Live statistics counter
│   │   ├── Metrics.tsx               # Key metrics display
│   │   ├── Navbar.tsx                # Navigation bar
│   │   ├── Pricing.tsx               # Challenge pricing cards
│   │   ├── ProfitSplit.tsx           # Profit split breakdown
│   │   ├── ProtectedRoute.tsx        # Auth guard wrapper
│   │   ├── Testimonials.tsx          # User testimonials carousel
│   │   └── WhyChooseUs.tsx           # Value proposition section
│   ├── contexts/
│   │   └── AuthContext.tsx           # Auth context (Supabase + mock user fallback)
│   ├── hooks/
│   │   ├── useBinanceWebSocket.ts    # Real-time crypto prices via Binance WebSocket
│   │   ├── useForexMockWebSocket.ts  # Simulated forex price ticks
│   │   └── useNotifications.ts      # Notification polling hook
│   ├── lib/
│   │   └── supabase.ts              # Supabase client initialization
│   ├── pages/
│   │   ├── AdminPanel.tsx            # Admin dashboard (users, challenges, KYC, tickets, payouts, coupons, affiliates, CMS)
│   │   ├── Auth.tsx                  # Login/Register forms
│   │   ├── Blog.tsx                  # Blog listing page
│   │   ├── BlogPost.tsx              # Individual blog post
│   │   ├── Checkout.tsx              # Payment checkout page
│   │   ├── ContactPage.tsx           # Contact form
│   │   ├── Dashboard.tsx             # User dashboard (accounts, stats, trading terminal)
│   │   ├── FAQPage.tsx               # FAQ accordion
│   │   ├── Home.tsx                  # Landing page (Hero, Features, Pricing, etc.)
│   │   ├── Legal.tsx                 # Legal pages (privacy, terms)
│   │   ├── Payouts.tsx               # Payout history and requests
│   │   └── TradingTerminal.tsx       # Full trading terminal view
│   ├── store/
│   │   ├── platformStore.ts          # Zustand store (persisted): challenges, blog, leaderboard, payouts, KYC, coupons, affiliates, tickets, CMS
│   │   └── tradingStore.ts           # Zustand store: positions, balance, equity, margin, price updates
│   ├── types/
│   │   └── index.ts                  # TypeScript interfaces: User, ChallengePlan, Payment, Payout, KycSubmission, Ticket, Notification, etc.
│   ├── App.tsx                       # Root component: Router, 3D background, routes
│   ├── main.tsx                      # React entry point
│   └── index.css                     # Global styles: dark theme, CSS variables, responsive
│
├── public/
│   ├── _redirects                   # Netlify SPA redirect
│   ├── favicon.svg
│   └── icons.svg
│
├── exness-demo/                     # Separate demo/trading playground
│   ├── src/
│   │   ├── components/              # Chart, OrderPanel, Sidebar, TopBar, PositionsPanel
│   │   ├── store.ts                 # Local trading store
│   │   ├── App.tsx, main.tsx, index.css
│   │   └── assets/
│   ├── public/
│   ├── package.json, vite.config.ts, tsconfig*.json
│   └── README.md
│
├── Dockerfile                       # Backend multi-stage build (node:20-alpine, tini, prisma generate)
├── Dockerfile.frontend              # Frontend build + nginx serve
├── docker-compose.yml               # Services: postgres:16, redis:7-alpine, backend, frontend (+ volumes, networks, healthchecks)
├── nginx.conf                       # Nginx config: SPA routing, API proxy, static asset caching
├── netlify.toml                     # Netlify SPA redirect config
├── vercel.json                      # Vercel SPA rewrite config
├── .env.local.example               # Supabase env vars template
├── .gitignore
├── package.json                     # Frontend deps: react, react-router-dom, zustand, three, framer-motion, recharts, lightweight-charts
├── vite.config.ts                   # Vite config
├── tsconfig.json, tsconfig.app.json, tsconfig.node.json
└── eslint.config.js                 # ESLint flat config
```
