# Deployment Guide

## Prerequisites

- **Node.js** >= 20.x
- **Docker** & **Docker Compose** (for containerized deployment)
- **PostgreSQL** 16+
- **A domain name** pointed to your server
- **Payment gateway accounts**: Razorpay (India) and/or Stripe (global)
- **SMTP credentials** (Gmail SMTP, SendGrid, Mailgun, etc.)
- **Supabase project** (for frontend auth)

---

## Environment Setup

### 1. Clone the Repository

```bash
git clone <repo-url>
cd antigravity
```

### 2. Backend Environment Variables

```bash
cp server/.env.example server/.env
```

Edit `server/.env` with your values:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/propfirm

# JWT
JWT_SECRET=<generate with: openssl rand -hex 32>
JWT_REFRESH_SECRET=<generate with: openssl rand -hex 32>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Server
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Payments
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 3. Frontend Environment Variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=https://api.yourdomain.com
```

---

## Docker Deployment (Recommended)

### 1. Configure docker-compose.yml

Ensure all `${VARIABLE}` references in `docker-compose.yml` have matching entries in a `.env` file at project root.

### 2. Build and Start

```bash
docker-compose up -d --build
```

This starts:
- **postgres**: PostgreSQL 16 database
- **redis**: Redis 7 cache
- **backend**: Express API on port 3001
- **frontend**: Nginx-served React app on port 5173

### 3. Run Database Migrations

```bash
docker-compose exec backend npx prisma migrate deploy
```

### 4. Seed Initial Data (Optional)

```bash
docker-compose exec backend npx tsx src/seed.ts
```

### 5. Verify

```bash
curl http://localhost:3001/api/health
# {"status":"ok","timestamp":"..."}
```

---

## Manual Deployment

### Backend

#### 1. Install Dependencies & Build

```bash
cd server
npm ci
npx prisma generate
npm run build
```

#### 2. Configure PM2 Process Manager

```bash
npm install -g pm2

# ecosystem.config.cjs
module.exports = {
  apps: [{
    name: 'antigravity-api',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
    },
  }],
};
```

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

#### 3. Reverse Proxy with Nginx

```nginx
server {
    listen 443 ssl;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 90s;
    }
}
```

### Frontend

#### 1. Install Dependencies & Build

```bash
npm ci
npm run build
```

Output goes to `dist/`.

#### 2. Serve via Nginx (VPS)

Upload `dist/` contents to `/var/www/antigravity/` and use the provided `nginx.conf` template.

#### 3. Serve via Nginx (Development/Alternative)

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/antigravity;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Vercel Deployment (Frontend)

### 1. Install Vercel CLI

```bash
npm i -g vercel
```

### 2. Deploy

```bash
vercel --prod
```

The `vercel.json` file handles SPA rewrites automatically.

### 3. Environment Variables

Set these in Vercel dashboard:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_URL` (your backend URL, e.g., `https://api.yourdomain.com`)

### 4. Custom Domain

Add your domain in Vercel project settings → Domains.

---

## VPS Deployment (Backend)

### 1. Provision a Server

Recommended: Ubuntu 22.04 LTS, minimum 2GB RAM (4GB preferred).

### 2. Install Dependencies

```bash
# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt-get install -y nodejs

# PostgreSQL 16
sudo apt-get install -y postgresql postgresql-contrib

# Nginx
sudo apt-get install -y nginx

# Certbot (SSL)
sudo apt-get install -y certbot python3-certbot-nginx
```

### 3. Setup Database

```bash
sudo -u postgres psql
CREATE USER propfirm WITH PASSWORD 'strong_password';
CREATE DATABASE propfirm OWNER propfirm;
\q
```

Update `server/.env` `DATABASE_URL` with the credentials.

### 4. Deploy Code

```bash
git clone <repo-url> /opt/antigravity
cd /opt/antigravity
```

### 5. Build and Start Backend

```bash
cd /opt/antigravity/server
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 start dist/index.js --name antigravity-api
pm2 save
```

### 6. Build and Deploy Frontend

```bash
cd /opt/antigravity
npm ci
npm run build
sudo cp -r dist/* /var/www/antigravity/
```

---

## Database Migrations

### Development

```bash
cd server
npx prisma migrate dev --name <migration-name>
```

### Production

```bash
cd server
npx prisma migrate deploy
```

### Generate Prisma Client

Run after pulling schema changes:

```bash
npx prisma generate
```

### Seed Production Data

```bash
cd server
npx tsx src/seed.ts
```

Default admin credentials (change immediately):
- Email: `admin@propfirm.com`
- Password: `Admin@123456`

---

## SSL/HTTPS with Certbot

### 1. Obtain Certificate

```bash
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com
```

### 2. Auto-Renewal

Certbot sets up a systemd timer by default. Verify with:

```bash
sudo systemctl status certbot.timer
sudo certbot renew --dry-run
```

### 3. Configure Backend for HTTPS

Set `CORS_ORIGIN=https://yourdomain.com` in `.env`.

---

## Monitoring with PM2

### Common Commands

```bash
pm2 list                    # List all processes
pm2 logs antigravity-api    # View logs
pm2 monit                   # Resource monitoring
pm2 restart antigravity-api # Restart
pm2 reload antigravity-api  # Zero-downtime reload
```

### Setup PM2 Web Dashboard

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### Health Checks

Configure uptime monitoring (UptimeRobot, Better Uptime, etc.) to hit:

```
https://api.yourdomain.com/api/health
```

---

## Backup Strategy

### Database Backups

Automate daily PostgreSQL dumps:

```bash
# /etc/cron.daily/antigravity-db-backup
#!/bin/bash
BACKUP_DIR=/backups/postgres
mkdir -p $BACKUP_DIR
pg_dump -U propfirm propfirm > $BACKUP_DIR/antigravity-$(date +%Y%m%d).sql
find $BACKUP_DIR -name "antigravity-*.sql" -mtime +30 -delete
```

### Uploads Backup

```bash
tar -czf /backups/uploads-$(date +%Y%m%d).tar.gz /opt/antigravity/server/uploads
```

### Off-site Backups

Sync to S3-compatible storage (Backblaze B2, AWS S3):

```bash
# Install rclone, configure remote, then:
rclone sync /backups remote:antigravity-backups/
```

### Restore Procedure

```bash
# Restore database
psql -U propfirm propfirm < antigravity-20260101.sql

# Restore uploads
tar -xzf uploads-20260101.tar.gz -C /opt/antigravity/server/
```
