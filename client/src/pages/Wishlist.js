import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { IconHeart, IconCart, IconTrash } from '../components/SvgIcons';

const Wishlist = () => {
  const { wishlistItems, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  return (
    <div style={{ paddingTop: 72, background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 style={{ fontFamily: 'Playfair Display', fontSize: '2rem', marginBottom: 8, color: '#1a1a1a' }}>
            My Wishlist <IconHeart size={20} color="#e74c3c" style={{marginLeft:6}} />
          </h1>
          <p style={{ color: '#888', marginBottom: 36 }}>{wishlistItems.length} saved {wishlistItems.length === 1 ? 'item' : 'items'}</p>
        </motion.div>

        {wishlistItems.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '80px 24px', background: 'white', borderRadius: 16, boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
            <div style={{ marginBottom: 20 }}><IconHeart size={56} color="#ddd" /></div>
            <h2 style={{ fontFamily: 'Playfair Display', color: '#2D5A27', marginBottom: 12 }}>Your wishlist is empty</h2>
            <p style={{ color: '#666', marginBottom: 28 }}>Save products you love by clicking the heart icon on any product</p>
            <Link to="/" style={{ background: '#2D5A27', color: 'white', padding: '13px 30px', borderRadius: 10, fontWeight: 700, fontSize: '0.95rem', textDecoration: 'none' }}>
              Explore Products
            </Link>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}
            className="products-grid">
            <AnimatePresence>
              {wishlistItems.map(item => (
                <motion.div key={item._id}
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                  style={{ background: 'white', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', transition: 'transform 0.3s, box-shadow 0.3s' }}
                  whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(0,0,0,0.12)' }}>
                  <Link to={`/product/${item._id}`} style={{ position: 'relative', display: 'block' }}>
                    <img src={item.imageUrl || item.images?.[0] || 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=400'} onError={e=>{e.target.onerror=null;e.target.src='https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=400'}} alt={item.name}
                      style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover' }} />
                    <span style={{ position: 'absolute', top: 10, left: 10, background: '#e8f5e3', color: '#2D5A27', borderRadius: 12, padding: '2px 10px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>{item.category}</span>
                  </Link>

                  <div style={{ padding: '16px' }}>
                    <Link to={`/product/${item._id}`} style={{ textDecoration: 'none' }}>
                      <h3 style={{ fontFamily: 'Playfair Display', fontSize: '0.95rem', color: '#1a1a1a', margin: '0 0 8px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.name}</h3>
                    </Link>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 14 }}>
                      <span style={{ fontWeight: 800, color: '#2D5A27', fontSize: '1.05rem' }}>PKR {(item.discountPrice || item.price).toLocaleString()}</span>
                      {item.discountPrice && <span style={{ fontSize: '0.8rem', color: '#aaa', textDecoration: 'line-through' }}>PKR {item.price.toLocaleString()}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => { addToCart(item); }} style={{ flex: 1, background: '#2D5A27', color: 'white', border: 'none', borderRadius: 8, padding: '9px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', transition: 'background 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#3a7a31'}
                        onMouseLeave={e => e.currentTarget.style.background = '#2D5A27'}>
                        <IconCart size={14} style={{marginRight:4}} /> Add to Cart
                      </button>
                      <button onClick={() => removeFromWishlist(item._id)} style={{ width: 36, height: 36, background: '#fde8e8', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f5b7b1'}
                        onMouseLeave={e => e.currentTarget.style.background = '#fde8e8'}>
                        <IconTrash size={15} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
      <style>{`
        @media (max-width: 1100px) { .products-grid { grid-template-columns: repeat(3,1fr) !important; } }
        @media (max-width: 768px) { .products-grid { grid-template-columns: repeat(2,1fr) !important; } }
        @media (max-width: 480px) { .products-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
};

export default Wishlist;
