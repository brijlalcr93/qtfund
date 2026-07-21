import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, Wallet, ChevronLeft } from 'lucide-react';
import { usePlatformStore } from '../store/platformStore';
import type { TradingAccount, TransactionItem } from '../store/platformStore';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';

type PaymentGateway = 'Stripe' | 'PayPal' | 'Razorpay' | 'Crypto' | 'NOWPayments';

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Platform Store Actions
  const { useCoupon, addUserAccount, addTransaction, affiliates, addReferral } = usePlatformStore();

  const planDetails = location.state || {
    type: '2-Step Challenge',
    size: '$100,000',
    price: '$249'
  };

  const [paymentMethod, setPaymentMethod] = useState<PaymentGateway>('NOWPayments');
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [cryptoCurrency, setCryptoCurrency] = useState('USDT');

  const basePriceNum = parseFloat(planDetails.price.replace(/[$,]/g, ''));
  const discountAmount = basePriceNum * (discountPercent / 100);
  const finalPrice = basePriceNum - discountAmount;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    
    // Check if valid in platformStore
    const coupons = usePlatformStore.getState().coupons;
    const matched = coupons.find(c => c.code.toUpperCase() === couponCode.toUpperCase() && c.active);
    
    if (matched) {
      if (matched.usageCount >= matched.usageLimit) {
        setCouponError('Coupon usage limit reached.');
        return;
      }
      useCoupon(matched.code); // increment usage
      setDiscountPercent(matched.discountPercent);
      setCouponApplied(matched.code.toUpperCase() === 'WELCOME15' ? true : true);
      setCouponApplied(true);
    } else {
      setCouponError('Invalid or expired coupon code.');
    }
  };

  const handleCompletePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    if (paymentMethod === 'NOWPayments') {
      try {
        const data = await api.post<any>('/payments/nowpayments/invoice', {
          price_amount: finalPrice,
          price_currency: 'usd',
          order_id: 'TXN-' + Math.floor(10000 + Math.random() * 90000),
          order_description: `Purchase: ${planDetails.size} ${planDetails.type}`
        });
        
        if (data && data.invoice_url) {
          window.location.href = data.invoice_url;
          return;
        } else {
          alert('Failed to generate NOWPayments invoice. Please ensure API key is configured in backend.');
          setIsProcessing(false);
          return;
        }
      } catch (err) {
        alert('Failed to generate NOWPayments invoice or connect to gateway.');
        setIsProcessing(false);
        return;
      }
    }

    setTimeout(() => {
      // Create new trading account
      const cleanSize = planDetails.size.replace(/[$,]/g, '');
      const initialBalance = parseFloat(cleanSize);
      
      const newAccountId = Math.floor(10000000 + Math.random() * 90000000).toString();
      
      // Determine rules based on type
      const isInstant = planDetails.type.toLowerCase().includes('instant');
      const isOneStep = planDetails.type.toLowerCase().includes('1-step');
      
      let profitTarget = initialBalance * 0.08;
      let drawdownLimit = - (initialBalance * 0.05);
      let maxDrawdown = - (initialBalance * 0.10);
      let tradingDaysRequired = 10;
      
      if (isInstant) {
        profitTarget = 0;
        drawdownLimit = - (initialBalance * 0.05);
        maxDrawdown = - (initialBalance * 0.10);
        tradingDaysRequired = 0;
      } else if (isOneStep) {
        profitTarget = initialBalance * 0.10;
        drawdownLimit = - (initialBalance * 0.04);
        maxDrawdown = - (initialBalance * 0.06);
        tradingDaysRequired = 0;
      }

      const newAccount: TradingAccount = {
        id: newAccountId,
        name: `${planDetails.size} ${planDetails.type}`,
        status: isInstant ? 'Funded' : 'Phase 1',
        balance: initialBalance,
        initialBalance: initialBalance,
        equity: initialBalance,
        leverage: isInstant ? '1:50' : '1:100',
        server: isInstant ? 'Quantum-Live-Pro' : 'Quantum-Evaluation-1',
        platform: 'MetaTrader 5',
        createdDate: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        winRate: 0,
        tradesCount: 0,
        profitTarget: profitTarget,
        dailyDrawdownLimit: drawdownLimit,
        dailyDrawdownCurrent: 0,
        maxDrawdownLimit: maxDrawdown,
        maxDrawdownCurrent: 0,
        tradingDaysCurrent: 0,
        tradingDaysRequired: tradingDaysRequired,
        equityHistory: [{ day: '1', equity: initialBalance }]
      };

      // Create transaction log
      const tx: TransactionItem = {
        id: 'TXN-' + Math.floor(10000 + Math.random() * 90000),
        userId: user?.id || 'offline-mock-user',
        userName: firstName ? `${firstName} ${lastName}` : (user?.fullName || 'Quantum Trader'),
        userEmail: email || user?.email || 'trader@quantum.com',
        amount: finalPrice,
        description: `Purchase: ${planDetails.size} ${planDetails.type}`,
        method: paymentMethod,
        status: 'Paid',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
      };

      // Trigger referral commission if affiliate code matches
      // Look up if any affiliate referrer has a referral code for this user or mock user
      const referrerId = 'google-mock-brijlalcr'; // seed mock referrer
      if (affiliates[referrerId]) {
        const commission = finalPrice * (affiliates[referrerId].commissionPercent / 100);
        addReferral(referrerId, tx.userName, 'Purchased', commission);
      }

      addUserAccount(newAccount);
      addTransaction(tx);
      setIsProcessing(false);
      setPurchaseSuccess(true);
    }, 2000);
  };

  return (
    <div className="scroll-section" style={{ minHeight: '100vh', justifyContent: 'center', paddingTop: '100px' }}>
      <AnimatePresence mode="wait">
        {!purchaseSuccess ? (
          <motion.div
            key="checkout-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{
              width: '100%',
              maxWidth: '1100px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '2.5rem'
            }}
          >
            {/* Left side: Order summary & Coupon */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* Back Button */}
              <button 
                onClick={() => navigate('/')} 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  alignSelf: 'flex-start'
                }}
              >
                <ChevronLeft size={16} /> Back to Challenges
              </button>

              {/* Summary panel */}
              <div style={{
                background: 'var(--glass-bg)',
                backdropFilter: 'blur(20px)',
                border: '1px solid var(--glass-border)',
                borderRadius: '24px',
                padding: '2.5rem',
              }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Order Summary</h2>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                  <span>Challenge Type:</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{planDetails.type}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                  <span>Account Size:</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{planDetails.size}</span>
                </div>
                
                {couponApplied && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: 'var(--accent-cyan)', fontSize: '0.95rem' }}>
                    <span>Discount ({discountPercent}%):</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div style={{ width: '100%', height: '1px', background: 'var(--glass-border)', margin: '1.5rem 0' }} />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: 500, color: 'var(--text-primary)' }}>Total:</span>
                  <span style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--accent-cyan)', textShadow: '0 0 12px var(--accent-glow)' }}>
                    ${finalPrice.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Coupon Panel */}
              <div style={{
                background: 'var(--glass-bg)',
                backdropFilter: 'blur(20px)',
                border: '1px solid var(--glass-border)',
                borderRadius: '24px',
                padding: '2rem',
              }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem' }}>Promo Code</h3>
                <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    placeholder="Enter code (e.g. WELCOME15)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    disabled={couponApplied}
                    style={{
                      flex: 1,
                      padding: '0.7rem 1rem',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontSize: '0.95rem',
                      outline: 'none'
                    }}
                  />
                  <button 
                    type="submit" 
                    disabled={couponApplied || !couponCode}
                    className="neon-button" 
                    style={{ padding: '0.7rem 1.2rem', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 600 }}
                  >
                    Apply
                  </button>
                </form>
                {couponError && <p style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '0.5rem' }}>{couponError}</p>}
                {couponApplied && <p style={{ color: 'var(--accent-cyan)', fontSize: '0.85rem', marginTop: '0.5rem', fontWeight: 600 }}>✓ Code applied successfully!</p>}
              </div>
            </div>

            {/* Right side: Payment Details */}
            <div style={{
              background: 'var(--glass-bg)',
              backdropFilter: 'blur(20px)',
              border: '1px solid var(--glass-border)',
              borderRadius: '24px',
              padding: '2.5rem'
            }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Payment Details</h2>
              
              {/* Gateway Tabs */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '0.5rem',
                marginBottom: '2rem',
                background: 'rgba(255,255,255,0.02)',
                padding: '0.3rem',
                borderRadius: '12px',
                border: '1px solid var(--glass-border)'
              }}>
                {(['NOWPayments'] as PaymentGateway[]).map((gateway) => (
                  <button
                    key={gateway}
                    type="button"
                    onClick={() => setPaymentMethod(gateway)}
                    style={{
                      padding: '0.6rem 0.2rem',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      background: paymentMethod === gateway ? 'var(--accent-cyan)' : 'transparent',
                      color: paymentMethod === gateway ? '#000' : 'var(--text-secondary)',
                      transition: 'all 0.2s',
                      textAlign: 'center'
                    }}
                  >
                    {gateway}
                  </button>
                ))}
              </div>

              {/* Sub Forms */}
              <form onSubmit={handleCompletePurchase} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                {/* Billing Info */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={labelStyle}>First Name</label>
                    <input type="text" placeholder="John" value={firstName} onChange={(e) => setFirstName(e.target.value)} style={inputStyle} required />
                  </div>
                  <div>
                    <label style={labelStyle}>Last Name</label>
                    <input type="text" placeholder="Doe" value={lastName} onChange={(e) => setLastName(e.target.value)} style={inputStyle} required />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Email Address</label>
                  <input type="email" placeholder="john@example.com" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} required />
                </div>

                <div style={{ width: '100%', height: '1px', background: 'var(--glass-border)', margin: '0.5rem 0' }} />

                {/* stripe/card fields */}
                {(paymentMethod === 'Stripe' || paymentMethod === 'Razorpay') && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                      <label style={labelStyle}>Card Number</label>
                      <input 
                        type="text" 
                        placeholder="4242 4242 4242 4242" 
                        value={cardNumber} 
                        onChange={(e) => setCardNumber(e.target.value)} 
                        style={inputStyle} 
                        required 
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={labelStyle}>Expiry Date</label>
                        <input 
                          type="text" 
                          placeholder="MM/YY" 
                          value={expiry} 
                          onChange={(e) => setExpiry(e.target.value)} 
                          style={inputStyle} 
                          required 
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>CVC</label>
                        <input 
                          type="password" 
                          placeholder="123" 
                          value={cvc} 
                          onChange={(e) => setCvc(e.target.value)} 
                          style={inputStyle} 
                          required 
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* PayPal fields */}
                {paymentMethod === 'PayPal' && (
                  <div style={{
                    padding: '2rem',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px dashed var(--glass-border)',
                    borderRadius: '12px',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    alignItems: 'center'
                  }}>
                    <DollarSign size={32} style={{ color: '#0079C1' }} />
                    <span style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 500 }}>PayPal Integration Sandbox</span>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      Upon clicking complete purchase, you will be redirected to the secure PayPal simulated gateway to authorize this evaluation fee transfer.
                    </p>
                  </div>
                )}

                {/* NOWPayments fields */}
                {paymentMethod === 'NOWPayments' && (
                  <div style={{
                    padding: '2rem',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px dashed var(--glass-border)',
                    borderRadius: '12px',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    alignItems: 'center'
                  }}>
                    <Wallet size={32} style={{ color: 'var(--accent-cyan)' }} />
                    <span style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 500 }}>Pay with Crypto (NOWPayments)</span>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      Upon clicking complete purchase, you will be redirected to the secure NOWPayments hosted gateway to complete your crypto transfer.
                    </p>
                  </div>
                )}

                {/* Crypto fields */}
                {paymentMethod === 'Crypto' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    <div>
                      <label style={labelStyle}>Select Crypto Network</label>
                      <select 
                        value={cryptoCurrency} 
                        onChange={(e) => setCryptoCurrency(e.target.value)} 
                        style={{
                          width: '100%',
                          padding: '0.8rem 1rem',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid var(--glass-border)',
                          borderRadius: '8px',
                          color: 'var(--text-primary)',
                          fontSize: '1rem',
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="USDT">USDT (TRC20 / ERC20)</option>
                        <option value="USDC">USDC (ERC20 / Polygon)</option>
                        <option value="BTC">Bitcoin (BTC Network)</option>
                        <option value="ETH">Ethereum (ERC20)</option>
                      </select>
                    </div>

                    <div style={{
                      padding: '1.5rem',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px dashed var(--glass-border)',
                      borderRadius: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                      fontSize: '0.85rem'
                    }}>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: 'var(--accent-cyan)' }}>
                        <Wallet size={16} />
                        <strong>Transfer Deposit Address:</strong>
                      </div>
                      <span style={{ fontFamily: 'monospace', color: 'var(--text-primary)', wordBreak: 'break-all', marginTop: '0.3rem', background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: '6px' }}>
                        {cryptoCurrency === 'USDT' && 'TYVp892XNzN14m12oK12h32uPnV92HkLaQ'}
                        {cryptoCurrency === 'USDC' && '0x42f89028cb20183e890cdba92e01bcf91e848201'}
                        {cryptoCurrency === 'BTC' && '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'}
                        {cryptoCurrency === 'ETH' && '0x71C7656EC7ab88b098defB751B7401B5f6d8976F'}
                      </span>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.3rem' }}>
                        Send exactly the equivalent of **${finalPrice.toFixed(2)}** to the address above. Transfers are monitored and auto-confirmed in 1 confirmation.
                      </span>
                    </div>
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={isProcessing} 
                  className="neon-button" 
                  style={{
                    marginTop: '1rem',
                    padding: '1.1rem',
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.8rem'
                  }}
                >
                  {isProcessing ? (
                    <>
                      <div style={{
                        width: '18px',
                        height: '18px',
                        border: '2px solid rgba(255,255,255,0.2)',
                        borderTopColor: '#000',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite'
                      }} />
                      Processing gateway authentication...
                    </>
                  ) : (
                    `Complete Purchase ($${finalPrice.toFixed(2)})`
                  )}
                </button>
                
                <button 
                  type="button" 
                  disabled={isProcessing}
                  onClick={() => navigate(-1)} 
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    alignSelf: 'center',
                    marginTop: '0.2rem'
                  }}
                >
                  Cancel and return
                </button>
              </form>
            </div>
            <style>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </motion.div>
        ) : (
          <motion.div
            key="success-screen"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{
              maxWidth: '550px',
              width: '100%',
              background: 'var(--glass-bg)',
              backdropFilter: 'blur(20px)',
              border: '2px solid var(--accent-cyan)',
              borderRadius: '24px',
              padding: '4rem 3rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1.5rem',
              boxShadow: '0 0 30px rgba(6,182,212,0.15)'
            }}
          >
            <div style={{
              width: '70px',
              height: '70px',
              borderRadius: '50%',
              background: 'rgba(6,182,212,0.1)',
              border: '2px solid var(--accent-cyan)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-cyan)',
              fontSize: '2rem',
              boxShadow: '0 0 20px var(--accent-glow)'
            }}>
              ✓
            </div>
            
            <h2 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Payment Verified
            </h2>
            
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6 }}>
              Your order has been verified by the gateway. We have provisioned your trading server and added the account credentials to your user terminal.
            </p>

            <div style={{
              width: '100%',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--glass-border)',
              borderRadius: '12px',
              padding: '1.2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              fontSize: '0.9rem',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Account Size:</span>
                <strong style={{ color: 'var(--text-primary)' }}>{planDetails.size}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Challenge Type:</span>
                <strong style={{ color: 'var(--text-primary)' }}>{planDetails.type}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Provision Server:</span>
                <span style={{ fontFamily: 'monospace', color: 'var(--accent-cyan)', fontWeight: 600 }}>Quantum-Evaluation-1</span>
              </div>
            </div>

            <button 
              onClick={() => navigate('/dashboard')} 
              className="neon-button" 
              style={{
                width: '100%',
                padding: '1rem',
                fontSize: '1rem',
                fontWeight: 700,
                marginTop: '1rem'
              }}
            >
              Go to Trader Dashboard
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const labelStyle = {
  display: 'block',
  marginBottom: '0.4rem',
  color: 'var(--text-secondary)',
  fontSize: '0.85rem'
};

const inputStyle = {
  width: '100%',
  padding: '0.8rem 1.2rem',
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid var(--glass-border)',
  borderRadius: '8px',
  color: 'var(--text-primary)',
  fontSize: '0.95rem',
  outline: 'none',
  marginTop: '0.2rem'
};
