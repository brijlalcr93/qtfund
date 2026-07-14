import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, Wallet, ChevronLeft } from 'lucide-react';
import { usePlatformStore } from '../store/platformStore';
import type { ChallengePackage } from '../store/platformStore';
import { useAuth } from '../contexts/AuthContext';
import { api, ApiError } from '../lib/api';

type PaymentGateway = 'Stripe' | 'PayPal' | 'Razorpay' | 'Crypto';

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { addUserAccount } = usePlatformStore();

  const planDetails = location.state || {
    type: '2-Step Challenge',
    size: '$100,000',
    price: '$449'
  };

  // Resolve the real backend challenge_plans row matching this plan's type/size, since the
  // purchase API needs a real packageId, not just display strings.
  const [matchedPackage, setMatchedPackage] = useState<ChallengePackage | null>(null);
  const [loadingPackage, setLoadingPackage] = useState(true);

  useEffect(() => {
    api.get<ChallengePackage[]>('/dashboard/packages')
      .then((packages) => {
        const typePrefix = planDetails.type.replace(' Challenge', '');
        const match = packages.find(p => p.type === typePrefix && p.size === planDetails.size);
        setMatchedPackage(match || null);
      })
      .catch(() => setMatchedPackage(null))
      .finally(() => setLoadingPackage(false));
  }, [planDetails.type, planDetails.size]);

  const [paymentMethod, setPaymentMethod] = useState<PaymentGateway>('Stripe');
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [purchaseError, setPurchaseError] = useState('');
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');

  const basePriceNum = parseFloat(planDetails.price.replace(/[$,]/g, ''));
  const discountAmount = basePriceNum * (discountPercent / 100);
  const finalPrice = basePriceNum - discountAmount;

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');

    try {
      const result = await api.get<{ active: boolean; discountPercent?: number }>(`/coupons/check/${couponCode.toUpperCase()}`);
      if (result.active) {
        setDiscountPercent(result.discountPercent || 0);
        setCouponApplied(true);
      } else {
        setCouponError('Invalid, expired, or fully-redeemed coupon code.');
      }
    } catch {
      setCouponError('Could not validate coupon. Please try again.');
    }
  };

  const handleCompletePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    setPurchaseError('');

    if (!matchedPackage) {
      setPurchaseError('This challenge package is not currently available. Please pick a plan from the Pricing page.');
      return;
    }

    setIsProcessing(true);
    try {
      if (paymentMethod === 'Crypto') {
        const { invoiceUrl } = await api.post<{ orderRef: string; invoiceUrl: string }>('/payments/crypto/create-invoice', {
          packageId: matchedPackage.id,
          couponCode: couponApplied ? couponCode.toUpperCase() : undefined
        });
        window.location.href = invoiceUrl;
        return;
      }

      await addUserAccount(matchedPackage.id, couponApplied ? couponCode.toUpperCase() : undefined);
      setPurchaseSuccess(true);
    } catch (err) {
      setPurchaseError(err instanceof ApiError ? err.message : 'Purchase failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
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
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '0.5rem',
                marginBottom: '2rem',
                background: 'rgba(255,255,255,0.02)',
                padding: '0.3rem',
                borderRadius: '12px',
                border: '1px solid var(--glass-border)'
              }}>
                {(['Stripe', 'PayPal', 'Razorpay', 'Crypto'] as PaymentGateway[]).map((gateway) => (
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

                {loadingPackage && (
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center' }}>
                    Verifying challenge availability...
                  </div>
                )}

                {!loadingPackage && !matchedPackage && (
                  <div style={{ color: '#ef4444', fontSize: '0.85rem', textAlign: 'center', background: 'rgba(239,68,68,0.05)', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.1)' }}>
                    This challenge package could not be matched to an available plan. Please return to Pricing and select a plan again.
                  </div>
                )}

                {purchaseError && (
                  <div style={{ color: '#ef4444', fontSize: '0.85rem', textAlign: 'center', background: 'rgba(239,68,68,0.05)', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.1)' }}>
                    {purchaseError}
                  </div>
                )}

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

                {/* Crypto: handled by BitPay's own hosted checkout — no address/QR needed here */}
                {paymentMethod === 'Crypto' && (
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
                      <strong>Pay with Bitcoin, Ethereum, or other supported crypto</strong>
                    </div>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.3rem' }}>
                      Clicking "Complete Purchase" redirects you to BitPay's secure checkout page, where you'll pick your coin and get a deposit address and QR code. You'll be brought back here automatically once payment is confirmed on-chain.
                    </span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isProcessing || loadingPackage || !matchedPackage}
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
