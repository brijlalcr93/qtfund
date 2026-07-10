# Pre-Launch Checklist

## Security Checks

- [ ] **JWT secrets regenerated**: Run `openssl rand -hex 32` for both `JWT_SECRET` and `JWT_REFRESH_SECRET`
- [ ] **Production environment**: `NODE_ENV=production` set (disables stack traces in error responses)
- [ ] **CORS origin**: `CORS_ORIGIN` set to production domain (not `localhost`)
- [ ] **Rate limiting tuned**: 100 req/15min per IP; consider stricter limits for auth endpoints
- [ ] **Helmet headers verified**: Run `curl -I https://yourdomain.com` to check security headers
- [ ] **Express trust proxy**: Add `app.set('trust proxy', 1)` if behind reverse proxy (Nginx)
- [ ] **No secrets in code**: Verify no API keys, JWT secrets, or DB credentials committed to git
- [ ] **`.env` files in `.gitignore`**: Both `server/.env` and `.env.local` must be gitignored
- [ ] **BCrypt cost factor**: Salt rounds set to 12 (current) — adjust based on server performance
- [ ] **API authentication tested**: All protected endpoints reject unauthenticated requests
- [ ] **RBAC verified**: Regular users cannot access admin routes; admins cannot access SUPER_ADMIN-only routes

## Database Checks

- [ ] **Migrations run**: `npx prisma migrate deploy` executed on production DB
- [ ] **Connection string**: `DATABASE_URL` points to production PostgreSQL (not local/dev)
- [ ] **Database backup configured**: Automated daily pg_dump to off-site storage
- [ ] **Connection pool**: Prisma connection pool size configured for expected load
- [ ] **Indexes verified**: Prisma schema indexes match query patterns (especially on `userId`, `email`, `status`)
- [ ] **Seed data removed**: Production seed only contains necessary admin account (change default password)
- [ ] **Admin password changed**: Default `Admin@123456` changed to strong unique password

## Payment Gateway Testing

- [ ] **Razorpay live keys**: Test mode → Live mode switch in env vars
- [ ] **Stripe live keys**: Test mode → Live mode switch in env vars
- [ ] **Webhook endpoints configured**: Add `https://api.yourdomain.com/api/payments/webhook/razorpay` and `/webhook/stripe` in gateway dashboards
- [ ] **Webhook signing secrets**: `RAZORPAY_KEY_SECRET` and `STRIPE_WEBHOOK_SECRET` set correctly
- [ ] **Payment flow tested end-to-end**: Create order → Gateway checkout → Verify → Challenge activation
- [ ] **Refund flow tested**: Admin refund restores balance and sends notification
- [ ] **Coupon integration tested**: Discount applied correctly during checkout
- [ ] **Multiple currencies tested**: USD and INR payment flows verified
- [ ] **Idempotency verified**: Duplicate webhook events do not double-credit users

## Email Delivery Testing

- [ ] **SMTP credentials**: Valid SMTP host/port/user/pass for production email service
- [ ] **Email templates rendered**: Verify email and reset-password templates render correctly
- [ ] **Verification email flow**: Register → Receive email → Click link → Account verified
- [ ] **Password reset flow**: Forgot password → Receive email → Reset → Login with new password
- [ ] **SPF/DKIM/DMARC records**: Added to domain DNS to improve deliverability
- [ ] **Email sending tested**: Send test emails to multiple providers (Gmail, Outlook, Proton)
- [ ] **Rate limiting on email**: Avoid hitting SMTP provider limits for mass emails

## KYC Flow Testing

- [ ] **File upload working**: Front-end upload → Backend multer validation → File saved to `uploads/`
- [ ] **File type validation**: Only JPEG, PNG, GIF, WebP, PDF, DOC accepted
- [ ] **File size limit**: 10MB limit enforced
- [ ] **KYC status flow**: SUBMIT → PENDING → APPROVED/REJECTED with feedback
- [ ] **Duplicate submission prevented**: User with pending KYC cannot submit again
- [ ] **Admin review interface**: Admin can view documents, approve, reject with reason
- [ ] **Notification on KYC change**: User receives notification when KYC is approved/rejected
- [ ] **File cleanup**: Consider adding a cron job to clean up rejected/old uploads

## Performance Checks

- [ ] **Database connection pooling**: Prisma connection limit appropriate for server size
- [ ] **API response times**: All endpoints respond within 500ms (check with a load test tool)
- [ ] **Static asset caching**: Nginx configured with proper cache headers (see `nginx.conf`)
- [ ] **Gzip compression**: Enabled in Nginx for text assets
- [ ] **Image optimization**: Static assets optimized (WebP, compression)
- [ ] **Frontend bundle size**: Analyze with `npx vite build --analyze` (keep under 500KB initial)
- [ ] **Database query optimization**: Check for N+1 queries in Prisma (use `include` wisely)
- [ ] **WebSocket performance**: Binance WebSocket reconnection logic verified

## Backup Verification

- [ ] **Database backup script tested**: Manual restore performed and verified
- [ ] **Uploads backup script tested**: File restoration verified
- [ ] **Off-site backup configured**: rclone or AWS CLI syncing to remote storage
- [ ] **Backup retention policy**: 30-day retention, with weekly/monthly snapshots
- [ ] **Backup monitoring**: Alert if backup fails (cron job email or health check)

## Monitoring Setup

- [ ] **PM2 configured**: Process runs in cluster mode, auto-restarts on crash
- [ ] **PM2 log rotation**: `pm2-logrotate` configured (10MB max, 7 files retained)
- [ ] **Uptime monitoring**: UptimeRobot/Uptime Kuma hitting `/api/health` every 5 minutes
- [ ] **Error tracking**: Sentry/GlitchTip/Papertrail integration for error alerts
- [ ] **Server metrics**: CPU, memory, disk usage monitoring (Netdata, Grafana, or hosting dashboard)
- [ ] **API response time monitoring**: Track p95/p99 response times
- [ ] **Alerting configured**: Email/Slack/PagerDuty alerts on service degradation
- [ ] **Log aggregation**: Centralized log management (ELK, Grafana Loki, or Papertrail)

## Domain & DNS Configuration

- [ ] **Apex domain**: `yourdomain.com` → Server IP (A record)
- [ ] **API subdomain**: `api.yourdomain.com` → Server IP (A record)
- [ ] **CDN/WAF**: Cloudflare or similar configured (DDoS protection, SSL, caching)
- [ ] **CNAME records**: Verify `www.yourdomain.com` → `yourdomain.com`
- [ ] **DNS propagation**: Verified with `dig yourdomain.com` or `nslookup`
- [ ] **Email DNS records**: SPF, DKIM, DMARC configured for sending domain
- [ ] **TXT records**: Domain verification for payment gateways and Supabase

## SSL Certificate

- [ ] **SSL issued**: Certbot/Let's Encrypt certificates active
- [ ] **Auto-renewal verified**: `sudo certbot renew --dry-run` passes
- [ ] **HSTS enabled**: `Strict-Transport-Security` header set (min 6 months)
- [ ] **SSL Labs grade**: Test at https://www.ssllabs.com/ssltest/ (target: A or A+)
- [ ] **Wildcard certificate**: If using subdomains, ensure SAN covers both `yourdomain.com` and `*.yourdomain.com`

## CDN Setup

- [ ] **Static assets served via CDN**: Cloudflare, Bunny.net, or similar
- [ ] **Cache rules configured**: Static assets (CSS, JS, images) cached aggressively
- [ ] **API bypass**: API routes bypass CDN cache (no caching for dynamic content)
- [ ] **Purge on deploy**: CDN cache purged after frontend deployment
- [ ] **SSL/TLS mode**: Full (strict) or Full mode for CDN-to-origin encryption

## Rate Limit Tuning

- [ ] **Global rate limit**: 100 req/15min per IP (current) — verify adequacy
- [ ] **Auth rate limit**: Consider stricter limit (20 req/15min) for `/api/auth/login`
- [ ] **API rate limit headers**: Verify `RateLimit-*` headers present in responses
- [ ] **Rate limit by role**: Higher limits for admin users
- [ ] **IP whitelist**: Admin endpoints accessible from trusted IPs only (optional)

## Webhook Endpoint Testing

- [ ] **Razorpay webhook**: Test event sent from Razorpay dashboard reaches server
- [ ] **Stripe webhook**: Test event sent from Stripe dashboard reaches server
- [ ] **Webhook retry logic**: Server handles duplicate webhook deliveries gracefully
- [ ] **Webhook logging**: All webhook events logged for audit trail
- [ ] **Webhook IP allowlisting**: Consider restricting endpoint to Razorpay/Stripe IP ranges

## Load Testing

- [ ] **Concurrent users**: Test with 100+ concurrent users (use k6, Artillery, or Locust)
- [ ] **API throughput**: Verify 500+ requests/second on API endpoints
- [ ] **Database under load**: Connection pool does not exhaust under peak load
- [ ] **Static assets**: CDN handles 10,000+ concurrent requests
- [ ] **Memory usage**: Node.js process stays under 512MB under load
- [ ] **CPU usage**: Under 70% under peak expected load

## Disaster Recovery Plan

- [ ] **Database restore procedure**: Documented and tested:
  ```bash
  # Stop application
  docker-compose stop backend
  # Restore database
  pg_restore -U propfirm -d propfirm backup.sql
  # Restart application
  docker-compose start backend
  ```
- [ ] **Full server rebuild**: Steps documented to provision a new server from scratch
- [ ] **Rollback plan**: Previous Docker images tagged and available for immediate rollback
- [ ] **Incident response**: On-call contact established, escalation path documented
- [ ] **Communication template**: Draft outage notification messages ready

## Final Verification

- [ ] **Production build passes**: `npm run build` (frontend) and `npm run build` (backend) succeed
- [ ] **All tests pass**: `npm test` (frontend + backend) — zero failures
- [ ] **Lint passes**: `npm run lint` — zero errors
- [ ] **Sitemap generated**: `/sitemap.xml` accessible with all public pages
- [ ] **Robots.txt**: `robots.txt` allows/allows-disallows correct paths
- [ ] **404 handling**: SPA returns index.html for all routes (verified with vercel.json/netlify.toml)
- [ ] **Mobile responsive**: Homepage, dashboard, trading terminal tested on mobile viewport
- [ ] **Cross-browser tested**: Chrome, Firefox, Safari, Edge
- [ ] **GDPR/Privacy compliance**: Privacy policy and terms of service pages accessible
- [ ] **Cookie consent**: If using analytics/tracking cookies, consent banner implemented

---

## Post-Launch Monitoring (First 72 Hours)

- [ ] Monitor error rates (target: <0.1% of requests)
- [ ] Monitor API response times (target: p95 < 1000ms)
- [ ] Monitor server resources (CPU, memory, disk I/O)
- [ ] Monitor database connections and query performance
- [ ] Monitor payment success rates (target: >95%)
- [ ] Monitor email delivery rates (target: >98%)
- [ ] Monitor user registration funnel (visit → register → verify → purchase)
- [ ] Review logs for unusual patterns or attacks
- [ ] Check rate limit hit counts (adjust if too many legitimate users blocked)
- [ ] Verify webhook processing latency (should be < 5 seconds)
