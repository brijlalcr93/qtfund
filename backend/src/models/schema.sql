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

-- Insert Default Challenge Packages
INSERT INTO challenge_plans (id, type, size, price, rules) VALUES
('1-step-5k', '1-Step', '$5,000', '$49', '[{"label": "Profit Target", "value": "10%"}, {"label": "Max Daily Loss", "value": "4%"}, {"label": "Max Overall Loss", "value": "6%"}, {"label": "Minimum Trading Days", "value": "0 Days"}, {"label": "Leverage", "value": "1:100"}]'::jsonb),
('1-step-10k', '1-Step', '$10,000', '$99', '[{"label": "Profit Target", "value": "10%"}, {"label": "Max Daily Loss", "value": "4%"}, {"label": "Max Overall Loss", "value": "6%"}, {"label": "Minimum Trading Days", "value": "0 Days"}, {"label": "Leverage", "value": "1:100"}]'::jsonb),
('1-step-100k', '1-Step', '$100,000', '$499', '[{"label": "Profit Target", "value": "10%"}, {"label": "Max Daily Loss", "value": "4%"}, {"label": "Max Overall Loss", "value": "6%"}, {"label": "Minimum Trading Days", "value": "0 Days"}, {"label": "Leverage", "value": "1:100"}]'::jsonb),
('2-step-5k', '2-Step', '$5,000', '$39', '[{"label": "Profit Target", "value": "8% (Ph 1) / 5% (Ph 2)"}, {"label": "Max Daily Loss", "value": "5%"}, {"label": "Max Overall Loss", "value": "10%"}, {"label": "Minimum Trading Days", "value": "0 Days"}, {"label": "Leverage", "value": "1:100"}]'::jsonb),
('2-step-50k', '2-Step', '$50,000', '$279', '[{"label": "Profit Target", "value": "8% (Ph 1) / 5% (Ph 2)"}, {"label": "Max Daily Loss", "value": "5%"}, {"label": "Max Overall Loss", "value": "10%"}, {"label": "Minimum Trading Days", "value": "0 Days"}, {"label": "Leverage", "value": "1:100"}]'::jsonb),
('2-step-100k', '2-Step', '$100,000', '$449', '[{"label": "Profit Target", "value": "8% (Ph 1) / 5% (Ph 2)"}, {"label": "Max Daily Loss", "value": "5%"}, {"label": "Max Overall Loss", "value": "10%"}, {"label": "Minimum Trading Days", "value": "0 Days"}, {"label": "Leverage", "value": "1:100"}]'::jsonb),
('instant-5k', 'Instant', '$5,000', '$199', '[{"label": "Profit Target", "value": "None"}, {"label": "Max Daily Loss", "value": "5%"}, {"label": "Max Overall Loss", "value": "10%"}, {"label": "Minimum Trading Days", "value": "None"}, {"label": "Leverage", "value": "1:50"}]'::jsonb),
('instant-100k', 'Instant', '$100,000', '$3,199', '[{"label": "Profit Target", "value": "None"}, {"label": "Max Daily Loss", "value": "5%"}, {"label": "Max Overall Loss", "value": "10%"}, {"label": "Minimum Trading Days", "value": "None"}, {"label": "Leverage", "value": "1:50"}]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Insert default coupons
INSERT INTO coupons (code, discount_percent, expiry_date, usage_limit, usage_count, active) VALUES
('QUANTUM10', 10.00, '2026-12-31 23:59:59+00', 500, 0, TRUE),
('WELCOME15', 15.00, '2026-08-30 23:59:59+00', 100, 0, TRUE)
ON CONFLICT (code) DO NOTHING;
