import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import HeroCarousel from '../components/HeroCarousel';
import ProductCard from '../components/ProductCard';
import React, { useState, useEffect } from 'react';
import apiClient from '../utils/apiClient';
import { categories } from '../data';
import { IconTag, IconWheat, IconCheck, IconFlask, IconTruck, IconBadgeCheck, IconLeaf, IconCreditCard, IconTrophy } from '../components/SvgIcons';

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } }
};

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
};

const Home = () => {
  const [featured, setFeatured] = useState([]);
  useEffect(() => {
    apiClient.get('/products?featured=true')
      .then(res => {
        const apiProducts = res.data.products || [];
        if (apiProducts.length > 0) {
          setFeatured(apiProducts);
        } else {
          try {
            const stored = localStorage.getItem('af_products');
            const all = stored ? JSON.parse(stored) : [];
            setFeatured(all.filter(p => p.featured).slice(0, 8));
          } catch { setFeatured([]); }
        }
      })
      .catch(() => {
        try {
          const stored = localStorage.getItem('af_products');
          const all = stored ? JSON.parse(stored) : [];
          setFeatured(all.filter(p => p.featured).slice(0, 8));
        } catch { setFeatured([]); }
      });
  }, []);

  return (
    <div>
      {/* ── Hero Carousel ── */}
      <HeroCarousel />

      {/* Spacer */}
      <div style={{ height: 56, background: '#f5f0e8' }} />

      {/* ── Promo Banner ── */}
      <motion.section initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
        style={{
          background: 'linear-gradient(135deg, #5D4037, #8B5E52)',
          padding: 'clamp(40px,6vw,60px) 20px', textAlign: 'center', position: 'relative', overflow: 'hidden',
        }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.1,
          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,0.1) 20px, rgba(255,255,255,0.1) 40px)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <span style={{ background: 'rgba(200,169,81,0.2)', border: '1px solid rgba(200,169,81,0.5)', borderRadius: 20, padding: '4px 16px', color: '#C8A951', fontSize: '0.82rem', fontWeight: 700, display: 'inline-block', marginBottom: 12 }}>
            <IconTag size={14} style={{marginRight:4}} /> LIMITED OFFER
          </span>
          <h2 style={{ color: 'white', fontFamily: 'Playfair Display', fontSize: 'clamp(1.2rem, 3vw, 2rem)', margin: '0 0 10px' }}>
            Kharif Season Sale — Up to 30% Off on Selected Products
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.75)', marginBottom: 24, fontSize: '0.95rem', maxWidth: 560, margin: '0 auto 24px' }}>
            Stock up before the season peaks. Free delivery on orders above PKR 5,000.
          </p>
          <Link to="/insecticides" style={{
            background: '#C8A951', color: '#1a1a1a', padding: '13px 32px',
            borderRadius: 10, fontWeight: 700, fontSize: '0.95rem',
            display: 'inline-block', transition: 'all 0.3s'
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#e0c070'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#C8A951'; e.currentTarget.style.transform = 'translateY(0)'; }}>
            Shop Sale →
          </Link>
        </div>
      </motion.section>

      {/* Spacer */}
      <div style={{ height: 56, background: '#f5f0e8' }} />

      {/* ── Category Grid ── */}
      <section style={{ padding: 'clamp(50px,8vw,80px) 20px', background: '#f8fdf6' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
            <div style={{ textAlign: 'center', marginBottom: 44 }}>
              <div style={{ width: 60, height: 4, background: 'linear-gradient(90deg, #2D5A27, #C8A951)', borderRadius: 2, margin: '0 auto 16px' }} />
              <h2 style={{ fontSize: 'clamp(1.4rem, 3vw, 2.2rem)', fontFamily: 'Playfair Display', marginBottom: 10 }}>
                Our <span style={{ color: '#2D5A27' }}>Product Categories</span>
              </h2>
              <p style={{ color: '#666', maxWidth: 500, margin: '0 auto', fontSize: '0.95rem' }}>Complete agricultural solutions from seed to harvest</p>
            </div>
          </motion.div>

          {/* 5-col → 3 → 2 → 1 via CSS class */}
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={containerVariants}
            className="category-cards-grid">
            {categories.map(cat => (
              <motion.div key={cat.id} variants={fadeUp} style={{ display: 'flex' }}>
                <Link to={`/${cat.id}`} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  width: '100%', background: 'white', borderRadius: 14,
                  padding: 'clamp(20px,3vw,28px) 16px 20px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
                  textDecoration: 'none', transition: 'all 0.3s', border: '2px solid transparent'
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 14px 36px rgba(45,90,39,0.18)'; e.currentTarget.style.borderColor = '#2D5A27'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 16px rgba(0,0,0,0.07)'; e.currentTarget.style.borderColor = 'transparent'; }}>
                  <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg,#e8f5e3,#c8e6c0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, marginBottom: 12, flexShrink: 0 }}>{cat.icon}</div>
                  <div style={{ color: '#1a1a1a', fontWeight: 700, fontSize: '0.92rem', fontFamily: 'Playfair Display', textAlign: 'center', marginBottom: 8, lineHeight: 1.3 }}>{cat.label}</div>
                  <div style={{ color: '#888', fontSize: '0.77rem', textAlign: 'center', lineHeight: 1.5, flex: 1, marginBottom: 12 }}>{cat.desc}</div>
                  <span style={{ background: '#e8f5e3', color: '#2D5A27', borderRadius: 20, padding: '5px 14px', fontSize: '0.74rem', fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>
                    Browse →
                  </span>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Featured Products ── */}
      <section style={{ padding: 'clamp(50px,7vw,70px) 20px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 36, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ width: 60, height: 4, background: 'linear-gradient(90deg, #2D5A27, #C8A951)', borderRadius: 2, marginBottom: 14 }} />
              <h2 style={{ fontSize: 'clamp(1.4rem, 3vw, 2.2rem)', fontFamily: 'Playfair Display', margin: 0 }}>
                Featured <span style={{ color: '#2D5A27' }}>Products</span>
              </h2>
              <p style={{ color: '#666', margin: '8px 0 0', fontSize: '0.9rem' }}>Our best-selling, most trusted products</p>
            </div>
            <Link to="/insecticides" style={{
              background: 'transparent', border: '2px solid #2D5A27', color: '#2D5A27',
              padding: '10px 22px', borderRadius: 10, fontWeight: 700, fontSize: '0.88rem',
              transition: 'all 0.3s', display: 'inline-block'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#2D5A27'; e.currentTarget.style.color = 'white'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#2D5A27'; }}>
              View All Products
            </Link>
          </motion.div>

          {/* products-grid: 4→3→2→1 via CSS class */}
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={containerVariants}
            className="products-grid">
            {featured.slice(0, 8).map(product => (
              <ProductCard key={product._id} product={product} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Kharif Crop Pack Banner ── */}
      <section style={{
        backgroundImage: 'url(https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1400&auto=format&fit=crop)',
        backgroundSize: 'cover', backgroundPosition: 'center',
        padding: 'clamp(60px,9vw,90px) 20px', position: 'relative'
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(90deg, rgba(45,90,39,0.92) 0%, rgba(45,90,39,0.5) 60%, rgba(0,0,0,0.1) 100%)'
        }} />
        <div style={{ maxWidth: 1280, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: 560 }}>
            <span style={{ background: 'rgba(200,169,81,0.25)', border: '1px solid rgba(200,169,81,0.5)', borderRadius: 20, padding: '5px 16px', color: '#C8A951', fontSize: '0.82rem', fontWeight: 700, display: 'inline-block', marginBottom: 16 }}>
              <IconWheat size={14} style={{marginRight:4}} /> Kharif Season Pack
            </span>
            <h2 style={{ color: 'white', fontFamily: 'Playfair Display', fontSize: 'clamp(1.6rem, 4vw, 2.8rem)', margin: '0 0 16px', lineHeight: 1.2 }}>
              Complete Crop<br /><span style={{ color: '#C8A951' }}>Protection Package</span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.85)', lineHeight: 1.75, marginBottom: 28, fontSize: '0.95rem' }}>
              Get everything you need for a successful Kharif season. Our experts have curated the perfect combination of insecticides, fungicides, and growth regulators for maximum yield.
            </p>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <Link to="/insecticides" style={{ background: '#C8A951', color: '#1a1a1a', padding: '13px 26px', borderRadius: 10, fontWeight: 700, fontSize: '0.95rem', display: 'inline-block', transition: 'all 0.3s' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#e0c070'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#C8A951'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                Shop Kharif Products
              </Link>
              <Link to="/contact" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1.5px solid rgba(255,255,255,0.4)', padding: '13px 22px', borderRadius: 10, fontWeight: 600, fontSize: '0.95rem', display: 'inline-block' }}>
                Get Free Consultation
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── PGR Section ── */}
      <section style={{ padding: 'clamp(50px,8vw,80px) 20px', background: '#f9f5f0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          {/* pgr-section-grid: 2→1 via CSS class */}
          <div className="pgr-section-grid">
            <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
              <div style={{ width: 60, height: 4, background: 'linear-gradient(90deg, #5D4037, #C8A951)', borderRadius: 2, marginBottom: 16 }} />
              <h2 style={{ fontFamily: 'Playfair Display', fontSize: 'clamp(1.4rem, 3vw, 2.2rem)', marginBottom: 16, color: '#1a1a1a' }}>
                Plant Growth Regulators<br /><span style={{ color: '#5D4037' }}>Boost Every Stage</span>
              </h2>
              <p style={{ color: '#666', lineHeight: 1.8, marginBottom: 24, fontSize: '0.95rem' }}>
                Our range of PGRs helps farmers optimize plant architecture, accelerate fruit set, and improve overall crop uniformity. Scientifically formulated for Pakistan's agro-climatic conditions.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, marginBottom: 28 }}>
                {['Gibberellins for enhanced germination', 'Cytokinins for cell division & fruit set', 'Auxins for root development', 'Ethephon for ripening management'].map(item => (
                  <li key={item} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10, color: '#444', fontSize: '0.9rem' }}>
                    <IconCheck size={18} color="#5D4037" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/pgr" style={{ background: '#5D4037', color: 'white', padding: '13px 28px', borderRadius: 10, fontWeight: 700, fontSize: '0.95rem', display: 'inline-block', transition: 'all 0.3s' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#7B5548'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#5D4037'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                Explore PGR Products →
              </Link>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}
              style={{ position: 'relative' }}>
              <div style={{ borderRadius: 16, overflow: 'hidden', boxShadow: '0 20px 60px rgba(93,64,55,0.2)' }}>
                <img src="https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&auto=format&fit=crop" alt="Plant Growth" style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover' }} />
              </div>
              {/* Float badge — hidden on mobile via CSS class */}
              <div className="pgr-float-badge" style={{
                position: 'absolute', bottom: -20, left: -20, background: '#2D5A27',
                borderRadius: 14, padding: '20px 24px', color: 'white', boxShadow: '0 12px 32px rgba(45,90,39,0.3)'
              }}>
                <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'Playfair Display', color: '#C8A951' }}>+40%</div>
                <div style={{ fontSize: '0.82rem', opacity: 0.85, lineHeight: 1.4 }}>Avg. yield increase<br />reported by farmers</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Why Choose Us ── */}
      <section style={{ padding: 'clamp(50px,8vw,80px) 20px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} style={{ textAlign: 'center', marginBottom: 50 }}>
            <div style={{ width: 60, height: 4, background: 'linear-gradient(90deg, #2D5A27, #C8A951)', borderRadius: 2, margin: '0 auto 16px' }} />
            <h2 style={{ fontFamily: 'Playfair Display', fontSize: 'clamp(1.4rem, 3vw, 2.2rem)', marginBottom: 10 }}>
              Why Choose <span style={{ color: '#2D5A27' }}>Arab Fertilizer?</span>
            </h2>
          </motion.div>

          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={containerVariants}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
            {[
              { icon: <IconFlask size={28} color="#2D5A27" />, title: 'Lab Tested', desc: 'Every product is tested in certified laboratories to ensure maximum efficacy and crop safety.' },
              { icon: <IconTruck size={28} color="#2D5A27" />, title: 'Fast Delivery', desc: 'Same-day dispatch for orders placed before 3 PM. Pan-Pakistan delivery within 3–5 days.' },
              { icon: <IconBadgeCheck size={28} color="#2D5A27" />, title: 'Quality Guarantee', desc: '100% authentic products. No counterfeit items. Sourced directly from manufacturers.' },
              { icon: <IconLeaf size={28} color="#2D5A27" />, title: 'Expert Advice', desc: 'Free agricultural consultation from our team of experienced agronomists and crop experts.' },
              { icon: <IconCreditCard size={28} color="#2D5A27" />, title: 'Easy Payments', desc: 'Pay via Bank Transfer or Cash on Delivery. No hidden fees, no registration charges.' },
              { icon: <IconTrophy size={28} color="#2D5A27" />, title: 'Trusted Since 2016', desc: '15+ years serving Pakistani farmers. Over 10,000 satisfied customers across 50+ cities.' }
            ].map(item => (
              <motion.div key={item.title} variants={fadeUp} style={{
                background: 'white', borderRadius: 14, padding: 'clamp(20px,3vw,28px) 22px',
                boxShadow: '0 2px 16px rgba(0,0,0,0.06)', textAlign: 'center', transition: 'all 0.3s'
              }}
              whileHover={{ y: -6, boxShadow: '0 16px 40px rgba(45,90,39,0.12)' }}>
                <div style={{ marginBottom: 14 }}>{item.icon}</div>
                <h3 style={{ fontFamily: 'Playfair Display', fontSize: '1.02rem', marginBottom: 10, color: '#1a1a1a' }}>{item.title}</h3>
                <p style={{ color: '#666', fontSize: '0.85rem', lineHeight: 1.7 }}>{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;