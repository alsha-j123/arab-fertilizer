import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import apiClient from '../utils/apiClient';
import ProductCard from '../components/ProductCard';

const Cart = () => {
  const { cartItems, cartTotal, updateQuantity, removeFromCart, clearCart } = useCart();
  const shipping   = cartTotal >= 5000 ? 0 : (cartTotal > 0 ? 200 : 0);
  const grandTotal = cartTotal + shipping;
  const [suggested, setSuggested] = useState([]);

  useEffect(() => {
    apiClient.get('/products?featured=true')
      .then(res => setSuggested((res.data.products || []).slice(0, 4)))
      .catch(() => setSuggested([]));
  }, []);

  return (
    <div style={{ paddingTop: 68, background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 'clamp(24px,4vw,40px) clamp(12px,3vw,24px)' }}>

        {/* Page header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <h1 style={{ fontFamily: 'Playfair Display', fontSize: 'clamp(1.5rem,4vw,2rem)', color: '#1a1a1a' }}>
            Shopping Cart
            {cartItems.length > 0 && <span style={{ fontSize: '0.95rem', color: '#888', fontFamily: 'Cairo', fontWeight: 400, marginLeft: 10 }}>({cartItems.length} items)</span>}
          </h1>
          {cartItems.length > 0 && (
            <button onClick={clearCart} style={{ background: 'none', border: '1px solid #e74c3c', color: '#e74c3c', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', fontFamily: 'Cairo, sans-serif' }}>
              Clear Cart
            </button>
          )}
        </div>

        {cartItems.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: 'clamp(48px,8vw,80px) 20px', background: 'white', borderRadius: 16, boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 64, marginBottom: 20 }}>🛒</div>
            <h2 style={{ fontFamily: 'Playfair Display', color: '#2D5A27', marginBottom: 12 }}>Your cart is empty</h2>
            <p style={{ color: '#666', marginBottom: 28 }}>Explore our wide range of agricultural products and add them to your cart</p>
            <Link to="/insecticides" style={{ background: '#2D5A27', color: 'white', padding: '13px 30px', borderRadius: 10, fontWeight: 700, fontSize: '0.95rem', textDecoration: 'none' }}>
              Start Shopping
            </Link>
          </motion.div>
        ) : (
          /* cart-layout: 2-col → 1-col via CSS class */
          <div className="cart-layout">
            {/* Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <AnimatePresence>
                {cartItems.map(item => {
                  const vw = item.selectedVariant?.weight || '';
                  return (
                    <motion.div key={`${item._id}-${vw}`}
                      initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20, height: 0 }}>
                      {/* cart-item-row: flex row on desktop, wraps on mobile */}
                      <div className="cart-item-row">
                        {/* Thumbnail */}
                        <Link to={`/product/${item._id}`} style={{ flexShrink: 0 }}>
                          <img src={item.imageUrl || item.images?.[0] || 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=120'} alt={item.name}
                            className="cart-item-img"
                            style={{ width: 88, height: 88, objectFit: 'cover', borderRadius: 10 }} />
                        </Link>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ background: '#e8f5e3', color: '#2D5A27', borderRadius: 12, padding: '2px 10px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>{item.category}</span>
                          <Link to={`/product/${item._id}`} style={{ textDecoration: 'none' }}>
                            <h3 style={{ fontFamily: 'Playfair Display', fontSize: '0.97rem', color: '#1a1a1a', margin: '6px 0 4px', lineHeight: 1.3 }}>{item.name}</h3>
                          </Link>
                          {/* Bug fix #9: item.season is never stored in the cart slim() function,
                              so it always rendered as 'undefined'. Only show weight which is stored. */}
                          <p style={{ color: '#888', fontSize: '0.8rem', margin: 0 }}>{item.weight}</p>
                        </div>

                        {/* Qty + Price + Remove — grouped for mobile wrap */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                          {/* Qty selector */}
                          <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #e0e0e0', borderRadius: 8, overflow: 'hidden' }}>
                            <button onClick={() => updateQuantity(item._id, item.quantity - 1, vw)} style={{ width: 34, height: 34, background: '#f5f5f5', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '1rem', color: '#333', transition: 'background 0.2s' }}
                              onMouseEnter={e => e.currentTarget.style.background = '#e8f5e3'}
                              onMouseLeave={e => e.currentTarget.style.background = '#f5f5f5'}>−</button>
                            <span style={{ width: 40, textAlign: 'center', fontWeight: 700, fontSize: '0.95rem' }}>{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item._id, item.quantity + 1, vw)} 
                              disabled={item.quantity >= item.stock}
                              style={{ 
                                width: 34, 
                                height: 34, 
                                background: '#f5f5f5', 
                                border: 'none', 
                                cursor: item.quantity >= item.stock ? 'not-allowed' : 'pointer', 
                                fontWeight: 700, 
                                fontSize: '1rem', 
                                color: '#333', 
                                transition: 'background 0.2s, opacity 0.2s',
                                opacity: item.quantity >= item.stock ? 0.4 : 1 
                              }}
                              onMouseEnter={e => { if (item.quantity < item.stock) e.currentTarget.style.background = '#e8f5e3'; }}
                              onMouseLeave={e => { if (item.quantity < item.stock) e.currentTarget.style.background = '#f5f5f5'; }}>+</button>
                          </div>

                          {/* Price */}
                          <div style={{ minWidth: 90 }}>
                            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#2D5A27' }}>
                              PKR {((item.discountPrice || item.price) * item.quantity).toLocaleString()}
                            </div>
                            {item.discountPrice && (
                              <div style={{ fontSize: '0.75rem', color: '#999', textDecoration: 'line-through' }}>
                                PKR {(item.price * item.quantity).toLocaleString()}
                              </div>
                            )}
                            <div style={{ fontSize: '0.72rem', color: '#aaa' }}>PKR {(item.discountPrice || item.price).toLocaleString()} each</div>
                          </div>

                          {/* Remove */}
                          <button onClick={() => removeFromCart(item._id, vw)} style={{ background: '#fde8e8', border: 'none', color: '#e74c3c', width: 34, height: 34, borderRadius: 8, cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.2s' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#f5b7b1'}
                            onMouseLeave={e => e.currentTarget.style.background = '#fde8e8'}>
                            🗑
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Summary */}
            <div style={{ background: 'white', borderRadius: 14, padding: '24px', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', position: 'sticky', top: 86 }}>
              <h2 style={{ fontFamily: 'Playfair Display', fontSize: '1.2rem', marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid #eee' }}>Order Summary</h2>

              {[
                { label: 'Subtotal', value: `PKR ${cartTotal.toLocaleString()}` },
                { label: 'Shipping', value: shipping === 0 ? 'FREE 🎉' : `PKR ${shipping}` },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: '0.9rem', color: '#555' }}>
                  <span>{row.label}</span>
                  <span style={{ fontWeight: 600, color: row.label === 'Shipping' && shipping === 0 ? '#27ae60' : '#333' }}>{row.value}</span>
                </div>
              ))}

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0', borderTop: '2px solid #eee', marginBottom: 20 }}>
                <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>Total</span>
                <span style={{ fontWeight: 800, fontSize: '1.3rem', color: '#2D5A27', fontFamily: 'Playfair Display' }}>PKR {grandTotal.toLocaleString()}</span>
              </div>

              {shipping > 0 && (
                <div style={{ background: '#fff3cd', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: '0.82rem', color: '#856404', fontWeight: 600 }}>
                  🚚 Add PKR {(5000 - cartTotal).toLocaleString()} more for free shipping!
                </div>
              )}

              <Link to="/checkout" style={{ display: 'block', background: '#2D5A27', color: 'white', textAlign: 'center', padding: '14px', borderRadius: 10, fontWeight: 700, fontSize: '1rem', marginBottom: 10, textDecoration: 'none', transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#3a7a31'}
                onMouseLeave={e => e.currentTarget.style.background = '#2D5A27'}>
                Proceed to Checkout →
              </Link>
              <Link to="/insecticides" style={{ display: 'block', textAlign: 'center', color: '#2D5A27', fontWeight: 600, fontSize: '0.88rem', padding: '8px', textDecoration: 'none' }}>
                ← Continue Shopping
              </Link>

              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #eee', display: 'flex', justifyContent: 'center', gap: 12 }}>
                {['🏦 Bank Transfer', '💵 COD'].map(p => (
                  <span key={p} style={{ fontSize: '0.75rem', color: '#888', background: '#f5f5f5', padding: '4px 10px', borderRadius: 6 }}>{p}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Suggested Products */}
        {suggested.length > 0 && (
          <div style={{ marginTop: 56 }}>
            <h2 style={{ fontFamily: 'Playfair Display', fontSize: 'clamp(1.3rem,3vw,1.6rem)', marginBottom: 6 }}>
              You Might Also <span style={{ color: '#2D5A27' }}>Like</span>
            </h2>
            <p style={{ color: '#666', marginBottom: 24, fontSize: '0.9rem' }}>Popular products from our store</p>
            <div className="products-grid">
              {suggested.map(p => <ProductCard key={p._id} product={p} />)}
            </div>
          </div>
        )}
      </div>

      <style>{`
        /* 2-col cart layout → stack on mobile */
        .cart-layout {
          display: grid;
          grid-template-columns: 1fr 360px;
          gap: 28px;
          align-items: start;
        }
        @media (max-width: 900px) {
          .cart-layout { grid-template-columns: 1fr !important; }
        }

        /* Cart item row wraps on small phones */
        .cart-item-row {
          background: white;
          border-radius: 14px;
          padding: 18px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.06);
          display: flex;
          gap: 16px;
          align-items: center;
        }
        @media (max-width: 560px) {
          .cart-item-row { flex-wrap: wrap; }
          .cart-item-img { width: 72px !important; height: 72px !important; }
        }
      `}</style>
    </div>
  );
};

export default Cart;