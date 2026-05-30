import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';

const PH = 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=100';

const CartDrawer = () => {
  const { cartItems, cartTotal, cartCount, isOpen, setIsOpen, updateQuantity, removeFromCart } = useCart();
  const shipping = cartTotal >= 5000 ? 0 : (cartTotal > 0 ? 200 : 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            onClick={() => setIsOpen(false)}
            style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:800 }} />

          <motion.div initial={{ x:'100%' }} animate={{ x:0 }} exit={{ x:'100%' }}
            transition={{ type:'tween', duration:0.3 }}
            style={{ position:'fixed', top:0, right:0, bottom:0, width:'100%', maxWidth:420, background:'white', zIndex:900, display:'flex', flexDirection:'column', boxShadow:'-8px 0 40px rgba(0,0,0,0.15)' }}>

            {/* Header */}
            <div style={{ background:'#2D5A27', padding:'20px 24px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <h2 style={{ color:'#C8A951', fontFamily:'Playfair Display', margin:0, fontSize:'1.3rem' }}>🛒 Your Cart</h2>
                <p style={{ color:'rgba(255,255,255,0.7)', margin:'2px 0 0', fontSize:'0.83rem' }}>{cartCount} {cartCount===1?'item':'items'}</p>
              </div>
              <button onClick={() => setIsOpen(false)}
                style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:8, width:36, height:36, cursor:'pointer', color:'white', fontSize:'1.1rem', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
            </div>

            {/* Items */}
            <div style={{ flex:1, overflowY:'auto', padding:16 }}>
              {cartItems.length === 0 ? (
                <div style={{ textAlign:'center', padding:'60px 20px', color:'#999' }}>
                  <div style={{ fontSize:48, marginBottom:16 }}>🛒</div>
                  <h3 style={{ color:'#666', fontFamily:'Playfair Display', marginBottom:8 }}>Cart is empty</h3>
                  <button onClick={() => setIsOpen(false)}
                    style={{ background:'#2D5A27', color:'white', border:'none', borderRadius:8, padding:'10px 24px', fontWeight:700, cursor:'pointer', fontFamily:'Cairo, sans-serif' }}>
                    Browse Products
                  </button>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  {cartItems.map(item => {
                    const imgSrc = item.imageUrl || item.images?.[0] || PH;
                    const vw = item.selectedVariant?.weight || '';
                    return (
                      <div key={item._id + vw} style={{ display:'flex', gap:12, alignItems:'center', background:'#fafafa', borderRadius:10, padding:10 }}>
                        <img src={imgSrc} alt={item.name}
                          onError={e => { e.target.onerror = null; e.target.src = PH; }}
                          style={{ width:60, height:60, objectFit:'cover', borderRadius:8, flexShrink:0, background:'#e8f5e3' }} />
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontWeight:600, fontSize:'0.88rem', color:'#1a1a1a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.name}</div>
                          {item.selectedVariant && <div style={{ fontSize:'0.74rem', color:'#888' }}>{item.selectedVariant.weight}</div>}
                          <div style={{ fontWeight:700, color:'#2D5A27', fontSize:'0.88rem', marginTop:2 }}>PKR {(item.discountPrice||item.price).toLocaleString()}</div>
                          <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:6 }}>
                            <button onClick={() => updateQuantity(item._id, item.quantity-1, vw)}
                              style={{ width:26, height:26, border:'1px solid #ddd', borderRadius:5, background:'white', cursor:'pointer', fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>−</button>
                            <span style={{ fontWeight:700, minWidth:20, textAlign:'center' }}>{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item._id, item.quantity+1, vw)}
                              disabled={item.quantity >= item.stock}
                              style={{ 
                                width:26, 
                                height:26, 
                                border:'1px solid #ddd', 
                                borderRadius:5, 
                                background:'white', 
                                cursor: item.quantity >= item.stock ? 'not-allowed' : 'pointer', 
                                fontWeight:700, 
                                display:'flex', 
                                alignItems:'center', 
                                justifyContent:'center',
                                opacity: item.quantity >= item.stock ? 0.4 : 1,
                                transition: 'opacity 0.2s'
                              }}>+</button>
                          </div>
                        </div>
                        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6, flexShrink:0 }}>
                          <div style={{ fontWeight:800, color:'#2D5A27', fontSize:'0.9rem' }}>
                            PKR {((item.discountPrice||item.price)*item.quantity).toLocaleString()}
                          </div>
                          <button onClick={() => removeFromCart(item._id, vw)}
                            style={{ background:'#fde8e8', color:'#e74c3c', border:'none', borderRadius:6, padding:'4px 10px', cursor:'pointer', fontSize:'0.75rem', fontWeight:600 }}>Remove</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {cartItems.length > 0 && (
              <div style={{ padding:'16px 20px', borderTop:'1px solid #eee', background:'white' }}>
                {[['Subtotal', `PKR ${cartTotal.toLocaleString()}`], ['Shipping', shipping===0?'FREE 🎉':`PKR ${shipping}`]].map(([l,v]) => (
                  <div key={l} style={{ display:'flex', justifyContent:'space-between', marginBottom:8, fontSize:'0.88rem', color:'#666' }}>
                    <span>{l}</span><span style={{ fontWeight:600 }}>{v}</span>
                  </div>
                ))}
                <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderTop:'2px solid #eee', marginTop:4, marginBottom:14 }}>
                  <span style={{ fontWeight:700, fontSize:'1rem' }}>Total</span>
                  <span style={{ fontWeight:800, fontSize:'1.15rem', color:'#2D5A27' }}>PKR {(cartTotal + shipping).toLocaleString()}</span>
                </div>
                <Link to="/checkout" onClick={() => setIsOpen(false)}
                  style={{ display:'block', background:'#2D5A27', color:'white', textAlign:'center', padding:'14px', borderRadius:10, fontWeight:700, fontSize:'0.95rem', textDecoration:'none', fontFamily:'Cairo, sans-serif' }}>
                  Proceed to Checkout →
                </Link>
                <button onClick={() => setIsOpen(false)}
                  style={{ display:'block', width:'100%', background:'none', border:'none', color:'#888', marginTop:10, cursor:'pointer', fontSize:'0.85rem', fontFamily:'Cairo, sans-serif' }}>
                  Continue Shopping
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
export default CartDrawer;
