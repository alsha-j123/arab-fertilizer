import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminSidebar from '../../components/AdminSidebar';

const AdminLayout = () => {
  const { user, loading, canAccessAdmin, setShowAuthModal } = useAuth();
  const [sidebarOpen, setSidebar] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !canAccessAdmin) {
      if (!user) {
        setShowAuthModal(true);
        navigate('/');
      } else {
        navigate('/');
      }
    }

    // Role-based route protection for employees
    if (!loading && user?.role === 'employee') {
      const restrictedPaths = ['/admin/products', '/admin/stock', '/admin/vendors', '/admin/employees', '/admin/users', '/admin/coupons', '/admin/reviews', '/admin/analytics'];
      const currentPath = window.location.pathname;
      if (restrictedPaths.some(path => currentPath.startsWith(path))) {
        navigate('/admin');
      }
    }

    // Block non-employees (e.g. customers who somehow have a link) from the Employee Panel
    if (!loading && user && user.role !== 'employee' && user.role !== 'admin') {
      const employeeOnlyPaths = ['/admin/employee-panel', '/admin/my-sales', '/admin/my-targets'];
      const currentPath = window.location.pathname;
      if (employeeOnlyPaths.some(path => currentPath.startsWith(path))) {
        console.warn(`[AccessGuard] User ${user.email} (role: ${user.role}) attempted to access employee-only route. Redirecting.`);
        navigate('/admin');
      }
    }
  }, [user, loading, canAccessAdmin, navigate, setShowAuthModal]);

  /* Close sidebar when clicking outside on mobile */
  useEffect(() => {
    const fn = e => {
      if (window.innerWidth <= 900 && sidebarOpen) {
        if (!e.target.closest('.admin-sidebar') && !e.target.closest('.admin-mobile-toggle')) {
          setSidebar(false);
        }
      }
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [sidebarOpen]);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#1a2e18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 44, height: 44, border: '4px solid rgba(200,169,81,0.3)', borderTopColor: '#C8A951', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!canAccessAdmin) return null; // Will redirect via useEffect

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f5f5' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div onClick={() => setSidebar(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 199, display: 'none' }}
          className="admin-mobile-overlay" />
      )}

      <AdminSidebar onLogout={() => {}} isOpen={sidebarOpen} onClose={() => setSidebar(false)} />

      <main className="admin-layout-main">
        {/* Mobile top bar */}
        <div className="admin-mobile-topbar" style={{
          display: 'none',
          position: 'sticky', top: 0, zIndex: 100,
          background: '#1a2e18', padding: '12px 16px',
          alignItems: 'center', gap: 14,
          boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
        }}>
          <button className="admin-mobile-toggle" onClick={() => setSidebar(o => !o)}
            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, padding: '8px 10px', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontFamily: 'Cairo, sans-serif' }}>
            ☰ Menu
          </button>
          <span style={{ color: '#C8A951', fontFamily: 'Playfair Display', fontWeight: 700, fontSize: '1rem' }}>Arab Fertilizer Admin</span>
        </div>
        <Outlet />
      </main>

      <style>{`
        @media (max-width: 900px) {
          .admin-layout-main  { margin-left: 0 !important; }
          .admin-mobile-topbar { display: flex !important; }
          .admin-mobile-overlay { display: block !important; }
          .admin-sidebar {
            position: fixed !important;
            top: 0 !important; left: 0 !important; bottom: 0 !important;
            z-index: 200 !important;
            transform: translateX(-100%);
            transition: transform 0.28s ease;
          }
          .admin-sidebar.sidebar-open { transform: translateX(0) !important; }
        }
      `}</style>
    </div>
  );
};

export default AdminLayout;