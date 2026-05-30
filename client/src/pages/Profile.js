import React, { useState } from 'react';
import { motion } from 'framer-motion';
import apiClient from '../utils/apiClient';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { user, setShowAuthModal } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name:     user?.name     || '',
    phone:    user?.phone    || '',
    street:   user?.address?.street   || '',
    city:     user?.address?.city     || '',
    province: user?.address?.province || '',
  });
  const [pwForm, setPwForm]   = useState({ current: '', newPw: '', confirm: '' });
  const [tab, setTab]         = useState('profile');
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState({ text: '', ok: true });

  if (!user) return (
    <div style={{ paddingTop: 120, textAlign: 'center', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🔒</div>
        <h2 style={{ fontFamily: 'Playfair Display', color: '#2D5A27', marginBottom: 12 }}>Please Login</h2>
        <button onClick={() => setShowAuthModal(true)}
          style={{ background: '#2D5A27', color: 'white', border: 'none', borderRadius: 10, padding: '12px 28px', fontWeight: 700, cursor: 'pointer', fontSize: '1rem', fontFamily: 'Cairo, sans-serif' }}>
          Login
        </button>
      </div>
    </div>
  );

  const flash = (text, ok = true) => { setMsg({ text, ok }); setTimeout(() => setMsg({ text: '', ok: true }), 3000); };

  const saveProfile = async () => {
    setSaving(true);
    try {
      await apiClient.put('/auth/profile',
        { name: form.name, phone: form.phone, address: { street: form.street, city: form.city, province: form.province } }
      );
      flash('✅ Profile updated successfully!');
    } catch (err) {
      flash(err.response?.data?.message || 'Failed to update profile', false);
    } finally { setSaving(false); }
  };

  const changePassword = async () => {
    if (!pwForm.current) { flash('Enter your current password', false); return; }
    if (pwForm.newPw.length < 6) { flash('New password must be at least 6 characters', false); return; }
    if (pwForm.newPw !== pwForm.confirm) { flash('Passwords do not match', false); return; }
    setSaving(true);
    try {
      await apiClient.put('/auth/change-password',
        { currentPassword: pwForm.current, newPassword: pwForm.newPw }
      );
      flash('✅ Password changed successfully!');
      setPwForm({ current: '', newPw: '', confirm: '' });
    } catch (err) {
      flash(err.response?.data?.message || 'Failed to change password', false);
    } finally { setSaving(false); }
  };

  const inp = { border: '1.5px solid #e0e0e0', borderRadius: 9, fontSize: '0.9rem', outline: 'none', fontFamily: 'Cairo, sans-serif', padding: '11px 14px', width: '100%', boxSizing: 'border-box', transition: 'border-color .2s' };

  return (
    <div style={{ paddingTop: 72, background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

          {/* Header card */}
          <div style={{ background: 'linear-gradient(135deg,#1a2e18,#2D5A27)', borderRadius: 16, padding: '32px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 24 }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#C8A951', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', fontWeight: 800, color: '#1a1a1a', flexShrink: 0 }}>
              {user.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <h1 style={{ color: 'white', fontFamily: 'Playfair Display', fontSize: '1.6rem', margin: '0 0 4px' }}>{user.name}</h1>
              <p style={{ color: 'rgba(255,255,255,0.6)', margin: 0, fontSize: '0.9rem' }}>{user.email}</p>
              <span style={{ background: 'rgba(200,169,81,0.2)', border: '1px solid rgba(200,169,81,0.5)', color: '#C8A951', borderRadius: 20, padding: '3px 12px', fontSize: '0.75rem', fontWeight: 700, display: 'inline-block', marginTop: 6, textTransform: 'capitalize' }}>
                {user.role || 'Customer'}
              </span>
            </div>
          </div>

          {/* Tab switcher */}
          <div style={{ background: 'white', borderRadius: 12, padding: '6px', marginBottom: 20, display: 'flex', gap: 4, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            {[['profile','👤 My Profile'],['password','🔑 Change Password'],['orders','📦 My Orders']].map(([k,l]) => (
              <button key={k} onClick={() => k === 'orders' ? navigate('/my-orders') : setTab(k)}
                style={{ flex: 1, padding: '10px', border: 'none', borderRadius: 9, cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem', fontFamily: 'Cairo, sans-serif', background: tab === k ? '#2D5A27' : 'transparent', color: tab === k ? 'white' : '#666', transition: 'all .2s' }}>
                {l}
              </button>
            ))}
          </div>

          {/* Flash message */}
          {msg.text && (
            <div style={{ background: msg.ok ? '#d1e7dd' : '#fde8e8', color: msg.ok ? '#0f5132' : '#c0392b', padding: '12px 18px', borderRadius: 10, marginBottom: 20, fontWeight: 600, fontSize: '0.9rem' }}>
              {msg.text}
            </div>
          )}

          {/* Profile tab */}
          {tab === 'profile' && (
            <div style={{ background: 'white', borderRadius: 14, padding: '28px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <h2 style={{ fontFamily: 'Playfair Display', fontSize: '1.2rem', marginBottom: 24, color: '#1a1a1a' }}>Personal Information</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 700, fontSize: '0.85rem', color: '#444' }}>Full Name</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inp}
                    onFocus={e => e.target.style.borderColor = '#2D5A27'} onBlur={e => e.target.style.borderColor = '#e0e0e0'} />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 700, fontSize: '0.85rem', color: '#444' }}>Email</label>
                  <input value={user.email} disabled style={{ ...inp, background: '#f9f9f9', color: '#aaa', cursor: 'not-allowed' }} />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 700, fontSize: '0.85rem', color: '#444' }}>Phone Number</label>
                  <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="03XX-XXXXXXX" style={inp}
                    onFocus={e => e.target.style.borderColor = '#2D5A27'} onBlur={e => e.target.style.borderColor = '#e0e0e0'} />
                </div>

                <div style={{ gridColumn: 'span 2', borderTop: '1px solid #eee', paddingTop: 20, marginTop: 4 }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16, color: '#444' }}>Default Shipping Address</h3>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 700, fontSize: '0.85rem', color: '#444' }}>Street Address</label>
                  <input value={form.street} onChange={e => setForm(f => ({ ...f, street: e.target.value }))} placeholder="House #, Street, Area" style={inp}
                    onFocus={e => e.target.style.borderColor = '#2D5A27'} onBlur={e => e.target.style.borderColor = '#e0e0e0'} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 700, fontSize: '0.85rem', color: '#444' }}>City</label>
                  <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="Lahore" style={inp}
                    onFocus={e => e.target.style.borderColor = '#2D5A27'} onBlur={e => e.target.style.borderColor = '#e0e0e0'} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 700, fontSize: '0.85rem', color: '#444' }}>Province</label>
                  <input value={form.province} onChange={e => setForm(f => ({ ...f, province: e.target.value }))} placeholder="Punjab" style={inp}
                    onFocus={e => e.target.style.borderColor = '#2D5A27'} onBlur={e => e.target.style.borderColor = '#e0e0e0'} />
                </div>
              </div>
              <button onClick={saveProfile} disabled={saving}
                style={{ marginTop: 24, background: saving ? '#aaa' : '#2D5A27', color: 'white', border: 'none', borderRadius: 10, padding: '13px 32px', fontWeight: 700, fontSize: '0.95rem', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'Cairo, sans-serif' }}
                onMouseEnter={e => { if (!saving) e.currentTarget.style.background = '#3a7a31'; }}
                onMouseLeave={e => { if (!saving) e.currentTarget.style.background = '#2D5A27'; }}>
                {saving ? '⏳ Saving...' : '💾 Save Changes'}
              </button>
            </div>
          )}

          {/* Password tab */}
          {tab === 'password' && (
            <div style={{ background: 'white', borderRadius: 14, padding: '28px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <h2 style={{ fontFamily: 'Playfair Display', fontSize: '1.2rem', marginBottom: 24, color: '#1a1a1a' }}>Change Password</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 440 }}>
                {[['current','Current Password'],['newPw','New Password'],['confirm','Confirm New Password']].map(([k,l]) => (
                  <div key={k}>
                    <label style={{ display: 'block', marginBottom: 6, fontWeight: 700, fontSize: '0.85rem', color: '#444' }}>{l}</label>
                    <input type="password" value={pwForm[k]} onChange={e => setPwForm(f => ({ ...f, [k]: e.target.value }))} style={inp}
                      onFocus={e => e.target.style.borderColor = '#2D5A27'} onBlur={e => e.target.style.borderColor = '#e0e0e0'} />
                  </div>
                ))}
                <button onClick={changePassword} disabled={saving}
                  style={{ background: saving ? '#aaa' : '#2D5A27', color: 'white', border: 'none', borderRadius: 10, padding: '13px', fontWeight: 700, fontSize: '0.95rem', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'Cairo, sans-serif', marginTop: 8 }}
                  onMouseEnter={e => { if (!saving) e.currentTarget.style.background = '#3a7a31'; }}
                  onMouseLeave={e => { if (!saving) e.currentTarget.style.background = '#2D5A27'; }}>
                  {saving ? '⏳ Saving...' : '🔑 Change Password'}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
