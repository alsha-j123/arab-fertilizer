import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import apiClient from '../utils/apiClient';

const Checkout = () => {
  const { cartItems, cartTotal, clearCart } = useCart();
  const { user, setShowAuthModal } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    street: '',
    city: '',
    province: '',
    postalCode: '',
    bankName: '',
    accountName: '',
    transactionId: ''
  });

  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        name:  prev.name  || user.name  || '',
        email: user.email || '',
      }));
    }
  }, [user]);

  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon]     = useState(null);
  const [couponError, setCouponError]         = useState('');
  const [couponLoading, setCouponLoading]     = useState(false);
  const [discountAmount, setDiscountAmount]   = useState(0);

  const shipping   = cartTotal >= 5000 ? 0 : 200;
  const grandTotal = cartTotal + shipping - discountAmount;

  const handleApplyCoupon = async () => {
    if (!couponCodeInput) return;
    setCouponLoading(true); setCouponError('');
    try {
      const { data } = await apiClient.post('/orders/validate-coupon', { code: couponCodeInput, orderAmount: cartTotal });
      if (data.success) { setAppliedCoupon(data.coupon); setDiscountAmount(data.coupon.discount); }
    } catch (err) {
      setCouponError(err.response?.data?.message || 'Invalid coupon code');
      setAppliedCoupon(null); setDiscountAmount(0);
    } finally { setCouponLoading(false); }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null); setDiscountAmount(0); setCouponCodeInput(''); setCouponError('');
  };

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleOrder = async (e) => {
    e.preventDefault();
    if (!user)                { setShowAuthModal(true); return; }
    if (cartItems.length === 0) { setError('Your cart is empty'); return; }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError('Please enter a valid email address');
      window.scrollTo(0, 0); return;
    }

    if (paymentMethod === 'bank' && (!form.bankName || !form.accountName || !form.transactionId)) {
      setError('Please fill in all bank transaction details');
      window.scrollTo(0, 0); return;
    }

    setLoading(true); setError('');
    try {
      const orderPayload = {
        items: cartItems.map(i => ({
          product:  i._id,
          name:     i.name,
          price:    i.discountPrice || i.price,
          quantity: i.quantity,
          weight:   i.weight  || '',
          image:    i.imageUrl || i.images?.[0] || '',  // matches Order schema: image (not imageUrl)
        })),

        // ✅ Keys match Order model shippingAddress schema EXACTLY:
        // name, email, phone, street, city, province, postalCode
        shippingAddress: {
          name:       form.name,
          email:      form.email,
          phone:      form.phone,
          street:     form.street,
          city:       form.city,
          province:   form.province,
          postalCode: form.postalCode,
        },

        paymentMethod,
        couponCode: appliedCoupon ? appliedCoupon.code : '',
        paymentDetails: paymentMethod === 'bank' ? {
          bankName:      form.bankName,
          accountName:   form.accountName,
          transactionId: form.transactionId,
        } : null,
      };

      const { data } = await apiClient.post('/orders', orderPayload);
      clearCart();
      navigate(`/order-success?orderId=${data.order._id}`);
    } catch (err) {
      console.error("Order placement failed:", err);
      setError(err.response?.data?.message || 'Failed to place order. Please try again.');
      window.scrollTo(0, 0);
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0 && !loading) {
    return (
      <div style={{ paddingTop: 100, textAlign: 'center', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🛒</div>
          <h2 style={{ fontFamily: 'Playfair Display', color: '#2D5A27' }}>Your cart is empty</h2>
          <p style={{ color: '#666', marginBottom: 24 }}>Add some products before checking out</p>
          <a href="/insecticides" style={{ background: '#2D5A27', color: 'white', padding: '12px 28px', borderRadius: 10, fontWeight: 700, textDecoration: 'none' }}>Shop Now</a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 72, background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>
        <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          style={{ fontFamily: 'Playfair Display', fontSize: '2rem', marginBottom: 32, color: '#1a1a1a' }}>
          Checkout
        </motion.h1>

        {error && (
          <div style={{ background: '#fde8e8', color: '#c0392b', padding: '14px 18px', borderRadius: 10, marginBottom: 24, fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleOrder} noValidate>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 28, alignItems: 'start' }}>

            {/* ── Left Column ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Shipping Info */}
              <div style={{ background: 'white', borderRadius: 14, padding: '28px', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
                <h2 style={{ fontFamily: 'Playfair Display', fontSize: '1.2rem', marginBottom: 22, color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: 10 }}>
                  📦 Shipping Information
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {[
                    { name: 'name',       label: 'Full Name *',      type: 'text',  placeholder: 'Muhammad Ahmed',        col: 2 },
                    { name: 'email',      label: 'Email Address *',  type: 'email', placeholder: 'ahmed@example.com',     col: 2 },
                    { name: 'phone',      label: 'Phone Number *',   type: 'tel',   placeholder: '03XX-XXXXXXX',          col: 1 },
                    { name: 'city',       label: 'City *',           type: 'text',  placeholder: 'Lahore',                col: 1 },
                    { name: 'street',     label: 'Street Address *', type: 'text',  placeholder: 'House #, Street, Area', col: 2 },
                    { name: 'province',   label: 'Province',         type: 'text',  placeholder: 'Punjab',                col: 1 },
                    { name: 'postalCode', label: 'Postal Code',      type: 'text',  placeholder: '54000',                 col: 1 },
                  ].map(field => (
                    <div key={field.name} style={{ gridColumn: `span ${field.col}` }}>
                      <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.85rem', color: '#444' }}>
                        {field.label}
                      </label>
                      <input
                        type={field.type} name={field.name} placeholder={field.placeholder}
                        value={form[field.name]} onChange={handleChange}
                        required={field.label.includes('*')}
                        style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e0e0e0', borderRadius: 8,
                          fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
                          fontFamily: 'Cairo, sans-serif', transition: 'border-color 0.2s' }}
                        onFocus={e => e.target.style.borderColor = '#2D5A27'}
                        onBlur={e  => e.target.style.borderColor = '#e0e0e0'}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Method */}
              <div style={{ background: 'white', borderRadius: 14, padding: '28px', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
                <h2 style={{ fontFamily: 'Playfair Display', fontSize: '1.2rem', marginBottom: 22, color: '#1a1a1a' }}>
                  💳 Payment Method
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { value: 'cod',  icon: '💵', title: 'Cash on Delivery', desc: 'Pay when your order arrives at your doorstep' },
                    { value: 'bank', icon: '🏦', title: 'Bank Transfer',    desc: 'Transfer directly to our bank account' },
                  ].map(opt => (
                    <label key={opt.value} style={{
                      display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px',
                      border: `2px solid ${paymentMethod === opt.value ? '#2D5A27' : '#e0e0e0'}`,
                      borderRadius: 10, cursor: 'pointer',
                      background: paymentMethod === opt.value ? '#f8fdf6' : 'white', transition: 'all 0.2s',
                    }}>
                      <input type="radio" name="payment" value={opt.value}
                        checked={paymentMethod === opt.value} onChange={() => setPaymentMethod(opt.value)}
                        style={{ accentColor: '#2D5A27', width: 18, height: 18 }} />
                      <span style={{ fontSize: '1.4rem' }}>{opt.icon}</span>
                      <div>
                        <div style={{ fontWeight: 700, color: '#1a1a1a', fontSize: '0.95rem' }}>{opt.title}</div>
                        <div style={{ color: '#888', fontSize: '0.82rem' }}>{opt.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>

                {paymentMethod === 'bank' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                    style={{ marginTop: 20, padding: 20, background: '#f9f9f9', borderRadius: 10, border: '1px solid #eee' }}>
                    <div style={{ marginBottom: 16 }}>
                      <h4 style={{ fontSize: '0.9rem', marginBottom: 8, color: '#1a1a1a' }}>Our Bank Details:</h4>
                      <div style={{ fontSize: '0.82rem', color: '#666', lineHeight: 1.6, background: 'white', padding: 12, borderRadius: 8, border: '1px dashed #2D5A27' }}>
                        <strong>Bank:</strong> Allied Bank<br />
                        <strong>Account Name:</strong> Arab Fertilizer and Agro Chemicals<br />
                        <strong>Account #:</strong> 10053335850010<br />
                        <strong>IBAN:</strong> PK87ABPA0010053335850010
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div style={{ gridColumn: 'span 2' }}>
                        <label style={{ display: 'block', marginBottom: 5, fontSize: '0.8rem', fontWeight: 600 }}>Your Bank Name *</label>
                        <input type="text" name="bankName" value={form.bankName} onChange={handleChange} placeholder="e.g. HBL, Alfalah"
                          style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid #ddd', fontSize: '0.85rem' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 5, fontSize: '0.8rem', fontWeight: 600 }}>Account Name *</label>
                        <input type="text" name="accountName" value={form.accountName} onChange={handleChange} placeholder="Name on account"
                          style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid #ddd', fontSize: '0.85rem' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 5, fontSize: '0.8rem', fontWeight: 600 }}>Transaction ID / Ref *</label>
                        <input type="text" name="transactionId" value={form.transactionId} onChange={handleChange} placeholder="Proof of payment"
                          style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid #ddd', fontSize: '0.85rem' }} />
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* ── Right Column — Order Summary ── */}
            <div style={{ background: 'white', borderRadius: 14, padding: '24px', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', position: 'sticky', top: 90 }}>
              <h2 style={{ fontFamily: 'Playfair Display', fontSize: '1.2rem', marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid #eee' }}>
                🧾 Order Summary
              </h2>

              <div style={{ maxHeight: 280, overflowY: 'auto', marginBottom: 16 }}>
                {cartItems.map(item => (
                  <div key={`${item._id}-${item.weight || ''}`} style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center' }}>
                    <img src={item.imageUrl || item.images?.[0] || 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=80'} alt={item.name}
                      style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 8 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.name}{item.weight && <span style={{ color: '#888', fontSize: '0.78rem', fontWeight: 400 }}> ({item.weight})</span>}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#888' }}>×{item.quantity}</div>
                    </div>
                    <div style={{ fontWeight: 700, color: '#2D5A27', fontSize: '0.9rem', flexShrink: 0 }}>
                      PKR {((item.discountPrice || item.price) * item.quantity).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              {/* Promo Code */}
              <div style={{ borderTop: '1px solid #eee', paddingTop: 16, marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#555', marginBottom: 8 }}>Have a promo code?</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="text" placeholder="Enter coupon code" value={couponCodeInput}
                    onChange={e => setCouponCodeInput(e.target.value.toUpperCase())}
                    disabled={couponLoading || !!appliedCoupon}
                    style={{ flex: 1, padding: '8px 12px', border: '1.5px solid #e0e0e0', borderRadius: 8, fontSize: '0.85rem', outline: 'none', textTransform: 'uppercase' }} />
                  {appliedCoupon ? (
                    <button type="button" onClick={handleRemoveCoupon}
                      style={{ padding: '8px 16px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                      Remove
                    </button>
                  ) : (
                    <button type="button" onClick={handleApplyCoupon} disabled={couponLoading || !couponCodeInput}
                      style={{ padding: '8px 16px', background: '#2D5A27', color: 'white', border: 'none', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600,
                        cursor: (couponLoading || !couponCodeInput) ? 'not-allowed' : 'pointer',
                        opacity: (couponLoading || !couponCodeInput) ? 0.6 : 1 }}>
                      {couponLoading ? 'Applying...' : 'Apply'}
                    </button>
                  )}
                </div>
                {couponError   && <div style={{ color: '#c0392b', fontSize: '0.75rem', marginTop: 6, fontWeight: 500 }}>⚠️ {couponError}</div>}
                {appliedCoupon && <div style={{ color: '#27ae60', fontSize: '0.75rem', marginTop: 6, fontWeight: 600 }}>🎉 Coupon "{appliedCoupon.code}" applied!</div>}
              </div>

              {/* Totals */}
              <div style={{ borderTop: '1px solid #eee', paddingTop: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: '0.88rem', color: '#666' }}>
                  <span>Subtotal</span>
                  <span style={{ fontWeight: 600, color: '#333' }}>PKR {cartTotal.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: '0.88rem', color: '#666' }}>
                  <span>Shipping</span>
                  <span style={{ fontWeight: 600, color: shipping === 0 ? '#27ae60' : '#333' }}>
                    {shipping === 0 ? 'FREE' : `PKR ${shipping}`}
                  </span>
                </div>
                {discountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: '0.88rem', color: '#e74c3c' }}>
                    <span>Discount {appliedCoupon ? `(${appliedCoupon.code})` : ''}</span>
                    <span style={{ fontWeight: 600 }}>-PKR {discountAmount.toLocaleString()}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderTop: '2px solid #eee', marginTop: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: '1rem' }}>Total</span>
                  <span style={{ fontWeight: 800, fontSize: '1.2rem', color: '#2D5A27' }}>PKR {grandTotal.toLocaleString()}</span>
                </div>
              </div>

              {shipping > 0 && (
                <div style={{ background: '#e8f5e3', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: '0.8rem', color: '#2D5A27', fontWeight: 600 }}>
                  🚚 Add PKR {(5000 - cartTotal).toLocaleString()} more for free shipping!
                </div>
              )}

              <button type="submit" disabled={loading} style={{
                width: '100%', padding: '15px', background: '#2D5A27', color: 'white',
                border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '1rem',
                cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
                transition: 'all 0.3s', fontFamily: 'Cairo, sans-serif',
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#3a7a31'; }}
              onMouseLeave={e => e.currentTarget.style.background = '#2D5A27'}>
                {loading ? '⏳ Processing...' : '✅ Place Order'}
              </button>
              <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#999', marginTop: 10 }}>
                🔒 Your information is secure and encrypted
              </p>
            </div>
          </div>
        </form>
      </div>

      <style>{`
        @media (max-width: 900px) {
          form > div { grid-template-columns: 1fr !important; }
          form div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default Checkout;