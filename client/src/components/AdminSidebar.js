import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';
import AdminNotifications from './AdminNotifications';
import { 
  IconChart, IconPackage, IconReceipt, IconTrendingUp, IconHandshake, 
  IconUsers, IconCreditCard, IconStore, IconFuel, IconUser, 
  IconTag, IconStar, IconBanknote, IconClipboard, IconKey,
  IconHome, IconLogOut
} from './SvgIcons';

const ICON_SIZE = 18;

const links = [
  { to: '/admin',                label: 'Dashboard',      icon: <IconChart size={ICON_SIZE} />, exact: true, roles: ['admin', 'employee'] },
  { to: '/admin/analytics',       label: 'Analytics',      icon: <IconTrendingUp size={ICON_SIZE} />, roles: ['admin'] },
  { to: '/admin/products',       label: 'Products',       icon: <IconPackage size={ICON_SIZE} />, roles: ['admin'] },
  { to: '/admin/orders',         label: 'Orders',         icon: <IconReceipt size={ICON_SIZE} />, roles: ['admin', 'employee'] },
  { to: '/admin/stock',          label: 'Stock',          icon: <IconTrendingUp size={ICON_SIZE} />, roles: ['admin'] },
  { to: '/admin/vendors',        label: 'Vendors',        icon: <IconHandshake size={ICON_SIZE} />, roles: ['admin'] },
  { to: '/admin/employees',      label: 'Employees',      icon: <IconUsers size={ICON_SIZE} />, roles: ['admin'] },
  { to: '/admin/salary',         label: 'Salaries',       icon: <IconCreditCard size={ICON_SIZE} />, roles: ['admin', 'employee'] },
  { to: '/admin/dealers',        label: 'Dealers',        icon: <IconStore size={ICON_SIZE} />, roles: ['admin', 'employee'] },
  { to: '/admin/fuel',           label: 'Fuel',           icon: <IconFuel size={ICON_SIZE} />, roles: ['admin', 'employee'] },
  { to: '/admin/users',          label: 'Users',          icon: <IconUser size={ICON_SIZE} />, roles: ['admin'] },
  { to: '/admin/coupons',        label: 'Coupons',        icon: <IconTag size={ICON_SIZE} />, roles: ['admin'] },
  { to: '/admin/reviews',        label: 'Reviews',        icon: <IconStar size={ICON_SIZE} />, roles: ['admin'] },
  { to: '/admin/ledger',         label: 'Ledger',         icon: <IconBanknote size={ICON_SIZE} />, roles: ['admin', 'employee'] },
  { to: '/admin/expenses',       label: 'Expenses',       icon: <IconClipboard size={ICON_SIZE} />, roles: ['admin', 'employee'] },
  { to: '/admin/reset-password', label: 'Reset Password', icon: <IconKey size={ICON_SIZE} />, roles: ['admin', 'employee'] },
];

const AdminSidebar = ({ isOpen, onClose }) => {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();

  const filteredLinks = links.filter(link => !link.roles || link.roles.includes(user?.role));

  return (
    <aside
      className={`admin-sidebar${isOpen ? ' sidebar-open' : ''}`}
      style={{
        width: 240, background: '#1a2e18', height: '100vh',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, zIndex: 200,
        boxShadow: '4px 0 20px rgba(0,0,0,0.2)',
      }}
    >
      {/* Logo */}
      <div style={{ padding: '20px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src={logo} alt="Logo" style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 8, background: 'rgba(255,255,255,0.08)', padding: 4 }} />
          <div>
            <div style={{ color: '#C8A951', fontFamily: 'Playfair Display', fontWeight: 700, fontSize: '0.88rem' }}>Arab Fertilizer</div>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.6rem', letterSpacing: '0.5px' }}>Admin Panel</div>
          </div>
        </div>
        {/* Close X for mobile */}
        <button onClick={onClose} className="sidebar-close-btn"
          style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: 'rgba(255,255,255,0.6)', borderRadius: 6, width: 28, height: 28, cursor: 'pointer', fontSize: '0.9rem', display: 'none', alignItems: 'center', justifyContent: 'center' }}>
          ✕
        </button>
      </div>

      {/* Admin badge */}
      <div style={{ padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {user?.avatar ? (
            <img src={user.avatar} alt="Avatar" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#C8A951', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1a1a1a', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600, fontSize: '0.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name || 'User'}</div>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.66rem', textTransform: 'capitalize' }}>{user?.role || 'Guest'}</div>
          </div>
        </div>
        {user?.role === 'admin' && <AdminNotifications />}
      </div>

      {/* Nav links */}
      <nav style={{ flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
        {filteredLinks.map(link => {
          const active = link.exact ? pathname === link.to : pathname.startsWith(link.to);
          return (
            <Link key={link.to} to={link.to} onClick={onClose} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8,
              background: active ? 'rgba(200,169,81,0.15)' : 'transparent',
              borderLeft: `3px solid ${active ? '#C8A951' : 'transparent'}`,
              color: active ? '#C8A951' : 'rgba(255,255,255,0.62)',
              fontWeight: active ? 700 : 400, fontSize: '0.86rem', transition: 'all 0.2s', textDecoration: 'none',
            }}
            onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.9)'; }}}
            onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.62)'; }}}>
              <span style={{ fontSize: '0.9rem', width: 20, textAlign: 'center' }}>{link.icon}</span>
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '10px 8px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Link to="/" target="_blank" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem', textDecoration: 'none', transition: 'color 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.color = 'white'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}>
          <IconHome size={16} /> View Website
        </Link>
        <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, color: '#e74c3c', fontSize: '0.82rem', background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', fontFamily: 'Cairo, sans-serif', transition: 'background 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(231,76,60,0.12)'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
          <IconLogOut size={16} /> Logout
        </button>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .sidebar-close-btn { display: flex !important; }
        }
      `}</style>
    </aside>
  );
};

export default AdminSidebar;
