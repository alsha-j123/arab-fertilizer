import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '../../utils/apiClient';
import { categories } from '../../data';
import { useAuth } from '../../context/AuthContext';

const KEY  = 'af_products';

/* Safe localStorage save — strips base64 images to prevent quota errors */
const persist = (products) => {
  try {
    const slim = products.map(p => ({
      ...p,
      images: (p.images || []).filter(img => img && img.startsWith('http')),
    }));
    localStorage.setItem(KEY, JSON.stringify(slim));
  } catch {
    /* Quota exceeded — just clear it, MongoDB is the source of truth */
    try { localStorage.removeItem(KEY); } catch {}
  }
};
const load = () => { try { const s = localStorage.getItem(KEY); return s ? JSON.parse(s) : []; } catch { return []; } };

const EMPTY = { name:'', category:'insecticides', price:'', discountPrice:'', stock:'', npkRatio:'', weight:'', season:'All Season', description:'', images:[], features:[], usage:[], precautions:[], variants:[] };
const IS = { border:'1.5px solid #e0e0e0', borderRadius:8, fontSize:'0.88rem', outline:'none', fontFamily:'Cairo, sans-serif', padding:'9px 12px', width:'100%', boxSizing:'border-box', transition:'border-color .2s' };

const Toast = ({ msg }) => (
  <AnimatePresence>
    {msg && (
      <motion.div initial={{ opacity:0, y:-12 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
        style={{ position:'fixed', top:24, right:24, background:'#2D5A27', color:'white', padding:'12px 22px', borderRadius:10, zIndex:9999, fontWeight:600, fontSize:'0.9rem', boxShadow:'0 6px 24px rgba(0,0,0,0.22)' }}>
        ✅ {msg}
      </motion.div>
    )}
  </AnimatePresence>
);


/* ── Bullet Point Editor ── */
const BulletEditor = ({ label, items = [], onChange, placeholder }) => {
  const [input, setInput] = useState('');

  const add = () => {
    const val = input.trim();
    if (!val) return;
    onChange([...items, val]);
    setInput('');
  };

  const remove = i => onChange(items.filter((_, idx) => idx !== i));

  const handleKey = e => { if (e.key === 'Enter') { e.preventDefault(); add(); } };

  return (
    <div style={{ gridColumn:'span 2' }}>
      <label style={{ display:'block', marginBottom:6, fontWeight:700, fontSize:'0.83rem', color:'#444' }}>{label}</label>

      {/* Existing bullets */}
      {items.length > 0 && (
        <div style={{ marginBottom:8, display:'flex', flexDirection:'column', gap:5 }}>
          {items.map((item, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:8, background:'#f8fdf6', borderRadius:7, padding:'7px 10px' }}>
              <span style={{ color:'#2D5A27', fontWeight:700, fontSize:'1rem' }}>•</span>
              <span style={{ flex:1, fontSize:'0.87rem', color:'#333' }}>{item}</span>
              <button type="button" onClick={() => remove(i)}
                style={{ background:'none', border:'none', cursor:'pointer', color:'#e74c3c', fontSize:'1rem', lineHeight:1, padding:'0 2px' }}>✕</button>
            </div>
          ))}
        </div>
      )}

      {/* Add new bullet */}
      <div style={{ display:'flex', gap:8 }}>
        <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
          placeholder={placeholder}
          style={{ flex:1, border:'1.5px solid #e0e0e0', borderRadius:8, fontSize:'0.88rem', outline:'none', fontFamily:'Cairo, sans-serif', padding:'9px 12px', boxSizing:'border-box' }}
          onFocus={e=>e.target.style.borderColor='#2D5A27'} onBlur={e=>e.target.style.borderColor='#e0e0e0'} />
        <button type="button" onClick={add}
          style={{ background:'#2D5A27', color:'white', border:'none', borderRadius:8, padding:'9px 16px', cursor:'pointer', fontWeight:700, fontSize:'0.88rem', fontFamily:'Cairo, sans-serif', whiteSpace:'nowrap' }}>
          + Add
        </button>
      </div>
      <p style={{ color:'#aaa', fontSize:'0.74rem', margin:'4px 0 0' }}>Press Enter or click Add to add a bullet point</p>
    </div>
  );
};

/* ── Variant Editor ── */
const VariantEditor = ({ variants = [], onChange }) => {
  const [w, setW]   = useState('');
  const [p, setP]   = useState('');
  const [dp, setDp] = useState('');
  const [st, setSt] = useState('');

  const add = () => {
    if (!w.trim() || !p) return;
    onChange([...variants, { weight:w.trim(), price:Number(p), discountPrice:dp?Number(dp):null, stock:st?Number(st):0 }]);
    setW(''); setP(''); setDp(''); setSt('');
  };
  const remove = i => onChange(variants.filter((_,idx) => idx !== i));
  const i2 = { border:'1.5px solid #e0e0e0', borderRadius:7, fontSize:'0.82rem', outline:'none', fontFamily:'Cairo, sans-serif', padding:'7px 9px', boxSizing:'border-box', width:'100%' };

  return (
    <div style={{ gridColumn:'span 2' }}>
      <label style={{ display:'block', marginBottom:8, fontWeight:700, fontSize:'0.83rem', color:'#444' }}>
        ⚖️ Weight / Size Variants
        <span style={{ color:'#aaa', fontWeight:400, fontSize:'0.76rem', marginLeft:6 }}>(optional — each size can have a different price)</span>
      </label>

      {variants.length > 0 && (
        <div style={{ marginBottom:10, display:'flex', flexDirection:'column', gap:5 }}>
          {variants.map((v, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:10, background:'#f8fdf6', borderRadius:8, padding:'8px 12px', border:'1px solid #d4edda' }}>
              <span style={{ fontWeight:700, color:'#2D5A27', minWidth:70, fontSize:'0.87rem' }}>{v.weight}</span>
              <span style={{ color:'#2D5A27', fontWeight:700, fontSize:'0.87rem' }}>PKR {Number(v.price).toLocaleString()}</span>
              {v.discountPrice && <span style={{ color:'#aaa', textDecoration:'line-through', fontSize:'0.8rem' }}>PKR {v.discountPrice}</span>}
              <span style={{ color:'#888', fontSize:'0.77rem', marginLeft:'auto' }}>Stock: {v.stock||0}</span>
              <button type="button" onClick={()=>remove(i)} style={{ background:'none', border:'none', cursor:'pointer', color:'#e74c3c', fontSize:'1rem', lineHeight:1 }}>✕</button>
            </div>
          ))}
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'1.5fr 1fr 1fr 1fr auto', gap:7, alignItems:'end' }}>
        <div><div style={{ fontSize:'0.73rem', color:'#888', marginBottom:3 }}>Weight/Size *</div>
          <input value={w} onChange={e=>setW(e.target.value)} placeholder="e.g. 500ml" style={i2}
            onFocus={e=>e.target.style.borderColor='#2D5A27'} onBlur={e=>e.target.style.borderColor='#e0e0e0'} /></div>
        <div><div style={{ fontSize:'0.73rem', color:'#888', marginBottom:3 }}>Price (PKR) *</div>
          <input type="number" value={p} onChange={e=>setP(e.target.value)} placeholder="1800" min="0" style={i2}
            onFocus={e=>e.target.style.borderColor='#2D5A27'} onBlur={e=>e.target.style.borderColor='#e0e0e0'} /></div>
        <div><div style={{ fontSize:'0.73rem', color:'#888', marginBottom:3 }}>Discount</div>
          <input type="number" value={dp} onChange={e=>setDp(e.target.value)} placeholder="Optional" min="0" style={i2}
            onFocus={e=>e.target.style.borderColor='#2D5A27'} onBlur={e=>e.target.style.borderColor='#e0e0e0'} /></div>
        <div><div style={{ fontSize:'0.73rem', color:'#888', marginBottom:3 }}>Stock</div>
          <input type="number" value={st} onChange={e=>setSt(e.target.value)} placeholder="0" min="0" style={i2}
            onFocus={e=>e.target.style.borderColor='#2D5A27'} onBlur={e=>e.target.style.borderColor='#e0e0e0'} /></div>
        <button type="button" onClick={add}
          style={{ background:'#2D5A27', color:'white', border:'none', borderRadius:7, padding:'8px 13px', cursor:'pointer', fontWeight:700, fontSize:'0.85rem', fontFamily:'Cairo, sans-serif', height:33 }}>
          + Add
        </button>
      </div>
      <p style={{ color:'#aaa', fontSize:'0.73rem', margin:'4px 0 0' }}>If variants added, base price above is used as fallback only.</p>
    </div>
  );
};

/* ProductModal defined OUTSIDE main component so it never remounts on parent re-render */
const ProductModal = ({ open, onClose, onSave, editing, cats }) => {
  const [form, setForm]     = useState(EMPTY);
  const [previews, setPreviews] = useState([]);
  const fileRef             = useRef();

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({
        name:          editing.name          || '',
        category:      editing.category      || 'insecticides',
        price:         String(editing.price  || ''),
        discountPrice: editing.discountPrice  ? String(editing.discountPrice) : '',
        stock:         String(editing.stock  || ''),
        npkRatio:      editing.npkRatio      || '',
        weight:        editing.weight        || '',
        season:        editing.season        || 'All Season',
        description:   editing.description   || '',
        images:        Array.isArray(editing.images) ? editing.images : [],
        features:      Array.isArray(editing.features)    ? editing.features    : [],
        usage:         Array.isArray(editing.usage)       ? editing.usage       : [],
        precautions:   Array.isArray(editing.precautions) ? editing.precautions : [],
        variants:      Array.isArray(editing.variants)    ? editing.variants    : [],
      });
      setPreviews(Array.isArray(editing.images) ? editing.images.filter(i=>i&&(i.startsWith('http')||i.startsWith('data:'))) : []);
    } else {
      setForm(EMPTY);
      setPreviews([]);
    }
  }, [open, editing]);

  const set = useCallback((k, v) => setForm(f => ({ ...f, [k]: v })), []);

  const handleFile = e => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        const result = ev.target.result;
        setPreviews(prev => [...prev, result]);
        setForm(f => ({ ...f, images: [...(f.images||[]), result] }));
      };
      reader.readAsDataURL(file);
    });
  };
  const removeImage = (idx) => {
    setPreviews(prev => prev.filter((_,i)=>i!==idx));
    setForm(f => ({ ...f, images: (f.images||[]).filter((_,i)=>i!==idx) }));
  };
  const addImageUrl = (url) => {
    if (!url.trim()) return;
    setPreviews(prev => [...prev, url]);
    setForm(f => ({ ...f, images: [...(f.images||[]), url] }));
  };

  const submit = () => {
    if (!form.name.trim())  { alert('Product name is required');  return; }
    if (!form.price)        { alert('Price is required');         return; }
    if (!form.stock)        { alert('Stock quantity is required'); return; }
    onSave(form, previews);
  };

  const bind = key => ({
    value: form[key],
    onChange: e => set(key, e.target.value),
    style: IS,
    onFocus: e => e.target.style.borderColor = '#2D5A27',
    onBlur:  e => e.target.style.borderColor = '#e0e0e0',
  });

  if (!open) return null;

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale:.92, opacity:0 }} animate={{ scale:1, opacity:1 }}
        style={{ background:'white', borderRadius:18, width:'100%', maxWidth:620, maxHeight:'92vh', overflowY:'auto', fontFamily:'Cairo, sans-serif' }}>

        <div style={{ padding:'24px 28px 0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h2 style={{ fontFamily:'Playfair Display', fontSize:'1.4rem', color:'#1a1a1a', margin:0 }}>
            {editing ? '✏️ Edit Product' : '➕ Add New Product'}
          </h2>
          <button onClick={onClose} style={{ background:'#f5f5f5', border:'none', borderRadius:8, width:36, height:36, fontSize:'1.1rem', cursor:'pointer', color:'#666' }}>✕</button>
        </div>

        <div style={{ padding:'20px 28px 28px' }}>

          {/* Multi-Image upload */}
          <div style={{ marginBottom:20 }}>
            <label style={{ display:'block', marginBottom:8, fontWeight:700, fontSize:'0.85rem', color:'#444' }}>
              Product Images <span style={{ color:'#aaa', fontWeight:400, fontSize:'0.76rem' }}>(up to 5 images)</span>
            </label>

            {/* Image previews */}
            {previews.length > 0 && (
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:10 }}>
                {previews.map((src, idx) => (
                  <div key={idx} style={{ position:'relative', width:72, height:72 }}>
                    <img src={src} alt="" style={{ width:72, height:72, objectFit:'cover', borderRadius:8, border: idx===0?'2px solid #2D5A27':'2px solid #e0e0e0' }}
                      onError={e=>{e.target.style.display='none'}} />
                    {idx===0 && <span style={{ position:'absolute', bottom:2, left:2, background:'#2D5A27', color:'white', fontSize:'0.58rem', padding:'1px 5px', borderRadius:4, fontWeight:700 }}>MAIN</span>}
                    <button type="button" onClick={()=>removeImage(idx)}
                      style={{ position:'absolute', top:-6, right:-6, width:18, height:18, background:'#e74c3c', color:'white', border:'none', borderRadius:'50%', cursor:'pointer', fontSize:'0.65rem', display:'flex', alignItems:'center', justifyContent:'center', lineHeight:1 }}>✕</button>
                  </div>
                ))}
                {previews.length < 5 && (
                  <div onClick={()=>fileRef.current?.click()}
                    style={{ width:72, height:72, border:'2px dashed #ccc', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', background:'#fafafa', flexDirection:'column', color:'#bbb', fontSize:'0.68rem', gap:3 }}>
                    <span style={{ fontSize:20 }}>+</span>Add
                  </div>
                )}
              </div>
            )}

            <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFile} style={{ display:'none' }} />
            <div style={{ display:'flex', gap:8 }}>
              <button type="button" onClick={()=>fileRef.current?.click()}
                style={{ flex:1, background:'#e8f5e3', color:'#2D5A27', border:'1.5px solid #b8ddb5', borderRadius:8, padding:'9px', fontWeight:700, fontSize:'0.83rem', cursor:'pointer', fontFamily:'Cairo, sans-serif' }}>
                📁 Choose Files (multi-select)
              </button>
            </div>
            <div style={{ marginTop:8, display:'flex', gap:8 }}>
              <input type="url" placeholder="Or paste image URL here..."
                id="urlInput"
                style={{ ...IS, flex:1 }}
                onFocus={e=>e.target.style.borderColor='#2D5A27'} onBlur={e=>e.target.style.borderColor='#e0e0e0'}
                onKeyDown={e=>{ if(e.key==='Enter'){ e.preventDefault(); addImageUrl(e.target.value); e.target.value=''; }}} />
              <button type="button"
                onClick={()=>{ const el=document.getElementById('urlInput'); if(el){addImageUrl(el.value);el.value='';} }}
                style={{ background:'#2D5A27', color:'white', border:'none', borderRadius:8, padding:'9px 14px', cursor:'pointer', fontWeight:700, fontSize:'0.83rem', fontFamily:'Cairo, sans-serif', whiteSpace:'nowrap' }}>
                + Add URL
              </button>
            </div>
            <p style={{ color:'#aaa', fontSize:'0.72rem', margin:'4px 0 0' }}>First image is the main display image. Drag to reorder (coming soon).</p>
          </div>

          {/* Fields grid */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div style={{ gridColumn:'span 2' }}>
              <label style={{ display:'block', marginBottom:5, fontWeight:700, fontSize:'0.83rem', color:'#444' }}>Product Name *</label>
              <input type="text" placeholder="e.g. Chlorpyrifos 40% EC" {...bind('name')} />
            </div>
            <div style={{ gridColumn:'span 2' }}>
              <label style={{ display:'block', marginBottom:5, fontWeight:700, fontSize:'0.83rem', color:'#444' }}>Category</label>
              <select value={form.category} onChange={e => set('category', e.target.value)}
                style={IS} onFocus={e=>e.target.style.borderColor='#2D5A27'} onBlur={e=>e.target.style.borderColor='#e0e0e0'}>
                {cats.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display:'block', marginBottom:5, fontWeight:700, fontSize:'0.83rem', color:'#444' }}>Price (PKR) *</label>
              <input type="number" placeholder="1800" min="0" {...bind('price')} />
            </div>
            <div>
              <label style={{ display:'block', marginBottom:5, fontWeight:700, fontSize:'0.83rem', color:'#444' }}>Discount Price</label>
              <input type="number" placeholder="1500 (optional)" min="0" {...bind('discountPrice')} />
            </div>
            <div>
              <label style={{ display:'block', marginBottom:5, fontWeight:700, fontSize:'0.83rem', color:'#444' }}>Stock Qty *</label>
              <input type="number" placeholder="50" min="0" {...bind('stock')} />
            </div>
            <div>
              <label style={{ display:'block', marginBottom:5, fontWeight:700, fontSize:'0.83rem', color:'#444' }}>Weight / Volume</label>
              <input type="text" placeholder="1 Litre / 500g" {...bind('weight')} />
            </div>
            <div>
              <label style={{ display:'block', marginBottom:5, fontWeight:700, fontSize:'0.83rem', color:'#444' }}>NPK Ratio</label>
              <input type="text" placeholder="18-46-0 / N/A" {...bind('npkRatio')} />
            </div>
            <div>
              <label style={{ display:'block', marginBottom:5, fontWeight:700, fontSize:'0.83rem', color:'#444' }}>Season</label>
              <select value={form.season} onChange={e => set('season', e.target.value)}
                style={IS} onFocus={e=>e.target.style.borderColor='#2D5A27'} onBlur={e=>e.target.style.borderColor='#e0e0e0'}>
                {['All Season','Kharif','Rabi','Kharif & Rabi'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ gridColumn:'span 2' }}>
              <label style={{ display:'block', marginBottom:5, fontWeight:700, fontSize:'0.83rem', color:'#444' }}>
                Short Description <span style={{ color:'#aaa', fontWeight:400, fontSize:'0.78rem' }}>(optional intro)</span>
              </label>
              <textarea placeholder="e.g. A broad-spectrum insecticide for cotton and rice crops." rows={2} value={form.description} onChange={e => set('description', e.target.value)}
                style={{ ...IS, resize:'vertical' }}
                onFocus={e=>e.target.style.borderColor='#2D5A27'} onBlur={e=>e.target.style.borderColor='#e0e0e0'} />
            </div>

            <BulletEditor label="✅ Key Features" items={form.features} onChange={v=>set('features',v)} placeholder="e.g. Fast-acting and long-lasting protection" />
            <BulletEditor label="📋 How to Use / Application" items={form.usage} onChange={v=>set('usage',v)} placeholder="e.g. Apply 250ml per acre with water" />
            <BulletEditor label="⚠️ Precautions" items={form.precautions} onChange={v=>set('precautions',v)} placeholder="e.g. Keep away from children and pets" />
            <VariantEditor variants={form.variants} onChange={v=>set('variants',v)} />
          </div>

          <div style={{ display:'flex', gap:12, marginTop:24 }}>
            <button onClick={submit}
              style={{ flex:1, background:'#2D5A27', color:'white', border:'none', borderRadius:10, padding:13, fontWeight:700, cursor:'pointer', fontFamily:'Cairo, sans-serif', fontSize:'0.95rem' }}
              onMouseEnter={e=>e.currentTarget.style.background='#3a7a31'}
              onMouseLeave={e=>e.currentTarget.style.background='#2D5A27'}>
              {editing ? '💾 Save Changes' : '➕ Add Product'}
            </button>
            <button onClick={onClose}
              style={{ flex:1, background:'#f5f5f5', color:'#555', border:'none', borderRadius:10, padding:13, fontWeight:700, cursor:'pointer', fontFamily:'Cairo, sans-serif' }}>
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

/* ══════════════ MAIN ══════════════ */
const ProductManager = () => {
  const [products, setProducts]   = useState([]);
  const [search, setSearch]       = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]     = useState(null);
  const [toast, setToast]         = useState('');
  const [delId, setDelId]         = useState(null);
  const [loading, setLoading]     = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    apiClient.get('/products')
      .then(res => {
        const p = res.data.products || [];
        const data = p.length > 0 ? p : load();
        setProducts(data);
        if (p.length > 0) persist(p);
      })
      .catch(() => setProducts(load()))
      .finally(() => setLoading(false));
  }, []);

  const flash = msg => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const filtered = products.filter(p => {
    const name = p.name || '';
    return name.toLowerCase().includes(search.toLowerCase()) &&
           (catFilter === 'all' || p.category === catFilter);
  });

  const handleSave = async (form, imagePreviews) => {
    const imgs = Array.isArray(imagePreviews) ? imagePreviews : (imagePreviews ? [imagePreviews] : []);
    // Use form.images if previews not provided, but filter out base64 for the URL images
    const allImages = imgs.length > 0 ? imgs : (form.images || editing?.images || []);
    const payload = {
      ...form,
      price:         Number(form.price),
      discountPrice: form.discountPrice ? Number(form.discountPrice) : null,
      stock:         Number(form.stock),
      images:        allImages, // server will upload base64, keep URLs
      variants:      form.variants || [],
    };
    let updated;
    try {
      if (editing) {
        const { data } = await apiClient.put(`/products/${editing._id}`, payload);
        const saved = data.product || { ...editing, ...payload };
        updated = products.map(p => p._id === editing._id ? saved : p);
        flash(`"${form.name}" updated`);
      } else {
        const { data } = await apiClient.post('/products', payload);
        const saved = data.product || { ...payload, _id:'prod_'+Date.now(), avgRating:0, numReviews:0, featured:false };
        updated = [saved, ...products];
        flash(`"${form.name}" added`);
      }
    } catch {
      // fallback: update locally if API fails
      if (editing) {
        updated = products.map(p => p._id === editing._id ? { ...p, ...payload } : p);
      } else {
        updated = [{ ...payload, _id:'prod_'+Date.now(), avgRating:0, numReviews:0, featured:false }, ...products];
      }
      flash(editing ? `"${form.name}" updated (offline)` : `"${form.name}" added (offline)`);
    }
    setProducts(updated); persist(updated); setModalOpen(false);
  };

  const handleDelete = id => {
    const updated = products.filter(p => p._id !== id);
    setProducts(updated); persist(updated);
    apiClient.delete(`/products/${id}`).catch(() => {});
    setDelId(null); flash('Product deleted');
  };

  const adjStock = async (id, delta) => {
    const product = products.find(p => p._id === id);
    if (!product) return;
    const newStock = Math.max(0, (product.stock || 0) + delta);
    
    // Optimistic update
    const updated = products.map(p => p._id === id ? { ...p, stock: newStock } : p);
    setProducts(updated);
    persist(updated);
    
    try {
      await apiClient.put(`/products/${id}`, { stock: newStock });
      flash(`Stock updated to ${newStock} for "${product.name}"`);
    } catch (err) {
      flash('Failed to update stock in database');
      // Rollback on failure
      const rolledBack = products.map(p => p._id === id ? product : p);
      setProducts(rolledBack);
      persist(rolledBack);
    }
  };

  return (
    <div style={{ padding:32, maxWidth:1200, fontFamily:'Cairo, sans-serif' }}>
      <Toast msg={toast} />

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:28, flexWrap:'wrap', gap:16 }}>
        <div>
          <h1 style={{ fontFamily:'Playfair Display', fontSize:'1.9rem', color:'#1a1a1a', marginBottom:4 }}>Product Manager</h1>
          <p style={{ color:'#888', fontSize:'0.88rem' }}>{filtered.length} of {products.length} products</p>
        </div>
        {user?.role === 'admin' && (
          <button onClick={() => { setEditing(null); setModalOpen(true); }}
            style={{ background:'#2D5A27', color:'white', border:'none', borderRadius:10, padding:'12px 24px', fontWeight:700, cursor:'pointer', fontSize:'0.9rem', fontFamily:'Cairo, sans-serif' }}
            onMouseEnter={e=>e.currentTarget.style.background='#3a7a31'}
            onMouseLeave={e=>e.currentTarget.style.background='#2D5A27'}>
            + Add Product
          </button>
        )}
      </div>

      {/* Filters */}
      <div style={{ background:'white', borderRadius:12, padding:'16px 20px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', marginBottom:20, display:'flex', gap:14, flexWrap:'wrap', alignItems:'center' }}>
        <input type="text" placeholder="🔍 Search products..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ ...IS, flex:1, minWidth:200 }}
          onFocus={e=>e.target.style.borderColor='#2D5A27'} onBlur={e=>e.target.style.borderColor='#e0e0e0'} />
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          style={{ ...IS, width:'auto' }}
          onFocus={e=>e.target.style.borderColor='#2D5A27'} onBlur={e=>e.target.style.borderColor='#e0e0e0'}>
          <option value="all">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        <button onClick={() => { setSearch(''); setCatFilter('all'); }}
          style={{ padding:'9px 16px', border:'1.5px solid #e0e0e0', borderRadius:8, background:'white', cursor:'pointer', fontSize:'0.85rem', color:'#888', fontFamily:'Cairo, sans-serif' }}>Reset</button>
      </div>

      {/* Table */}
      <div style={{ background:'white', borderRadius:14, boxShadow:'0 2px 16px rgba(0,0,0,0.07)', overflow:'hidden' }}>
        {loading ? (
          <div style={{ padding:60, textAlign:'center' }}>
            <div style={{ width:40, height:40, border:'4px solid #e8f5e3', borderTopColor:'#2D5A27', borderRadius:'50%', animation:'spin .8s linear infinite', margin:'0 auto 12px' }} />
            <p style={{ color:'#888' }}>Loading products...</p>
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'#2D5A27' }}>
                  {['Image','Product','Category','Price','Stock','Rating'].map(h => (
                    <th key={h} style={{ padding:'13px 14px', textAlign:'left', color:'white', fontSize:'0.82rem', fontWeight:600, whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                  {user?.role === 'admin' && <th style={{ padding:'13px 14px', textAlign:'left', color:'white', fontSize:'0.82rem', fontWeight:600, whiteSpace:'nowrap' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding:60, textAlign:'center', color:'#888' }}>No products found.</td></tr>
                ) : filtered.map(p => (
                  <motion.tr key={p._id} initial={{ opacity:0 }} animate={{ opacity:1 }}
                    style={{ borderBottom:'1px solid #f0f0f0' }}
                    onMouseEnter={e=>e.currentTarget.style.background='#fafafa'}
                    onMouseLeave={e=>e.currentTarget.style.background='white'}>
                    <td style={{ padding:'10px 14px' }}>
                      {p.images?.[0]
                        ? <img src={p.images[0]} alt={p.name} style={{ width:48, height:48, objectFit:'cover', borderRadius:8 }} onError={e=>e.target.style.display='none'} />
                        : <div style={{ width:48, height:48, borderRadius:8, background:'#e8f5e3', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.4rem' }}>🌿</div>}
                    </td>
                    <td style={{ padding:'10px 14px' }}>
                      <div style={{ fontWeight:600, fontSize:'0.88rem', color:'#1a1a1a', maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</div>
                      <div style={{ fontSize:'0.74rem', color:'#888' }}>{p.weight||'—'}</div>
                    </td>
                    <td style={{ padding:'10px 14px' }}>
                      <span style={{ background:'#e8f5e3', color:'#2D5A27', borderRadius:12, padding:'3px 10px', fontSize:'0.72rem', fontWeight:700, textTransform:'capitalize' }}>{p.category}</span>
                    </td>
                    <td style={{ padding:'10px 14px', fontSize:'0.88rem' }}>
                      <div style={{ fontWeight:700, color:'#2D5A27' }}>PKR {Number(p.discountPrice||p.price||0).toLocaleString()}</div>
                      {p.discountPrice && <div style={{ fontSize:'0.74rem', color:'#aaa', textDecoration:'line-through' }}>PKR {Number(p.price||0).toLocaleString()}</div>}
                    </td>
                    <td style={{ padding:'10px 14px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                        {user?.role === 'admin' && <button onClick={()=>adjStock(p._id,-1)} style={{ width:24, height:24, border:'1px solid #ddd', borderRadius:4, background:'white', cursor:'pointer', fontWeight:700, fontSize:'1rem', lineHeight:1, display:'flex', alignItems:'center', justifyContent:'center' }}>−</button>}
                        <span style={{ fontWeight:700, fontSize:'0.88rem', minWidth:28, textAlign:'center', color:(p.stock||0)<10?'#e74c3c':(p.stock||0)<30?'#f39c12':'#2D5A27' }}>{p.stock||0}</span>
                        {user?.role === 'admin' && <button onClick={()=>adjStock(p._id,+1)} style={{ width:24, height:24, border:'1px solid #ddd', borderRadius:4, background:'white', cursor:'pointer', fontWeight:700, fontSize:'1rem', lineHeight:1, display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>}
                      </div>
                      {(p.stock||0)<10 && <div style={{ fontSize:'0.68rem', color:'#e74c3c', marginTop:2 }}>Low Stock</div>}
                    </td>
                    <td style={{ padding:'10px 14px', fontSize:'0.88rem' }}>
                      {p.avgRating>0
                        ? <span><span style={{ color:'#C8A951' }}>★</span> <b>{p.avgRating.toFixed(1)}</b> <span style={{ color:'#aaa', fontSize:'0.74rem' }}>({p.numReviews})</span></span>
                        : <span style={{ color:'#aaa', fontSize:'0.8rem' }}>No reviews</span>}
                    </td>
                    {user?.role === 'admin' && (
                      <td style={{ padding:'10px 14px' }}>
                        <div style={{ display:'flex', gap:7 }}>
                          <button onClick={() => { setEditing(p); setModalOpen(true); }}
                            style={{ background:'#e8f5e3', color:'#2D5A27', border:'none', borderRadius:7, padding:'6px 13px', cursor:'pointer', fontWeight:700, fontSize:'0.8rem', fontFamily:'Cairo, sans-serif' }}>Edit</button>
                          <button onClick={() => setDelId(p._id)}
                            style={{ background:'#fde8e8', color:'#e74c3c', border:'none', borderRadius:7, padding:'6px 11px', cursor:'pointer', fontWeight:700, fontSize:'0.8rem', fontFamily:'Cairo, sans-serif' }}>Del</button>
                        </div>
                      </td>
                    )}
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete confirm */}
      <AnimatePresence>
        {delId && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:3000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
            <motion.div initial={{ scale:.9 }} animate={{ scale:1 }} exit={{ scale:.9 }}
              style={{ background:'white', borderRadius:16, padding:32, maxWidth:360, width:'100%', textAlign:'center' }}>
              <div style={{ fontSize:48, marginBottom:16 }}>🗑️</div>
              <h3 style={{ fontFamily:'Playfair Display', marginBottom:10 }}>Delete Product?</h3>
              <p style={{ color:'#888', marginBottom:24, fontSize:'0.9rem' }}>This cannot be undone.</p>
              <div style={{ display:'flex', gap:12 }}>
                <button onClick={()=>handleDelete(delId)} style={{ flex:1, background:'#e74c3c', color:'white', border:'none', borderRadius:10, padding:12, fontWeight:700, cursor:'pointer', fontFamily:'Cairo, sans-serif' }}>Delete</button>
                <button onClick={()=>setDelId(null)} style={{ flex:1, background:'#f5f5f5', color:'#555', border:'none', borderRadius:10, padding:12, fontWeight:700, cursor:'pointer', fontFamily:'Cairo, sans-serif' }}>Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ProductModal open={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSave} editing={editing} cats={categories} />

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
};

export default ProductManager;
