import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import slide1Img from '../assets/slide1-seedling.png';
import slide2Img from '../assets/slide2-farmer.png';

const slides = [
  {
    id: 1,
    bgImage: slide1Img,
    overlay: 'linear-gradient(105deg, rgba(26,46,22,0.82) 0%, rgba(45,90,39,0.55) 55%, rgba(0,0,0,0.10) 100%)',
    badge: '🌾 Kharif Season 2024',
    title: 'Maximize Your',
    titleAccent: 'Crop Yield',
    subtitle: 'Premium agricultural chemicals and fertilizers trusted by 10,000+ farmers across Pakistan.',
    cta: 'Shop Insecticides', ctaLink: '/insecticides',
    align: 'left',
  },
  {
    id: 2,
    bgImage: slide2Img,
    overlay: 'linear-gradient(105deg, rgba(93,64,55,0.80) 0%, rgba(45,90,39,0.50) 55%, rgba(0,0,0,0.08) 100%)',
    badge: '🌱 Pakistan\'s Fields',
    title: 'Nurture Every',
    titleAccent: 'Harvest',
    subtitle: 'From germination to golden harvest — Arab Fertilizer delivers science-backed solutions for thriving crops.',
    cta: 'Explore PGR', ctaLink: '/pgr',
    ctaSecondary: 'Learn More', ctaSecondaryLink: '/about',
    align: 'left',
  },
  {
    id: 3,
    bgImage: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1400&auto=format&fit=crop',
    overlay: 'linear-gradient(135deg, rgba(26,58,21,0.83) 0%, rgba(93,64,55,0.65) 100%)',
    badge: '🏆 Pakistan\'s Trusted Brand',
    title: 'Fields That',
    titleAccent: 'Flourish',
    subtitle: 'From cotton to wheat, protect your crops with our wide range of insecticides, fungicides, and weedicides.',
    cta: 'Shop Now', ctaLink: '/insecticides',
    ctaSecondary: 'Contact Us', ctaSecondaryLink: '/contact',
    align: 'right',
  },
];

const HeroCarousel = () => {
  const [current, setCurrent] = useState(0);
  const [animating, setAnim]  = useState(false);

  const go = useCallback(idx => {
    if (animating) return;
    setAnim(true);
    setTimeout(() => { setCurrent(idx); setAnim(false); }, 550);
  }, [animating]);

  const next = useCallback(() => go((current + 1) % slides.length), [current, go]);

  useEffect(() => {
    const t = setInterval(next, 5500);
    return () => clearInterval(t);
  }, [next]);

  const s = slides[current];

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', minHeight: 480, maxHeight: 800, overflow: 'hidden' }}>

      {/* Slide backgrounds */}
      {slides.map((sl, i) => (
        <div key={sl.id} style={{
          position: 'absolute', inset: 0,
          backgroundImage: `${sl.overlay}, url(${sl.bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: sl.id === 1 ? 'center 40%' : 'center center',
          opacity: i === current ? 1 : 0,
          transition: 'opacity 0.55s ease-in-out',
          zIndex: i === current ? 1 : 0,
        }} />
      ))}

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', alignItems: 'center', padding: '68px 20px 80px' }}>
        <div style={{ maxWidth: 1280, width: '100%', margin: '0 auto' }}>
          <div style={{
            maxWidth: 620,
            marginLeft:  s.align === 'right' ? 'auto' : 0,
            marginRight: s.align === 'right' ? 0 : 'auto',
            opacity: animating ? 0 : 1,
            transform: animating ? 'translateY(18px)' : 'translateY(0)',
            transition: 'opacity 0.45s ease, transform 0.45s ease',
          }}>
            <div style={{ display: 'inline-block', background: 'rgba(200,169,81,0.2)', border: '1px solid rgba(200,169,81,0.5)', borderRadius: 20, padding: '5px 16px', color: '#C8A951', fontSize: '0.82rem', fontWeight: 600, marginBottom: 18, letterSpacing: '0.3px' }}>
              {s.badge}
            </div>
            <h1 style={{ fontSize: 'clamp(1.9rem, 5vw, 3.8rem)', color: 'white', fontFamily: 'Playfair Display, serif', fontWeight: 800, lineHeight: 1.15, marginBottom: 14 }}>
              {s.title} <span style={{ color: '#C8A951' }}>{s.titleAccent}</span>
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.87)', fontSize: 'clamp(0.88rem, 2vw, 1.05rem)', lineHeight: 1.75, marginBottom: 30, maxWidth: 480 }}>
              {s.subtitle}
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link to={s.ctaLink} style={{ background: '#C8A951', color: '#1a1a1a', padding: 'clamp(11px,2vw,14px) clamp(20px,3vw,30px)', borderRadius: 10, fontWeight: 700, fontSize: 'clamp(0.88rem,2vw,1rem)', display: 'inline-block', transition: 'all 0.3s', boxShadow: '0 8px 24px rgba(200,169,81,0.38)', textDecoration: 'none' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#e0c070'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#C8A951'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                {s.cta} →
              </Link>
              {s.ctaSecondary && s.ctaSecondaryLink && (
                <Link to={s.ctaSecondaryLink} style={{ background: 'rgba(255,255,255,0.12)', color: 'white', border: '1.5px solid rgba(255,255,255,0.38)', padding: 'clamp(11px,2vw,14px) clamp(18px,2.5vw,26px)', borderRadius: 10, fontWeight: 600, fontSize: 'clamp(0.88rem,2vw,1rem)', display: 'inline-block', transition: 'all 0.3s', textDecoration: 'none' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}>
                  {s.ctaSecondary}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dot nav */}
      <div style={{ position: 'absolute', bottom: 72, left: '50%', transform: 'translateX(-50%)', zIndex: 3, display: 'flex', gap: 8 }}>
        {slides.map((_, i) => (
          <button key={i} onClick={() => go(i)} style={{ width: i === current ? 28 : 8, height: 8, borderRadius: 4, border: 'none', cursor: 'pointer', background: i === current ? '#C8A951' : 'rgba(255,255,255,0.4)', transition: 'all 0.4s', padding: 0 }} />
        ))}
      </div>

      {/* Stats bar — hidden on mobile via CSS class */}
      <div className="hero-stats-bar" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 3, background: 'rgba(0,0,0,0.38)', backdropFilter: 'blur(10px)', borderTop: '1px solid rgba(255,255,255,0.09)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '14px 24px', display: 'flex', justifyContent: 'center', gap: 'clamp(24px,5vw,48px)', flexWrap: 'wrap' }}>
          {[
            { value: '10,000+', label: 'Happy Farmers' },
            { value: '200+',    label: 'Products'       },
            { value: '15+',     label: 'Years Experience' },
            { value: '50+',     label: 'Cities Served'  },
          ].map(st => (
            <div key={st.label} style={{ textAlign: 'center' }}>
              <div style={{ color: '#C8A951', fontWeight: 800, fontSize: 'clamp(1rem,2vw,1.25rem)', fontFamily: 'Playfair Display' }}>{st.value}</div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.78rem', letterSpacing: '0.3px' }}>{st.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile "scroll down" hint */}
      <style>{`
        @media (max-width: 768px) {
          .hero-stats-bar { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default HeroCarousel;
