import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer style={{ background: '#1a2e18', color: 'rgba(255,255,255,0.8)', paddingTop: 60 }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 40, paddingBottom: 48 }}>
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <img src={logo} alt="Arab Fertilizer" style={{ height: 52, width: 52, objectFit: 'contain' }} />
              <div>
                <div style={{ color: '#C8A951', fontFamily: 'Playfair Display', fontSize: '1.1rem', fontWeight: 700 }}>Arab Fertilizer</div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem', letterSpacing: '0.5px' }}>Fertilizers & Agro Chemicals</div>
              </div>
            </div>
            <p style={{ fontSize: '0.88rem', lineHeight: 1.7, color: 'rgba(255,255,255,0.6)', marginBottom: 20 }}>
              Empowering Pakistan's farmers with premium quality agricultural inputs since 2009.
            </p>
          </div>

          {/* Categories */}
          <div>
            <h4 style={{ color: '#C8A951', fontFamily: 'Playfair Display', marginBottom: 20, fontSize: '1rem' }}>Categories</h4>
            {[
              { to: '/insecticides', label: 'Insecticides' },
              { to: '/weedicides', label: 'Weedicides' },
              { to: '/fungicides', label: 'Fungicides' },
              { to: '/pgr', label: 'Plant Growth Regulators' },
              { to: '/granules', label: 'Granules & Fertilizers' }
            ].map(link => (
              <Link key={link.to} to={link.to} style={{ display: 'block', color: 'rgba(255,255,255,0.65)', fontSize: '0.88rem', marginBottom: 10, transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#C8A951'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.65)'}>
                → {link.label}
              </Link>
            ))}
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ color: '#C8A951', fontFamily: 'Playfair Display', marginBottom: 20, fontSize: '1rem' }}>Quick Links</h4>
            {[
              { to: '/about', label: 'About Us' },
              { to: '/contact', label: 'Contact Us' },
              { to: '/my-orders', label: 'Track Order' },
              { to: '/wishlist', label: 'Wishlist' },
              { to: '/cart', label: 'Cart' }
            ].map(link => (
              <Link key={link.to} to={link.to} style={{ display: 'block', color: 'rgba(255,255,255,0.65)', fontSize: '0.88rem', marginBottom: 10, transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#C8A951'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.65)'}>
                → {link.label}
              </Link>
            ))}
          </div>

          {/* Contact */}
          <div>
            <h4 style={{ color: '#C8A951', fontFamily: 'Playfair Display', marginBottom: 20, fontSize: '1rem' }}>Contact Us</h4>
            {[
              { icon: '📍', text: '89/6R M.Pur Road, Sahiwal, Punjab, Pakistan' },
              { icon: '📞', text: '+92-308-8881186, +92-308-8881165' },
              { icon: '📧', text: 'arabagro89@gamil.com' },
              { icon: '⏰', text: 'Mon–Sat: 9AM – 5PM' }
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.9rem', flexShrink: 0, marginTop: 1 }}>{item.icon}</span>
                <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.1)', padding: '20px 0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 12
        }}>
          <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)', margin: 0 }}>
            © {year} Arab Fertilizers & Agro Chemicals| Developed by Ayesha & Abeera. All rights reserved.
          </p>
          <div style={{ display: 'flex', gap: 20 }}>
            {['Privacy Policy', 'Terms of Service', 'Refund Policy'].map(item => (
              <span key={item} style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#C8A951'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}>
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
