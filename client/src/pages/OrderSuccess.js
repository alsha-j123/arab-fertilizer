import React, { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCart } from '../context/CartContext';

const OrderSuccess = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const { clearCart } = useCart();

  useEffect(() => { clearCart(); }, [clearCart]);

  return (
    <div style={{ paddingTop: 72, minHeight: '100vh', background: 'linear-gradient(135deg, #f8fdf6 0%, #f0f8ee 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ background: 'white', borderRadius: 20, padding: '56px 48px', textAlign: 'center', maxWidth: 520, width: '100%', boxShadow: '0 24px 60px rgba(45,90,39,0.12)' }}>

        {/* Animated check */}
        <motion.div
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          style={{ width: 90, height: 90, background: 'linear-gradient(135deg, #2D5A27, #3a7a31)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', boxShadow: '0 12px 30px rgba(45,90,39,0.3)' }}>
          <span style={{ fontSize: 40 }}>✅</span>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <h1 style={{ fontFamily: 'Playfair Display', fontSize: '2rem', color: '#2D5A27', marginBottom: 12 }}>
            Order Confirmed!
          </h1>
          <p style={{ color: '#666', fontSize: '1rem', lineHeight: 1.7, marginBottom: 28 }}>
            Thank you for your order! We've received your request and will process it shortly. You'll receive a confirmation email soon.
          </p>

          {orderId && (
            <div style={{ background: '#f8fdf6', border: '1.5px solid #c8e6c9', borderRadius: 12, padding: '16px 24px', marginBottom: 32 }}>
              <div style={{ fontSize: '0.78rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Order ID</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#2D5A27', letterSpacing: '1px', fontFamily: 'monospace' }}>
                #{orderId.substring(0, 16).toUpperCase()}
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 36 }}>
            {[
              { icon: '📧', label: 'Email Sent', desc: 'Check your inbox' },
              { icon: '🚚', label: 'Delivery', desc: '3–5 business days' },
              { icon: '📞', label: 'Support', desc: '03XX-XXXXXXX' }
            ].map(item => (
              <div key={item.label} style={{ background: '#f9f9f9', borderRadius: 10, padding: '14px 10px' }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>{item.icon}</div>
                <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#333' }}>{item.label}</div>
                <div style={{ fontSize: '0.72rem', color: '#888' }}>{item.desc}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/my-orders" style={{ background: '#2D5A27', color: 'white', padding: '13px 28px', borderRadius: 10, fontWeight: 700, fontSize: '0.95rem', textDecoration: 'none', transition: 'all 0.3s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#3a7a31'}
              onMouseLeave={e => e.currentTarget.style.background = '#2D5A27'}>
              Track My Order
            </Link>
            <Link to="/" style={{ background: 'transparent', color: '#2D5A27', border: '2px solid #2D5A27', padding: '13px 28px', borderRadius: 10, fontWeight: 700, fontSize: '0.95rem', textDecoration: 'none' }}>
              Continue Shopping
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default OrderSuccess;
