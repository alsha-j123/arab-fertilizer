import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import apiClient from '../utils/apiClient';
import ProductCard from '../components/ProductCard';

const Skeleton = () => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 24 }}>
    {[1,2,3,4,5,6,7,8].map(i => (
      <div key={i} style={{ background: 'white', borderRadius: 12, height: 350, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
        <div style={{ height: '70%', background: '#f0f0f0', animation: 'pulse 1.5s infinite ease-in-out' }} />
        <div style={{ padding: 15 }}>
          <div style={{ height: 20, background: '#f0f0f0', borderRadius: 4, marginBottom: 10, width: '80%', animation: 'pulse 1.5s infinite ease-in-out' }} />
          <div style={{ height: 15, background: '#f5f5f5', borderRadius: 4, width: '40%', animation: 'pulse 1.5s infinite ease-in-out' }} />
        </div>
      </div>
    ))}
    <style>{`@keyframes pulse{0%{opacity:1}50%{opacity:0.4}100%{opacity:1}}`}</style>
  </div>
);

const CategoryPage = ({ category, title, description, icon }) => {
  const [sort, setSort]       = useState('default');
  const [search, setSearch]   = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiClient.get(`/products?category=${category}`)
      .then(res => {
        const apiProducts = res.data.products || [];
        if (apiProducts.length > 0) {
          setProducts(apiProducts);
        } else {
          /* fallback to localStorage */
          try {
            const stored = localStorage.getItem('af_products');
            const all = stored ? JSON.parse(stored) : [];
            setProducts(all.filter(p => p.category === category));
          } catch { setProducts([]); }
        }
      })
      .catch(() => {
        try {
          const stored = localStorage.getItem('af_products');
          const all = stored ? JSON.parse(stored) : [];
          setProducts(all.filter(p => p.category === category));
        } catch { setProducts([]); }
      })
      .finally(() => setLoading(false));
  }, [category]);

  const filtered = useMemo(() => {
    let result = [...products];
    if (search) result = result.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    if (sort === 'price-asc')  result.sort((a, b) => (a.discountPrice||a.price) - (b.discountPrice||b.price));
    if (sort === 'price-desc') result.sort((a, b) => (b.discountPrice||b.price) - (a.discountPrice||a.price));
    if (sort === 'rating')     result.sort((a, b) => b.avgRating - a.avgRating);
    if (sort === 'name')       result.sort((a, b) => a.name.localeCompare(b.name));
    return result;
  }, [products, sort, search]);

  const bgImages = {
    insecticides: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=1400&fit=crop',
    weedicides: 'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=1400&fit=crop',
    fungicides: 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=1400&fit=crop',
    pgr:        'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1400&fit=crop',
    granules:   'https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?w=1400&fit=crop'
  };

  return (
    <div style={{ paddingTop: 72 }}>
      {/* Hero */}
      <div style={{
        backgroundImage: `linear-gradient(135deg,rgba(45,90,39,0.88),rgba(93,64,55,0.85)),url(${bgImages[category]})`,
        backgroundSize: 'cover', backgroundPosition: 'center', padding: '70px 24px 55px', textAlign: 'center'
      }}>
        <div style={{ fontSize: 52, marginBottom: 14 }}>{icon}</div>
        <h1 style={{ color: 'white', fontFamily: 'Playfair Display', fontSize: 'clamp(1.8rem,4vw,2.8rem)', marginBottom: 12 }}>{title}</h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', maxWidth: 500, margin: '0 auto', fontSize: '1rem' }}>{description}</p>
      </div>

      {/* Filters */}
      <div style={{ background: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', position: 'sticky', top: 72, zIndex: 10 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '14px 24px', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <input type="text" placeholder={`Search ${title}...`} value={search} onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: 200, padding: '9px 14px', border: '1.5px solid #e0e0e0', borderRadius: 8, fontSize: '0.88rem', outline: 'none', fontFamily: 'Cairo, sans-serif' }}
            onFocus={e => e.target.style.borderColor = '#2D5A27'} onBlur={e => e.target.style.borderColor = '#e0e0e0'} />
          <select value={sort} onChange={e => setSort(e.target.value)}
            style={{ padding: '9px 14px', border: '1.5px solid #e0e0e0', borderRadius: 8, fontSize: '0.88rem', outline: 'none', fontFamily: 'Cairo, sans-serif', background: 'white' }}>
            <option value="default">Default Sorting</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating">Top Rated</option>
            <option value="name">Name A-Z</option>
          </select>
          <span style={{ color: '#888', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{filtered.length} products</span>
        </div>
      </div>

      {/* Products */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px' }}>
        {loading && products.length === 0 ? (
          <Skeleton />
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 80 }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🌿</div>
            <h3 style={{ fontFamily: 'Playfair Display', color: '#2D5A27', marginBottom: 8 }}>No products yet</h3>
            <p style={{ color: '#888' }}>Products added from the admin panel will appear here.</p>
          </div>
        ) : (
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }}
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 24 }}>
            {filtered.map(p => (
              <motion.div key={p._id} variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
                <ProductCard product={p} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CategoryPage;