import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import apiClient from '../utils/apiClient';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';
import { IconSearch, IconSeedling, IconScale, IconXCircle, IconCheckCircle, IconCart, IconHeartFilled, IconHeart, IconTruck, IconBadgeCheck, IconCreditCard, IconEdit, IconCheck, IconClipboard, IconAlertTriangle, IconMessageCircle, IconLoader, IconStar } from '../components/SvgIcons';

const StarRating = ({ rating }) => (
  <div style={{ display: 'flex', gap: 3 }}>
    {[1,2,3,4,5].map(s => (
      <span key={s} style={{ color: s <= Math.round(rating) ? '#C8A951' : '#ddd', fontSize: 20 }}>★</span>
    ))}
  </div>
);

const StarPicker = ({ value, onChange }) => (
  <div style={{ display: 'flex', gap: 4 }}>
    {[1,2,3,4,5].map(s => (
      <span key={s} onClick={() => onChange(s)}
        style={{ color: s <= value ? '#C8A951' : '#ddd', fontSize: 28, cursor: 'pointer', transition: 'color .15s' }}>★</span>
    ))}
  </div>
);

const ProductDetail = () => {
  const { id }   = useParams();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { user } = useAuth();

  const [product, setProduct]     = useState(null);
  const [related, setRelated]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [qty, setQty]             = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [activeImage, setActiveImage] = useState(0);
  const [added, setAdded]         = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);

  /* Review form state */
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewMsg, setReviewMsg]   = useState('');

  /* Fetch product — try API first, fallback to localStorage */
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setProduct(null);

    const tryLocalStorage = () => {
      try {
        const stored = localStorage.getItem('af_products');
        if (stored) {
          const all = JSON.parse(stored);
          const found = all.find(p => p._id === id);
          if (found) {
            setProduct(found);
            setRelated(all.filter(p => p.category === found.category && p._id !== id).slice(0, 4));
            return true;
          }
        }
      } catch {}
      return false;
    };

    apiClient.get(`/products/${id}`)
      .then(res => {
        const p = res.data.product;
        setProduct(p);
        return apiClient.get(`/products?category=${p.category}&limit=10`);
      })
      .then(res => {
        setRelated((res.data.products || []).filter(p => p._id !== id).slice(0, 4));
      })
      .catch(() => {
        /* API failed or product not in DB — try localStorage */
        tryLocalStorage();
      })
      .finally(() => setLoading(false));
  }, [id]);

  /* Auto-select first variant when product loads */
  useEffect(() => {
    if (product?.variants?.length > 0) {
      setSelectedVariant(product.variants[0]);
    } else {
      setSelectedVariant(null);
    }
  }, [product]);

  if (loading) return (
    <div style={{ paddingTop: 120, textAlign: 'center', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div>
        <div style={{ width: 48, height: 48, border: '4px solid #e8f5e3', borderTopColor: '#2D5A27', borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: '#888' }}>Loading product...</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!loading && !product) return (
    <div style={{ paddingTop: 100, textAlign: 'center', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div>
        <div style={{ marginBottom: 20 }}><IconSearch size={56} color="#2D5A27" /></div>
        <h2 style={{ fontFamily: 'Playfair Display', color: '#2D5A27', marginBottom: 12 }}>Product Not Found</h2>
        <p style={{ color: '#666', marginBottom: 8 }}>This product may have been removed or the link is invalid.</p>
        <p style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: 24 }}>Make sure products are added from the Admin Panel first.</p>
        <Link to="/" style={{ background: '#2D5A27', color: 'white', padding: '12px 28px', borderRadius: 10, fontWeight: 700, textDecoration: 'none' }}>Back to Home</Link>
      </div>
    </div>
  );

  const images   = product.images?.length > 0 ? product.images : ['https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=600'];
  /* Use variant price if selected, otherwise base product price */
  const activePrice    = selectedVariant ? selectedVariant.price         : product.price;
  const activeDiscount = selectedVariant ? selectedVariant.discountPrice : product.discountPrice;
  const activeStock    = selectedVariant ? selectedVariant.stock         : product.stock;
  const activeWeight   = selectedVariant ? selectedVariant.weight        : product.weight;
  const price    = activeDiscount || activePrice;
  const discount = activeDiscount ? Math.round(((activePrice - activeDiscount) / activePrice) * 100) : 0;
  const inWishlist = isInWishlist(product._id);

  const handleAddToCart = () => {
    /* Pass variant info to cart */
    const cartProduct = selectedVariant
      ? { ...product, price: activePrice, discountPrice: activeDiscount, weight: activeWeight, stock: activeStock, selectedVariant }
      : product;
    addToCart(cartProduct, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const submitReview = async () => {
    if (!user) { setReviewMsg('Please login to submit a review'); return; }
    if (!reviewComment.trim()) { setReviewMsg('Please write a comment'); return; }
    setReviewLoading(true); setReviewMsg('');
    try {
      const { data } = await apiClient.post(`/products/${id}/review`,
        { rating: reviewRating, comment: reviewComment }
      );
      setProduct(data.product);
      setReviewComment(''); setReviewRating(5);
      setReviewMsg(data.message || 'Review submitted successfully!');
    } catch (err) {
      setReviewMsg(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setReviewLoading(false);
    }
  };

  return (
    <div style={{ paddingTop: 72 }}>
      {/* Breadcrumb */}
      <div style={{ background: '#f8fdf6', padding: '12px 24px', borderBottom: '1px solid #e8f0e4' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', gap: 8, fontSize: '0.82rem', color: '#888', alignItems: 'center', flexWrap: 'wrap' }}>
          <Link to="/" style={{ color: '#2D5A27', textDecoration: 'none', fontWeight: 600 }}>Home</Link>
          <span>/</span>
          <Link to={`/${product.category}`} style={{ color: '#2D5A27', textDecoration: 'none', fontWeight: 600, textTransform: 'capitalize' }}>{product.category}</Link>
          <span>/</span>
          <span style={{ color: '#555' }}>{product.name}</span>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px' }}>
        {/* Main grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, marginBottom: 64 }}>
          {/* Images */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div style={{ borderRadius: 16, overflow: 'hidden', background: '#f8fdf6', aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <img src={images[activeImage]} alt={product.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={e => e.target.src = 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=600'} />
            </div>
            {images.length > 1 && (
              <div style={{ display: 'flex', gap: 10 }}>
                {images.map((img, i) => (
                  <div key={i} onClick={() => setActiveImage(i)}
                    style={{ width: 72, height: 72, borderRadius: 10, overflow: 'hidden', cursor: 'pointer', border: `2.5px solid ${activeImage === i ? '#2D5A27' : '#e0e0e0'}` }}>
                    <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Info */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
              <span style={{ background: '#e8f5e3', color: '#2D5A27', borderRadius: 20, padding: '4px 14px', fontSize: '0.78rem', fontWeight: 700, textTransform: 'capitalize' }}>{product.category}</span>
              {product.season && <span style={{ background: '#fff8e1', color: '#f57f17', borderRadius: 20, padding: '4px 14px', fontSize: '0.78rem', fontWeight: 700, display:'inline-flex', alignItems:'center', gap:4 }}><IconSeedling size={14} /> {product.season}</span>}
              {discount > 0 && <span style={{ background: '#fde8e8', color: '#e74c3c', borderRadius: 20, padding: '4px 14px', fontSize: '0.78rem', fontWeight: 700 }}>{discount}% OFF</span>}
            </div>

            <h1 style={{ fontFamily: 'Playfair Display', fontSize: 'clamp(1.5rem,3vw,2rem)', color: '#1a1a1a', marginBottom: 14, lineHeight: 1.3 }}>{product.name}</h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <StarRating rating={product.avgRating || 0} />
              <span style={{ color: '#888', fontSize: '0.85rem' }}>({product.numReviews || 0} reviews)</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 24 }}>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: '#2D5A27', fontFamily: 'Playfair Display' }}>PKR {price.toLocaleString()}</span>
              {activeDiscount && <span style={{ fontSize: '1.1rem', color: '#aaa', textDecoration: 'line-through' }}>PKR {activePrice.toLocaleString()}</span>}
            </div>

            {/* Variant selector — only shown if product has variants */}
            {product.variants?.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#444', marginBottom: 10 }}>
                  <span style={{display:'inline-flex',alignItems:'center',gap:5}}><IconScale size={16} /> Select Size / Weight:</span>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {product.variants.map((v, i) => {
                    const isSelected = selectedVariant?.weight === v.weight;
                    return (
                      <button key={i} type="button" onClick={() => { setSelectedVariant(v); setQty(1); }}
                        style={{
                          padding: '10px 18px', borderRadius: 10, cursor: 'pointer',
                          border: `2px solid ${isSelected ? '#2D5A27' : '#e0e0e0'}`,
                          background: isSelected ? '#e8f5e3' : 'white',
                          transition: 'all 0.2s', fontFamily: 'Cairo, sans-serif',
                          outline: 'none'
                        }}>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: isSelected ? '#2D5A27' : '#333' }}>{v.weight}</div>
                        <div style={{ fontSize: '0.8rem', color: isSelected ? '#2D5A27' : '#888', marginTop: 2 }}>
                          PKR {(v.discountPrice || v.price).toLocaleString()}
                          {v.discountPrice && <span style={{ color: '#e74c3c', marginLeft: 4, fontSize: '0.74rem' }}>
                            -{Math.round(((v.price - v.discountPrice) / v.price) * 100)}%
                          </span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <p style={{ color: '#555', lineHeight: 1.8, marginBottom: 24, fontSize: '0.95rem' }}>{product.description}</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
              {[['Weight', activeWeight], ['NPK Ratio', product.npkRatio], ['Season', product.season]].map(([k,v]) => v && (
                <div key={k} style={{ background: '#f8fdf6', borderRadius: 8, padding: '10px 14px' }}>
                  <div style={{ fontSize: '0.72rem', color: '#888', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>{k}</div>
                  <div style={{ fontWeight: 700, color: '#1a1a1a', fontSize: '0.9rem' }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Qty + Add to cart */}
            <div style={{ display: 'flex', gap: 14, marginBottom: 16, alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #e0e0e0', borderRadius: 10, overflow: 'hidden' }}>
                <button onClick={() => setQty(q => Math.max(1, q-1))} style={{ width: 42, height: 48, background: 'white', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#555' }}>−</button>
                <span style={{ padding: '0 18px', fontWeight: 700, fontSize: '1rem' }}>{qty}</span>
                <button 
                  onClick={() => setQty(q => Math.min(activeStock, q+1))} 
                  disabled={qty >= activeStock || activeStock === 0}
                  style={{ 
                    width: 42, 
                    height: 48, 
                    background: 'white', 
                    border: 'none', 
                    cursor: (qty >= activeStock || activeStock === 0) ? 'not-allowed' : 'pointer', 
                    fontSize: '1.2rem', 
                    color: '#555',
                    opacity: (qty >= activeStock || activeStock === 0) ? 0.4 : 1,
                    transition: 'opacity 0.2s'
                  }}>+</button>
              </div>
              <button onClick={handleAddToCart} disabled={activeStock === 0}
                style={{ flex: 1, padding: '14px', background: added ? '#27ae60' : '#2D5A27', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '0.95rem', cursor: activeStock === 0 ? 'not-allowed' : 'pointer', transition: 'background .3s', fontFamily: 'Cairo, sans-serif' }}>
                {activeStock === 0 ? <><IconXCircle size={16} style={{marginRight:4}} /> Out of Stock</> : added ? <><IconCheckCircle size={16} style={{marginRight:4}} /> Added to Cart!</> : <><IconCart size={16} style={{marginRight:4}} /> Add to Cart</>}
              </button>
              <button onClick={() => toggleWishlist(product)}
                style={{ width: 48, height: 48, borderRadius: 10, border: `2px solid ${inWishlist ? '#e74c3c' : '#e0e0e0'}`, background: inWishlist ? '#fde8e8' : 'white', cursor: 'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                {inWishlist ? <IconHeartFilled size={20} color="#e74c3c" /> : <IconHeart size={20} color="#ccc" />}
              </button>
            </div>

            

            <div style={{ padding: '12px 16px', background: '#f8fdf6', borderRadius: 8, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {[
                {icon: <IconTruck size={14} />, text: 'Free delivery on PKR 5000+'},
                {icon: <IconBadgeCheck size={14} />, text: '100% Authentic'},
                {icon: <IconCreditCard size={14} />, text: 'Bank Transfer / COD'}
              ].map(item => (
                <span key={item.text} style={{ fontSize: '0.8rem', color: '#2D5A27', fontWeight: 600, display:'inline-flex', alignItems:'center', gap:4 }}>{item.icon} {item.text}</span>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Tabs */}
        <div>
          <div style={{ display: 'flex', borderBottom: '2px solid #e0e0e0', marginBottom: 28, gap: 4, flexWrap: 'wrap' }}>
            {[
              { key: 'description', label: 'Description' },
              { key: 'specs',       label: 'Specifications' },
              { key: 'reviews',     label: `Reviews (${product.numReviews || 0})` },
              { key: 'write',       label: <span style={{display:'inline-flex',alignItems:'center',gap:4}}><IconEdit size={14}/> Write Review</span> },
            ].map(tab => (
              <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)} style={{
                padding: '12px 22px', fontWeight: 600, fontSize: '0.9rem',
                background: 'none', border: 'none', cursor: 'pointer',
                borderBottom: `2.5px solid ${activeTab === tab.key ? '#2D5A27' : 'transparent'}`,
                color: activeTab === tab.key ? '#2D5A27' : '#888',
                marginBottom: -2, transition: 'all 0.2s', fontFamily: 'Cairo, sans-serif'
              }}>{tab.label}</button>
            ))}
          </div>

          <div style={{ minHeight: 160 }}>
            {activeTab === 'description' && (
              <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} style={{ maxWidth:820 }}>
                {/* Short intro */}
                {product.description && (
                  <p style={{ color:'#555', lineHeight:1.85, fontSize:'0.95rem', marginBottom:24 }}>{product.description}</p>
                )}

                {/* Key Features */}
                {product.features?.length > 0 && (
                  <div style={{ marginBottom:22 }}>
                    <h4 style={{ color:'#2D5A27', fontFamily:'Playfair Display', fontSize:'1rem', marginBottom:10, display:'flex', alignItems:'center', gap:8 }}>
                      <IconCheck size={18} /> Key Features
                    </h4>
                    <ul style={{ margin:0, paddingLeft:20, display:'flex', flexDirection:'column', gap:6 }}>
                      {product.features.map((item, i) => (
                        <li key={i} style={{ color:'#444', fontSize:'0.92rem', lineHeight:1.6 }}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Usage */}
                {product.usage?.length > 0 && (
                  <div style={{ marginBottom:22 }}>
                    <h4 style={{ color:'#2D5A27', fontFamily:'Playfair Display', fontSize:'1rem', marginBottom:10, display:'flex', alignItems:'center', gap:8 }}>
                      <IconClipboard size={18} /> How to Use / Application
                    </h4>
                    <ul style={{ margin:0, paddingLeft:20, display:'flex', flexDirection:'column', gap:6 }}>
                      {product.usage.map((item, i) => (
                        <li key={i} style={{ color:'#444', fontSize:'0.92rem', lineHeight:1.6 }}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Precautions */}
                {product.precautions?.length > 0 && (
                  <div style={{ background:'#fff8e1', border:'1px solid #ffe082', borderRadius:10, padding:'16px 20px' }}>
                    <h4 style={{ color:'#f57f17', fontFamily:'Playfair Display', fontSize:'1rem', marginBottom:10, display:'flex', alignItems:'center', gap:8 }}>
                      <IconAlertTriangle size={18} /> Precautions
                    </h4>
                    <ul style={{ margin:0, paddingLeft:20, display:'flex', flexDirection:'column', gap:6 }}>
                      {product.precautions.map((item, i) => (
                        <li key={i} style={{ color:'#555', fontSize:'0.92rem', lineHeight:1.6 }}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Fallback if nothing filled */}
                {!product.description && !product.features?.length && !product.usage?.length && !product.precautions?.length && (
                  <p style={{ color:'#aaa', fontSize:'0.9rem' }}>No description available for this product.</p>
                )}
              </motion.div>
            )}

            {activeTab === 'specs' && (
              <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 12, maxWidth: 700 }}>
                  {[['Product Name',product.name],['Category',product.category],['NPK Ratio',product.npkRatio||'N/A'],['Weight/Volume',product.weight||'N/A'],['Season',product.season||'All Season']].map(([k,v]) => (
                    <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'12px 16px', background:'#f8fdf6', borderRadius:8, fontSize:'0.88rem' }}>
                      <span style={{ color:'#666', fontWeight:600 }}>{k}</span>
                      <span style={{ color:'#1a1a1a', fontWeight:700 }}>{v}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'reviews' && (
              <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}>
                {!product.reviews || product.reviews.length === 0 ? (
                  <div style={{ textAlign:'center', padding:'40px 20px', color:'#999' }}>
                    <div style={{ marginBottom:12 }}><IconMessageCircle size={36} color="#ccc" /></div>
                    <p>No reviews yet. Be the first to review this product!</p>
                    <button onClick={() => setActiveTab('write')}
                      style={{ marginTop:12, background:'#2D5A27', color:'white', border:'none', borderRadius:8, padding:'10px 22px', fontWeight:700, cursor:'pointer', fontFamily:'Cairo, sans-serif' }}>
                      Write a Review
                    </button>
                  </div>
                ) : (
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:32, padding:'0 0 24px', borderBottom:'1px solid #eee', marginBottom:24 }}>
                      <div style={{ textAlign:'center' }}>
                        <div style={{ fontSize:'3rem', fontWeight:800, color:'#2D5A27', fontFamily:'Playfair Display' }}>{(product.avgRating||0).toFixed(1)}</div>
                        <StarRating rating={product.avgRating||0} />
                        <div style={{ color:'#888', fontSize:'0.82rem', marginTop:4 }}>{product.numReviews} reviews</div>
                      </div>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                      {product.reviews.map((r,i) => (
                        <div key={i} style={{ background:'#f8fdf6', borderRadius:12, padding:'16px 20px' }}>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                            <div style={{ fontWeight:700, fontSize:'0.9rem' }}>{r.name}</div>
                            <StarRating rating={r.rating} />
                          </div>
                          <p style={{ color:'#555', fontSize:'0.88rem', margin:0, lineHeight:1.6 }}>{r.comment}</p>
                          <div style={{ fontSize:'0.74rem', color:'#aaa', marginTop:6 }}>{new Date(r.createdAt).toLocaleDateString('en-PK')}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'write' && (
              <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}>
                <div style={{ maxWidth:540 }}>
                  <h3 style={{ fontFamily:'Playfair Display', marginBottom:20 }}>Write a Review</h3>
                  {!user && (
                    <div style={{ background:'#fff3cd', borderRadius:9, padding:'12px 16px', marginBottom:16, fontSize:'0.88rem', color:'#856404' }}>
                      <span style={{display:'inline-flex',alignItems:'center',gap:6}}><IconAlertTriangle size={16} /> You must be logged in to submit a review.</span>
                    </div>
                  )}
                  {reviewMsg && (
                    <div style={{ 
                      background: (reviewMsg.toLowerCase().includes('success') || reviewMsg.toLowerCase().includes('submitted')) ? '#d1e7dd' : '#fde8e8', 
                      color: (reviewMsg.toLowerCase().includes('success') || reviewMsg.toLowerCase().includes('submitted')) ? '#0f5132' : '#c0392b', 
                      borderRadius:9, padding:'12px 16px', marginBottom:16, fontSize:'0.88rem', fontWeight:600 
                    }}>
                      {reviewMsg}
                    </div>
                  )}
                  <div style={{ marginBottom:18 }}>
                    <label style={{ display:'block', marginBottom:8, fontWeight:700, fontSize:'0.85rem', color:'#444' }}>Your Rating *</label>
                    <StarPicker value={reviewRating} onChange={setReviewRating} />
                  </div>
                  <div style={{ marginBottom:20 }}>
                    <label style={{ display:'block', marginBottom:8, fontWeight:700, fontSize:'0.85rem', color:'#444' }}>Your Review *</label>
                    <textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)} rows={4} placeholder="Share your experience with this product..."
                      style={{ width:'100%', padding:'11px 14px', border:'1.5px solid #e0e0e0', borderRadius:9, fontSize:'0.9rem', outline:'none', resize:'vertical', fontFamily:'Cairo, sans-serif', boxSizing:'border-box' }}
                      onFocus={e=>e.target.style.borderColor='#2D5A27'} onBlur={e=>e.target.style.borderColor='#e0e0e0'} />
                  </div>
                  <button onClick={submitReview} disabled={reviewLoading || !user}
                    style={{ background: reviewLoading ? '#aaa' : '#2D5A27', color:'white', border:'none', borderRadius:10, padding:'13px 32px', fontWeight:700, fontSize:'0.95rem', cursor: reviewLoading||!user ? 'not-allowed':'pointer', fontFamily:'Cairo, sans-serif' }}>
                    {reviewLoading ? <><IconLoader size={16} style={{marginRight:4}} /> Submitting...</> : <><IconStar size={16} style={{marginRight:4}} /> Submit Review</>}
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <div style={{ marginTop: 64 }}>
            <h2 style={{ fontFamily:'Playfair Display', fontSize:'1.8rem', marginBottom:8 }}>
              Related <span style={{ color:'#2D5A27' }}>Products</span>
            </h2>
            <p style={{ color:'#666', marginBottom:32 }}>Other products in the same category</p>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:24 }} className="products-grid">
              {related.map(p => <ProductCard key={p._id} product={p} />)}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @media(max-width:768px){
          div[style*="grid-template-columns: 1fr 1fr"]{grid-template-columns:1fr!important;}
          .products-grid{grid-template-columns:repeat(2,1fr)!important;}
        }
        @media(max-width:480px){.products-grid{grid-template-columns:1fr!important;}}
      `}</style>
    </div>
  );
};

export default ProductDetail;
