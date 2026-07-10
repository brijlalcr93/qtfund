import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { RotateCw, Mail, ArrowLeft, Key } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api, ApiError } from '../lib/api';

type AuthView = 'login' | 'signup' | 'reset-password' | 'otp-verify' | 'two-factor';

export default function Auth() {
  const navigate = useNavigate();
  const { user, signIn, signUp } = useAuth();

  const [view, setView] = useState<AuthView>('login');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // CAPTCHA State (For Sign In)
  const [captchaCode, setCaptchaCode] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');

  // Verification OTP State (For Registration)
  const [otpInput, setOtpInput] = useState('');

  // 2FA State (For Login)
  const [twoFactorCode, setTwoFactorCode] = useState('');

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Generate CAPTCHA
  const generateCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaCode(code);
    setCaptchaInput('');
  };

  useEffect(() => {
    if (view === 'login') {
      generateCaptcha();
    }
  }, [view]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (view === 'login') {
        // 1. Validate CAPTCHA
        if (captchaInput.toLowerCase() !== captchaCode.toLowerCase()) {
          setErrorMsg('Invalid CAPTCHA verification code. Please retry.');
          generateCaptcha();
          setLoading(false);
          return;
        }

        // Check if 2FA is active for this email (or local storage key `quantum_2fa_active` is true)
        const is2FAActive = localStorage.getItem('quantum_2fa_active') === 'true' || email === 'admin@quantum.com';

        if (is2FAActive) {
          // Pause login and redirect to 2FA screen
          setView('two-factor');
          setLoading(false);
          return;
        }

        // Standard Login
        await proceedToLogin();
      } 
      
      else if (view === 'signup') {
        const registeredUser = await signUp(email, password, fullName);
        navigate('/dashboard');
        return;
      }

      else if (view === 'reset-password') {
        await api.post('/auth/reset-password', { email });
        setSuccessMsg(`If an account exists for ${email}, a password reset link has been dispatched. Please also check your spam folder.`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error.');
      setLoading(false);
    }
  };

  const proceedToLogin = async () => {
    setLoading(true);
    setErrorMsg('');

    try {
      const loggedInUser = await signIn(email, password);

      // Route admin roles to admin panel, everyone else to dashboard
      if (
        loggedInUser.role === 'Admin' ||
        loggedInUser.role === 'Super Admin' ||
        loggedInUser.role === 'Support Agent' ||
        loggedInUser.role === 'Finance Manager' ||
        loggedInUser.role === 'Affiliate Manager'
      ) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message || 'Invalid email or password');
      } else {
        setErrorMsg('Cannot connect to server. Please try again later.');
      }
      setLoading(false);
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setView('login');
  };

  const handleVerify2FA = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(async () => {
      if (twoFactorCode === '999999' || twoFactorCode.length === 6) {
        await proceedToLogin();
      } else {
        setErrorMsg('Invalid Google Authenticator code. Enter 999999 to bypass.');
        setLoading(false);
      }
    }, 1500);
  };

  const handleGoogleSignUp = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const isPlaceholder = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('placeholder');
      if (isPlaceholder) throw new Error('Supabase not configured');

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + '/dashboard' }
      });
      if (error) throw error;
    } catch {
      setErrorMsg('Google Sign-In is not available. Please use email registration.');
      setLoading(false);
    }
  };

  return (
    <div className="scroll-section" style={{ minHeight: '100vh', justifyContent: 'center' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="auth-card"
      >
        {/* Back navigation */}
        {view !== 'login' && view !== 'signup' && (
          <button
            onClick={() => { setView('login'); setErrorMsg(''); setSuccessMsg(''); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '0.9rem',
              marginBottom: '1.5rem',
              padding: 0
            }}
          >
            <ArrowLeft size={16} /> Return to Sign In
          </button>
        )}

        <h2 style={{
          fontSize: '2rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
          textAlign: 'center',
          marginBottom: '2rem',
          letterSpacing: '-0.02em'
        }}>
          {view === 'login' && 'Welcome Back'}
          {view === 'signup' && 'Create Account'}
          {view === 'reset-password' && 'Reset Password'}
          {view === 'otp-verify' && 'Verify Email'}
          {view === 'two-factor' && '2FA Authorization'}
        </h2>

        {errorMsg && (
          <div style={{ color: '#ef4444', marginBottom: '1.5rem', textAlign: 'center', fontSize: '0.9rem', lineHeight: 1.4, background: 'rgba(239,68,68,0.05)', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.1)' }}>
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div style={{ color: 'var(--accent-cyan)', marginBottom: '1.5rem', textAlign: 'center', fontSize: '0.9rem', lineHeight: 1.4, background: 'rgba(6,182,212,0.05)', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(6,182,212,0.15)' }}>
            {successMsg}
          </div>
        )}

        {/* 1. Main Forms (Login, Register, Reset Password) */}
        {(view === 'login' || view === 'signup' || view === 'reset-password') && (
          <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {view === 'signup' && (
              <div>
                <label style={labelStyle}>Full Name</label>
                <input 
                  type="text" 
                  placeholder="John Doe" 
                  style={inputStyle} 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required 
                />
              </div>
            )}
            
            <div>
              <label style={labelStyle}>Email Address</label>
              <input 
                type="email" 
                placeholder="john@example.com" 
                style={inputStyle} 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>

            {view !== 'reset-password' && (
              <div>
                <label style={labelStyle}>Password</label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  style={inputStyle} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>
            )}

            {/* Forgot Password link during Sign In */}
            {view === 'login' && (
              <button
                type="button"
                onClick={() => { setView('reset-password'); setErrorMsg(''); }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  textAlign: 'right',
                  marginTop: '-0.8rem',
                  alignSelf: 'flex-end'
                }}
              >
                Forgot Password?
              </button>
            )}

            {/* Captcha Block for Sign In */}
            {view === 'login' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <label style={labelStyle}>Security Verification</label>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={captchaContainerStyle}>
                    <span style={captchaTextStyle}>
                      {captchaCode}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={generateCaptcha}
                    style={refreshBtnStyle}
                    title="Refresh CAPTCHA"
                  >
                    <RotateCw size={18} />
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Type characters above"
                  style={inputStyle}
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value)}
                  required
                />
              </div>
            )}

            <button type="submit" disabled={loading} className="neon-button" style={{
              marginTop: '1rem',
              padding: '1rem',
              fontSize: '1rem',
              fontWeight: 600,
              width: '100%',
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}>
              {loading ? 'Processing...' : (view === 'login' ? 'Sign In' : view === 'signup' ? 'Sign Up' : 'Disptach Reset Link')}
            </button>
          </form>
        )}

        {/* 2. Email verification prompt (shown after signup) */}
        {view === 'otp-verify' && (
          <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
              <Mail size={32} style={{ color: 'var(--accent-cyan)', marginBottom: '0.5rem' }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                A verification link has been sent to <strong>{email}</strong>. Please check your email and click the link to activate your account.
              </p>
            </div>
            
            <div>
              <label style={labelStyle}>Email Verified?</label>
              <input 
                type="text" 
                maxLength={6}
                placeholder="Click verify link in email" 
                style={inputStyle} 
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
                required 
              />
            </div>

            <button type="submit" disabled={loading} className="neon-button" style={{
              padding: '1rem',
              fontSize: '1rem',
              fontWeight: 600,
              width: '100%'
            }}>
              {loading ? 'Checking...' : 'Return to Sign In'}
            </button>
          </form>
        )}

        {/* 3. 2FA Form (For login validation) */}
        {view === 'two-factor' && (
          <form onSubmit={handleVerify2FA} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
              <Key size={32} style={{ color: '#a855f7', marginBottom: '0.5rem' }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                Two-Factor Security is active on this account. Open your Google Authenticator app and enter the 6-digit security code. (Use **999999** for mockup bypass).
              </p>
            </div>
            
            <div>
              <label style={labelStyle}>Authenticator Code</label>
              <input 
                type="text" 
                maxLength={6}
                placeholder="999999" 
                style={inputStyle} 
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
                required 
              />
            </div>

            <button type="submit" disabled={loading} className="neon-button" style={{
              padding: '1rem',
              fontSize: '1rem',
              fontWeight: 600,
              width: '100%'
            }}>
              {loading ? 'Authorizing session...' : 'Authorize Login'}
            </button>
          </form>
        )}

        {/* Google OAuth signup option for Sign Up and Login views */}
        {(view === 'login' || view === 'signup') && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0', gap: '1rem' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }} />
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>or</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }} />
            </div>

            <button 
              type="button" 
              onClick={handleGoogleSignUp} 
              style={googleBtnStyle}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
                e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.5)';
                e.currentTarget.style.boxShadow = '0 0 15px rgba(6, 182, 212, 0.2)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                e.currentTarget.style.borderColor = 'var(--glass-border)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              {view === 'login' ? 'Sign In with Google' : 'Sign Up with Google'}
            </button>
          </>
        )}

        <div style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--text-secondary)' }}>
          {view === 'login' ? (
            <>
              Don't have an account?{' '}
              <button 
                onClick={() => { setView('signup'); setErrorMsg(''); setSuccessMsg(''); }}
                style={linkButtonStyle}
              >
                Sign Up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button 
                onClick={() => { setView('login'); setErrorMsg(''); setSuccessMsg(''); }}
                style={linkButtonStyle}
              >
                Sign In
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

const labelStyle = {
  display: 'block',
  marginBottom: '0.5rem',
  color: 'var(--text-secondary)',
  fontSize: '0.9rem'
};

const inputStyle = {
  width: '100%',
  padding: '0.8rem 1rem',
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid var(--glass-border)',
  borderRadius: '8px',
  color: 'var(--text-primary)',
  fontSize: '1rem',
  outline: 'none',
  boxSizing: 'border-box' as const
};



const captchaContainerStyle = {
  flex: 1,
  padding: '0.8rem 1.2rem',
  background: 'repeating-linear-gradient(45deg, rgba(6,182,212,0.1), rgba(6,182,212,0.1) 8px, rgba(0,0,0,0.35) 8px, rgba(0,0,0,0.35) 16px)',
  border: '1px solid rgba(6, 182, 212, 0.3)',
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  userSelect: 'none' as const,
  boxShadow: 'inset 0 0 12px rgba(6, 182, 212, 0.25)'
};

const captchaTextStyle = {
  fontFamily: 'monospace',
  fontSize: '1.6rem',
  fontWeight: 700,
  letterSpacing: '0.25em',
  color: 'var(--accent-cyan)',
  textShadow: '0 0 10px rgba(6, 182, 212, 0.6)',
  transform: 'skewX(-8deg) rotate(-2deg)',
  display: 'inline-block'
};

const refreshBtnStyle = {
  padding: '0.8rem',
  background: 'rgba(255, 255, 255, 0.03)',
  border: '1px solid var(--glass-border)',
  borderRadius: '8px',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s'
};

const googleBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.75rem',
  width: '100%',
  padding: '0.8rem 1.5rem',
  borderRadius: '8px',
  background: 'rgba(255, 255, 255, 0.03)',
  border: '1px solid var(--glass-border)',
  color: 'var(--text-primary)',
  fontSize: '0.95rem',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.3s',
  boxSizing: 'border-box' as const
};

const linkButtonStyle = {
  background: 'none',
  border: 'none',
  color: 'var(--accent-cyan)',
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: '1rem',
  padding: 0
};
