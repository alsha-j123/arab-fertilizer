import React, { useState, useEffect } from 'react';
import apiClient from '../../utils/apiClient';
import { useAuth } from '../../context/AuthContext';


const Toast = ({ msg }) => msg ? (
  <div style={{ position:'fixed', top:24, right:24, background:'#2D5A27', color:'white', padding:'12px 22px', borderRadius:10, zIndex:9999, fontWeight:600, fontSize:'0.9rem', boxShadow:'0 6px 24px rgba(0,0,0,0.2)' }}>✅ {msg}</div>
) : null;

/* ══════════════════════════════════════════════
   ORDER MANAGER
══════════════════════════════════════════════ */
export const OrderManager = () => {
  const { user } = useAuth();
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('all');
  const [toast, setToast]     = useState('');
  const [page, setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [expandedOrder, setExpandedOrder] = useState(null); // ID of expanded order
  const [orderDetails, setOrderDetails]   = useState({}); // Cache for lazy-loaded items

  const fetchOrders = async (p = 1, f = 'all') => {
    setLoading(true);
    try {
      const statusParam = (f !== 'all' && f !== 'bank') ? `&status=${f}` : '';
      const paymentParam = f === 'bank' ? '&paymentMethod=bank' : '';
      const { data } = await apiClient.get(`/orders?page=${p}&limit=20${statusParam}${paymentParam}`);
      if (data.success) {
        setOrders(data.orders);
        setTotalPages(data.pages);
        setTotalOrders(data.total);
        setPage(data.currentPage);
      }
    } catch { flash('Failed to fetch orders'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchOrders(1, filter);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const flash = msg => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const updateStatus = async (id, updates) => {
    try {
      await apiClient.put(`/orders/${id}/status`, updates);
      setOrders(prev => prev.map(o => o._id === id ? { ...o, ...updates } : o));
      const msg = Object.keys(updates).map(k => `${k}: ${updates[k]}`).join(', ');
      flash(`Order updated: ${msg}`);
    } catch { flash('Update failed'); }
  };

  const deleteOrder = async id => {
    if (!window.confirm('Delete this order?')) return;
    try {
      await apiClient.delete(`/orders/${id}`);
      setOrders(prev => prev.filter(o => o._id !== id));
      setTotalOrders(prev => prev - 1);
      flash('Order deleted');
    } catch { flash('Delete failed'); }
  };

  const fetchOrderDetails = async (id) => {
    if (orderDetails[id]) return; // Already loaded
    try {
      const { data } = await apiClient.get(`/orders/${id}`);
      if (data.success) {
        setOrderDetails(prev => ({ ...prev, [id]: data.order }));
      }
    } catch { flash('Failed to load order details'); }
  };

  const toggleExpand = (id) => {
    if (expandedOrder === id) setExpandedOrder(null);
    else {
      setExpandedOrder(id);
      fetchOrderDetails(id);
    }
  };

  const SC = React.useMemo(() => ({ pending:'#f39c12', processing:'#3498db', shipped:'#1abc9c', delivered:'#27ae60', cancelled:'#e74c3c' }), []);
  const STATUSES = React.useMemo(() => ['pending','processing','shipped','delivered','cancelled'], []);

  return (
    <div style={{ padding:'clamp(16px, 3vw, 32px)', maxWidth:1200, fontFamily:'Cairo, sans-serif' }}>
      <Toast msg={toast} />
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:24 }}>
        <div>
          <h1 style={{ fontFamily:'Playfair Display', fontSize:'1.9rem', marginBottom:4 }}>
            {user?.role === 'employee' ? 'My Orders' : 'Order Manager'}
          </h1>
          <p style={{ color:'#888', margin:0, fontSize:'0.88rem' }}>{totalOrders} total orders • Page {page} of {totalPages}</p>
        </div>
        
        {/* Pagination Header */}
        <div style={{ display:'flex', gap:6 }}>
          <button disabled={page <= 1} onClick={() => fetchOrders(page - 1, filter)}
            style={{ padding:'6px 12px', borderRadius:6, border:'1px solid #e0e0e0', background:'white', cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.5 : 1 }}>←</button>
          <button disabled={page >= totalPages} onClick={() => fetchOrders(page + 1, filter)}
            style={{ padding:'6px 12px', borderRadius:6, border:'1px solid #e0e0e0', background:'white', cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.5 : 1 }}>→</button>
        </div>
      </div>

      {/* Filter buttons */}
      <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
        {['all', ...STATUSES, 'bank'].map(s => (
          <button key={s} onClick={() => { setFilter(s); setPage(1); }} style={{
            padding:'8px 16px', borderRadius:8, border:'1.5px solid',
            borderColor: filter===s ? (s==='bank' ? '#3498db' : '#2D5A27') : '#e0e0e0',
            background: filter===s ? (s==='bank' ? '#3498db' : '#2D5A27') : 'white',
            color: filter===s ? 'white' : '#666',
            cursor:'pointer', fontSize:'0.82rem', fontWeight:600, textTransform:'capitalize', fontFamily:'Cairo, sans-serif'
          }}>{s === 'bank' ? '🏦 Bank Transfers' : s}</button>
        ))}
      </div>

      <div style={{ background:'white', borderRadius:14, boxShadow:'0 2px 16px rgba(0,0,0,0.07)', overflow:'hidden' }}>
        {loading ? (
          <div style={{ padding:60, textAlign:'center', color:'#888' }}>
            <div style={{ width:40, height:40, border:'4px solid #e8f5e3', borderTopColor:'#2D5A27', borderRadius:'50%', animation:'spin .8s linear infinite', margin:'0 auto 12px' }} />
            Loading orders...
          </div>
        ) : orders.length === 0 ? (
          <div style={{ padding:60, textAlign:'center' }}>
            <div style={{ fontSize:40, marginBottom:12 }}>🧾</div>
            <p style={{ color:'#888' }}>No orders found.</p>
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'#2D5A27' }}>
                  {['Order ID','Customer','Items','Amount','Payment','Status','Date'].map(h => (
                    <th key={h} style={{ padding:'13px 14px', textAlign:'left', color:'white', fontSize:'0.8rem', fontWeight:600, whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                  {user?.role === 'admin' && <th style={{ padding:'13px 14px', textAlign:'left', color:'white', fontSize:'0.8rem', fontWeight:600, whiteSpace:'nowrap' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {orders.map(order => {
                  const isExpanded = expandedOrder === order._id;
                  const details = orderDetails[order._id];

                  return (
                    <React.Fragment key={order._id}>
                      <tr style={{ borderBottom: '1px solid #f0f0f0', cursor:'pointer' }}
                        onClick={() => toggleExpand(order._id)}
                        onMouseEnter={e=>e.currentTarget.style.background='#fafafa'}
                        onMouseLeave={e=>e.currentTarget.style.background='white'}>
                        <td style={{ padding:'12px 14px', fontFamily:'monospace', fontSize:'0.76rem', color:'#555' }}>
                          <span style={{ marginRight:8, color:'#ccc' }}>{isExpanded ? '▼' : '▶'}</span>
                          #{String(order._id).slice(-8).toUpperCase()}
                        </td>
                        <td style={{ padding:'12px 14px' }}>
                          <div style={{ fontWeight:600, fontSize:'0.88rem' }}>{order.user?.name || 'Guest'}</div>
                          <div style={{ fontSize:'0.74rem', color:'#888' }}>{order.user?.email}</div>
                        </td>
                        <td style={{ padding:'12px 14px', fontSize:'0.8rem', color:'#444' }}>
                          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                            {order.items?.map((item, i) => (
                              <div key={i} style={{ whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:180 }}>
                                {item.quantity}x {item.name}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td style={{ padding:'12px 14px', fontWeight:700, color:'#2D5A27', fontSize:'0.9rem' }}>PKR {Number(order.totalAmount||0).toLocaleString()}</td>
                        <td style={{ padding:'12px 14px' }}>
                          <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                            <span style={{ background:'#f0f4ff', color:'#3949ab', borderRadius:20, padding:'3px 10px', fontSize:'0.72rem', fontWeight:700, textTransform:'uppercase', textAlign:'center' }}>
                              {order.paymentMethod === 'bank' ? '🏦 Bank' : '💵 COD'}
                            </span>
                            {order.paymentMethod === 'bank' && order.paymentStatus === 'pending' && (
                              <span style={{ background:'#fff3cd', color:'#856404', borderRadius:20, padding:'2px 8px', fontSize:'0.62rem', fontWeight:800, textAlign:'center', border:'1px solid #ffc107' }}>
                                ⚠️ Needs Verify
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding:'12px 14px' }}>
                          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                              <span style={{ background:`${SC[order.deliveryStatus]}20`, color:SC[order.deliveryStatus], borderRadius:20, padding:'2px 8px', fontSize:'0.62rem', fontWeight:800, textTransform:'capitalize', flex:1, textAlign:'center' }}>
                                {order.deliveryStatus}
                              </span>
                            </div>
                            <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                              <span style={{ background: order.paymentStatus==='paid'?'#d1e7dd':(order.paymentStatus==='rejected'?'#fde8e8':'#fff3cd'), color: order.paymentStatus==='paid'?'#0f5132':(order.paymentStatus==='rejected'?'#c0392b':'#856404'), borderRadius:20, padding:'2px 8px', fontSize:'0.62rem', fontWeight:800, textTransform:'capitalize', flex:1, textAlign:'center' }}>
                                {order.paymentStatus}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding:'12px 14px', fontSize:'0.78rem', color:'#888' }}>
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-PK') : '—'}
                        </td>
                        {user?.role === 'admin' && (
                          <td style={{ padding:'12px 14px' }} onClick={e => e.stopPropagation()}>
                            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                              <select value={order.deliveryStatus} onChange={e=>updateStatus(order._id, { deliveryStatus: e.target.value })}
                                style={{ padding:'4px 6px', border:'1px solid #e0e0e0', borderRadius:6, fontSize:'0.74rem', background:'white', cursor:'pointer', fontFamily:'Cairo, sans-serif' }}>
                                {STATUSES.map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                              </select>
                              <select value={order.paymentStatus} onChange={e=>updateStatus(order._id, { paymentStatus: e.target.value })}
                                style={{ padding:'4px 6px', border:'1px solid #e0e0e0', borderRadius:6, fontSize:'0.74rem', background:'white', cursor:'pointer', fontFamily:'Cairo, sans-serif' }}>
                                {['pending', 'paid', 'failed', 'rejected'].map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                              </select>
                              <button onClick={()=>deleteOrder(order._id)} style={{ background:'#fde8e8', color:'#e74c3c', border:'none', borderRadius:6, padding:'5px', cursor:'pointer', fontWeight:700, fontSize:'0.7rem' }}>Delete</button>
                            </div>
                          </td>
                        )}
                      </tr>
                      
                      {/* Expanded Details — uses list data directly (lazy-loaded details used as enhancement) */}
                      {isExpanded && (
                        <tr style={{ background:'#f9fcf8' }}>
                          <td colSpan={7} style={{ padding:'20px 30px', borderBottom:'2px solid #e8f5e3' }}>
                            {(() => {
                              const d = details || order; // Use lazy-loaded detail or fall back to list-level order data
                              return (
                              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:40 }}>
                                <div>
                                  <h4 style={{ margin:'0 0 12px', fontSize:'0.9rem', color:'#2D5A27' }}>📦 Order Items</h4>
                                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                                    {d.items?.map((item, i) => (
                                      <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:'0.85rem', borderBottom:'1px dashed #eee', paddingBottom:6 }}>
                                        <span>{item.name} <strong>x{item.quantity}</strong></span>
                                        <span style={{ fontWeight:700 }}>PKR {Number(item.price * item.quantity).toLocaleString()}</span>
                                      </div>
                                    ))}
                                    {/* Pricing Breakdown */}
                                    <div style={{ borderTop:'1px solid #ddd', paddingTop:10, display:'flex', flexDirection:'column', gap:6 }}>
                                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.85rem', color:'#555' }}>
                                        <span>Subtotal</span>
                                        <span style={{ fontWeight:600 }}>PKR {Number(d.subtotal !== undefined ? d.subtotal : d.totalAmount).toLocaleString()}</span>
                                      </div>
                                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.85rem', color:'#555' }}>
                                        <span>Shipping</span>
                                        <span style={{ fontWeight:600, color: (d.shippingCost === 0 || d.shippingCost === undefined) ? '#27ae60' : '#333' }}>
                                          {(d.shippingCost === 0 || d.shippingCost === undefined) ? 'FREE' : `PKR ${Number(d.shippingCost).toLocaleString()}`}
                                        </span>
                                      </div>
                                      {d.discountAmount > 0 && (
                                        <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.85rem', color:'#e74c3c' }}>
                                          <span>Discount {d.couponCode ? `(${d.couponCode})` : ''}</span>
                                          <span style={{ fontWeight:600 }}>-PKR {Number(d.discountAmount).toLocaleString()}</span>
                                        </div>
                                      )}
                                      <div style={{ display:'flex', justifyContent:'space-between', fontWeight:800, color:'#1a1a1a', paddingTop:8, borderTop:'2px solid #2D5A27' }}>
                                        <span>TOTAL AMOUNT</span>
                                        <span style={{ color:'#2D5A27' }}>PKR {Number(d.totalAmount).toLocaleString()}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <h4 style={{ margin:'0 0 12px', fontSize:'0.9rem', color:'#2D5A27' }}>📍 Shipping Address</h4>
                                  <div style={{ fontSize:'0.85rem', color:'#555', lineHeight:1.6 }}>
                                    <div><strong>{d.shippingAddress?.name}</strong></div>
                                    <div>{d.shippingAddress?.phone}</div>
                                    <div>{d.shippingAddress?.street}</div>
                                    <div>{d.shippingAddress?.city}, {d.shippingAddress?.province}</div>
                                    {d.orderNotes && <div style={{ marginTop:10, padding:8, background:'#fff', borderRadius:6, border:'1px solid #eee' }}>📝 <em>{d.orderNotes}</em></div>}
                                  </div>
                                  {d.paymentMethod === 'bank' && (
                                    <div style={{ marginTop:15, padding:14, background:'#fffbea', borderRadius:10, border:'2px solid #ffc107' }}>
                                      <h5 style={{ margin:'0 0 10px', fontSize:'0.82rem', color:'#856404', display:'flex', alignItems:'center', gap:6 }}>🏦 Bank Transfer Details — <span style={{ color: d.paymentStatus === 'paid' ? '#27ae60' : '#e67e22', fontWeight:800 }}>{d.paymentStatus === 'paid' ? '✅ Verified' : '⚠️ Awaiting Verification'}</span></h5>
                                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                                        <div style={{ background:'white', borderRadius:6, padding:'8px 10px', border:'1px solid #ffe082' }}>
                                          <div style={{ fontSize:'0.68rem', color:'#999', textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:3 }}>Customer's Bank</div>
                                          <div style={{ fontWeight:700, fontSize:'0.85rem', color:'#333' }}>{d.paymentDetails?.bankName || '—'}</div>
                                        </div>
                                        <div style={{ background:'white', borderRadius:6, padding:'8px 10px', border:'1px solid #ffe082' }}>
                                          <div style={{ fontSize:'0.68rem', color:'#999', textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:3 }}>Account Name</div>
                                          <div style={{ fontWeight:700, fontSize:'0.85rem', color:'#333' }}>{d.paymentDetails?.accountName || '—'}</div>
                                        </div>
                                        <div style={{ background:'white', borderRadius:6, padding:'8px 10px', border:'1px solid #ffe082', gridColumn:'span 2' }}>
                                          <div style={{ fontSize:'0.68rem', color:'#999', textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:3 }}>Transaction ID / Reference</div>
                                          <div style={{ fontWeight:800, fontSize:'0.9rem', color:'#3949ab', fontFamily:'monospace', letterSpacing:'0.5px' }}>{d.paymentDetails?.transactionId || '—'}</div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                              );
                            })()}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:10, marginTop:24 }}>
          <button disabled={page <= 1} onClick={() => fetchOrders(page - 1, filter)}
            style={{ padding:'8px 16px', borderRadius:8, border:'1.5px solid #e0e0e0', background:'white', cursor: page <= 1 ? 'not-allowed' : 'pointer', fontWeight:600 }}>Previous</button>
          <div style={{ display:'flex', gap:6 }}>
            {[...Array(totalPages)].map((_, i) => (
              <button key={i} onClick={() => fetchOrders(i + 1, filter)}
                style={{
                  width:36, height:36, borderRadius:8, border:'1.5px solid',
                  borderColor: (i+1) === page ? '#2D5A27' : '#e0e0e0',
                  background: (i+1) === page ? '#2D5A27' : 'white',
                  color: (i+1) === page ? 'white' : '#666',
                  cursor:'pointer', fontWeight:700
                }}>{i + 1}</button>
            ))}
          </div>
          <button disabled={page >= totalPages} onClick={() => fetchOrders(page + 1, filter)}
            style={{ padding:'8px 16px', borderRadius:8, border:'1.5px solid #e0e0e0', background:'white', cursor: page >= totalPages ? 'not-allowed' : 'pointer', fontWeight:600 }}>Next</button>
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
};


/* ══════════════════════════════════════════════
   STOCK INVENTORY — fully live from MongoDB
══════════════════════════════════════════════ */
export const StockInventory = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [toast, setToast]       = useState('');
  const [editingStock, setEditingStock] = useState(null); // { id, value }
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    apiClient.get('/products')
      .then(res => {
        setProducts(res.data.products || []);
        setTotalCount(res.data.total || (res.data.products || []).length);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const flash = msg => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const categories = ['all','insecticides','weedicides','fungicides','pgr','granules'];

  const filtered = React.useMemo(() => products.filter(p => {
    const name = p.name || '';
    return name.toLowerCase().includes(search.toLowerCase()) &&
           (catFilter === 'all' || p.category === catFilter);
  }), [products, search, catFilter]);

  const { lowStock, outStock, wellStock } = React.useMemo(() => {
    let low = 0, out = 0, well = 0;
    for (const p of products) {
      if (p.stock === 0) out++;
      else if (p.stock < 10) low++;
      if (p.stock >= 30) well++;
    }
    return { lowStock: low, outStock: out, wellStock: well };
  }, [products]);

  const saveStock = async (id, newStock) => {
    const val = Number(newStock);
    if (isNaN(val) || val < 0) return;
    try {
      await apiClient.put(`/products/${id}`, { stock: val });
      setProducts(prev => prev.map(p => p._id === id ? { ...p, stock: val } : p));
      setEditingStock(null);
      flash('Stock updated');
    } catch { flash('Failed to update stock'); }
  };

  const adjStock = async (id, delta) => {
    const product = products.find(p => p._id === id);
    if (!product) return;
    const newStock = Math.max(0, (product.stock || 0) + delta);
    await saveStock(id, newStock);
  };

  const statusColor = stock => stock === 0 ? '#e74c3c' : stock < 10 ? '#f39c12' : stock < 30 ? '#3498db' : '#27ae60';
  const statusLabel = stock => stock === 0 ? 'Out of Stock' : stock < 10 ? 'Low Stock' : stock < 30 ? 'Medium' : 'Well Stocked';

  return (
    <div style={{ padding:'clamp(16px, 3vw, 32px)', maxWidth:1200, fontFamily:'Cairo, sans-serif' }}>
      <Toast msg={toast} />
      <h1 style={{ fontFamily:'Playfair Display', fontSize:'1.9rem', marginBottom:8 }}>Stock Inventory</h1>
      <p style={{ color:'#888', marginBottom:24, fontSize:'0.88rem' }}>Live stock levels from MongoDB — edit directly</p>

      {/* Summary Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:16, marginBottom:28 }}>
        {[
          { label:'Total Products', value:totalCount, color:'#2D5A27', icon:'📦' },
          { label:'Out of Stock',   value:outStock,   color:'#e74c3c', icon:'❌' },
          { label:'Low Stock',      value:lowStock,   color:'#f39c12', icon:'⚠️' },
          { label:'Well Stocked',   value:wellStock,  color:'#27ae60', icon:'✅' },
        ].map(card => (
          <div key={card.label} style={{ background:'white', borderRadius:12, padding:'20px 22px', boxShadow:'0 2px 12px rgba(0,0,0,0.07)', borderLeft:`4px solid ${card.color}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontSize:'0.76rem', color:'#888', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:4 }}>{card.label}</div>
              <div style={{ fontSize:'1.9rem', fontWeight:800, color:card.color, fontFamily:'Playfair Display' }}>{card.value}</div>
            </div>
            <span style={{ fontSize:'1.8rem' }}>{card.icon}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ background:'white', borderRadius:12, padding:'14px 20px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', marginBottom:20, display:'flex', gap:14, flexWrap:'wrap', alignItems:'center' }}>
        <input type="text" placeholder="🔍 Search products..." value={search} onChange={e=>setSearch(e.target.value)}
          style={{ flex:1, minWidth:200, padding:'9px 14px', border:'1.5px solid #e0e0e0', borderRadius:8, fontSize:'0.88rem', outline:'none', fontFamily:'Cairo, sans-serif' }}
          onFocus={e=>e.target.style.borderColor='#2D5A27'} onBlur={e=>e.target.style.borderColor='#e0e0e0'} />
        <select value={catFilter} onChange={e=>setCatFilter(e.target.value)}
          style={{ padding:'9px 14px', border:'1.5px solid #e0e0e0', borderRadius:8, fontSize:'0.88rem', outline:'none', fontFamily:'Cairo, sans-serif', background:'white' }}>
          {categories.map(c=><option key={c} value={c}>{c === 'all' ? 'All Categories' : c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
        </select>
        <span style={{ color:'#888', fontSize:'0.85rem', whiteSpace:'nowrap' }}>{filtered.length} products</span>
      </div>

      {/* Inventory Table */}
      <div style={{ background:'white', borderRadius:14, boxShadow:'0 2px 16px rgba(0,0,0,0.07)', overflow:'hidden' }}>
        {loading ? (
          <div style={{ padding:60, textAlign:'center', color:'#888' }}>
            <div style={{ width:40, height:40, border:'4px solid #e8f5e3', borderTopColor:'#2D5A27', borderRadius:'50%', animation:'spin .8s linear infinite', margin:'0 auto 12px' }} />
            Loading inventory...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding:60, textAlign:'center' }}>
            <div style={{ fontSize:48, marginBottom:12 }}>📦</div>
            <p style={{ color:'#888' }}>No products found. Add products from the Product Manager.</p>
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'#2D5A27' }}>
                  {['Product','Category','Stock Level','Qty','Status'].map(h=>(
                    <th key={h} style={{ padding:'13px 16px', textAlign:'left', color:'white', fontSize:'0.82rem', fontWeight:600, whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                  {user?.role === 'admin' && <th style={{ padding:'13px 16px', textAlign:'left', color:'white', fontSize:'0.82rem', fontWeight:600, whiteSpace:'nowrap' }}>Quick Adjust</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const color = statusColor(p.stock||0);
                  const maxStock = 200;
                  const pct = Math.min(((p.stock||0)/maxStock)*100, 100);
                  const isEditing = editingStock?.id === p._id;

                  return (
                    <tr key={p._id} style={{ borderBottom:'1px solid #f0f0f0' }}
                      onMouseEnter={e=>e.currentTarget.style.background='#fafafa'}
                      onMouseLeave={e=>e.currentTarget.style.background='white'}>
                      <td style={{ padding:'14px 16px' }}>
                        <div style={{ fontWeight:600, fontSize:'0.88rem', color:'#1a1a1a', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</div>
                        <div style={{ fontSize:'0.74rem', color:'#aaa', marginTop:2 }}>{p.weight || '—'}</div>
                      </td>
                      <td style={{ padding:'14px 16px' }}>
                        <span style={{ background:'#e8f5e3', color:'#2D5A27', borderRadius:12, padding:'3px 10px', fontSize:'0.72rem', fontWeight:700, textTransform:'capitalize' }}>{p.category}</span>
                      </td>
                      <td style={{ padding:'14px 16px', minWidth:160 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <div style={{ flex:1, height:8, background:'#f0f0f0', borderRadius:4, overflow:'hidden' }}>
                            <div style={{ width:`${pct}%`, height:'100%', background:color, borderRadius:4, transition:'width .5s' }} />
                          </div>
                          <span style={{ fontSize:'0.78rem', color:'#888', minWidth:32 }}>{pct.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td style={{ padding:'14px 16px' }}>
                        {isEditing ? (
                          <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                            <input type="number" value={editingStock.value} min="0"
                              onChange={e=>setEditingStock(s=>({...s,value:e.target.value}))}
                              onKeyDown={e=>{ if(e.key==='Enter') saveStock(p._id, editingStock.value); if(e.key==='Escape') setEditingStock(null); }}
                              style={{ width:70, padding:'5px 8px', border:'1.5px solid #2D5A27', borderRadius:6, fontSize:'0.88rem', outline:'none', fontFamily:'Cairo, sans-serif' }}
                              autoFocus />
                            <button onClick={()=>saveStock(p._id, editingStock.value)} style={{ background:'#2D5A27', color:'white', border:'none', borderRadius:6, padding:'5px 10px', cursor:'pointer', fontSize:'0.76rem', fontWeight:700 }}>✓</button>
                            <button onClick={()=>setEditingStock(null)} style={{ background:'#f5f5f5', color:'#555', border:'none', borderRadius:6, padding:'5px 8px', cursor:'pointer', fontSize:'0.76rem' }}>✕</button>
                          </div>
                        ) : (
                          <span onClick={()=> { if(user?.role==='admin') setEditingStock({id:p._id, value:String(p.stock||0)}) }}
                            style={{ fontWeight:800, fontSize:'1rem', color, cursor: user?.role === 'admin' ? 'pointer' : 'default', borderBottom: user?.role === 'admin' ? `2px dashed ${color}` : 'none', paddingBottom: 1 }}
                            title={user?.role === 'admin' ? "Click to edit" : ""}>
                            {p.stock||0}
                          </span>
                        )}
                      </td>
                      <td style={{ padding:'14px 16px' }}>
                        <span style={{ background:`${color}18`, color, borderRadius:20, padding:'4px 12px', fontSize:'0.74rem', fontWeight:700, whiteSpace:'nowrap' }}>
                          {statusLabel(p.stock||0)}
                        </span>
                      </td>
                      {user?.role === 'admin' && (
                        <td style={{ padding:'14px 16px' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                            <button onClick={()=>adjStock(p._id,-10)} title="−10"
                              style={{ background:'#fde8e8', color:'#e74c3c', border:'none', borderRadius:6, padding:'5px 10px', cursor:'pointer', fontWeight:700, fontSize:'0.78rem' }}>−10</button>
                            <button onClick={()=>adjStock(p._id,-1)}
                              style={{ width:28, height:28, border:'1px solid #ddd', borderRadius:6, background:'white', cursor:'pointer', fontWeight:700, fontSize:'1rem', display:'flex', alignItems:'center', justifyContent:'center' }}>−</button>
                            <button onClick={()=>adjStock(p._id,+1)}
                              style={{ width:28, height:28, border:'1px solid #ddd', borderRadius:6, background:'white', cursor:'pointer', fontWeight:700, fontSize:'1rem', display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
                            <button onClick={()=>adjStock(p._id,+10)} title="+10"
                              style={{ background:'#e8f5e3', color:'#2D5A27', border:'none', borderRadius:6, padding:'5px 10px', cursor:'pointer', fontWeight:700, fontSize:'0.78rem' }}>+10</button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
};

/* ══════════════════════════════════════════════
   VENDOR MODULE — full CRUD with MongoDB
══════════════════════════════════════════════ */
const EMPTY_VENDOR = { name:'', category:'', contact:{ phone:'', email:'', address:'' }, totalPurchases:'', outstandingBalance:'', notes:'' };

export const VendorModule = () => {
  const { user } = useAuth();
  const [vendors, setVendors]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(false);
  const [editing, setEditing]   = useState(null);
  const [form, setForm]         = useState(EMPTY_VENDOR);
  const [toast, setToast]       = useState('');
  const [delId, setDelId]       = useState(null);
  const [search, setSearch]     = useState('');

  useEffect(() => {
    apiClient.get('/vendors')
      .then(res => setVendors(res.data.vendors || []))
      .catch(() => setVendors([]))
      .finally(() => setLoading(false));
  }, []);

  const flash = msg => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const filtered = React.useMemo(() => vendors.filter(v => {
    const name = v.name || '';
    return name.toLowerCase().includes(search.toLowerCase()) ||
           (v.contact?.email||'').toLowerCase().includes(search.toLowerCase()) ||
           (v.contact?.address||'').toLowerCase().includes(search.toLowerCase());
  }), [vendors, search]);

  const openAdd  = () => { setEditing(null); setForm(EMPTY_VENDOR); setModal(true); };
  const openEdit = v  => {
    setEditing(v);
    setForm({ name:v.name||'', category:v.category||'', contact:{ phone:v.contact?.phone||'', email:v.contact?.email||'', address:v.contact?.address||'' }, totalPurchases:v.totalPurchases?String(v.totalPurchases):'', outstandingBalance:v.outstandingBalance?String(v.outstandingBalance):'', notes:v.notes||'' });
    setModal(true);
  };

  const setC = (k,v) => setForm(f=>({...f,contact:{...f.contact,[k]:v}}));
  const setF = (k,v) => setForm(f=>({...f,[k]:v}));

  const save = async () => {
    if (!form.name.trim()) { alert('Vendor name is required'); return; }
    const payload = { ...form, totalPurchases:form.totalPurchases?Number(form.totalPurchases):0, outstandingBalance:form.outstandingBalance?Number(form.outstandingBalance):0 };
    try {
      if (editing) {
        const { data } = await apiClient.put(`/vendors/${editing._id}`, payload);
        setVendors(prev => prev.map(v => v._id===editing._id ? data.vendor : v));
        flash(`"${form.name}" updated`);
      } else {
        const { data } = await apiClient.post('/vendors', payload);
        setVendors(prev => [data.vendor, ...prev]);
        flash(`"${form.name}" added`);
      }
      setModal(false);
    } catch (err) { flash(err.response?.data?.message || 'Failed to save vendor'); }
  };

  const del = async id => {
    try {
      await apiClient.delete(`/vendors/${id}`);
      setVendors(prev => prev.filter(v => v._id!==id));
      setDelId(null); flash('Vendor deleted');
    } catch { flash('Failed to delete'); }
  };

  const inp = { border:'1.5px solid #e0e0e0', borderRadius:8, fontSize:'0.88rem', outline:'none', fontFamily:'Cairo, sans-serif', padding:'10px 12px', width:'100%', boxSizing:'border-box', transition:'border-color .2s' };
  const onF = e => e.target.style.borderColor='#2D5A27';
  const onB = e => e.target.style.borderColor='#e0e0e0';

  return (
    <div style={{ padding:'clamp(16px, 3vw, 32px)', maxWidth:1100, fontFamily:'Cairo, sans-serif' }}>
      <Toast msg={toast} />
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:28, flexWrap:'wrap', gap:16 }}>
        <div>
          <h1 style={{ fontFamily:'Playfair Display', fontSize:'1.9rem', marginBottom:4 }}>
            {user?.role === 'employee' ? 'Suppliers' : 'Vendor Module'}
          </h1>
          <p style={{ color:'#888', fontSize:'0.88rem' }}>{vendors.length} active suppliers</p>
        </div>
        {user?.role === 'admin' && (
          <button onClick={openAdd} style={{ background:'#2D5A27', color:'white', border:'none', borderRadius:10, padding:'12px 24px', fontWeight:700, cursor:'pointer', fontSize:'0.9rem', fontFamily:'Cairo, sans-serif' }}
            onMouseEnter={e=>e.currentTarget.style.background='#3a7a31'} onMouseLeave={e=>e.currentTarget.style.background='#2D5A27'}>
            + Add Vendor
          </button>
        )}
      </div>

      <div style={{ background:'white', borderRadius:12, padding:'14px 20px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', marginBottom:20 }}>
        <input type="text" placeholder="🔍 Search vendors..." value={search} onChange={e=>setSearch(e.target.value)}
          style={{ ...inp }} onFocus={onF} onBlur={onB} />
      </div>

      {loading ? (
        <div style={{ padding:60, textAlign:'center', color:'#888' }}>
          <div style={{ width:40, height:40, border:'4px solid #e8f5e3', borderTopColor:'#2D5A27', borderRadius:'50%', animation:'spin .8s linear infinite', margin:'0 auto 12px' }} />Loading vendors...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background:'white', borderRadius:14, padding:60, textAlign:'center', boxShadow:'0 2px 16px rgba(0,0,0,0.07)' }}>
          <div style={{ fontSize:48, marginBottom:16 }}>🤝</div>
          <h3 style={{ fontFamily:'Playfair Display', marginBottom:8 }}>No Vendors Yet</h3>
          <p style={{ color:'#888', marginBottom:20 }}>{user?.role === 'admin' ? 'Add your first supplier to get started.' : 'No vendors are registered yet.'}</p>
          {user?.role === 'admin' && (
            <button onClick={openAdd} style={{ background:'#2D5A27', color:'white', border:'none', borderRadius:10, padding:'12px 28px', fontWeight:700, cursor:'pointer', fontFamily:'Cairo, sans-serif' }}>+ Add First Vendor</button>
          )}
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {filtered.map(v => (
            <div key={v._id} style={{ background:'white', borderRadius:14, padding:'22px 26px', boxShadow:'0 2px 16px rgba(0,0,0,0.07)', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:20 }}>
              <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                <div style={{ width:52, height:52, borderRadius:12, background:'linear-gradient(135deg,#2D5A27,#4a8a42)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:800, fontSize:'1.3rem', flexShrink:0 }}>
                  {v.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight:700, fontSize:'1rem', color:'#1a1a1a', marginBottom:3 }}>{v.name}</div>
                  {v.category && <div style={{ fontSize:'0.8rem', color:'#888', marginBottom:2 }}>📦 {v.category}</div>}
                  <div style={{ fontSize:'0.78rem', color:'#aaa' }}>
                    {v.contact?.phone && `📞 ${v.contact.phone}`}
                    {v.contact?.phone && v.contact?.address && ' · '}
                    {v.contact?.address && `📍 ${v.contact.address}`}
                  </div>
                  {v.contact?.email && <div style={{ fontSize:'0.76rem', color:'#aaa' }}>✉️ {v.contact.email}</div>}
                  {v.notes && <div style={{ fontSize:'0.76rem', color:'#aaa', fontStyle:'italic', marginTop:2 }}>📝 {v.notes}</div>}
                </div>
              </div>
              <div style={{ display:'flex', gap:24, flexWrap:'wrap', alignItems:'center' }}>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:'0.7rem', color:'#888', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:3 }}>Total Purchases</div>
                  <div style={{ fontWeight:700, color:'#2D5A27', fontSize:'0.95rem' }}>PKR {Number(v.totalPurchases||0).toLocaleString()}</div>
                </div>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:'0.7rem', color:'#888', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:3 }}>Outstanding</div>
                  <div style={{ fontWeight:700, color:Number(v.outstandingBalance)>0?'#e74c3c':'#27ae60', fontSize:'0.95rem' }}>
                    {Number(v.outstandingBalance)>0?`PKR ${Number(v.outstandingBalance).toLocaleString()}`:'✅ Settled'}
                  </div>
                </div>
                {user?.role === 'admin' && (
                  <div style={{ display:'flex', gap:8 }}>
                    <button onClick={()=>openEdit(v)} style={{ background:'#e8f5e3', color:'#2D5A27', border:'none', borderRadius:8, padding:'8px 18px', cursor:'pointer', fontWeight:700, fontSize:'0.82rem', fontFamily:'Cairo, sans-serif' }}>Edit</button>
                    <button onClick={()=>setDelId(v._id)} style={{ background:'#fde8e8', color:'#e74c3c', border:'none', borderRadius:8, padding:'8px 14px', cursor:'pointer', fontWeight:700, fontSize:'0.82rem', fontFamily:'Cairo, sans-serif' }}>Del</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {delId && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:3000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ background:'white', borderRadius:16, padding:32, maxWidth:360, width:'100%', textAlign:'center' }}>
            <div style={{ fontSize:48, marginBottom:16 }}>🗑️</div>
            <h3 style={{ fontFamily:'Playfair Display', marginBottom:10 }}>Delete Vendor?</h3>
            <p style={{ color:'#888', marginBottom:24, fontSize:'0.9rem' }}>This cannot be undone.</p>
            <div style={{ display:'flex', gap:12 }}>
              <button onClick={()=>del(delId)} style={{ flex:1, background:'#e74c3c', color:'white', border:'none', borderRadius:10, padding:12, fontWeight:700, cursor:'pointer', fontFamily:'Cairo, sans-serif' }}>Delete</button>
              <button onClick={()=>setDelId(null)} style={{ flex:1, background:'#f5f5f5', color:'#555', border:'none', borderRadius:10, padding:12, fontWeight:700, cursor:'pointer', fontFamily:'Cairo, sans-serif' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
          onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div style={{ background:'white', borderRadius:18, width:'100%', maxWidth:560, maxHeight:'92vh', overflowY:'auto' }}>
            <div style={{ padding:'24px 28px 0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <h2 style={{ fontFamily:'Playfair Display', fontSize:'1.4rem', color:'#1a1a1a', margin:0 }}>{editing?'✏️ Edit Vendor':'🤝 Add New Vendor'}</h2>
              <button onClick={()=>setModal(false)} style={{ background:'#f5f5f5', border:'none', borderRadius:8, width:36, height:36, fontSize:'1.1rem', cursor:'pointer', color:'#666' }}>✕</button>
            </div>
            <div style={{ padding:'20px 28px 28px', display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={{ display:'block', marginBottom:6, fontWeight:700, fontSize:'0.83rem', color:'#444' }}>Vendor Name *</label>
                <input type="text" value={form.name} onChange={e=>setF('name',e.target.value)} placeholder="e.g. Agro Solutions Pvt Ltd" style={inp} onFocus={onF} onBlur={onB} />
              </div>
              <div>
                <label style={{ display:'block', marginBottom:6, fontWeight:700, fontSize:'0.83rem', color:'#444' }}>Product Category</label>
                <input type="text" value={form.category} onChange={e=>setF('category',e.target.value)} placeholder="e.g. Insecticides & Fungicides" style={inp} onFocus={onF} onBlur={onB} />
              </div>
              <div style={{ background:'#f8fdf6', borderRadius:10, padding:'16px' }}>
                <div style={{ fontWeight:700, fontSize:'0.85rem', color:'#2D5A27', marginBottom:12 }}>📞 Contact Information</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div>
                    <label style={{ display:'block', marginBottom:5, fontWeight:600, fontSize:'0.8rem', color:'#555' }}>Phone</label>
                    <input type="tel" value={form.contact.phone} onChange={e=>setC('phone',e.target.value)} placeholder="0300-1234567" style={inp} onFocus={onF} onBlur={onB} />
                  </div>
                  <div>
                    <label style={{ display:'block', marginBottom:5, fontWeight:600, fontSize:'0.8rem', color:'#555' }}>Email</label>
                    <input type="email" value={form.contact.email} onChange={e=>setC('email',e.target.value)} placeholder="vendor@email.com" style={inp} onFocus={onF} onBlur={onB} />
                  </div>
                  <div style={{ gridColumn:'span 2' }}>
                    <label style={{ display:'block', marginBottom:5, fontWeight:600, fontSize:'0.8rem', color:'#555' }}>Address</label>
                    <input type="text" value={form.contact.address} onChange={e=>setC('address',e.target.value)} placeholder="City, Province" style={inp} onFocus={onF} onBlur={onB} />
                  </div>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label style={{ display:'block', marginBottom:6, fontWeight:700, fontSize:'0.83rem', color:'#444' }}>Total Purchases (PKR)</label>
                  <input type="number" value={form.totalPurchases} onChange={e=>setF('totalPurchases',e.target.value)} placeholder="0" min="0" style={inp} onFocus={onF} onBlur={onB} />
                </div>
                <div>
                  <label style={{ display:'block', marginBottom:6, fontWeight:700, fontSize:'0.83rem', color:'#444' }}>Outstanding Balance (PKR)</label>
                  <input type="number" value={form.outstandingBalance} onChange={e=>setF('outstandingBalance',e.target.value)} placeholder="0" min="0" style={inp} onFocus={onF} onBlur={onB} />
                </div>
              </div>
              <div>
                <label style={{ display:'block', marginBottom:6, fontWeight:700, fontSize:'0.83rem', color:'#444' }}>Notes (optional)</label>
                <textarea value={form.notes} onChange={e=>setF('notes',e.target.value)} rows={2} placeholder="Any additional notes..." style={{ ...inp, resize:'vertical' }} onFocus={onF} onBlur={onB} />
              </div>
              <div style={{ display:'flex', gap:12, marginTop:8 }}>
                <button onClick={save} style={{ flex:1, background:'#2D5A27', color:'white', border:'none', borderRadius:10, padding:13, fontWeight:700, cursor:'pointer', fontFamily:'Cairo, sans-serif', fontSize:'0.95rem' }}
                  onMouseEnter={e=>e.currentTarget.style.background='#3a7a31'} onMouseLeave={e=>e.currentTarget.style.background='#2D5A27'}>
                  {editing?'💾 Save Changes':'🤝 Add Vendor'}
                </button>
                <button onClick={()=>setModal(false)} style={{ flex:1, background:'#f5f5f5', color:'#555', border:'none', borderRadius:10, padding:13, fontWeight:700, cursor:'pointer', fontFamily:'Cairo, sans-serif' }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
};

export const Ledger = () => {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate]     = useState('');
  const { user } = useAuth();

  useEffect(() => {
    apiClient.get('/orders?limit=1000')
      .then(res => setOrders(res.data.orders || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = React.useMemo(() => orders.filter(o => {
    if (!startDate && !endDate) return true;
    const d = new Date(o.createdAt);
    if (startDate && d < new Date(startDate)) return false;
    if (endDate   && d > new Date(endDate + 'T23:59:59')) return false;
    return true;
  }), [orders, startDate, endDate]);

  const { totalRevenue, totalPending, codOrders } = React.useMemo(() => {
    let rev = 0, pend = 0, cod = 0;
    for (const o of filtered) {
      if (o.deliveryStatus === 'delivered') rev += Number(o.totalAmount || 0);
      if (o.paymentStatus === 'pending') pend += Number(o.totalAmount || 0);
      if (o.paymentMethod === 'cod') cod++;
    }
    return { totalRevenue: rev, totalPending: pend, codOrders: cod };
  }, [filtered]);

  const exportCSV = () => {
    if (user?.role !== 'admin') return;
    const rows = [
      ['Order ID','Customer','Amount','Payment','Delivery Status','Payment Status','Date'],
      ...filtered.map(o => [
        o._id, o.user?.name||'Guest', o.totalAmount,
        o.paymentMethod, o.deliveryStatus, o.paymentStatus,
        o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-PK') : ''
      ])
    ];
    const csv  = rows.map(r=>r.map(v=>`"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type:'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a'); a.href=url; a.download='ledger.csv'; a.click();
  };

  const SC = { pending:'#f39c12', processing:'#3498db', shipped:'#1abc9c', delivered:'#27ae60', cancelled:'#e74c3c' };

  return (
    <div style={{ padding:'clamp(16px, 3vw, 32px)', maxWidth:1200, fontFamily:'Cairo, sans-serif' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:28, flexWrap:'wrap', gap:16 }}>
        <div>
          <h1 style={{ fontFamily:'Playfair Display', fontSize:'1.9rem', marginBottom:4 }}>
            {user?.role === 'employee' ? 'Personal Ledger' : 'Financial Ledger'}
          </h1>
          <p style={{ color:'#888', fontSize:'0.88rem' }}>Live order-based financial records from MongoDB</p>
        </div>
        {user?.role === 'admin' && (
          <button onClick={exportCSV} style={{ background:'#5D4037', color:'white', border:'none', borderRadius:10, padding:'11px 22px', fontWeight:700, cursor:'pointer', fontSize:'0.9rem', fontFamily:'Cairo, sans-serif' }}>
            📥 Export CSV
          </button>
        )}
      </div>

      {/* Summary */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:16, marginBottom:28 }}>
        {[
          { label:'Total Revenue',   value:`PKR ${Number(totalRevenue || 0).toLocaleString()}`,  color:'#27ae60', icon:'📈' },
          { label:'Pending Payment', value:`PKR ${Number(totalPending || 0).toLocaleString()}`,  color:'#f39c12', icon:'⏳' },
          { label:'COD Orders',      value:codOrders,                               color:'#5D4037', icon:'💵' },
        ].map(card => (
          <div key={card.label} style={{ background:'white', borderRadius:12, padding:'20px 22px', boxShadow:'0 2px 12px rgba(0,0,0,0.07)', borderLeft:`4px solid ${card.color}` }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontSize:'0.76rem', color:'#888', textTransform:'uppercase', marginBottom:4 }}>{card.label}</div>
                <div style={{ fontWeight:800, fontSize:'1.3rem', color:card.color, fontFamily:'Playfair Display' }}>{card.value}</div>
              </div>
              <span style={{ fontSize:'1.6rem' }}>{card.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Date Filter */}
      <div style={{ background:'white', borderRadius:12, padding:'14px 20px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', marginBottom:18, display:'flex', gap:14, alignItems:'center', flexWrap:'wrap' }}>
        <label style={{ fontSize:'0.85rem', fontWeight:600, color:'#555' }}>From:</label>
        <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)}
          style={{ padding:'8px 12px', border:'1.5px solid #e0e0e0', borderRadius:8, fontSize:'0.85rem', outline:'none', fontFamily:'Cairo, sans-serif' }} />
        <label style={{ fontSize:'0.85rem', fontWeight:600, color:'#555' }}>To:</label>
        <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)}
          style={{ padding:'8px 12px', border:'1.5px solid #e0e0e0', borderRadius:8, fontSize:'0.85rem', outline:'none', fontFamily:'Cairo, sans-serif' }} />
        <button onClick={()=>{setStartDate('');setEndDate('');}}
          style={{ padding:'8px 16px', border:'1.5px solid #e0e0e0', borderRadius:8, background:'white', cursor:'pointer', fontSize:'0.85rem', color:'#888', fontFamily:'Cairo, sans-serif' }}>
          Clear
        </button>
        <span style={{ color:'#888', fontSize:'0.85rem' }}>{filtered.length} orders</span>
      </div>

      {/* Orders Table */}
      <div style={{ background:'white', borderRadius:14, boxShadow:'0 2px 16px rgba(0,0,0,0.07)', overflow:'hidden' }}>
        {loading ? (
          <div style={{ padding:60, textAlign:'center', color:'#888' }}>
            <div style={{ width:40, height:40, border:'4px solid #e8f5e3', borderTopColor:'#2D5A27', borderRadius:'50%', animation:'spin .8s linear infinite', margin:'0 auto 12px' }} />
            Loading ledger...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding:60, textAlign:'center' }}>
            <div style={{ fontSize:40, marginBottom:12 }}>💰</div>
            <p style={{ color:'#888' }}>No transactions found.</p>
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'#2D5A27' }}>
                  {['Order ID','Customer','Amount','Payment','Delivery','Pay Status','Date'].map(h=>(
                    <th key={h} style={{ padding:'13px 14px', textAlign:'left', color:'white', fontSize:'0.8rem', fontWeight:600, whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(o => (
                  <tr key={o._id} style={{ borderBottom:'1px solid #f0f0f0' }}
                    onMouseEnter={e=>e.currentTarget.style.background='#fafafa'}
                    onMouseLeave={e=>e.currentTarget.style.background='white'}>
                    <td style={{ padding:'12px 14px', fontFamily:'monospace', fontSize:'0.76rem', color:'#555' }}>#{String(o._id).slice(-8).toUpperCase()}</td>
                    <td style={{ padding:'12px 14px', fontSize:'0.85rem', fontWeight:600 }}>{o.user?.name||'Guest'}</td>
                    <td style={{ padding:'12px 14px', fontWeight:700, color:'#2D5A27', fontSize:'0.9rem' }}>PKR {Number(o.totalAmount||0).toLocaleString()}</td>
                    <td style={{ padding:'12px 14px' }}>
                      <span style={{ background:'#f0f4ff', color:'#3949ab', borderRadius:20, padding:'3px 10px', fontSize:'0.72rem', fontWeight:700, textTransform:'uppercase' }}>{o.paymentMethod}</span>
                    </td>
                    <td style={{ padding:'12px 14px' }}>
                      <span style={{ background:`${SC[o.deliveryStatus]}20`, color:SC[o.deliveryStatus], borderRadius:20, padding:'3px 10px', fontSize:'0.72rem', fontWeight:700, textTransform:'capitalize' }}>{o.deliveryStatus}</span>
                    </td>
                    <td style={{ padding:'12px 14px' }}>
                      <span style={{ background: o.paymentStatus==='paid'?'#d1e7dd':'#fff3cd', color: o.paymentStatus==='paid'?'#0f5132':'#856404', borderRadius:20, padding:'3px 10px', fontSize:'0.72rem', fontWeight:700, textTransform:'capitalize' }}>{o.paymentStatus}</span>
                    </td>
                    <td style={{ padding:'12px 14px', fontSize:'0.78rem', color:'#888' }}>
                      {o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-PK') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
};