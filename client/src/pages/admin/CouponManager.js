import React, { useState, useEffect } from 'react';
import apiClient from '../../utils/apiClient';

const EMPTY = { code:'', type:'percent', value:'', minOrder:'', maxUses:'100', expiresAt:'', isActive:true };

const Toast = ({ msg }) => msg ? <div style={{ position:'fixed', top:24, right:24, background:'#2D5A27', color:'white', padding:'12px 22px', borderRadius:10, zIndex:9999, fontWeight:600 }}>✅ {msg}</div> : null;

const CouponManager = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm]       = useState(EMPTY);
  const [toast, setToast]     = useState('');

  useEffect(() => {
    apiClient.get('/orders/coupons')
      .then(r => setCoupons(r.data.coupons||[]))
      .catch(()=>setCoupons([]))
      .finally(()=>setLoading(false));
  }, []);

  const flash = msg => { setToast(msg); setTimeout(()=>setToast(''), 2500); };
  const openAdd  = () => { setEditing(null); setForm(EMPTY); setModal(true); };
  const openEdit = c  => { setEditing(c); setForm({ code:c.code, type:c.type, value:String(c.value), minOrder:String(c.minOrder||''), maxUses:String(c.maxUses||'100'), expiresAt: c.expiresAt && !isNaN(new Date(c.expiresAt).getTime()) ? new Date(c.expiresAt).toISOString().split('T')[0] : '', isActive:c.isActive }); setModal(true); };

  const save = async () => {
    if (!form.code.trim() || !form.value) { alert('Code and value required'); return; }
    const payload = { ...form, code:form.code.toUpperCase(), value:Number(form.value), minOrder:Number(form.minOrder||0), maxUses:Number(form.maxUses||100) };
    try {
      if (editing) {
        const { data } = await apiClient.put(`/orders/coupons/${editing._id}`, payload);
        setCoupons(prev => prev.map(c => c._id===editing._id ? data.coupon : c));
        flash('Coupon updated');
      } else {
        const { data } = await apiClient.post('/orders/coupons', payload);
        setCoupons(prev => [data.coupon, ...prev]);
        flash('Coupon created');
      }
      setModal(false);
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  const del = async id => {
    if (!window.confirm('Delete this coupon?')) return;
    await apiClient.delete(`/orders/coupons/${id}`);
    setCoupons(prev => prev.filter(c=>c._id!==id));
    flash('Coupon deleted');
  };

  const toggle = async (coupon) => {
    const { data } = await apiClient.put(`/orders/coupons/${coupon._id}`, { isActive: !coupon.isActive });
    setCoupons(prev => prev.map(c => c._id===coupon._id ? data.coupon : c));
  };

  const inp = { border:'1.5px solid #e0e0e0', borderRadius:8, fontSize:'0.88rem', outline:'none', fontFamily:'Cairo, sans-serif', padding:'9px 12px', width:'100%', boxSizing:'border-box' };

  return (
    <div style={{ padding:32, maxWidth:900, fontFamily:'Cairo, sans-serif' }}>
      <Toast msg={toast} />
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24, flexWrap:'wrap', gap:16 }}>
        <div>
          <h1 style={{ fontFamily:'Playfair Display', fontSize:'1.9rem', marginBottom:4 }}>🎟️ Coupon Manager</h1>
          <p style={{ color:'#888', fontSize:'0.88rem' }}>{coupons.length} coupons total</p>
        </div>
        <button onClick={openAdd} style={{ background:'#2D5A27', color:'white', border:'none', borderRadius:10, padding:'11px 22px', fontWeight:700, cursor:'pointer', fontFamily:'Cairo, sans-serif' }}>+ Create Coupon</button>
      </div>

      {loading ? <div style={{ padding:60, textAlign:'center', color:'#888' }}>Loading...</div> : coupons.length === 0 ? (
        <div style={{ background:'white', borderRadius:14, padding:60, textAlign:'center', boxShadow:'0 2px 16px rgba(0,0,0,0.07)' }}>
          <div style={{ fontSize:48, marginBottom:16 }}>🎟️</div>
          <h3 style={{ fontFamily:'Playfair Display', marginBottom:8 }}>No Coupons Yet</h3>
          <button onClick={openAdd} style={{ background:'#2D5A27', color:'white', border:'none', borderRadius:10, padding:'11px 24px', fontWeight:700, cursor:'pointer', fontFamily:'Cairo, sans-serif' }}>Create First Coupon</button>
        </div>
      ) : (
        <div style={{ background:'white', borderRadius:14, boxShadow:'0 2px 16px rgba(0,0,0,0.07)', overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'#2D5A27' }}>
                {['Code','Discount','Min Order','Uses','Expires','Status','Actions'].map(h=>(
                  <th key={h} style={{ padding:'12px 14px', textAlign:'left', color:'white', fontSize:'0.8rem', fontWeight:600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {coupons.map(c => (
                <tr key={c._id} style={{ borderBottom:'1px solid #f0f0f0' }}
                  onMouseEnter={e=>e.currentTarget.style.background='#fafafa'}
                  onMouseLeave={e=>e.currentTarget.style.background='white'}>
                  <td style={{ padding:'12px 14px', fontFamily:'monospace', fontWeight:700, fontSize:'0.9rem', color:'#2D5A27', letterSpacing:'1px' }}>{c.code}</td>
                  <td style={{ padding:'12px 14px', fontWeight:700, color:'#e74c3c' }}>
                    {c.type==='percent' ? `${c.value}% OFF` : `PKR ${c.value} OFF`}
                  </td>
                  <td style={{ padding:'12px 14px', fontSize:'0.85rem', color:'#666' }}>{Number(c.minOrder||0)>0?`PKR ${Number(c.minOrder).toLocaleString()}`:'None'}</td>
                  <td style={{ padding:'12px 14px', fontSize:'0.85rem', color:'#666' }}>{c.usedCount}/{c.maxUses}</td>
                  <td style={{ padding:'12px 14px', fontSize:'0.82rem', color:'#888' }}>{c.expiresAt?new Date(c.expiresAt).toLocaleDateString('en-PK'):'Never'}</td>
                  <td style={{ padding:'12px 14px' }}>
                    <button onClick={()=>toggle(c)} style={{ background:c.isActive?'#d1e7dd':'#f8d7da', color:c.isActive?'#0f5132':'#842029', border:'none', borderRadius:20, padding:'3px 12px', cursor:'pointer', fontWeight:700, fontSize:'0.74rem', fontFamily:'Cairo, sans-serif' }}>
                      {c.isActive?'Active':'Inactive'}
                    </button>
                  </td>
                  <td style={{ padding:'12px 14px' }}>
                    <div style={{ display:'flex', gap:7 }}>
                      <button onClick={()=>openEdit(c)} style={{ background:'#e8f5e3', color:'#2D5A27', border:'none', borderRadius:7, padding:'5px 13px', cursor:'pointer', fontWeight:700, fontSize:'0.8rem', fontFamily:'Cairo, sans-serif' }}>Edit</button>
                      <button onClick={()=>del(c._id)} style={{ background:'#fde8e8', color:'#e74c3c', border:'none', borderRadius:7, padding:'5px 10px', cursor:'pointer', fontWeight:700, fontSize:'0.8rem', fontFamily:'Cairo, sans-serif' }}>Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
          onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div style={{ background:'white', borderRadius:18, width:'100%', maxWidth:480, fontFamily:'Cairo, sans-serif' }}>
            <div style={{ padding:'22px 26px 0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <h2 style={{ fontFamily:'Playfair Display', fontSize:'1.3rem', margin:0 }}>{editing?'✏️ Edit Coupon':'🎟️ Create Coupon'}</h2>
              <button onClick={()=>setModal(false)} style={{ background:'#f5f5f5', border:'none', borderRadius:8, width:34, height:34, cursor:'pointer', color:'#666' }}>✕</button>
            </div>
            <div style={{ padding:'18px 26px 26px', display:'flex', flexDirection:'column', gap:13 }}>
              <div>
                <label style={{ display:'block', marginBottom:5, fontWeight:700, fontSize:'0.82rem', color:'#444' }}>Coupon Code * <span style={{ color:'#aaa', fontWeight:400 }}>(auto UPPERCASE)</span></label>
                <input type="text" value={form.code} onChange={e=>setForm(f=>({...f,code:e.target.value.toUpperCase()}))} placeholder="e.g. SAVE20" style={inp}
                  onFocus={e=>e.target.style.borderColor='#2D5A27'} onBlur={e=>e.target.style.borderColor='#e0e0e0'} />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label style={{ display:'block', marginBottom:5, fontWeight:700, fontSize:'0.82rem', color:'#444' }}>Discount Type</label>
                  <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))} style={inp}>
                    <option value="percent">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (PKR)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display:'block', marginBottom:5, fontWeight:700, fontSize:'0.82rem', color:'#444' }}>Value *</label>
                  <input type="number" value={form.value} onChange={e=>setForm(f=>({...f,value:e.target.value}))} placeholder={form.type==='percent'?'20':'500'} min="0" style={inp}
                    onFocus={e=>e.target.style.borderColor='#2D5A27'} onBlur={e=>e.target.style.borderColor='#e0e0e0'} />
                </div>
                <div>
                  <label style={{ display:'block', marginBottom:5, fontWeight:700, fontSize:'0.82rem', color:'#444' }}>Min Order (PKR)</label>
                  <input type="number" value={form.minOrder} onChange={e=>setForm(f=>({...f,minOrder:e.target.value}))} placeholder="0" min="0" style={inp}
                    onFocus={e=>e.target.style.borderColor='#2D5A27'} onBlur={e=>e.target.style.borderColor='#e0e0e0'} />
                </div>
                <div>
                  <label style={{ display:'block', marginBottom:5, fontWeight:700, fontSize:'0.82rem', color:'#444' }}>Max Uses</label>
                  <input type="number" value={form.maxUses} onChange={e=>setForm(f=>({...f,maxUses:e.target.value}))} placeholder="100" min="1" style={inp}
                    onFocus={e=>e.target.style.borderColor='#2D5A27'} onBlur={e=>e.target.style.borderColor='#e0e0e0'} />
                </div>
              </div>
              <div>
                <label style={{ display:'block', marginBottom:5, fontWeight:700, fontSize:'0.82rem', color:'#444' }}>Expiry Date (optional)</label>
                <input type="date" value={form.expiresAt} onChange={e=>setForm(f=>({...f,expiresAt:e.target.value}))} style={inp}
                  onFocus={e=>e.target.style.borderColor='#2D5A27'} onBlur={e=>e.target.style.borderColor='#e0e0e0'} />
              </div>
              <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', fontWeight:600, fontSize:'0.85rem', color:'#444' }}>
                <input type="checkbox" checked={form.isActive} onChange={e=>setForm(f=>({...f,isActive:e.target.checked}))} style={{ accentColor:'#2D5A27', width:16, height:16 }} />
                Active (customers can use this coupon)
              </label>
              <div style={{ display:'flex', gap:12, marginTop:4 }}>
                <button onClick={save} style={{ flex:1, background:'#2D5A27', color:'white', border:'none', borderRadius:10, padding:12, fontWeight:700, cursor:'pointer', fontFamily:'Cairo, sans-serif' }}>
                  {editing?'💾 Save':'🎟️ Create'}
                </button>
                <button onClick={()=>setModal(false)} style={{ flex:1, background:'#f5f5f5', color:'#555', border:'none', borderRadius:10, padding:12, fontWeight:700, cursor:'pointer', fontFamily:'Cairo, sans-serif' }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default CouponManager;
