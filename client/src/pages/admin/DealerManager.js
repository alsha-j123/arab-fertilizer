import React, { useState, useEffect } from 'react';
import apiClient from '../../utils/apiClient';
import { useAuth } from '../../context/AuthContext';


const EMPTY = { name: '', phone: '', city: '', area: '', address: '', employee: '', notes: '' };

const Toast = ({ msg, type = 'success' }) => msg ? (
  <div style={{ position: 'fixed', top: 24, right: 24, background: type === 'success' ? '#2D5A27' : '#e74c3c', color: 'white', padding: '12px 22px', borderRadius: 10, zIndex: 9999, fontWeight: 600, fontSize: '0.9rem', boxShadow: '0 6px 24px rgba(0,0,0,0.2)' }}>
    {type === 'success' ? '✅' : '❌'} {msg}
  </div>
) : null;

const DealerManager = () => {
  const [dealers, setDealers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [delId, setDelId] = useState(null);
  const [toast, setToast] = useState({ msg: '', type: 'success' });
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadData(); }, []);

  const loadData = () => {
    setLoading(true);
    const endpoints = [apiClient.get('/dealers')];
    if (user?.role === 'admin') endpoints.push(apiClient.get('/employees'));
    
    Promise.all(endpoints)
      .then(([dealersRes, employeesRes]) => {
        setDealers(dealersRes.data.dealers || []);
        if (employeesRes) setEmployees(employeesRes.data.employees || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const flash = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast({ msg: '', type: 'success' }), 2500); };

  const filtered = dealers.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    (d.city || '').toLowerCase().includes(search.toLowerCase()) ||
    (d.area || '').toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditing(null);
    setForm({ ...EMPTY, employee: user?.role === 'employee' ? (user.employeeId || '') : '' });
    setModal(true);
  };
  const openEdit = d => {
    setEditing(d);
    setForm({
      name: d.name, phone: d.phone || '', city: d.city || '', area: d.area || '',
      address: d.address || '', employee: d.employee?._id || d.employee || '', notes: d.notes || ''
    });
    setModal(true);
  };

  const save = async () => {
    if (!form.name.trim() || !form.employee) { flash('Name and employee are required', 'error'); return; }
    setSaving(true);
    try {
      if (editing) {
        const { data } = await apiClient.put(`/dealers/${editing._id}`, form);
        setDealers(prev => prev.map(d => d._id === editing._id ? data.dealer : d));
        flash(`${form.name} updated`);
      } else {
        const { data } = await apiClient.post('/dealers', form);
        setDealers(prev => [data.dealer, ...prev]);
        flash(`${form.name} added`);
      }
      setModal(false);
    } catch (err) { flash(err.response?.data?.message || 'Failed', 'error'); }
    finally { setSaving(false); }
  };

  const del = async id => {
    try {
      await apiClient.delete(`/dealers/${id}`);
      setDealers(prev => prev.filter(d => d._id !== id));
      setDelId(null); flash('Dealer removed');
    } catch (err) { flash(err.response?.data?.message || 'Failed to delete', 'error'); }
  };

  const inp = { border: '1.5px solid #e0e0e0', borderRadius: 8, fontSize: '0.88rem', outline: 'none', fontFamily: 'Cairo, sans-serif', padding: '10px 12px', width: '100%', boxSizing: 'border-box' };
  const onF = e => e.target.style.borderColor = '#2D5A27';
  const onB = e => e.target.style.borderColor = '#e0e0e0';

  return (
    <div style={{ padding: 32, maxWidth: 1200, fontFamily: 'Cairo, sans-serif' }}>
      <Toast msg={toast.msg} type={toast.type} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: 'Playfair Display', fontSize: '1.9rem', marginBottom: 4 }}>
            {user?.role === 'employee' ? 'My Dealers' : 'Dealer Management'}
          </h1>
          <p style={{ color: '#888', fontSize: '0.88rem' }}>{dealers.length} active dealers</p>
        </div>
        {(user?.role === 'admin' || user?.role === 'employee') && (
          <button onClick={openAdd}
            style={{ background: '#2D5A27', color: 'white', border: 'none', borderRadius: 10, padding: '12px 24px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem', fontFamily: 'Cairo, sans-serif' }}
            onMouseEnter={e => e.currentTarget.style.background = '#3a7a31'} onMouseLeave={e => e.currentTarget.style.background = '#2D5A27'}>
            + Add Dealer
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div style={{ background: 'white', borderRadius: 12, padding: '14px 20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 20 }}>
        <input type="text" placeholder="🔍 Search dealers by name, city, or area..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ ...inp }} onFocus={onF} onBlur={onB} />
      </div>

      {/* Dealer List */}
      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: '#888' }}>
          <div style={{ width: 40, height: 40, border: '4px solid #e8f5e3', borderTopColor: '#2D5A27', borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto 12px' }} />
          Loading...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: 'white', borderRadius: 14, padding: 60, textAlign: 'center', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏪</div>
          <h3 style={{ fontFamily: 'Playfair Display', marginBottom: 8 }}>No Dealers Yet</h3>
          <p style={{ color: '#888', marginBottom: 20 }}>Assign dealers to your employees.</p>
          {(user?.role === 'admin' || user?.role === 'employee') && <button onClick={openAdd} style={{ background: '#2D5A27', color: 'white', border: 'none', borderRadius: 10, padding: '11px 24px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>+ Add First Dealer</button>}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {filtered.map(d => (
            <div key={d._id} style={{ background: 'white', borderRadius: 14, padding: '20px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1a1a1a' }}>{d.name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#888', marginTop: 2 }}>{d.city ? `${d.city} ${d.area ? `— ${d.area}` : ''}` : 'No Location Provided'}</div>
                </div>
                <div style={{ background: '#e8f5e3', color: '#2D5A27', borderRadius: 20, padding: '4px 12px', fontSize: '0.74rem', fontWeight: 700, textAlign: 'center' }}>
                  Assignee
                  <div style={{ fontSize: '0.8rem', color: '#1a1a1a' }}>{d.employee?.name || 'Unassigned'}</div>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.84rem', color: '#555', marginBottom: 16 }}>
                {d.phone && <div>📞 {d.phone}</div>}
                {d.address && <div>📍 {d.address}</div>}
                {d.notes && <div style={{ color: '#888', fontStyle: 'italic' }}>📝 {d.notes}</div>}
              </div>

              {(user?.role === 'admin' || (user?.role === 'employee' && (d.employee?._id || d.employee) === user?.employeeId)) && (
                <div style={{ display: 'flex', gap: 8, borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
                  <button onClick={() => openEdit(d)} style={{ flex: 1, background: '#f5f5f5', color: '#333', border: 'none', borderRadius: 8, padding: '8px 0', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem', fontFamily: 'Cairo, sans-serif' }}>Edit</button>
                  <button onClick={() => setDelId(d._id)} style={{ flex: 1, background: '#fde8e8', color: '#e74c3c', border: 'none', borderRadius: 8, padding: '8px 0', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem', fontFamily: 'Cairo, sans-serif' }}>Remove</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Delete confirm */}
      {delId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 32, maxWidth: 360, width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🗑️</div>
            <h3 style={{ fontFamily: 'Playfair Display', marginBottom: 10 }}>Remove Dealer?</h3>
            <p style={{ color: '#888', marginBottom: 24, fontSize: '0.9rem' }}>This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => del(delId)} style={{ flex: 1, background: '#e74c3c', color: 'white', border: 'none', borderRadius: 10, padding: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>Remove</button>
              <button onClick={() => setDelId(null)} style={{ flex: 1, background: '#f5f5f5', color: '#555', border: 'none', borderRadius: 10, padding: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div style={{ background: 'white', borderRadius: 18, width: '100%', maxWidth: 500, maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ padding: '22px 26px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontFamily: 'Playfair Display', fontSize: '1.3rem', margin: 0 }}>{editing ? '✏️ Edit Dealer' : '🏪 Add Dealer'}</h2>
              <button onClick={() => setModal(false)} style={{ background: '#f5f5f5', border: 'none', borderRadius: 8, width: 34, height: 34, cursor: 'pointer', fontSize: '1rem', color: '#666' }}>✕</button>
            </div>
            <div style={{ padding: '18px 26px 26px', display: 'flex', flexDirection: 'column', gap: 13 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 700, fontSize: '0.82rem', color: '#444' }}>Dealer Name *</label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inp} onFocus={onF} onBlur={onB} />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 700, fontSize: '0.82rem', color: '#444' }}>Assign to Employee *</label>
                <select 
                  value={form.employee} 
                  onChange={e => setForm(f => ({ ...f, employee: e.target.value }))} 
                  style={{ ...inp, background: user?.role === 'employee' ? '#f5f5f5' : 'white', cursor: user?.role === 'employee' ? 'not-allowed' : 'pointer' }} 
                  onFocus={onF} onBlur={onB}
                  disabled={user?.role === 'employee'}
                >
                  <option value="">Select Employee...</option>
                  {employees.length > 0 ? (
                    employees.map(emp => (
                      <option key={emp._id} value={emp._id}>{emp.name} — {emp.role}</option>
                    ))
                  ) : (
                    user?.role === 'employee' && <option value={user.employeeId}>{user.name}</option>
                  )}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 5, fontWeight: 700, fontSize: '0.82rem', color: '#444' }}>Phone</label>
                  <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} style={inp} onFocus={onF} onBlur={onB} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 5, fontWeight: 700, fontSize: '0.82rem', color: '#444' }}>City</label>
                  <input type="text" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} style={inp} onFocus={onF} onBlur={onB} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 5, fontWeight: 700, fontSize: '0.82rem', color: '#444' }}>Area</label>
                  <input type="text" value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value }))} style={inp} onFocus={onF} onBlur={onB} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 5, fontWeight: 700, fontSize: '0.82rem', color: '#444' }}>Address</label>
                  <input type="text" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} style={inp} onFocus={onF} onBlur={onB} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 700, fontSize: '0.82rem', color: '#444' }}>Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} style={{ ...inp, resize: 'vertical' }} onFocus={onF} onBlur={onB} />
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                <button onClick={save} disabled={saving} style={{ flex: 1, background: saving ? '#aaa' : '#2D5A27', color: 'white', border: 'none', borderRadius: 10, padding: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'Cairo, sans-serif' }}
                  onMouseEnter={e => { if (!saving) e.currentTarget.style.background = '#3a7a31' }} onMouseLeave={e => { if (!saving) e.currentTarget.style.background = '#2D5A27' }}>
                  {saving ? 'Saving...' : (editing ? '💾 Save Changes' : '🏪 Add Dealer')}
                </button>
                <button onClick={() => setModal(false)} style={{ flex: 1, background: '#f5f5f5', color: '#555', border: 'none', borderRadius: 10, padding: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
};
export default DealerManager;