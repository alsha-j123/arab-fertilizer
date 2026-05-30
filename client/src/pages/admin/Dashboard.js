import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import apiClient from '../../utils/apiClient';
import { useAuth } from '../../context/AuthContext';


/* ── localStorage helpers ── */
const ORDERS_KEY   = 'af_orders';
const PRODUCTS_KEY = 'af_products';

const getProducts = () => { try { const s = localStorage.getItem(PRODUCTS_KEY); return s ? JSON.parse(s) : []; } catch { return []; } };
const getOrders   = () => { try { const s = localStorage.getItem(ORDERS_KEY);   return s ? JSON.parse(s) : defaultOrders(); } catch { return defaultOrders(); } };
const saveOrders  = d => localStorage.setItem(ORDERS_KEY,   JSON.stringify(d));

function defaultOrders() {
  return [];
}

const SC = { pending:'#f39c12', processing:'#3498db', shipped:'#1abc9c', delivered:'#27ae60', cancelled:'#e74c3c' };
const STATUSES = ['pending','processing','shipped','delivered','cancelled'];

const KpiCard = ({ icon, title, value, sub, color }) => (
  <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
    style={{ background:'white', borderRadius:14, padding:'18px 20px', boxShadow:'0 2px 16px rgba(0,0,0,0.07)', borderLeft:`4px solid ${color}` }}>
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:'0.72rem', color:'#888', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>{title}</div>
        <div style={{ fontSize:'clamp(1.3rem,3vw,1.8rem)', fontWeight:800, color:'#1a1a1a', fontFamily:'Playfair Display' }}>{value}</div>
        {sub && <div style={{ fontSize:'0.72rem', color:'#888', marginTop:4 }}>{sub}</div>}
      </div>
      <div style={{ width:44, height:44, borderRadius:12, background:`${color}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.3rem', flexShrink:0, marginLeft:10 }}>{icon}</div>
    </div>
  </motion.div>
);

const Toast = ({ msg }) => msg ? (
  <div style={{ position:'fixed', top:24, right:24, background:'#2D5A27', color:'white', padding:'12px 22px', borderRadius:10, zIndex:9999, fontWeight:600, fontSize:'0.9rem', boxShadow:'0 6px 24px rgba(0,0,0,0.2)', animation:'fadeIn .3s' }}>
    ✅ {msg}
  </div>
) : null;



const Dashboard = () => {
  const [orders, setOrders]       = useState([]);
  const [products, setProducts]   = useState([]);
  const [toast, setToast]         = useState('');
  const [addModal, setAddModal]   = useState(false);
  const [newOrder, setNewOrder]   = useState({ customer:'', email:'', amount:'', method:'COD', status:'pending' });

  const fetchOrders = async () => {
    try {
      const res = await apiClient.get('/orders');
      const o = res.data.orders || [];
      setOrders(o);
      localStorage.setItem(ORDERS_KEY, JSON.stringify(o));
    } catch {
      setOrders(getOrders());
    }
  };

  useEffect(() => {
    /* Fetch orders and products on mount */
    fetchOrders();

    apiClient.get('/products').then(res => {
      const p = res.data.products || [];
      if (p.length > 0) { setProducts(p); localStorage.setItem(PRODUCTS_KEY, JSON.stringify(p)); }
      else setProducts(getProducts());
    }).catch(() => setProducts(getProducts()));

    /* Auto-refresh orders every 60 seconds */
    const interval = setInterval(fetchOrders, 60000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const flash = msg => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const updateStatus = async (id, status) => {
    /* Optimistic update using both field names so revenue recalcs immediately */
    setOrders(prev => prev.map(o =>
      o._id === id ? { ...o, status, deliveryStatus: status } : o
    ));
    try {
      await apiClient.put(`/orders/${id}/status`, { deliveryStatus: status });
      /* Re-fetch to ensure server state is in sync */
      await fetchOrders();
    } catch {
      /* Revert optimistic update on failure */
      await fetchOrders();
    }
    flash(`Order ${id} → "${status}"`);
  };

  const deleteOrder = async id => {
    if (!window.confirm('Delete this order?')) return;
    try {
      await apiClient.delete(`/orders/${id}`);
      flash('Order deleted');
    } catch {
      flash('Delete failed');
    }
    /* Always re-fetch to keep state in sync */
    await fetchOrders();
  };

  const addOrder = () => {
    if (!newOrder.customer || !newOrder.amount) { alert('Customer name and amount required'); return; }
    const o = { ...newOrder, _id: 'ORD' + Date.now(), amount: Number(newOrder.amount), date: new Date().toISOString().split('T')[0] };
    const updated = [o, ...orders];
    setOrders(updated); saveOrders(updated);
    setAddModal(false);
    setNewOrder({ customer:'', email:'', amount:'', method:'COD', status:'pending' });
    flash(`Order added for ${o.customer}`);
  };

  /* API returns deliveryStatus + totalAmount; local mock uses status + amount */
  const revenue = orders
    .filter(o => (o.deliveryStatus || o.status) === 'delivered')
    .reduce((s, o) => s + (o.totalAmount || o.amount || 0), 0);
  const lowStock = products.filter(p=>(p.stock||0)<10).length;

  const kpis = [
    { icon:'🧾', title:'Total Orders',   value:orders.length,                                                              sub:`${orders.filter(o=>(o.deliveryStatus||o.status)==='pending').length} pending`,  color:'#2D5A27' },
    { icon:'💰', title:'Revenue',        value:`PKR ${(revenue/1000).toFixed(0)}K`,                                        sub:'Delivered orders',                                                           color:'#C8A951' },
    { icon:'📦', title:'Products',       value:products.length,                                                            sub:`${lowStock} low stock`,                                                       color:'#5D4037' },
    { icon:'⚠️', title:'Low Stock',      value:lowStock,                                                                   sub:'Below 10 units',                                                              color:'#e74c3c' },
    { icon:'🚚', title:'Shipped',        value:orders.filter(o=>(o.deliveryStatus||o.status)==='shipped').length,          sub:'In transit',                                                                  color:'#1abc9c' },
    { icon:'✅', title:'Delivered',      value:orders.filter(o=>(o.deliveryStatus||o.status)==='delivered').length,        sub:'Completed',                                                                   color:'#27ae60' },
  ];

  const inp = { border:'1.5px solid #e0e0e0', borderRadius:8, fontSize:'0.88rem', outline:'none', fontFamily:'Cairo, sans-serif', padding:'9px 12px', width:'100%', boxSizing:'border-box' };

  const { user } = useAuth();

  return (
    <div className="dash-container">
      <Toast msg={toast} />

      {/* Header */}
      <div className="dash-header">
        <div>
          <h1 style={{ fontFamily:'Playfair Display', fontSize:'clamp(1.4rem,4vw,1.9rem)', color:'#1a1a1a', marginBottom:4 }}>
            {user?.role === 'employee' ? 'Employee Dashboard' : 'Admin Dashboard'}
          </h1>
          <p style={{ color:'#888', fontSize:'0.88rem' }}>{new Date().toLocaleDateString('en-PK',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</p>
        </div>
        {user?.role === 'admin' && (
          <button onClick={()=>setAddModal(true)} style={{ background:'#2D5A27', color:'white', border:'none', borderRadius:10, padding:'11px 22px', fontWeight:700, cursor:'pointer', fontSize:'0.9rem', fontFamily:'Cairo, sans-serif', whiteSpace:'nowrap' }}>
            + New Order
          </button>
        )}
      </div>

      {/* KPI Grid */}
      <div className="dash-kpi-grid">
        {kpis
          .filter(k => {
            if (user?.role === 'employee') {
              return ['Total Orders', 'Revenue', 'Shipped', 'Delivered'].includes(k.title);
            }
            return true;
          })
          .map(k => <KpiCard key={k.title} {...k} />)
        }
      </div>

      {/* Revenue Chart */}
      <div style={{ background:'white', borderRadius:14, padding:'20px', boxShadow:'0 2px 16px rgba(0,0,0,0.07)', marginBottom:28 }}>
        <h2 style={{ fontFamily:'Playfair Display', fontSize:'1.1rem', marginBottom:20, color:'#1a1a1a' }}>Weekly Revenue Overview</h2>
        <div style={{ display:'flex', gap:8, alignItems:'flex-end', height:120, overflowX:'auto' }}>
          {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((day,i) => {
            const h = [60,85,45,110,70,125,50][i];
            return (
              <div key={day} style={{ flex:'1 0 32px', display:'flex', flexDirection:'column', alignItems:'center', gap:6, minWidth:32 }}>
                <span style={{ fontSize:'0.62rem', color:'#888', whiteSpace:'nowrap' }}>PKR {(h*1000).toLocaleString()}</span>
                <div style={{ width:'100%', background:'linear-gradient(180deg,#2D5A27,#4a8a42)', borderRadius:'6px 6px 0 0', height:h }} />
                <span style={{ fontSize:'0.68rem', color:'#888' }}>{day}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Orders Table — full CRUD */}
      <div style={{ background:'white', borderRadius:14, padding:'20px', boxShadow:'0 2px 16px rgba(0,0,0,0.07)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, flexWrap:'wrap', gap:8 }}>
          <h2 style={{ fontFamily:'Playfair Display', fontSize:'1.1rem', color:'#1a1a1a', margin:0 }}>Orders</h2>
          <span style={{ background:'#e8f5e3', color:'#2D5A27', borderRadius:20, padding:'4px 14px', fontSize:'0.78rem', fontWeight:700 }}>{orders.length} total</span>
        </div>
        <div style={{ overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', minWidth:640 }}>
            <thead>
              <tr style={{ background:'#2D5A27' }}>
                {['Order ID','Customer','Amount','Method','Status','Date'].map(h=>(
                  <th key={h} style={{ padding:'12px 14px', textAlign:'left', color:'white', fontSize:'0.78rem', fontWeight:600, whiteSpace:'nowrap' }}>{h}</th>
                ))}
                {user?.role === 'admin' && <th style={{ padding:'12px 14px', textAlign:'left', color:'white', fontSize:'0.78rem', fontWeight:600, whiteSpace:'nowrap' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order._id} style={{ borderBottom:'1px solid #f0f0f0' }}
                  onMouseEnter={e=>e.currentTarget.style.background='#fafafa'}
                  onMouseLeave={e=>e.currentTarget.style.background='white'}>
                  <td style={{ padding:'12px 14px', fontFamily:'monospace', fontSize:'0.74rem', color:'#555', whiteSpace:'nowrap' }}>#{String(order._id).slice(-8).toUpperCase()}</td>
                  <td style={{ padding:'12px 14px' }}>
                    <div style={{ fontWeight:600, fontSize:'0.85rem' }}>{order.customer || order.user?.name}</div>
                    <div style={{ fontSize:'0.72rem', color:'#888' }}>{order.email || order.user?.email}</div>
                  </td>
                  <td style={{ padding:'12px 14px', fontWeight:700, color:'#2D5A27', fontSize:'0.88rem', whiteSpace:'nowrap' }}>PKR {Number(order.amount||order.totalAmount||0).toLocaleString()}</td>
                  <td style={{ padding:'12px 14px' }}>
                    <span style={{ background:'#f0f4ff', color:'#3949ab', borderRadius:20, padding:'3px 10px', fontSize:'0.7rem', fontWeight:700, whiteSpace:'nowrap' }}>{order.method||order.paymentMethod}</span>
                  </td>
                  <td style={{ padding:'12px 14px' }}>
                    <span style={{ background:`${SC[order.status||order.deliveryStatus]}20`, color:SC[order.status||order.deliveryStatus], borderRadius:20, padding:'3px 10px', fontSize:'0.7rem', fontWeight:700, textTransform:'capitalize', whiteSpace:'nowrap' }}>
                      {order.status||order.deliveryStatus}
                    </span>
                  </td>
                  <td style={{ padding:'12px 14px', fontSize:'0.76rem', color:'#888', whiteSpace:'nowrap' }}>{order.date || (order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-PK') : '—')}</td>
                  {user?.role === 'admin' && (
                    <td style={{ padding:'12px 14px' }}>
                      <div style={{ display:'flex', gap:6, flexWrap:'nowrap' }}>
                        <select value={order.status||order.deliveryStatus} onChange={e=>updateStatus(order._id, e.target.value)}
                          style={{ padding:'5px 6px', border:'1px solid #e0e0e0', borderRadius:6, fontSize:'0.74rem', background:'white', cursor:'pointer', fontFamily:'Cairo, sans-serif', outline:'none' }}>
                          {STATUSES.map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                        </select>
                        <button onClick={()=>deleteOrder(order._id)} style={{ background:'#fde8e8', color:'#e74c3c', border:'none', borderRadius:6, padding:'5px 10px', cursor:'pointer', fontWeight:700, fontSize:'0.74rem', whiteSpace:'nowrap' }}>Del</button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Order Modal */}
      {addModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
          onClick={e=>e.target===e.currentTarget&&setAddModal(false)}>
          <motion.div initial={{ scale:0.9, opacity:0 }} animate={{ scale:1, opacity:1 }}
            style={{ background:'white', borderRadius:16, padding:'24px 24px', width:'100%', maxWidth:460, maxHeight:'92vh', overflowY:'auto' }}>
            <h2 style={{ fontFamily:'Playfair Display', fontSize:'1.35rem', marginBottom:22 }}>Add New Order</h2>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {[['customer','Customer Name *','text'],['email','Email','email'],['amount','Amount (PKR) *','number']].map(([k,l,t])=>(
                <div key={k}>
                  <label style={{ display:'block', marginBottom:5, fontWeight:700, fontSize:'0.82rem', color:'#444' }}>{l}</label>
                  <input type={t} value={newOrder[k]} onChange={e=>setNewOrder(n=>({...n,[k]:e.target.value}))} style={inp}
                    onFocus={e=>e.target.style.borderColor='#2D5A27'} onBlur={e=>e.target.style.borderColor='#e0e0e0'} />
                </div>
              ))}
              <div>
                <label style={{ display:'block', marginBottom:5, fontWeight:700, fontSize:'0.82rem', color:'#444' }}>Payment Method</label>
                <select value={newOrder.method} onChange={e=>setNewOrder(n=>({...n,method:e.target.value}))} style={{ ...inp }}>
                  {['COD','Bank Transfer'].map(m=><option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display:'block', marginBottom:5, fontWeight:700, fontSize:'0.82rem', color:'#444' }}>Status</label>
                <select value={newOrder.status} onChange={e=>setNewOrder(n=>({...n,status:e.target.value}))} style={{ ...inp }}>
                  {STATUSES.map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display:'flex', gap:12, marginTop:22 }}>
              <button onClick={addOrder} style={{ flex:1, background:'#2D5A27', color:'white', border:'none', borderRadius:10, padding:13, fontWeight:700, cursor:'pointer', fontFamily:'Cairo, sans-serif' }}>Add Order</button>
              <button onClick={()=>setAddModal(false)} style={{ flex:1, background:'#f5f5f5', color:'#555', border:'none', borderRadius:10, padding:13, fontWeight:700, cursor:'pointer', fontFamily:'Cairo, sans-serif' }}>Cancel</button>
            </div>
          </motion.div>
        </div>
      )}

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}

        .dash-container {
          padding: 28px 28px;
          max-width: 1200px;
          font-family: 'Cairo', sans-serif;
          box-sizing: border-box;
          width: 100%;
        }
        .dash-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 28px;
          flex-wrap: wrap;
          gap: 14px;
        }
        .dash-kpi-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 28px;
        }

        @media (max-width: 900px) {
          .dash-container { padding: 20px 16px; }
          .dash-kpi-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
        }
        @media (max-width: 540px) {
          .dash-container { padding: 16px 12px; }
          .dash-kpi-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
          .dash-header { gap: 10px; }
        }
        @media (max-width: 380px) {
          .dash-kpi-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};
export default Dashboard;
