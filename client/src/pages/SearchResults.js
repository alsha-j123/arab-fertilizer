import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import apiClient from '../utils/apiClient';
import { categories } from '../data';
import ProductCard from '../components/ProductCard';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q') || '';

  const [results, setResults] = useState([]);

  useEffect(() => {
    if (!q.trim()) { setResults([]); return; }

    const searchLocalStorage = () => {
      try {
        const stored = localStorage.getItem('af_products');
        if (stored) {
          const all = JSON.parse(stored);
          const lower = q.toLowerCase();
          return all.filter(p =>
            p.name?.toLowerCase().includes(lower) ||
            p.category?.toLowerCase().includes(lower) ||
            p.description?.toLowerCase().includes(lower)
          );
        }
      } catch {}
      return [];
    };

    apiClient.get(`/products?search=${encodeURIComponent(q)}`)
      .then(res => {
        const apiResults = res.data.products || [];
        if (apiResults.length > 0) {
          setResults(apiResults);
        } else {
          /* API returned nothing — search localStorage */
          setResults(searchLocalStorage());
        }
      })
      .catch(() => setResults(searchLocalStorage()));
  }, [q]);

  return (
    <div style={{ paddingTop: 72, background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ background: 'linear-gradient(135deg, rgba(45,90,39,0.88), rgba(93,64,55,0.85)), url(https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200) center/cover', padding: '50px 24px', textAlign: 'center' }}>
        <h1 style={{ color: 'white', fontFamily: 'Playfair Display', fontSize: 'clamp(1.5rem, 4vw, 2.4rem)', marginBottom: 10 }}>
          Search Results
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1rem' }}>
          {results.length} result{results.length !== 1 ? 's' : ''} for "<span style={{ color: '#C8A951', fontWeight: 700 }}>{q}</span>"
        </p>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px' }}>
        {!q.trim() ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🔍</div>
            <h2 style={{ fontFamily: 'Playfair Display', color: '#2D5A27', marginBottom: 12 }}>Start Searching</h2>
            <p style={{ color: '#666' }}>Use the search bar above to find products</p>
          </div>
        ) : results.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>😔</div>
            <h2 style={{ fontFamily: 'Playfair Display', color: '#2D5A27', marginBottom: 12 }}>No results found</h2>
            <p style={{ color: '#666', marginBottom: 32 }}>Try different keywords or browse our categories</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              {categories.map(cat => (
                <Link key={cat.id} to={`/${cat.id}`} style={{ background: '#2D5A27', color: 'white', padding: '10px 20px', borderRadius: 8, fontWeight: 600, fontSize: '0.88rem', textDecoration: 'none' }}>
                  {cat.icon} {cat.label}
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <>
            <p style={{ color: '#666', marginBottom: 28, fontSize: '0.9rem' }}>
              Showing {results.length} product{results.length !== 1 ? 's' : ''} matching "<strong>{q}</strong>"
            </p>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}
              className="products-grid">
              {results.map(product => (
                <ProductCard key={product._id} product={product} />
              ))}
            </motion.div>
          </>
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

export default SearchResults;