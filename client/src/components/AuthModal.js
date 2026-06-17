import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// eslint-disable-next-line no-unused-vars
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const Field = ({ label, type, placeholder, value, onChange, accent = '#2D5A27' }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: 'block', marginBottom: 5, fontWeight: 600, fontSize: '0.85rem', color: '#333' }}>{label}</label>
    <input type={type} required placeholder={placeholder} value={value} onChange={onChange}
      style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e0e0e0', borderRadius: 8, fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'Cairo, sans-serif', transition: 'border-color 0.2s' }}
      onFocus={e => e.target.style.borderColor = accent}
      onBlur={e => e.target.style.borderColor = '#e0e0e0'} />
  </div>
);

const Rule = ({ checked, label }) => (
  <div style={{ 
    display: 'flex', 
    alignItems: 'center', 
    gap: 6, 
    color: checked ? '#2D5A27' : '#888', 
    fontWeight: checked ? 600 : 400,
    transition: 'all 0.25s',
    fontSize: '0.78rem'
  }}>
    <span style={{ 
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 14, 
      height: 14, 
      borderRadius: '50%', 
      background: checked ? 'rgba(45, 90, 39, 0.15)' : 'rgba(0,0,0,0.06)',
      color: checked ? '#2D5A27' : '#aaa',
      fontSize: '0.65rem',
      fontWeight: 'bold',
      transition: 'all 0.25s'
    }}>
      {checked ? '✓' : '•'}
    </span>
    {label}
  </div>
);

const AuthModal = () => {
  const { showAuthModal, setShowAuthModal, login, register, googleLogin, forgotPassword, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab]           = useState('login');   /* 'login' | 'register' | 'forgot' | 'reset' */
  const [loginData, setLD]      = useState({ email: '', password: '' });
  const [regData,   setRD]      = useState({ name: '', email: '', password: '', confirm: '' });
  const [forgotData, setFD]     = useState({ email: '', otp: '', newPassword: '', confirm: '' });
  const [loading, setLoading]   = useState(false);
  const [error,   setError]     = useState('');
  const [success, setSuccess]   = useState('');

  useEffect(() => {
    if (!showAuthModal) { setTab('login'); setError(''); setSuccess(''); }
    document.body.style.overflow = showAuthModal ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showAuthModal]);

  const handleAuthSuccess = (user) => {
    if (user.role === 'admin' || user.role === 'employee') {
      navigate('/admin');
    }
  };

  const handleLogin = async e => {
    e.preventDefault(); setError(''); setLoading(true);
    try { 
      const user = await login(loginData.email, loginData.password); 
      handleAuthSuccess(user);
    }
    catch (err) { setError(err.response?.data?.message || 'Login failed. Check your credentials.'); }
    finally { setLoading(false); }
  };

  const handleRegister = async e => {
    e.preventDefault();
    if (regData.password !== regData.confirm) { setError('Passwords do not match.'); return; }
    
    // Client-side strong password validation
    const passLength = regData.password.length >= 8;
    const passUpper = /[A-Z]/.test(regData.password);
    const passLower = /[a-z]/.test(regData.password);
    const passNumber = /[0-9]/.test(regData.password);
    const passSymbol = /[^A-Za-z0-9]/.test(regData.password);
    
    if (!passLength || !passUpper || !passLower || !passNumber || !passSymbol) {
      setError('Please satisfy all password complexity requirements.');
      return;
    }

    setError(''); setLoading(true);
    try { 
      const user = await register(regData.name, regData.email, regData.password); 
      handleAuthSuccess(user);
    }
    catch (err) { setError(err.response?.data?.message || 'Registration failed. Try again.'); }
    finally { setLoading(false); }
  };

  // Use a ref so the GSI callback always calls the latest version (fixes stale closure)
  const googleCallbackRef = useRef(null);

  const handleGoogleCallback = useCallback(async (response) => {
    setLoading(true);
    setError('');
    try {
      const user = await googleLogin({ credential: response.credential });
      handleAuthSuccess(user);
    } catch (err) {
      console.error('Google Login Error:', err);
      setError(err.response?.data?.message || 'Google authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [googleLogin]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    googleCallbackRef.current = handleGoogleCallback;
  }, [handleGoogleCallback]);

  useEffect(() => {
    if (showAuthModal && tab === 'login') {
      const stableCallback = (response) => googleCallbackRef.current(response);
      const interval = setInterval(() => {
        if (window.google) {
          clearInterval(interval);
          if (!process.env.REACT_APP_GOOGLE_CLIENT_ID) {
            console.error(
              "❌ REACT_APP_GOOGLE_CLIENT_ID is not defined! " +
              "Google Sign-In will not function. Make sure to configure it in your Vercel/environment settings."
            );
            return;
          }
          window.google.accounts.id.initialize({
            client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
            callback: stableCallback,
          });
          window.google.accounts.id.renderButton(
            document.getElementById('google-signin-btn'),
            { theme: 'outline', size: 'large', width: 364, text: 'continue_with' }
          );
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [showAuthModal, tab]);

  const handleForgot = async e => {
    e.preventDefault(); setError(''); setSuccess(''); setLoading(true);
    try {
      await forgotPassword(forgotData.email);
      setSuccess('Reset code sent! Check your email.');
      setTab('reset');
    } catch (err) { setError(err.response?.data?.message || 'Failed to send reset code.'); }
    finally { setLoading(false); }
  };

  const handleReset = async e => {
    e.preventDefault(); setError(''); setSuccess('');
    if (forgotData.newPassword !== forgotData.confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      await resetPassword(forgotData.email, forgotData.otp, forgotData.newPassword);
      setSuccess('Password updated successfully! You can now log in.');
      setTab('login');
      setFD({ email: '', otp: '', newPassword: '', confirm: '' });
    } catch (err) { setError(err.response?.data?.message || 'Failed to reset password.'); }
    finally { setLoading(false); }
  };

  const switchTab = t => { setTab(t); setError(''); setSuccess(''); };

  if (!showAuthModal) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={() => setShowAuthModal(false)}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>

        <motion.div initial={{ scale: 0.88, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.88, opacity: 0 }}
          onClick={e => e.stopPropagation()}
          style={{ background: 'white', borderRadius: 18, width: '100%', maxWidth: 420, boxShadow: '0 24px 70px rgba(0,0,0,0.28)', overflow: 'hidden' }}>

          {/* ── Gradient header ── */}
          <div style={{ background: 'linear-gradient(135deg, #2D5A27, #5D4037)', padding: '28px 32px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 38, marginBottom: 6 }}>🌿</div>
            <h2 style={{ color: '#C8A951', fontFamily: 'Playfair Display', margin: '0 0 4px', fontSize: '1.45rem' }}>
              {tab === 'login' ? 'Welcome Back' : tab === 'register' ? 'Create Account' : tab === 'forgot' ? 'Reset Password' : 'New Password'}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.72)', margin: 0, fontSize: '0.85rem' }}>
              {tab === 'login' ? 'Sign in to Arab Fertilizer' : tab === 'register' ? 'Join the Arab Fertilizer family' : tab === 'forgot' ? 'Enter your email to receive a code' : 'Enter the code and your new password'}
            </p>

            {/* Tab switcher inside header */}
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: 4, marginTop: 18 }}>
              {['login', 'register'].map(t => (
                <button key={t} onClick={() => switchTab(t)} style={{
                  flex: 1, padding: '8px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: tab === t ? 'white' : 'transparent',
                  color: tab === t ? '#2D5A27' : 'rgba(255,255,255,0.75)',
                  fontWeight: tab === t ? 700 : 500, fontSize: '0.88rem',
                  fontFamily: 'Cairo, sans-serif', transition: 'all 0.25s',
                }}>
                  {t === 'login' ? 'Sign In' : 'Sign Up'}
                </button>
              ))}
            </div>
          </div>

          {/* ── Body ── */}
          <div style={{ padding: '24px 28px 28px', overflowY: 'auto', maxHeight: 'calc(95vh - 200px)' }}>
            {error && (
              <div style={{ background: '#fde8e8', color: '#c0392b', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: '0.85rem', fontWeight: 500 }}>
                ⚠️ {error}
              </div>
            )}
            {success && (
              <div style={{ background: '#e8f5e9', color: '#2D5A27', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: '0.85rem', fontWeight: 500 }}>
                ✅ {success}
              </div>
            )}

            {/* LOGIN FORM */}
            {tab === 'login' && (
              <form onSubmit={handleLogin}>
                <Field label="Email" type="email" placeholder="your@email.com"
                  value={loginData.email} onChange={e => setLD(d => ({ ...d, email: e.target.value }))} />
                <Field label="Password" type="password" placeholder="••••••••"
                  value={loginData.password} onChange={e => setLD(d => ({ ...d, password: e.target.value }))} />
                
                <div style={{ textAlign: 'right', marginTop: '-6px', marginBottom: '14px' }}>
                  <button type="button" onClick={() => switchTab('forgot')} style={{ background: 'none', border: 'none', color: '#2D5A27', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', padding: 0 }}>
                    Forgot Password?
                  </button>
                </div>

                <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', background: '#2D5A27', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginBottom: 14, fontFamily: 'Cairo, sans-serif', transition: 'background 0.2s' }}
                  onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#3a7a31'; }}
                  onMouseLeave={e => e.currentTarget.style.background = '#2D5A27'}>
                  {loading ? '⏳ Signing in…' : 'Sign In →'}
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div style={{ flex: 1, height: 1, background: '#eee' }} />
                  <span style={{ color: '#aaa', fontSize: '0.8rem' }}>or continue with</span>
                  <div style={{ flex: 1, height: 1, background: '#eee' }} />
                </div>

                <div id="google-signin-btn" style={{ display: 'flex', justifyContent: 'center' }}></div>
              </form>
            )}

            {/* REGISTER FORM */}
            {tab === 'register' && (() => {
              const passLength = regData.password.length >= 8;
              const passUpper  = /[A-Z]/.test(regData.password);
              const passLower  = /[a-z]/.test(regData.password);
              const passNumber = /[0-9]/.test(regData.password);
              const passSymbol = /[^A-Za-z0-9]/.test(regData.password);

              return (
                <form onSubmit={handleRegister}>
                  <Field label="Full Name" type="text" placeholder="Muhammad Ahmed" accent="#5D4037"
                    value={regData.name} onChange={e => setRD(d => ({ ...d, name: e.target.value }))} />
                  <Field label="Email" type="email" placeholder="your@email.com" accent="#5D4037"
                    value={regData.email} onChange={e => setRD(d => ({ ...d, email: e.target.value }))} />
                  <Field label="Password" type="password" placeholder="••••••••" accent="#5D4037"
                    value={regData.password} onChange={e => setRD(d => ({ ...d, password: e.target.value }))} />

                  {/* Password requirements panel */}
                  {regData.password && (
                    <div style={{
                      background: 'rgba(0,0,0,0.02)',
                      border: '1px dashed #e0e0e0',
                      borderRadius: 8,
                      padding: '10px 14px',
                      marginBottom: 14,
                      transition: 'all 0.3s'
                    }}>
                      <div style={{ fontWeight: 700, marginBottom: 6, fontSize: '0.8rem', color: '#444' }}>Password Requirements:</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 10px' }}>
                        <Rule checked={passLength} label="Min 8 characters" />
                        <Rule checked={passUpper} label="Uppercase letter" />
                        <Rule checked={passLower} label="Lowercase letter" />
                        <Rule checked={passNumber} label="At least one number" />
                        <div style={{ gridColumn: 'span 2' }}>
                          <Rule checked={passSymbol} label="Special symbol (e.g. @, #, $, !)" />
                        </div>
                      </div>
                    </div>
                  )}

                  <Field label="Confirm Password" type="password" placeholder="••••••••" accent="#5D4037"
                    value={regData.confirm} onChange={e => setRD(d => ({ ...d, confirm: e.target.value }))} />

                  <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', background: '#5D4037', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: 4, fontFamily: 'Cairo, sans-serif', transition: 'background 0.2s' }}
                    onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#7a5548'; }}
                    onMouseLeave={e => e.currentTarget.style.background = '#5D4037'}>
                    {loading ? '⏳ Creating…' : 'Create Account →'}
                  </button>
                </form>
              );
            })()}

            {/* FORGOT PASSWORD FORM */}
            {tab === 'forgot' && (
              <form onSubmit={handleForgot}>
                <Field label="Email Address" type="email" placeholder="your@email.com"
                  value={forgotData.email} onChange={e => setFD(d => ({ ...d, email: e.target.value }))} />
                
                <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', background: '#2D5A27', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: 4, fontFamily: 'Cairo, sans-serif', transition: 'background 0.2s' }}>
                  {loading ? '⏳ Sending…' : 'Send Reset Code →'}
                </button>
                <div style={{ textAlign: 'center', marginTop: 14 }}>
                  <button type="button" onClick={() => switchTab('login')} style={{ background: 'none', border: 'none', color: '#666', fontSize: '0.85rem', cursor: 'pointer' }}>
                    ← Back to Login
                  </button>
                </div>
              </form>
            )}

            {/* RESET PASSWORD FORM */}
            {tab === 'reset' && (
              <form onSubmit={handleReset}>
                <Field label="6-Digit Reset Code" type="text" placeholder="123456"
                  value={forgotData.otp} onChange={e => setFD(d => ({ ...d, otp: e.target.value }))} />
                <Field label="New Password" type="password" placeholder="••••••••"
                  value={forgotData.newPassword} onChange={e => setFD(d => ({ ...d, newPassword: e.target.value }))} />
                <Field label="Confirm New Password" type="password" placeholder="••••••••"
                  value={forgotData.confirm} onChange={e => setFD(d => ({ ...d, confirm: e.target.value }))} />

                <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', background: '#2D5A27', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: 4, fontFamily: 'Cairo, sans-serif', transition: 'background 0.2s' }}>
                  {loading ? '⏳ Resetting…' : 'Update Password →'}
                </button>
              </form>
            )}
          </div>

          {/* close button */}
          <button onClick={() => setShowAuthModal(false)} style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(255,255,255,0.18)', border: 'none', color: 'white', width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ✕
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AuthModal;