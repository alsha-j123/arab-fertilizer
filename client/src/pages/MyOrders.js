import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import apiClient from '../utils/apiClient';
import { useAuth } from '../context/AuthContext';

const statusColors = {
  pending: { bg: '#fff3cd', color: '#856404' },
  processing: { bg: '#cfe2ff', color: '#084298' },
  shipped: { bg: '#d1ecf1', color: '#0c5460' },
  delivered: { bg: '#d1e7dd', color: '#0f5132' },
  cancelled: { bg: '#f8d7da', color: '#842029' }
};

const MyOrders = () => {
  const { user, setShowAuthModal } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    apiClient.get('/orders/my')
      .then(res => setOrders(res.data.orders || []))
      .catch(() => setError('Failed to load orders'))
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) return (
    <div style={{ paddingTop: 100, textAlign: 'center', minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div>
        <div style={{ fontSize: 64, marginBottom: 20 }}>🔐</div>
        <h2 style={{ fontFamily: 'Playfair Display', color: '#2D5A27', marginBottom: 12 }}>Login to View Orders</h2>
        <p style={{ color: '#666', marginBottom: 24 }}>Sign in to track your order history and status</p>
        <button onClick={() => setShowAuthModal(true)} style={{ background: '#2D5A27', color: 'white', padding: '13px 28px', borderRadius: 10, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>
          Login Now
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ paddingTop: 72, background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px' }}>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 style={{ fontFamily: 'Playfair Display', fontSize: '2rem', marginBottom: 8 }}>My Orders</h1>
          <p style={{ color: '#888', marginBottom: 36 }}>Track and manage your order history</p>
        </motion.div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
            <div style={{ width: 44, height: 44, border: '4px solid #e8f5e3', borderTopColor: '#2D5A27', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : error ? (
          <div style={{ background: '#fde8e8', color: '#c0392b', padding: 20, borderRadius: 10, textAlign: 'center' }}>{error}</div>
        ) : orders.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '80px 24px', background: 'white', borderRadius: 16, boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 72, marginBottom: 20 }}>📦</div>
            <h2 style={{ fontFamily: 'Playfair Display', color: '#2D5A27', marginBottom: 12 }}>No orders yet</h2>
            <p style={{ color: '#666', marginBottom: 28 }}>Start shopping to see your orders here</p>
            <Link to="/insecticides" style={{ background: '#2D5A27', color: 'white', padding: '13px 30px', borderRadius: 10, fontWeight: 700, textDecoration: 'none' }}>
              Shop Now
            </Link>
          </motion.div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {orders.map((order, i) => (
              <motion.div key={order._id}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                style={{ background: 'white', borderRadius: 14, padding: '22px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.85rem', color: '#555', marginBottom: 4 }}>
                      ORDER #{order._id.substring(0, 16).toUpperCase()}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#999' }}>
                      {new Date(order.createdAt).toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {[
                      { label: order.deliveryStatus, ...statusColors[order.deliveryStatus] },
                      { label: order.paymentMethod === 'cod' ? 'COD' : 'Bank Transfer', bg: '#f0f4ff', color: '#3949ab' },
                      { label: order.paymentStatus, bg: order.paymentStatus === 'paid' ? '#d1e7dd' : '#fff3cd', color: order.paymentStatus === 'paid' ? '#0f5132' : '#856404' }
                    ].map((badge, bi) => (
                      <span key={bi} style={{ background: badge.bg, color: badge.color, borderRadius: 20, padding: '4px 12px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'capitalize' }}>
                        {badge.label}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Items */}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
                  {(order.items || []).slice(0, 4).map((item, j) => (
                    <div key={j} style={{ display: 'flex', gap: 10, alignItems: 'center', background: '#f9f9f9', borderRadius: 8, padding: '8px 12px', minWidth: 200, flex: 1 }}>
                      {item.image && <img src={item.image} alt={item.name} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6 }} />}
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#333', lineHeight: 1.3 }}>{item.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#888' }}>×{item.quantity} — PKR {(item.price * item.quantity).toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                  {order.items?.length > 4 && (
                    <div style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', background: '#f0f0f0', borderRadius: 8, fontSize: '0.82rem', color: '#666' }}>
                      +{order.items.length - 4} more
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, borderTop: '1px solid #eee' }}>
                  <div>
                    <span style={{ fontSize: '0.82rem', color: '#888' }}>Total </span>
                    <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#2D5A27' }}>PKR {order.totalAmount?.toLocaleString()}</span>
                  </div>
                  {order.estimatedDelivery && order.deliveryStatus !== 'delivered' && (
                    <span style={{ fontSize: '0.8rem', color: '#666' }}>
                      Est. delivery: {new Date(order.estimatedDelivery).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default MyOrders;
