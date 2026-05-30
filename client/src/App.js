import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';

// Context Providers
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
// Bug fix #8: ProductsProvider was defined but never imported or used — all consumers got null context
import { ProductsProvider } from './context/ProductsContext';

// Layout Components (kept eager — always needed)
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import AuthModal from './components/AuthModal';
import WhatsAppButton from './components/WhatsAppButton';

// Global CSS
import './styles/global.css';

// ─── Lazy-loaded Pages ───────────────────────────────────────
const Home          = lazy(() => import('./pages/Home'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Cart          = lazy(() => import('./pages/Cart'));
const Wishlist      = lazy(() => import('./pages/Wishlist'));
const Checkout      = lazy(() => import('./pages/Checkout'));
const OrderSuccess  = lazy(() => import('./pages/OrderSuccess'));
const SearchResults = lazy(() => import('./pages/SearchResults'));
const MyOrders      = lazy(() => import('./pages/MyOrders'));
const AboutUs       = lazy(() => import('./pages/AboutUs'));
const Profile       = lazy(() => import('./pages/Profile'));
const ContactUs     = lazy(() => import('./pages/ContactUs'));

// Lazy-loaded Admin Pages
const AdminLayout     = lazy(() => import('./pages/admin/AdminLayout'));
const Dashboard       = lazy(() => import('./pages/admin/Dashboard'));
const ProductManager  = lazy(() => import('./pages/admin/ProductManager'));
const EmployeeManager = lazy(() => import('./pages/admin/EmployeeManager'));
const SalaryManager   = lazy(() => import('./pages/admin/SalaryManager'));
const DealerManager   = lazy(() => import('./pages/admin/DealerManager'));
const FuelManager     = lazy(() => import('./pages/admin/FuelManager'));
const UserManager     = lazy(() => import('./pages/admin/UserManager'));
const CouponManager   = lazy(() => import('./pages/admin/CouponManager'));
const ExpenseManager  = lazy(() => import('./pages/admin/ExpenseManager'));
const ReviewManager   = lazy(() => import('./pages/admin/ReviewManager'));
const ResetPassword   = lazy(() => import('./pages/admin/ResetPassword'));
const Analytics       = lazy(() => import('./pages/admin/Analytics'));



// Spinner shown while chunks load
const PageSpinner = () => (
  <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ width: 44, height: 44, border: '4px solid #e8f5e3', borderTopColor: '#2D5A27', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
};

// Inner app that can use auth context
const AppInner = () => {
  return (
    <>
      <AuthModal />
      <CartDrawer />
      <WhatsAppButton />

      <Suspense fallback={<PageSpinner />}>
        <Routes>
          {/* Admin routes — separate layout, no navbar/footer */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="products" element={<ProductManager />} />
            <Route path="orders" element={<Suspense fallback={<PageSpinner />}><AdminOrderManager /></Suspense>} />
            <Route path="vendors" element={<Suspense fallback={<PageSpinner />}><AdminVendorModule /></Suspense>} />
            <Route path="stock" element={<Suspense fallback={<PageSpinner />}><AdminStockInventory /></Suspense>} />
            <Route path="ledger" element={<Suspense fallback={<PageSpinner />}><AdminLedger /></Suspense>} />
            <Route path="employees" element={<EmployeeManager />} />
            <Route path="salary" element={<SalaryManager />} />
            <Route path="dealers" element={<DealerManager />} />
            <Route path="fuel" element={<FuelManager />} />
            <Route path="users" element={<UserManager />} />
            <Route path="coupons" element={<CouponManager />} />
            <Route path="expenses" element={<ExpenseManager />} />
            <Route path="reviews" element={<ReviewManager />} />
            <Route path="reset-password" element={<ResetPassword />} />
          </Route>

          {/* Main website routes — with navbar/footer */}
          <Route path="/*" element={
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
              <Navbar />
              <main style={{ flex: 1 }}>
                <Suspense fallback={<PageSpinner />}>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/insecticides" element={<LazyCategory which="Insecticides" />} />
                    <Route path="/weedicides" element={<LazyCategory which="Weedicides" />} />
                    <Route path="/fungicides" element={<LazyCategory which="Fungicides" />} />
                    <Route path="/pgr" element={<LazyCategory which="PGR" />} />
                    <Route path="/granules" element={<LazyCategory which="Granules" />} />
                    <Route path="/product/:id" element={<ProductDetail />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/wishlist" element={<Wishlist />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/order-success" element={<OrderSuccess />} />
                    <Route path="/search" element={<SearchResults />} />
                    <Route path="/my-orders" element={<MyOrders />} />
                    <Route path="/about" element={<AboutUs />} />
                    <Route path="/contact" element={<ContactUs />} />
                    <Route path="/profile" element={<Profile />} />
                    {/* 404 fallback */}
                    <Route path="*" element={
                      <div style={{ paddingTop: 120, textAlign: 'center', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div>
                          <div style={{ fontSize: 72, marginBottom: 20 }}>🌿</div>
                          <h1 style={{ fontFamily: 'Playfair Display', color: '#2D5A27', marginBottom: 12 }}>Page Not Found</h1>
                          <p style={{ color: '#666', marginBottom: 24 }}>The page you're looking for doesn't exist.</p>
                          <a href="/" style={{ background: '#2D5A27', color: 'white', padding: '13px 28px', borderRadius: 10, fontWeight: 700, textDecoration: 'none' }}>Go Home</a>
                        </div>
                      </div>
                    } />
                  </Routes>
                </Suspense>
              </main>
              <Footer />
            </div>
          } />
        </Routes>
      </Suspense>
    </>
  );
};

/* ── Wrapper for named-export category pages ── */
const LazyCategory = ({ which }) => {
  const [Comp, setComp] = React.useState(null);
  React.useEffect(() => {
    import('./pages/Categories').then(mod => {
      setComp(() => mod[which]);
    });
  }, [which]);
  if (!Comp) return <PageSpinner />;
  return <Comp />;
};

/* ── Wrappers for named-export admin pages ── */
const AdminOrderManager = () => {
  const [Comp, setComp] = React.useState(null);
  React.useEffect(() => {
    import('./pages/admin/AdminPages').then(mod => setComp(() => mod.OrderManager));
  }, []);
  if (!Comp) return <PageSpinner />;
  return <Comp />;
};
const AdminVendorModule = () => {
  const [Comp, setComp] = React.useState(null);
  React.useEffect(() => {
    import('./pages/admin/AdminPages').then(mod => setComp(() => mod.VendorModule));
  }, []);
  if (!Comp) return <PageSpinner />;
  return <Comp />;
};
const AdminStockInventory = () => {
  const [Comp, setComp] = React.useState(null);
  React.useEffect(() => {
    import('./pages/admin/AdminPages').then(mod => setComp(() => mod.StockInventory));
  }, []);
  if (!Comp) return <PageSpinner />;
  return <Comp />;
};
const AdminLedger = () => {
  const [Comp, setComp] = React.useState(null);
  React.useEffect(() => {
    import('./pages/admin/AdminPages').then(mod => setComp(() => mod.Ledger));
  }, []);
  if (!Comp) return <PageSpinner />;
  return <Comp />;
};

const App = () => (
  <BrowserRouter>
    <ScrollToTop />
    <AuthProvider>
      <ProductsProvider>
        <CartProvider>
          <WishlistProvider>
            <AppInner />
          </WishlistProvider>
        </CartProvider>
      </ProductsProvider>
    </AuthProvider>
  </BrowserRouter>
);

export default App;