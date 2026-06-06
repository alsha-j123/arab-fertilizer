import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import logo from '../assets/logo.png';

/* ── SVG icons ── */
const IcoSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const IcoHeart = ({ on }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill={on ? '#e74c3c' : 'none'} stroke={on ? '#e74c3c' : '#555'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);
const IcoCart = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
);
const IcoUser = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const IcoMenu = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);
const IcoClose = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const BG     = '#F6F1E7';
const BG_SCR = 'rgba(246,241,231,0.97)';
const GREEN  = '#2D5A27';

const navLinks = [
  { to: '/insecticides', label: 'Insecticides' },
  { to: '/weedicides',   label: 'Weedicides'  },
  { to: '/fungicides',   label: 'Fungicides'  },
  { to: '/pgr',          label: 'PGR'         },
  { to: '/granules',     label: 'Granules'    },
  { to: '/about',        label: 'About Us'    },
];

const Navbar = () => {
  const { user, logout, setShowAuthModal } = useAuth();
  const { cartCount, setIsOpen }           = useCart();
  const { wishlistCount }                  = useWishlist();
  const [q, setQ]               = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobile] = useState(false);
  const [profileOpen, setPO]    = useState(false);
  const navigate   = useNavigate();
  const location   = useLocation();
  const profileRef = useRef(null);

  /* Close mobile menu on route change */
  useEffect(() => { setMobile(false); setPO(false); }, [location.pathname]);

  /* Scroll effect */
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  /* Click-outside for profile dropdown */
  useEffect(() => {
    const fn = e => { if (profileRef.current && !profileRef.current.contains(e.target)) setPO(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  /* Prevent body scroll when mobile menu open */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const handleSearch = e => {
    e.preventDefault();
    e.stopPropagation();
    const trimmed = q.trim();
    if (trimmed) { navigate(`/search?q=${encodeURIComponent(trimmed)}`); setMobile(false); }
  };

  const act = to => location.pathname === to;

  const linkStyle = active => ({
    color: active ? GREEN : '#4a4a4a',
    fontWeight: active ? 700 : 500,
    fontSize: '0.95rem',
    padding: '7px 12px',
    borderRadius: 8,
    background: active ? `rgba(45,90,39,0.09)` : 'transparent',
    borderBottom: `2px solid ${active ? GREEN : 'transparent'}`,
    whiteSpace: 'nowrap',
    textDecoration: 'none',
    transition: 'all 0.2s',
  });

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 500,
        background: scrolled ? BG_SCR : BG,
        backdropFilter: scrolled ? 'blur(14px)' : 'none',
        boxShadow: scrolled ? '0 4px 20px rgba(45,90,39,0.13)' : '0 1px 0 rgba(45,90,39,0.10)',
        borderBottom: '1.5px solid rgba(45,90,39,0.08)',
        height: 68, display: 'flex', alignItems: 'center',
        transition: 'all 0.3s',
      }}>
        <div style={{ maxWidth: 1340, margin: '0 auto', width: '100%', padding: '0 16px', display: 'flex', alignItems: 'center', gap: 12 }}>

          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, textDecoration: 'none' }}>
            <img src={logo} alt="Arab Fertilizer"
              style={{ height: 40, width: 40, objectFit: 'contain', borderRadius: 10, background: 'rgba(45,90,39,0.07)', padding: 4 }} />
            <div className="nav-brand-text">
              <div style={{ color: GREEN, fontFamily: 'Playfair Display', fontSize: '1.05rem', fontWeight: 800, lineHeight: 1.1 }}>Arab Fertilizer</div>
              <div style={{ color: '#999', fontSize: '0.58rem', letterSpacing: '0.5px' }}>Agro Chemicals</div>
            </div>
          </Link>

          {/* Desktop nav links */}
          <div className="nav-links-desktop" style={{ display: 'flex', gap: 2, flex: 1, justifyContent: 'center' }}>
            {navLinks.map(l => (
              <Link key={l.to} to={l.to} style={linkStyle(act(l.to))}
                onMouseEnter={e => { e.currentTarget.style.color = GREEN; e.currentTarget.style.background = 'rgba(45,90,39,0.09)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = act(l.to) ? GREEN : '#4a4a4a'; e.currentTarget.style.background = act(l.to) ? 'rgba(45,90,39,0.09)' : 'transparent'; }}>
                {l.label}
              </Link>
            ))}
          </div>

          {/* Right actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>

            {/* Search pill — hidden <640px via CSS class */}
            <form onSubmit={handleSearch} className="nav-search-form" style={{ display: 'flex' }}>
              <div style={{ display: 'flex', alignItems: 'center', background: 'white', borderRadius: 8, border: '1.5px solid rgba(45,90,39,0.18)', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                <input
                  type="text" value={q}
                  onChange={e => setQ(e.target.value)}
                  placeholder="Search..."
                  style={{ background: 'transparent', border: 'none', padding: '8px 10px', color: '#333', fontSize: '0.83rem', width: 130, outline: 'none', fontFamily: 'Cairo, sans-serif' }}
                />
                <button type="submit" style={{ background: GREEN, border: 'none', padding: '0 11px', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', height: 36, transition: 'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#3a7a31'}
                  onMouseLeave={e => e.currentTarget.style.background = GREEN}>
                  <IcoSearch />
                </button>
              </div>
            </form>

            {/* Wishlist icon — hidden <480px */}
            <Link to="/wishlist" className="nav-wishlist-btn" style={{ position: 'relative', color: '#555', padding: '8px', display: 'flex', borderRadius: 8, transition: 'background 0.2s', textDecoration: 'none' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(45,90,39,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <IcoHeart on={wishlistCount > 0} />
              {wishlistCount > 0 && (
                <motion.span key={wishlistCount} initial={{ scale: 0 }} animate={{ scale: 1 }}
                  style={{ position: 'absolute', top: 2, right: 2, background: '#e74c3c', color: 'white', borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.58rem', fontWeight: 700 }}>
                  {wishlistCount}
                </motion.span>
              )}
            </Link>

            {/* Cart button */}
            <button onClick={() => setIsOpen(true)} style={{ position: 'relative', background: 'white', border: '1.5px solid rgba(45,90,39,0.18)', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: GREEN, fontWeight: 600, fontSize: '0.95rem', transition: 'all 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(45,90,39,0.07)'; e.currentTarget.style.borderColor = GREEN; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = 'rgba(45,90,39,0.18)'; }}>
              <IcoCart />
              {cartCount > 0 && (
                <motion.span key={cartCount} initial={{ scale: 0.5 }} animate={{ scale: 1 }}
                  style={{ background: GREEN, color: 'white', borderRadius: 20, padding: '1px 7px', fontSize: '0.72rem', fontWeight: 700 }}>
                  {cartCount}
                </motion.span>
              )}
            </button>

            {/* User / Login */}
            {user ? (
              <div ref={profileRef} style={{ position: 'relative' }}>
                <button onClick={() => setPO(p => !p)} style={{ background: 'rgba(45,90,39,0.08)', border: '1.5px solid rgba(45,90,39,0.2)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, color: GREEN, fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s' }}>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.8rem', overflow: 'hidden', flexShrink: 0 }}>
                    {user.avatar ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : user.name?.[0]?.toUpperCase()}
                  </div>
                  <span className="nav-user-name" style={{ maxWidth: 72, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name?.split(' ')[0]}</span>
                </button>
                <AnimatePresence>
                  {profileOpen && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                      style={{ position: 'absolute', top: '110%', right: 0, background: 'white', borderRadius: 10, boxShadow: '0 8px 28px rgba(0,0,0,0.12)', minWidth: 185, overflow: 'hidden', zIndex: 600, border: '1px solid rgba(0,0,0,0.06)' }}>
                      <div style={{ padding: '12px 16px', borderBottom: '1px solid #eee', color: GREEN, fontWeight: 700, fontSize: '0.88rem' }}>
                        {user.name}<div style={{ color: '#999', fontWeight: 400, fontSize: '0.75rem', marginTop: 2 }}>{user.email}</div>
                      </div>
                      {[
                        { to: '/profile',   label: '👤  My Profile' },
                        { to: '/my-orders', label: '📦  My Orders'  },
                        { to: '/wishlist',  label: '❤️  Wishlist'   },
                        ...(user.role === 'admin' ? [{ to: '/admin', label: '⚙️  Admin Panel' }] : []),
                      ].map(item => (
                        <Link key={item.to} to={item.to} style={{ display: 'block', padding: '10px 16px', color: '#333', fontSize: '0.88rem', textDecoration: 'none', transition: 'background 0.2s' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          {item.label}
                        </Link>
                      ))}
                      <button onClick={logout} style={{ width: '100%', padding: '10px 16px', background: 'none', border: 'none', textAlign: 'left', color: '#e74c3c', cursor: 'pointer', fontSize: '0.88rem', borderTop: '1px solid #eee', fontFamily: 'Cairo, sans-serif' }}>
                        🚪  Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button onClick={() => setShowAuthModal(true)} style={{ background: GREEN, color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'Cairo, sans-serif', display: 'flex', alignItems: 'center', gap: 7, boxShadow: '0 2px 8px rgba(45,90,39,0.22)' }}
                onMouseEnter={e => e.currentTarget.style.background = '#3a7a31'}
                onMouseLeave={e => e.currentTarget.style.background = GREEN}>
                <IcoUser /> <span className="nav-login-text">Login</span>
              </button>
            )}

            {/* Mobile burger — shown only on narrow screens via CSS */}
            <button onClick={() => setMobile(o => !o)} className="mobile-menu-btn"
              style={{ background: 'rgba(45,90,39,0.08)', border: '1px solid rgba(45,90,39,0.15)', borderRadius: 8, padding: '8px', cursor: 'pointer', color: GREEN, display: 'none', alignItems: 'center', justifyContent: 'center' }}>
              {mobileOpen ? <IcoClose /> : <IcoMenu />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile overlay backdrop */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setMobile(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 498, top: 68 }} />
        )}
      </AnimatePresence>

      {/* Mobile drawer — slides in from right */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0, x: '100%' }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: '100%' }} transition={{ type: 'tween', duration: 0.28 }}
            style={{ position: 'fixed', top: 68, right: 0, bottom: 0, width: '80%', maxWidth: 300, background: BG, zIndex: 499, display: 'flex', flexDirection: 'column', overflowY: 'auto', boxShadow: '-4px 0 24px rgba(0,0,0,0.15)', borderLeft: '1px solid rgba(45,90,39,0.10)' }}>

            {/* Mobile search */}
            <div style={{ padding: '16px 14px', borderBottom: '1px solid rgba(45,90,39,0.10)' }}>
              <form onSubmit={handleSearch} style={{ display: 'flex' }}>
                <div style={{ display: 'flex', alignItems: 'center', background: 'white', borderRadius: 8, border: '1.5px solid rgba(45,90,39,0.2)', overflow: 'hidden', width: '100%' }}>
                  <input type="text" value={q} onChange={e => setQ(e.target.value)} placeholder="Search products..."
                    style={{ flex: 1, background: 'transparent', border: 'none', padding: '10px 12px', color: '#333', fontSize: '0.9rem', outline: 'none', fontFamily: 'Cairo, sans-serif' }} />
                  <button type="submit" style={{ background: GREEN, border: 'none', padding: '0 14px', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', height: 40 }}>
                    <IcoSearch />
                  </button>
                </div>
              </form>
            </div>

            {/* Nav links */}
            <nav style={{ flex: 1, padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {navLinks.map(l => (
                <Link key={l.to} to={l.to}
                  style={{ color: act(l.to) ? GREEN : '#555', padding: '13px 16px', borderRadius: 8, background: act(l.to) ? 'rgba(45,90,39,0.09)' : 'transparent', fontWeight: act(l.to) ? 700 : 500, display: 'block', textDecoration: 'none', fontSize: '1rem', borderLeft: `3px solid ${act(l.to) ? GREEN : 'transparent'}` }}>
                  {l.label}
                </Link>
              ))}
            </nav>

            {/* Mobile wishlist & profile links */}
            <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(45,90,39,0.08)', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <Link to="/wishlist" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderRadius: 8, color: '#555', fontSize: '0.9rem', textDecoration: 'none' }}>
                ❤️ Wishlist {wishlistCount > 0 && <span style={{ background: '#e74c3c', color: 'white', borderRadius: 20, padding: '0 7px', fontSize: '0.72rem', fontWeight: 700 }}>{wishlistCount}</span>}
              </Link>
              {user ? (
                <>
                  <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderRadius: 8, color: '#555', fontSize: '0.9rem', textDecoration: 'none' }}>👤 My Profile</Link>
                  <Link to="/my-orders" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderRadius: 8, color: '#555', fontSize: '0.9rem', textDecoration: 'none' }}>📦 My Orders</Link>
                  {user.role === 'admin' && <Link to="/admin" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderRadius: 8, color: GREEN, fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none' }}>⚙️ Admin Panel</Link>}
                  <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderRadius: 8, color: '#e74c3c', fontSize: '0.9rem', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'Cairo, sans-serif', width: '100%' }}>🚪 Logout</button>
                </>
              ) : (
                <button onClick={() => { setShowAuthModal(true); setMobile(false); }}
                  style={{ width: '100%', background: GREEN, color: 'white', border: 'none', borderRadius: 8, padding: '12px', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', marginTop: 4 }}>
                  🔐 Sign In / Register
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 980px) {
          .nav-links-desktop { display: none !important; }
          .mobile-menu-btn   { display: flex !important; }
        }
        @media (max-width: 640px) {
          .nav-search-form { display: none !important; }
        }
        @media (max-width: 480px) {
          .nav-wishlist-btn { display: none !important; }
          .nav-user-name    { display: none !important; }
          .nav-login-text   { display: none !important; }
          .nav-brand-text   { display: none !important; }
        }
      `}</style>
    </>
  );
};

export default Navbar;