import React, { useState } from 'react';
import apiClient from '../../utils/apiClient';
import { useAuth } from '../../context/AuthContext';

const ResetPassword = () => {
  const [form, setForm]     = useState({ oldPassword: '', newPassword: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg]       = useState({ text: '', ok: true });
  const { user } = useAuth();

  const submit = async () => {
    if (!form.oldPassword) {
      setMsg({ text: 'Current password is required', ok: false });
      return;
    }
    if (form.newPassword.length < 6) {
      setMsg({ text: 'New password must be at least 6 characters', ok: false });
      return;
    }
    if (form.newPassword !== form.confirm) {
      setMsg({ text: 'Passwords do not match', ok: false });
      return;
    }
    setLoading(true);
    setMsg({ text: '', ok: true });
    try {
      const { data } = await apiClient.post(
        '/admin/change-password',
        {
          currentPassword: form.oldPassword,
          newPassword: form.newPassword
        }
      );
      setMsg({ text: '✅ ' + (data.message || 'Password updated successfully!'), ok: true });
      setForm({ oldPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Failed to update password', ok: false });
    } finally {
      setLoading(false);
    }
  };

  const inp = {
    border: '1.5px solid #e0e0e0', borderRadius: 9, fontSize: '0.9rem',
    outline: 'none', fontFamily: 'Cairo, sans-serif',
    padding: '11px 44px 11px 14px', width: '100%', boxSizing: 'border-box',
  };

  return (
    <div style={{ padding: 32, maxWidth: 520, fontFamily: 'Cairo, sans-serif' }}>
      <h1 style={{ fontFamily: 'Playfair Display', fontSize: '1.9rem', marginBottom: 8 }}>
        🔑 {user?.role === 'employee' ? 'Change Password' : 'Change Admin Password'}
      </h1>
      <p style={{ color: '#888', marginBottom: 28, fontSize: '0.9rem' }}>
        Update the password for <strong>{user?.email || 'your account'}</strong> in MongoDB.
      </p>

      <div style={{ background: 'white', borderRadius: 14, padding: 28, boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
        {msg.text && (
          <div style={{ background: msg.ok ? '#d1e7dd' : '#fde8e8', color: msg.ok ? '#0f5132' : '#c0392b', padding: '12px 16px', borderRadius: 9, marginBottom: 20, fontWeight: 600, fontSize: '0.9rem', lineHeight: 1.5 }}>
            {msg.text}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[['oldPassword', 'Current Password'], ['newPassword', 'New Password'], ['confirm', 'Confirm New Password']].map(([key, label]) => (
            <div key={key}>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 700, fontSize: '0.85rem', color: '#444' }}>{label}</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder="Min 6 characters"
                  style={inp}
                  onFocus={e => e.target.style.borderColor = '#2D5A27'}
                  onBlur={e => e.target.style.borderColor = '#e0e0e0'}
                />
                <button type="button" onClick={() => setShowPw(s => !s)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: '#888' }}>
                  {showPw ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
          ))}

          <button onClick={submit} disabled={loading}
            style={{ background: loading ? '#aaa' : '#2D5A27', color: 'white', border: 'none', borderRadius: 10, padding: 13, fontWeight: 700, fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Cairo, sans-serif', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#3a7a31'; }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#2D5A27'; }}>
            {loading
              ? <><span style={{ width: 18, height: 18, border: '3px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin .8s linear infinite' }} /> Updating…</>
              : '🔑 Update Password in MongoDB'}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
};

export default ResetPassword;