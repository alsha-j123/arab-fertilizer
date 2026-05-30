import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
};

const Stars = ({ rating, count }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
    <div style={{ display: 'flex', gap: 1 }}>
      {[1,2,3,4,5].map(s => (
        <span key={s} style={{ color: s <= Math.round(rating) ? '#C8A951' : '#ddd', fontSize: 11 }}>★</span>
      ))}
    </div>
    <span style={{ fontSize: '0.72rem', color: '#aaa' }}>({count})</span>
  </div>
);

const ProductCard = ({ product }) => {
  const { addToCart }              = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const inWL   = isInWishlist(product._id);
  const price  = product.discountPrice || product.price;
  const pct    = product.discountPrice
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  return (
    <motion.div variants={cardVariants}
      /* ── fixed height so all cards in a row are identical ── */
      style={{
        background: 'white', borderRadius: 12,
        boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        height: '100%',                   /* fill grid cell height */
        transition: 'box-shadow 0.3s',
      }}
      whileHover={{ y: -5, boxShadow: '0 14px 36px rgba(0,0,0,0.13)' }}>

      {/* Image — fixed aspect ratio so image blocks are equal */}
      <Link to={`/product/${product._id}`} style={{ position: 'relative', display: 'block', flexShrink: 0 }}>
        <div style={{ paddingTop: '72%', position: 'relative', overflow: 'hidden' }}>
          <img
            src={product.images?.[0] || 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=400'}
            alt={product.name}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.07)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          />
        </div>

        {/* badges */}
        {pct > 0 && (
          <div style={{ position: 'absolute', top: 9, left: 9, background: '#e74c3c', color: 'white', borderRadius: 6, padding: '3px 9px', fontSize: '0.72rem', fontWeight: 700 }}>
            -{pct}%
          </div>
        )}
        {product.stock === 0 && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.42)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontWeight: 700, fontSize: '0.95rem', background: 'rgba(0,0,0,0.55)', padding: '5px 14px', borderRadius: 8 }}>Out of Stock</span>
          </div>
        )}

        {/* wishlist */}
        <button onClick={e => { e.preventDefault(); toggleWishlist(product); }}
          style={{ position: 'absolute', top: 8, right: 8, width: 30, height: 30, background: 'rgba(255,255,255,0.94)', border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', boxShadow: '0 2px 8px rgba(0,0,0,0.14)', transition: 'transform 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.18)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
          {inWL ? '❤️' : '🤍'}
        </button>
      </Link>

      {/* Info — flex:1 so all cards stretch to same bottom */}
      <div style={{ padding: '14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>

        {/* category + weight row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ background: '#e8f5e3', color: '#2D5A27', borderRadius: 20, padding: '2px 9px', fontSize: '0.67rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
            {product.category}
          </span>
          <span style={{ fontSize: '0.72rem', color: '#aaa' }}>{product.weight}</span>
        </div>

        {/* Name — always 2 lines, keeps card heights equal */}
        <Link to={`/product/${product._id}`} style={{ textDecoration: 'none' }}>
          <h3 style={{
            fontSize: '0.92rem', fontFamily: 'Playfair Display, serif',
            color: '#1a1a1a', lineHeight: 1.45, fontWeight: 600, margin: 0,
            /* IMPORTANT: clamp to exactly 2 lines */
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            minHeight: '2.9rem',   /* 2 × lineHeight × fontSize  ~= 2 × 1.45 × 0.92rem */
          }}>
            {product.name}
          </h3>
        </Link>

        {/* Stars (fixed height slot even when no rating) */}
        <div style={{ minHeight: 18 }}>
          {product.avgRating > 0 && <Stars rating={product.avgRating} count={product.numReviews} />}
        </div>

        {/* Price + Cart — always at the bottom */}
        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid #f0f0f0' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
              <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#2D5A27' }}>PKR {price.toLocaleString()}</span>
              {product.discountPrice && (
                <span style={{ fontSize: '0.78rem', color: '#bbb', textDecoration: 'line-through' }}>{product.price.toLocaleString()}</span>
              )}
            </div>
            <div style={{ fontSize: '0.68rem', color: '#bbb' }}>per {product.weight || 'unit'}</div>
          </div>

          <button
            onClick={() => product.stock > 0 && addToCart(product)}
            disabled={product.stock === 0}
            style={{
              background: product.stock === 0 ? '#e8e8e8' : '#2D5A27',
              color:      product.stock === 0 ? '#aaa'    : 'white',
              border: 'none', borderRadius: 8,
              padding: '8px 13px', fontSize: '0.8rem', fontWeight: 700,
              cursor: product.stock === 0 ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s', fontFamily: 'Cairo, sans-serif',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { if (product.stock > 0) e.currentTarget.style.background = '#3a7a31'; }}
            onMouseLeave={e => { if (product.stock > 0) e.currentTarget.style.background = '#2D5A27'; }}>
            {product.stock === 0 ? 'Sold Out' : '+ Cart'}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
