-- Create extension for UUID generation if it doesn't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'Trader' CHECK (role IN ('Super Admin', 'Admin', 'Support Agent', 'Finance Manager', 'Affiliate Manager', 'Trader')),
    kyc_status VARCHAR(50) DEFAULT 'Pending' CHECK (kyc_status IN ('Pending', 'Approved', 'Rejected', 'Unsubmitted')),
    is_verified BOOLEAN DEFAULT FALSE,
    is_suspended BOOLEAN DEFAULT FALSE,
    is_banned BOOLEAN DEFAULT FALSE,
    total_deposited DECIMAL(15, 2) DEFAULT 0.00,
    total_withdrawn DECIMAL(15, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: challenge_plans
CREATE TABLE IF NOT EXISTS challenge_plans (
    id VARCHAR(100) PRIMARY KEY,
    type VARCHAR(50) NOT NULL CHECK (type IN ('1-Step', '2-Step', 'Instant')),
    size VARCHAR(50) NOT NULL,
    price VARCHAR(50) NOT NULL,
    rules JSONB NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: trading_accounts
CREATE TABLE IF NOT EXISTS trading_accounts (
    id VARCHAR(100) PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'Phase 1' CHECK (status IN ('Funded', 'Phase 1', 'Phase 2', 'Breached')),
    balance DECIMAL(15, 2) NOT NULL,
    initial_balance DECIMAL(15, 2) NOT NULL,
    equity DECIMAL(15, 2) NOT NULL,
    leverage VARCHAR(50) NOT NULL,
    server VARCHAR(100) NOT NULL,
    platform VARCHAR(100) NOT NULL,
    win_rate DECIMAL(5, 2) DEFAULT 0.00,
    trades_count INT DEFAULT 0,
    profit_target DECIMAL(15, 2) NOT NULL,
    daily_drawdown_limit DECIMAL(15, 2) NOT NULL,
    daily_drawdown_current DECIMAL(15, 2) DEFAULT 0.00,
    max_drawdown_limit DECIMAL(15, 2) NOT NULL,
    max_drawdown_current DECIMAL(15, 2) DEFAULT 0.00,
    trading_days_current INT DEFAULT 0,
    trading_days_required INT DEFAULT 0,
    equity_history JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: coupons
CREATE TABLE IF NOT EXISTS coupons (
    code VARCHAR(50) PRIMARY KEY,
    discount_percent DECIMAL(5, 2) NOT NULL,
    expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
    usage_limit INT DEFAULT 100,
    usage_count INT DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: payments
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_name VARCHAR(255) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    description TEXT NOT NULL,
    method VARCHAR(50) NOT NULL CHECK (method IN ('Stripe', 'PayPal', 'Razorpay', 'Crypto')),
    status VARCHAR(50) DEFAULT 'Paid' CHECK (status IN ('Paid', 'Refunded')),
    transaction_ref VARCHAR(255) UNIQUE NOT NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: payouts
CREATE TABLE IF NOT EXISTS payouts (
    id VARCHAR(100) PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    method VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Paid', 'Rejected')),
    country VARCHAR(10) NOT NULL,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: kyc_submissions
CREATE TABLE IF NOT EXISTS kyc_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_name VARCHAR(255) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('Passport', 'Driver License', 'Aadhaar', 'PAN')),
    document_number VARCHAR(100) NOT NULL,
    document_file_url TEXT,
    selfie_file_url TEXT,
    status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Resubmission Requested')),
    feedback TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: affiliate_profiles
CREATE TABLE IF NOT EXISTS affiliate_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referral_code VARCHAR(100) UNIQUE NOT NULL,
    commission_percent DECIMAL(5, 2) DEFAULT 10.00,
    total_earned DECIMAL(15, 2) DEFAULT 0.00,
    pending_payout DECIMAL(15, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: referrals
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    affiliate_id UUID NOT NULL REFERENCES affiliate_profiles(id) ON DELETE CASCADE,
    referred_user_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'Signed Up' CHECK (status IN ('Signed Up', 'Purchased')),
    commission DECIMAL(15, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: support_tickets
CREATE TABLE IF NOT EXISTS support_tickets (
    id VARCHAR(100) PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'Open' CHECK (status IN ('Open', 'Awaiting User Response', 'Closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: support_messages
CREATE TABLE IF NOT EXISTS support_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id VARCHAR(100) NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    sender VARCHAR(100) NOT NULL, -- 'User' or 'Agent' or 'System'
    text TEXT NOT NULL,
    time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Phase 1 migration: schema consolidation for testprop functionality port
-- ============================================================

-- trading_accounts: split single status enum into activity-state + explicit phase counter,
-- and add compliance/violations tracking (ported from testprop's Account model).
ALTER TABLE trading_accounts ADD COLUMN IF NOT EXISTS phase INT NOT NULL DEFAULT 1;
ALTER TABLE trading_accounts ADD COLUMN IF NOT EXISTS compliance BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE trading_accounts ADD COLUMN IF NOT EXISTS violations JSONB NOT NULL DEFAULT '[]'::jsonb;

-- profit_target_phase2: phase-2-specific target in dollars (mirrors the existing profit_target
-- column, which is reused as the phase-1 target). NULL for single-phase plans (1-Step/Instant).
ALTER TABLE trading_accounts ADD COLUMN IF NOT EXISTS profit_target_phase2 DECIMAL(15, 2);

-- phase_start_balance: the balance at the moment the CURRENT phase began. Profit-target checks
-- must be measured from this, not from the account's original size — testprop's own
-- simulate-trade route measures cumulative profit from the original size for both phases, which
-- means its (lower) phase-2 threshold is already satisfied by the time phase-1's (higher)
-- threshold is met, trivializing phase 2. Tracking a fresh baseline per phase fixes this properly.
ALTER TABLE trading_accounts ADD COLUMN IF NOT EXISTS phase_start_balance DECIMAL(15, 2);
UPDATE trading_accounts SET phase_start_balance = initial_balance WHERE phase_start_balance IS NULL;

-- Backfill phase for any accounts created before this migration, from the legacy status column.
UPDATE trading_accounts SET phase = 2 WHERE status = 'Phase 2' AND phase = 1;
UPDATE trading_accounts SET phase = 3 WHERE status = 'Funded' AND phase = 1;

-- challenge_plans: discrete numeric percentage columns alongside the existing display-copy
-- `rules` JSONB, so route logic no longer has to regex-parse strings like "8% (Ph 1) / 5% (Ph 2)".
ALTER TABLE challenge_plans ADD COLUMN IF NOT EXISTS profit_target_phase1_pct DECIMAL(5, 2);
ALTER TABLE challenge_plans ADD COLUMN IF NOT EXISTS profit_target_phase2_pct DECIMAL(5, 2);
ALTER TABLE challenge_plans ADD COLUMN IF NOT EXISTS daily_drawdown_pct DECIMAL(5, 2);
ALTER TABLE challenge_plans ADD COLUMN IF NOT EXISTS max_drawdown_pct DECIMAL(5, 2);
ALTER TABLE challenge_plans ADD COLUMN IF NOT EXISTS profit_split_pct DECIMAL(5, 2) NOT NULL DEFAULT 80.00;

-- users: real server-side 2FA (TOTP) + email verification / password reset tokens
-- (lifted from server/prisma/schema.prisma's design, applied to the raw-SQL schema).
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255);

-- users: attribution of which affiliate referral code a user registered under (ported from
-- testprop's User.referredBy — qtf-db's schema had nowhere to record this at signup).
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by_code VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS earnings DECIMAL(15, 2) NOT NULL DEFAULT 0.00;

-- payouts: link back to the trading_account the payout was drawn from. Without this, admin
-- reject/complete actions have no way to know which account's balance to restore on rejection.
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS account_id VARCHAR(100) REFERENCES trading_accounts(id) ON DELETE SET NULL;

-- crypto_invoices: tracks BitPay invoices for challenge purchases paid with cryptocurrency.
-- One row per invoice created; finalized (trading account created) only once, on the first
-- webhook/status-check that observes a paid/confirmed status from BitPay's own API.
CREATE TABLE IF NOT EXISTS crypto_invoices (
    id VARCHAR(100) PRIMARY KEY,
    -- order_ref: our own reference, generated BEFORE calling BitPay (their invoice id isn't
    -- known until after creation, so it can't be embedded in the invoice's own redirectURL).
    -- The frontend receives this in the redirect URL and polls status by it.
    order_ref VARCHAR(100) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    package_id VARCHAR(100) NOT NULL,
    coupon_code VARCHAR(50),
    amount_usd DECIMAL(15, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'new',
    trading_account_id VARCHAR(100) REFERENCES trading_accounts(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Idempotent add in case crypto_invoices already existed from an earlier version of this
-- migration (the table is empty so far in practice, but this keeps re-runs safe either way).
ALTER TABLE crypto_invoices ADD COLUMN IF NOT EXISTS order_ref VARCHAR(100);
UPDATE crypto_invoices SET order_ref = id WHERE order_ref IS NULL;
ALTER TABLE crypto_invoices ALTER COLUMN order_ref SET NOT NULL;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'crypto_invoices_order_ref_key') THEN
    ALTER TABLE crypto_invoices ADD CONSTRAINT crypto_invoices_order_ref_key UNIQUE (order_ref);
  END IF;
END $$;

-- refresh_tokens: DB-backed refresh-token rotation/revocation (today's /api/auth/refresh is
-- purely stateless JWT verification with no revocation capability).
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- cms_settings: persisted key/value store replacing admin.routes.ts's in-memory `cmsSettings`
-- object, which currently resets to hardcoded defaults on every server restart.
CREATE TABLE IF NOT EXISTS cms_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed cms_settings with the same defaults admin.routes.ts's in-memory object currently uses,
-- so switching the route to read from this table is a no-op for existing behavior.
INSERT INTO cms_settings (key, value) VALUES
('homepageTitle', 'Institutional-Grade Funding.'),
('homepageSubtitle', 'Unlock up to $1M in institutional trading capital. Keep up to 90% of the profits with zero drawdown liability.'),
('pricingTitle', 'Choose Your Challenge.'),
('pricingSubtitle', 'Select from our evaluation frameworks designed to measure consistency and reward professional risk parameters.'),
('announcement', '🔥 FLASH SALE: Use coupon WELCOME15 for 15% off all 2-Step challenges! Ending soon.')
ON CONFLICT (key) DO NOTHING;

-- Insert Default Challenge Packages. Sizes/prices match src/components/Pricing.tsx's
-- `pricingData` exactly (5k/10k/25k/50k/100k x 1-Step/2-Step/Instant) — previously only 8 of
-- these 15 combinations existed here, so Pricing.tsx's "Buy" buttons for the missing tiers
-- (10k/25k/50k for 1-Step and Instant, 25k for 2-Step) had no matching backend package at all.
INSERT INTO challenge_plans (id, type, size, price, rules) VALUES
('1-step-5k', '1-Step', '$5,000', '$49', '[{"label": "Profit Target", "value": "10%"}, {"label": "Max Daily Loss", "value": "4%"}, {"label": "Max Overall Loss", "value": "6%"}, {"label": "Minimum Trading Days", "value": "0 Days"}, {"label": "Leverage", "value": "1:100"}]'::jsonb),
('1-step-10k', '1-Step', '$10,000', '$99', '[{"label": "Profit Target", "value": "10%"}, {"label": "Max Daily Loss", "value": "4%"}, {"label": "Max Overall Loss", "value": "6%"}, {"label": "Minimum Trading Days", "value": "0 Days"}, {"label": "Leverage", "value": "1:100"}]'::jsonb),
('1-step-25k', '1-Step', '$25,000', '$199', '[{"label": "Profit Target", "value": "10%"}, {"label": "Max Daily Loss", "value": "4%"}, {"label": "Max Overall Loss", "value": "6%"}, {"label": "Minimum Trading Days", "value": "0 Days"}, {"label": "Leverage", "value": "1:100"}]'::jsonb),
('1-step-50k', '1-Step', '$50,000', '$299', '[{"label": "Profit Target", "value": "10%"}, {"label": "Max Daily Loss", "value": "4%"}, {"label": "Max Overall Loss", "value": "6%"}, {"label": "Minimum Trading Days", "value": "0 Days"}, {"label": "Leverage", "value": "1:100"}]'::jsonb),
('1-step-100k', '1-Step', '$100,000', '$499', '[{"label": "Profit Target", "value": "10%"}, {"label": "Max Daily Loss", "value": "4%"}, {"label": "Max Overall Loss", "value": "6%"}, {"label": "Minimum Trading Days", "value": "0 Days"}, {"label": "Leverage", "value": "1:100"}]'::jsonb),
('2-step-5k', '2-Step', '$5,000', '$39', '[{"label": "Profit Target", "value": "8% (Ph 1) / 5% (Ph 2)"}, {"label": "Max Daily Loss", "value": "5%"}, {"label": "Max Overall Loss", "value": "10%"}, {"label": "Minimum Trading Days", "value": "0 Days"}, {"label": "Leverage", "value": "1:100"}]'::jsonb),
('2-step-10k', '2-Step', '$10,000', '$89', '[{"label": "Profit Target", "value": "8% (Ph 1) / 5% (Ph 2)"}, {"label": "Max Daily Loss", "value": "5%"}, {"label": "Max Overall Loss", "value": "10%"}, {"label": "Minimum Trading Days", "value": "0 Days"}, {"label": "Leverage", "value": "1:100"}]'::jsonb),
('2-step-25k', '2-Step', '$25,000', '$179', '[{"label": "Profit Target", "value": "8% (Ph 1) / 5% (Ph 2)"}, {"label": "Max Daily Loss", "value": "5%"}, {"label": "Max Overall Loss", "value": "10%"}, {"label": "Minimum Trading Days", "value": "0 Days"}, {"label": "Leverage", "value": "1:100"}]'::jsonb),
('2-step-50k', '2-Step', '$50,000', '$279', '[{"label": "Profit Target", "value": "8% (Ph 1) / 5% (Ph 2)"}, {"label": "Max Daily Loss", "value": "5%"}, {"label": "Max Overall Loss", "value": "10%"}, {"label": "Minimum Trading Days", "value": "0 Days"}, {"label": "Leverage", "value": "1:100"}]'::jsonb),
('2-step-100k', '2-Step', '$100,000', '$449', '[{"label": "Profit Target", "value": "8% (Ph 1) / 5% (Ph 2)"}, {"label": "Max Daily Loss", "value": "5%"}, {"label": "Max Overall Loss", "value": "10%"}, {"label": "Minimum Trading Days", "value": "0 Days"}, {"label": "Leverage", "value": "1:100"}]'::jsonb),
('instant-5k', 'Instant', '$5,000', '$199', '[{"label": "Profit Target", "value": "None"}, {"label": "Max Daily Loss", "value": "5%"}, {"label": "Max Overall Loss", "value": "10%"}, {"label": "Minimum Trading Days", "value": "None"}, {"label": "Leverage", "value": "1:50"}]'::jsonb),
('instant-10k', 'Instant', '$10,000', '$399', '[{"label": "Profit Target", "value": "None"}, {"label": "Max Daily Loss", "value": "5%"}, {"label": "Max Overall Loss", "value": "10%"}, {"label": "Minimum Trading Days", "value": "None"}, {"label": "Leverage", "value": "1:50"}]'::jsonb),
('instant-25k', 'Instant', '$25,000', '$899', '[{"label": "Profit Target", "value": "None"}, {"label": "Max Daily Loss", "value": "5%"}, {"label": "Max Overall Loss", "value": "10%"}, {"label": "Minimum Trading Days", "value": "None"}, {"label": "Leverage", "value": "1:50"}]'::jsonb),
('instant-50k', 'Instant', '$50,000', '$1,699', '[{"label": "Profit Target", "value": "None"}, {"label": "Max Daily Loss", "value": "5%"}, {"label": "Max Overall Loss", "value": "10%"}, {"label": "Minimum Trading Days", "value": "None"}, {"label": "Leverage", "value": "1:50"}]'::jsonb),
('instant-100k', 'Instant', '$100,000', '$3,199', '[{"label": "Profit Target", "value": "None"}, {"label": "Max Daily Loss", "value": "5%"}, {"label": "Max Overall Loss", "value": "10%"}, {"label": "Minimum Trading Days", "value": "None"}, {"label": "Leverage", "value": "1:50"}]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Insert default coupons
INSERT INTO coupons (code, discount_percent, expiry_date, usage_limit, usage_count, active) VALUES
('QUANTUM10', 10.00, '2026-12-31 23:59:59+00', 500, 0, TRUE),
('WELCOME15', 15.00, '2026-08-30 23:59:59+00', 100, 0, TRUE)
ON CONFLICT (code) DO NOTHING;

-- Backfill discrete percentage columns for the seeded challenge plans (matches the numbers
-- already encoded as display strings in each plan's `rules` JSONB). Runs after the seed
-- INSERTs above so it applies on a fresh database too, not just on re-runs.
UPDATE challenge_plans SET profit_target_phase1_pct = 10, profit_target_phase2_pct = NULL, daily_drawdown_pct = 4, max_drawdown_pct = 6 WHERE type = '1-Step';
UPDATE challenge_plans SET profit_target_phase1_pct = 8, profit_target_phase2_pct = 5, daily_drawdown_pct = 5, max_drawdown_pct = 10 WHERE type = '2-Step';
UPDATE challenge_plans SET profit_target_phase1_pct = NULL, profit_target_phase2_pct = NULL, daily_drawdown_pct = 5, max_drawdown_pct = 10 WHERE type = 'Instant';
