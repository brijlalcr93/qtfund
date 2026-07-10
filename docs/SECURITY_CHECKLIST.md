# Security Checklist

## Authentication & Authorization

| # | Measure | Implementation | Status |
|---|---------|---------------|--------|
| 1 | **JWT Access Tokens** | Short-lived (15m default), signed with HS256 secret | ✅ `server/src/utils/jwt.ts` |
| 2 | **JWT Refresh Tokens** | Long-lived (7d default), stored in DB, rotatable | ✅ `server/src/utils/jwt.ts` |
| 3 | **Token Expiry Detection** | `TokenExpiredError` returns specific error code | ✅ `server/src/middleware/auth.ts:56` |
| 4 | **RBAC** | Three roles: `USER`, `ADMIN`, `SUPER_ADMIN` | ✅ `server/src/middleware/auth.ts:64` |
| 5 | **Password Hashing** | bcryptjs with 12 salt rounds | ✅ `server/src/routes/auth.ts:39` |
| 6 | **Account Suspension** | Blocks login and all authenticated requests | ✅ `server/src/middleware/auth.ts:43` |
| 7 | **Account Banning** | Blocks login + revokes all refresh tokens | ✅ `server/src/routes/users.ts:194` |
| 8 | **Email Verification** | UUID token sent on registration, verified via `/verify-email/:token` | ✅ `server/src/routes/auth.ts:305` |
| 9 | **Password Reset** | UUID token with 1-hour expiry | ✅ `server/src/routes/auth.ts:236` |
| 10 | **2FA Support** | TOTP via speakeasy (enable, verify, disable) | ✅ `server/src/routes/auth.ts:401-479` |

## API Security

| # | Measure | Implementation | Status |
|---|---------|---------------|--------|
| 11 | **Rate Limiting** | 100 requests per 15-minute window per IP | ✅ `server/src/index.ts:44` |
| 12 | **Helmet Headers** | Security headers (CSP, X-Frame-Options, etc.) | ✅ `server/src/index.ts:30` |
| 13 | **CORS** | Restricted to `CORS_ORIGIN` env var, credentials enabled | ✅ `server/src/index.ts:37` |
| 14 | **Input Validation** | express-validator on all mutation endpoints | ✅ All route files use `validate` middleware |
| 15 | **Error Handling** | No stack traces in production, `AppError` class for custom errors | ✅ `server/src/middleware/errorHandler.ts` |
| 16 | **Request Logging** | Morgan combined format logged via Winston | ✅ `server/src/index.ts:33` |
| 17 | **Body Size Limit** | JSON and URL-encoded bodies limited to 10MB | ✅ `server/src/index.ts:55` |
| 18 | **SQL Injection Prevention** | Prisma ORM with parameterized queries | ✅ All database queries use Prisma |

## File Upload Security

| # | Measure | Implementation | Status |
|---|---------|---------------|--------|
| 19 | **File Type Validation** | MIME type whitelist (JPEG, PNG, GIF, WebP, PDF, DOC) | ✅ `server/src/middleware/upload.ts:17` |
| 20 | **File Size Limit** | Max 10MB per file | ✅ `server/src/middleware/upload.ts:39` |
| 21 | **Max File Count** | Max 5 files per upload | ✅ `server/src/middleware/upload.ts:40` |
| 22 | **UUID Filenames** | Prevents path traversal and filename collisions | ✅ `server/src/middleware/upload.ts:12` |
| 23 | **Multer Error Handling** | `MulterError` caught and returned as 400 | ✅ `server/src/middleware/errorHandler.ts:25` |

## Payment Security

| # | Measure | Implementation | Status |
|---|---------|---------------|--------|
| 24 | **Razorpay Signature Verification** | HMAC SHA-256 validation on client-side verification | ✅ `server/src/routes/payments.ts:166` |
| 25 | **Stripe Webhook Verification** | `stripe.webhooks.constructEvent()` with signing secret | ✅ `server/src/routes/payments.ts:338` |
| 26 | **Razorpay Webhook Signature** | HMAC SHA-256 validation on incoming webhooks | ✅ `server/src/routes/payments.ts:286` |
| 27 | **Payment Ownership Check** | Verifies payment belongs to authenticated user | ✅ `server/src/routes/payments.ts:156` |
| 28 | **Payment Already Verified Check** | Prevents duplicate verification | ✅ `server/src/routes/payments.ts:161` |
| 29 | **Refund Balance Protection** | Uses `decrement` to prevent negative balances | ✅ `server/src/routes/payments.ts:241` |

## Payout Security

| # | Measure | Implementation | Status |
|---|---------|---------------|--------|
| 30 | **Balance Check** | Verifies sufficient balance before payout | ✅ `server/src/routes/payouts.ts:29` |
| 31 | **Status Guards** | Admin actions check payout status (PENDING/APPROVED) | ✅ `server/src/routes/payouts.ts:138,168,207` |
| 32 | **Rejected Payout Refund** | Balance restored on rejection | ✅ `server/src/routes/payouts.ts:181` |
| 33 | **Completed Payout Tracking** | `totalWithdrawn` incremented on completion | ✅ `server/src/routes/payouts.ts:223` |

## KYC Security

| # | Measure | Implementation | Status |
|---|---------|---------------|--------|
| 34 | **Duplicate Submission Prevention** | Blocks if user has pending KYC | ✅ `server/src/routes/kyc.ts:39` |
| 35 | **Document Upload Validation** | Required fields and file type checks | ✅ `server/src/routes/kyc.ts:34` |
| 36 | **Admin Review Only** | Status changes restricted to ADMIN/SUPER_ADMIN | ✅ `server/src/routes/kyc.ts:134,166` |

## Webhook Security

| # | Measure | Implementation | Status |
|---|---------|---------------|--------|
| 37 | **Signature Verification** | All payment webhooks verify cryptographic signatures | ✅ `server/src/routes/payments.ts:281-379` |
| 38 | **Idempotency** | Checks existing payment status before processing | ✅ `server/src/routes/payments.ts:304,354` |

## Infrastructure Security

| # | Measure | Implementation | Status |
|---|---------|---------------|--------|
| 39 | **HTTPS** | Certbot/Let's Encrypt for SSL termination | ✅ See Deployment Guide |
| 40 | **Graceful Shutdown** | SIGTERM/SIGINT handler closes HTTP server + DB connection | ✅ `server/src/index.ts:80` |
| 41 | **Shutdown Timeout** | Forced exit after 30s if graceful shutdown fails | ✅ `server/src/index.ts:90` |
| 42 | **Docker: Non-root User** | Backend runs as `node` user | ✅ `Dockerfile:30` |
| 43 | **Docker: tini Init** | Uses `tini` as PID 1 for proper signal handling | ✅ `Dockerfile:22,32` |
| 44 | **Docker: Minimal Base Image** | `node:20-alpine` for small attack surface | ✅ `Dockerfile:1,18` |
| 45 | **Docker: Healthchecks** | PostgreSQL and Redis health checks in compose | ✅ `docker-compose.yml` |
| 46 | **Logging** | Winston writes to files, error logs separately | ✅ `server/src/utils/logger.ts` |
| 47 | **Cookie Security** | HTTP-only cookies via cookie-parser | ✅ `server/src/index.ts:32` |

## Notification & Audit

| # | Measure | Implementation | Status |
|---|---------|---------------|--------|
| 48 | **Security Notifications** | Users notified on account suspension, balance changes, etc. | ✅ All admin actions create notifications |
| 49 | **Ticket Audit Trail** | All ticket messages stored with timestamps and user info | ✅ `server/src/routes/tickets.ts` |
| 50 | **Payment Audit Trail** | Full payment history with gateway IDs and statuses | ✅ `server/src/routes/payments.ts` |

## Additional Recommendations

| # | Recommendation | Priority | Notes |
|---|---------------|----------|-------|
| 51 | Add CSRF tokens for cookie-based auth | High | Currently using Bearer tokens; if switching to cookies, implement CSRF |
| 52 | Implement security headers audit | Medium | Review helmet config for CSP, HSTS, etc. |
| 53 | Add API key management for external integrations | Medium | Future-proof for partner integrations |
| 54 | Implement IP whitelist for admin endpoints | Low | Optional for high-security deployments |
| 55 | Add audit log table for all admin actions | Medium | Track who changed what and when |
| 56 | Implement session management dashboard | Low | Allow users to view/revoke active sessions |
| 57 | Add rate limiting per endpoint (not global) | Medium | Differentiate between auth, public, and admin endpoints |
| 58 | Implement account lockout after failed attempts | High | Lock after 5 failed login attempts for 15 minutes |
| 59 | Add webhook IP allowlisting | Medium | Restrict webhook processing to known IP ranges |
| 60 | Regular dependency audits (`npm audit`) | High | Run as part of CI/CD pipeline |
