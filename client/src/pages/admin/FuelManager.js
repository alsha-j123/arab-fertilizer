import React, { useState, useEffect, useMemo } from 'react';
import apiClient from '../../utils/apiClient';
import { useAuth } from '../../context/AuthContext';


const Toast = ({ msg }) => msg ? <div style={{ position:'fixed', top:24, right:24, background:'#2D5A27', color:'white', padding:'12px 22px', borderRadius:10, zIndex:9999, fontWeight:600, boxShadow:'0 4px 20px rgba(0,0,0,0.2)' }}>{msg}</div> : null;
const EMPTY = { employee:'', vehicleInfo:'', fuelType:'Petrol', liters:'', costPerLiter:'', date: new Date().toISOString().split('T')[0], odometerKm:'', notes:'' };

const FuelManager = () => {
  const [records, setRecords]     = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(false);
  const [editing, setEditing]     = useState(null);
  const [form, setForm]           = useState(EMPTY);
  const [toast, setToast]         = useState('');
  const [filterEmp, setFilterEmp] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [saving, setSaving]       = useState(false);

  const { user } = useAuth();

  const fetchData = () => {
    setLoading(true);
    const params = {};
    if (filterEmp) params.employee = filterEmp;
    if (filterMonth) params.month = filterMonth;
    
    const endpoints = [apiClient.get('/fuel', { params })];
    if (user?.role === 'admin') endpoints.push(apiClient.get('/employees'));

    Promise.all(endpoints).then(([fuelRes, empRes]) => {
      setRecords(fuelRes.data.records || []);
      if (empRes) setEmployees(empRes.data.employees || []);
    }).catch(() => {}).finally(() => setLoading(false));
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchData(); }, [filterEmp, filterMonth]);

  const flash = msg => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const stats = useMemo(() => ({
    totalCost: records.reduce((s,r) => s + r.totalCost, 0),
    totalLiters: records.reduce((s,r) => s + r.liters, 0),
    count: records.length,
  }), [records]);

  const openAdd = () => { 
    setEditing(null); 
    setForm({ ...EMPTY, employee: user?.role === 'employee' ? (user.employeeId || '') : '' }); 
    setModal(true); 
  };
  const openEdit = rec => {
    setEditing(rec);
    setForm({
      employee: rec.employee?._id || rec.employee,
      vehicleInfo: rec.vehicleInfo, fuelType: rec.fuelType,
      liters: String(rec.liters), costPerLiter: String(rec.costPerLiter),
      date: new Date(rec.date).toISOString().split('T')[0],
      odometerKm: rec.odometerKm ? String(rec.odometerKm) : '', notes: rec.notes || '',
    });
    setModal(true);
  };

  const save = async () => {
    if (!form.employee || !form.vehicleInfo || !form.liters || !form.costPerLiter) { alert('Fill required fields'); return; }
    setSaving(true);
    try {
      if (editing) {
        const { data } = await apiClient.put(`/fuel/${editing._id}`, form);
        setRecords(prev => prev.map(r => r._id === editing._id ? data.record : r));
        flash('Record updated');
      } else {
        const { data } = await apiClient.post('/fuel', form);
        setRecords(prev => [data.record, ...prev]);
        flash('Fuel record added');
      }
      setModal(false);
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const del = async id => {
    if (!window.confirm('Delete this fuel record?')) return;
    try {
      await apiClient.delete(`/fuel/${id}`);
      setRecords(prev => prev.filter(r => r._id !== id));
      flash('Record deleted');
    } catch (err) { alert(err.response?.data?.message || 'Failed to delete'); }
  };

  const inp = { border:'1.5px solid #e0e0e0', borderRadius:8, fontSize:'0.88rem', outline:'none', fontFamily:'Cairo, sans-serif', padding:'10px 12px', width:'100%', boxSizing:'border-box' };

  return (
    <div style={{ padding:'clamp(16px,3vw,32px)', maxWidth:1100, fontFamily:'Cairo, sans-serif' }}>
      <Toast msg={toast} />

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24, flexWrap:'wrap', gap:16 }}>
        <div>
          <h1 style={{ fontFamily:'Playfair Display', fontSize:'clamp(1.4rem,3vw,1.9rem)', marginBottom:4 }}>
            {user?.role === 'employee' ? 'My Fuel Consumption' : 'Fuel Consumption'}
          </h1>
          <p style={{ color:'#888', fontSize:'0.88rem' }}>{stats.count} records — {stats.totalLiters.toFixed(1)} L — PKR {stats.totalCost.toLocaleString()}</p>
        </div>
        {(user?.role === 'admin' || user?.role === 'employee') && (
          <button onClick={openAdd} style={{ background:'#2D5A27', color:'white', border:'none', borderRadius:10, padding:'11px 22px', fontWeight:700, cursor:'pointer', fontFamily:'Cairo, sans-serif' }}
            onMouseEnter={e => e.currentTarget.style.background='#3a7a31'} onMouseLeave={e => e.currentTarget.style.background='#2D5A27'}>
            + Add Record
          </button>
        )}
      </div>

      {/* KPI */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px,1fr))', gap:14, marginBottom:24 }}>
        <div style={{ background:'linear-gradient(135deg,#e67e22,#d35400)', borderRadius:14, padding:'18px 20px', color:'white' }}>
          <div style={{ fontSize:'0.78rem', opacity:0.7, marginBottom:4 }}>Total Cost</div>
          <div style={{ fontSize:'1.5rem', fontWeight:800, fontFamily:'Playfair Display' }}>PKR {stats.totalCost.toLocaleString()}</div>
        </div>
        <div style={{ background:'white', borderRadius:14, padding:'18px 20px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize:'0.78rem', color:'#888', marginBottom:4 }}>Total Liters</div>
          <div style={{ fontSize:'1.5rem', fontWeight:800, color:'#e67e22', fontFamily:'Playfair Display' }}>{stats.totalLiters.toFixed(1)} L</div>
        </div>
        <div style={{ background:'white', borderRadius:14, padding:'18px 20px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize:'0.78rem', color:'#888', marginBottom:4 }}>Records</div>
          <div style={{ fontSize:'1.5rem', fontWeight:800, color:'#333', fontFamily:'Playfair Display' }}>{stats.count}</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
        {user?.role === 'admin' && (
          <select value={filterEmp} onChange={e => setFilterEmp(e.target.value)} style={{ ...inp, width:'auto', minWidth:180 }}>
            <option value="">All Employees</option>
            {employees.map(emp => <option key={emp._id} value={emp._id}>{emp.name}</option>)}
          </select>
        )}
        <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} style={{ ...inp, width:'auto', maxWidth:200 }} />
        {(filterEmp || filterMonth) && <button onClick={() => { setFilterEmp(''); setFilterMonth(''); }} style={{ background:'#fde8e8', color:'#e74c3c', border:'none', borderRadius:8, padding:'8px 14px', fontWeight:600, cursor:'pointer', fontSize:'0.82rem', fontFamily:'Cairo, sans-serif' }}>Clear</button>}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ padding:60, textAlign:'center', color:'#888' }}>
          <div style={{ width:40, height:40, border:'4px solid #fff3cd', borderTopColor:'#e67e22', borderRadius:'50%', animation:'spin .8s linear infinite', margin:'0 auto 16px' }} />
          Loading...
        </div>
      ) : records.length === 0 ? (
        <div style={{ background:'white', borderRadius:14, padding:60, textAlign:'center', boxShadow:'0 2px 16px rgba(0,0,0,0.07)' }}>
          <h3 style={{ fontFamily:'Playfair Display', marginBottom:8 }}>No Fuel Records</h3>
          <p style={{ color:'#888', fontSize:'0.88rem', marginBottom:20 }}>Start tracking fuel consumption</p>
          {(user?.role === 'admin' || user?.role === 'employee') && <button onClick={openAdd} style={{ background:'#2D5A27', color:'white', border:'none', borderRadius:10, padding:'11px 24px', fontWeight:700, cursor:'pointer', fontFamily:'Cairo, sans-serif' }}>Add First Record</button>}
        </div>
      ) : (
        <div style={{ background:'white', borderRadius:14, boxShadow:'0 2px 16px rgba(0,0,0,0.07)', overflow:'hidden' }}>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', minWidth:780 }}>
              <thead>
                <tr style={{ background:'#2D5A27' }}>
                  {['Date','Employee','Vehicle','Fuel','Liters','Cost/L','Total'].map(h => (
                    <th key={h} style={{ padding:'12px 14px', textAlign:'left', color:'white', fontSize:'0.8rem', fontWeight:600, whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                  {(user?.role === 'admin' || user?.role === 'employee') && <th style={{ padding:'12px 14px', textAlign:'left', color:'white', fontSize:'0.8rem', fontWeight:600, whiteSpace:'nowrap' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {records.map(r => (
                  <tr key={r._id} style={{ borderBottom:'1px solid #f0f0f0' }}
                    onMouseEnter={e => e.currentTarget.style.background='#fafafa'}
                    onMouseLeave={e => e.currentTarget.style.background='white'}>
                    <td style={{ padding:'12px 14px', fontSize:'0.85rem', color:'#555', whiteSpace:'nowrap' }}>{new Date(r.date).toLocaleDateString('en-PK',{day:'2-digit',month:'short',year:'numeric'})}</td>
                    <td style={{ padding:'12px 14px', fontWeight:600, color:'#1a1a1a' }}>{r.employee?.name || '—'}</td>
                    <td style={{ padding:'12px 14px', fontSize:'0.84rem', color:'#555' }}>{r.vehicleInfo}</td>
                    <td style={{ padding:'12px 14px' }}>
                      <span style={{ background: r.fuelType==='Diesel' ? '#e8f0fe' : r.fuelType==='CNG' ? '#e8f5e3' : '#fff3cd', color: r.fuelType==='Diesel' ? '#1a56db' : r.fuelType==='CNG' ? '#2D5A27' : '#856404', borderRadius:20, padding:'3px 10px', fontSize:'0.74rem', fontWeight:700 }}>{r.fuelType}</span>
                    </td>
                    <td style={{ padding:'12px 14px', fontWeight:700, fontSize:'0.88rem' }}>{r.liters} L</td>
                    <td style={{ padding:'12px 14px', fontSize:'0.85rem', color:'#888' }}>PKR {r.costPerLiter}</td>
                    <td style={{ padding:'12px 14px', fontWeight:800, color:'#e74c3c', fontSize:'0.92rem' }}>PKR {r.totalCost?.toLocaleString()}</td>
                    {(user?.role === 'admin' || (user?.role === 'employee' && (r.employee?._id || r.employee) === user?.employeeId)) && (
                      <td style={{ padding:'12px 14px' }}>
                        <div style={{ display:'flex', gap:7 }}>
                          <button onClick={() => openEdit(r)} style={{ background:'#e8f5e3', color:'#2D5A27', border:'none', borderRadius:7, padding:'5px 13px', cursor:'pointer', fontWeight:700, fontSize:'0.8rem', fontFamily:'Cairo, sans-serif' }}>Edit</button>
                          <button onClick={() => del(r._id)} style={{ background:'#fde8e8', color:'#e74c3c', border:'none', borderRadius:7, padding:'5px 10px', cursor:'pointer', fontWeight:700, fontSize:'0.8rem', fontFamily:'Cairo, sans-serif' }}>Del</button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
          onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div style={{ background:'white', borderRadius:18, width:'100%', maxWidth:500, fontFamily:'Cairo, sans-serif', boxShadow:'0 24px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ padding:'22px 26px 0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <h2 style={{ fontFamily:'Playfair Display', fontSize:'1.2rem', margin:0 }}>{editing ? 'Edit Fuel Record' : 'Add Fuel Record'}</h2>
              <button onClick={() => setModal(false)} style={{ background:'#f5f5f5', border:'none', borderRadius:8, width:34, height:34, cursor:'pointer', color:'#666' }}>✕</button>
            </div>
            <div style={{ padding:'18px 26px 26px', display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={{ display:'block', marginBottom:5, fontWeight:700, fontSize:'0.82rem', color:'#444' }}>Employee *</label>
                <select 
                  value={form.employee} 
                  onChange={e => setForm(f => ({...f, employee:e.target.value}))} 
                  style={{ ...inp, background: user?.role !== 'admin' ? '#f5f5f5' : 'white', cursor: user?.role !== 'admin' ? 'not-allowed' : 'pointer' }}
                  disabled={user?.role !== 'admin'}
                >
                  <option value="">Select Employee</option>
                  {employees.length > 0 ? (
                    employees.map(emp => <option key={emp._id} value={emp._id}>{emp.name} — {emp.role}</option>)
                  ) : (
                    user?.role === 'employee' && <option value={user.employeeId}>{user.name}</option>
                  )}
                </select>
              </div>
              <div>
                <label style={{ display:'block', marginBottom:5, fontWeight:700, fontSize:'0.82rem', color:'#444' }}>Vehicle Info *</label>
                <input type="text" value={form.vehicleInfo} onChange={e => setForm(f => ({...f, vehicleInfo:e.target.value}))} placeholder="Honda CD-70 — ABC-1234" style={inp} />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
                <div>
                  <label style={{ display:'block', marginBottom:5, fontWeight:700, fontSize:'0.82rem', color:'#444' }}>Fuel Type</label>
                  <select value={form.fuelType} onChange={e => setForm(f => ({...f, fuelType:e.target.value}))} style={inp}>
                    {['Petrol','Diesel','CNG'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display:'block', marginBottom:5, fontWeight:700, fontSize:'0.82rem', color:'#444' }}>Liters *</label>
                  <input type="number" value={form.liters} onChange={e => setForm(f => ({...f, liters:e.target.value}))} placeholder="15" min="0" step="0.1" style={inp} />
                </div>
                <div>
                  <label style={{ display:'block', marginBottom:5, fontWeight:700, fontSize:'0.82rem', color:'#444' }}>Cost/Liter *</label>
                  <input type="number" value={form.costPerLiter} onChange={e => setForm(f => ({...f, costPerLiter:e.target.value}))} placeholder="280" min="0" style={inp} />
                </div>
              </div>
              {form.liters && form.costPerLiter && (
                <div style={{ background:'#f8fdf6', borderRadius:8, padding:'10px 14px', fontSize:'0.88rem', fontWeight:700, color:'#2D5A27' }}>
                  Total: PKR {(Number(form.liters) * Number(form.costPerLiter)).toLocaleString()}
                </div>
              )}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label style={{ display:'block', marginBottom:5, fontWeight:700, fontSize:'0.82rem', color:'#444' }}>Date</label>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({...f, date:e.target.value}))} style={inp} />
                </div>
                <div>
                  <label style={{ display:'block', marginBottom:5, fontWeight:700, fontSize:'0.82rem', color:'#444' }}>Odometer (km)</label>
                  <input type="number" value={form.odometerKm} onChange={e => setForm(f => ({...f, odometerKm:e.target.value}))} placeholder="Optional" min="0" style={inp} />
                </div>
              </div>
              <div>
                <label style={{ display:'block', marginBottom:5, fontWeight:700, fontSize:'0.82rem', color:'#444' }}>Notes</label>
                <input type="text" value={form.notes} onChange={e => setForm(f => ({...f, notes:e.target.value}))} placeholder="Optional notes" style={inp} />
              </div>
              <div style={{ display:'flex', gap:12, marginTop:4 }}>
                <button onClick={save} disabled={saving} style={{ flex:1, background: saving ? '#aaa' : '#2D5A27', color:'white', border:'none', borderRadius:10, padding:12, fontWeight:700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily:'Cairo, sans-serif' }}>
                  {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Record'}
                </button>
                <button onClick={() => setModal(false)} style={{ flex:1, background:'#f5f5f5', color:'#555', border:'none', borderRadius:10, padding:12, fontWeight:700, cursor:'pointer', fontFamily:'Cairo, sans-serif' }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
};

export default FuelManager;