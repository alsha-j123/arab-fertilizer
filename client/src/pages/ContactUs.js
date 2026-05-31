import React, { useState } from 'react';
import { motion } from 'framer-motion';
import apiClient from '../utils/apiClient';

const ContactUs = () => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setError(null);

    try {
      await apiClient.post('/notifications/contact', form);
      setSent(true);
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err) {
      console.error('Contact Form Error:', err);
      setError(err.response?.data?.message || 'Failed to send message. Please try again later.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ paddingTop: 68 }}>
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(45,90,39,0.88), rgba(93,64,55,0.85)), url(https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1400) center/cover',
        padding: 'clamp(56px,8vw,80px) 20px', textAlign: 'center'
      }}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
          <h1 style={{ color: 'white', fontFamily: 'Playfair Display', fontSize: 'clamp(1.8rem, 5vw, 3rem)', marginBottom: 12 }}>Contact Us</h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 'clamp(0.88rem,2vw,1rem)', maxWidth: 500, margin: '0 auto' }}>Get in touch with our expert team for product advice, orders, or support</p>
        </motion.div>
      </div>

      <section style={{ padding: 'clamp(44px,6vw,70px) 20px', background: '#f8fdf6' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          {/* contact-grid: 2→1 via CSS class */}
          <div className="contact-grid">
            {/* Info */}
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
              <div style={{ width: 60, height: 4, background: 'linear-gradient(90deg, #2D5A27, #C8A951)', borderRadius: 2, marginBottom: 16 }} />
              <h2 style={{ fontFamily: 'Playfair Display', fontSize: 'clamp(1.5rem,3vw,1.8rem)', marginBottom: 20 }}>Get In <span style={{ color: '#2D5A27' }}>Touch</span></h2>
              <p style={{ color: '#555', lineHeight: 1.8, marginBottom: 28, fontSize: '0.95rem' }}>
                Our team of agricultural experts is available 6 days a week to help you choose the right products for your crops and answer any questions.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { icon: '📍', title: 'Visit Us', lines: ['89/6R M.Pur Road, Sahiwal', 'Punjab, Pakistan'] },
                  { icon: '📞', title: 'Call Us', lines: ['+92-308-8881186', '+92-308-8881165'] },
                  { icon: '📧', title: 'Email Us', lines: ['arabagro89@gmail.com'] },
                  { icon: '⏰', title: 'Working Hours', lines: ['Mon–Sat: 9:00 AM – 5:00 PM'] }
                ].map(item => (
                  <div key={item.title} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', background: 'white', borderRadius: 12, padding: '14px 16px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                    <div style={{ width: 40, height: 40, background: '#e8f5e3', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>{item.icon}</div>
                    <div>
                      <div style={{ fontWeight: 700, color: '#1a1a1a', fontSize: '0.9rem', marginBottom: 3 }}>{item.title}</div>
                      {item.lines.map(line => <div key={line} style={{ color: '#666', fontSize: '0.85rem' }}>{line}</div>)}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Form */}
            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
              <div style={{ background: 'white', borderRadius: 16, padding: 'clamp(20px,4vw,36px)', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
                {sent ? (
                  <div style={{ textAlign: 'center', padding: '36px 16px' }}>
                    <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
                    <h3 style={{ fontFamily: 'Playfair Display', color: '#2D5A27', marginBottom: 10 }}>Message Sent!</h3>
                    <p style={{ color: '#666', marginBottom: 24 }}>We'll get back to you within 24 hours.</p>
                    <button onClick={() => { setSent(false); setForm({ name: '', email: '', phone: '', subject: '', message: '' }); }}
                      style={{ background: '#2D5A27', color: 'white', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>
                      Send Another
                    </button>
                  </div>
                ) : (
                  <>
                    <h3 style={{ fontFamily: 'Playfair Display', fontSize: '1.25rem', marginBottom: 22 }}>Send a Message</h3>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {/* 2-col inner grid → 1-col on narrow */}
                      <div className="contact-form-grid">
                        {[
                          { name: 'name', label: 'Full Name *', type: 'text', placeholder: 'Full Name' },
                          { name: 'email', label: 'Email *', type: 'email', placeholder: 'your@email.com' },
                          { name: 'phone', label: 'Phone', type: 'tel', placeholder: '03XX-XXXXXXX' },
                          { name: 'subject', label: 'Subject *', type: 'text', placeholder: 'Product inquiry' }
                        ].map(f => (
                          <div key={f.name}>
                            <label style={{ display: 'block', marginBottom: 5, fontWeight: 600, fontSize: '0.85rem', color: '#444' }}>{f.label}</label>
                            <input type={f.type} name={f.name} placeholder={f.placeholder} value={form[f.name]}
                              onChange={e => setForm(fr => ({ ...fr, [f.name]: e.target.value }))}
                              required={f.label.includes('*')}
                              style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e0e0e0', borderRadius: 8, fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'Cairo, sans-serif' }}
                              onFocus={e => e.target.style.borderColor = '#2D5A27'}
                              onBlur={e => e.target.style.borderColor = '#e0e0e0'} />
                          </div>
                        ))}
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 5, fontWeight: 600, fontSize: '0.85rem', color: '#444' }}>Message *</label>
                        <textarea name="message" placeholder="Tell us how we can help you..." value={form.message}
                          onChange={e => setForm(fr => ({ ...fr, message: e.target.value }))} required
                          rows={5} style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #e0e0e0', borderRadius: 8, fontSize: '0.88rem', outline: 'none', resize: 'vertical', fontFamily: 'Cairo, sans-serif', boxSizing: 'border-box' }}
                          onFocus={e => e.target.style.borderColor = '#2D5A27'}
                          onBlur={e => e.target.style.borderColor = '#e0e0e0'} />
                      </div>
                      {error && (
                        <div style={{ color: '#d32f2f', fontSize: '0.85rem', background: '#ffebee', padding: '10px', borderRadius: 8, textAlign: 'center' }}>
                          ❌ {error}
                        </div>
                      )}
                      <button type="submit" disabled={sending}
                        style={{ background: '#2D5A27', color: 'white', border: 'none', borderRadius: 10, padding: '14px', fontWeight: 700, fontSize: '1rem', cursor: sending ? 'not-allowed' : 'pointer', opacity: sending ? 0.7 : 1, fontFamily: 'Cairo, sans-serif', transition: 'background 0.2s' }}
                        onMouseEnter={e => { if (!sending) e.currentTarget.style.background = '#3a7a31'; }}
                        onMouseLeave={e => e.currentTarget.style.background = '#2D5A27'}>
                        {sending ? '⏳ Sending...' : '📤 Send Message'}
                      </button>
                    </form>
                  </>
                )}
              </div>

              <div style={{ marginTop: 18, borderRadius: 14, overflow: 'hidden' }}>
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3431.2111101974488!2d73.06510997419052!3d30.68433578797249!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3922c93f8d27fa89%3A0x2644c3d5c61ef1a7!2sArab%20Fertilizers%26Agro%20Chemicals!5e0!3m2!1sen!2s!4v1778256891820!5m2!1sen!2s"
                  width="100%"
                  height="350"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Google Map"
                ></iframe>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <style>{`
        .contact-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        @media (max-width: 480px) {
          .contact-form-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default ContactUs;