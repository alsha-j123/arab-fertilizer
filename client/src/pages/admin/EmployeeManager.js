import React, { useState, useEffect } from 'react';
import apiClient from '../../utils/apiClient';
import { useAuth } from '../../context/AuthContext';


const EMPTY_EMP = { name:'', role:'', phone:'', email:'', address:'', area:'', region:'', baseSalary:'', status:'active', notes:'' };

const Toast = ({ msg, type='success' }) => msg ? (
  <div style={{ position:'fixed', top:24, right:24, background: type==='success'?'#2D5A27':'#e74c3c', color:'white', padding:'12px 22px', borderRadius:10, zIndex:9999, fontWeight:600, fontSize:'0.9rem', boxShadow:'0 6px 24px rgba(0,0,0,0.2)' }}>
    {type==='success'?'✅':'❌'} {msg}
  </div>
) : null;

const EmployeeManager = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [modal, setModal]         = useState(false);
  const [editing, setEditing]     = useState(null);
  const [form, setForm]           = useState(EMPTY_EMP);
  const [selected, setSelected]   = useState(null); // viewing salary detail
  const [salModal, setSalModal]   = useState(false);
  const [salForm, setSalForm]     = useState({ month:'', amount:'', paid:false, note:'' });
  const [delId, setDelId]         = useState(null);
  const [toast, setToast]         = useState({ msg:'', type:'success' });

  const { user } = useAuth();

  useEffect(() => { load(); }, []);

  const load = () => {
    setLoading(true);
    apiClient.get('/employees')
      .then(r => setEmployees(r.data.employees || []))
      .catch(() => setEmployees([]))
      .finally(() => setLoading(false));
  };

  const flash = (msg, type='success') => { setToast({ msg, type }); setTimeout(() => setToast({ msg:'', type:'success' }), 2500); };

  const filtered = employees.filter(e => {
    const name = e.name || '';
    const role = e.role || '';
    return name.toLowerCase().includes(search.toLowerCase()) ||
           role.toLowerCase().includes(search.toLowerCase());
  });

  const openAdd  = () => {
    if (user?.role !== 'admin') return;
    setEditing(null); setForm(EMPTY_EMP); setModal(true);
  };
  const openEdit = e => {
    if (user?.role !== 'admin') return;
    setEditing(e); setForm({ name:e.name, role:e.role, phone:e.phone||'', email:e.email||'', address:e.address||'', area:e.area||'', region:e.region||'', baseSalary:String(e.baseSalary||''), status:e.status||'active', notes:e.notes||'' }); setModal(true);
  };

  const save = async () => {
    if (user?.role !== 'admin') return;
    if (!form.name.trim() || !form.role.trim()) { flash('Name and role required', 'error'); return; }
    try {
      const payload = { ...form, baseSalary: Number(form.baseSalary)||0 };
      if (editing) {
        const { data } = await apiClient.put(`/employees/${editing._id}`, payload);
        setEmployees(prev => prev.map(e => e._id===editing._id ? data.employee : e));
        if (selected?._id === editing._id) setSelected(data.employee);
        flash(`${form.name} updated`);
      } else {
        const { data } = await apiClient.post('/employees', payload);
        setEmployees(prev => [data.employee, ...prev]);
        flash(`${form.name} added`);
      }
      setModal(false);
    } catch (err) { flash(err.response?.data?.message || 'Failed', 'error'); }
  };

  const del = async id => {
    if (user?.role !== 'admin') return;
    try {
      await apiClient.delete(`/employees/${id}`);
      setEmployees(prev => prev.filter(e => e._id!==id));
      if (selected?._id === id) setSelected(null);
      setDelId(null); flash('Employee removed');
    } catch { flash('Failed to delete', 'error'); }
  };

  const addSalary = async () => {
    if (user?.role !== 'admin') return;
    if (!salForm.month || !salForm.amount) { flash('Month and amount required', 'error'); return; }
    try {
      const { data } = await apiClient.post(`/employees/${selected._id}/salary`, { ...salForm, amount: Number(salForm.amount) });
      setSelected(data.employee);
      setEmployees(prev => prev.map(e => e._id===selected._id ? data.employee : e));
      setSalModal(false); setSalForm({ month:'', amount:'', paid:false, note:'' });
      flash('Salary record added');
    } catch (err) { flash(err.response?.data?.message || 'Failed', 'error'); }
  };

  const togglePaid = async (salaryId, currentPaid) => {
    if (user?.role !== 'admin') return;
    try {
      const { data } = await apiClient.put(`/employees/${selected._id}/salary/${salaryId}`, { paid: !currentPaid, paidDate: !currentPaid ? new Date() : null });
      setSelected(data.employee);
      setEmployees(prev => prev.map(e => e._id===selected._id ? data.employee : e));
      flash(!currentPaid ? 'Marked as paid ✅' : 'Marked as pending');
    } catch { flash('Failed', 'error'); }
  };

  const delSalary = async (salaryId) => {
    if (user?.role !== 'admin') return;
    try {
      const { data } = await apiClient.delete(`/employees/${selected._id}/salary/${salaryId}`);
      setSelected(data.employee);
      setEmployees(prev => prev.map(e => e._id===selected._id ? data.employee : e));
      flash('Record deleted');
    } catch { flash('Failed', 'error'); }
  };

  const inp = { border:'1.5px solid #e0e0e0', borderRadius:8, fontSize:'0.88rem', outline:'none', fontFamily:'Cairo, sans-serif', padding:'10px 12px', width:'100%', boxSizing:'border-box' };
  const onF = e => e.target.style.borderColor='#2D5A27';
  const onB = e => e.target.style.borderColor='#e0e0e0';

  const totalSalary   = employees.reduce((s,e) => s+Number(e.baseSalary || 0),0);
  const totalPaid     = employees.reduce((s,e) => s+(e.salaryPayments||[]).filter(p=>p.paid).reduce((a,p)=>a+Number(p.amount || 0),0), 0);
  const totalPending  = employees.reduce((s,e) => s+(e.salaryPayments||[]).filter(p=>!p.paid).reduce((a,p)=>a+Number(p.amount || 0),0), 0);

  return (
    <div className="emp-container">
      <Toast msg={toast.msg} type={toast.type} />

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24, flexWrap:'wrap', gap:16 }}>
        <div>
          <h1 style={{ fontFamily:'Playfair Display', fontSize:'1.9rem', marginBottom:4 }}>
            {user?.role === 'employee' ? 'My Profile' : 'Employee Management'}
          </h1>
          <p style={{ color:'#888', fontSize:'0.88rem' }}>{user?.role === 'employee' ? 'Your personal details and records' : `${employees.filter(e=>e.status==='active').length} active employees`}</p>
        </div>
        {user?.role === 'admin' && (
          <button onClick={openAdd}
            style={{ background:'#2D5A27', color:'white', border:'none', borderRadius:10, padding:'12px 24px', fontWeight:700, cursor:'pointer', fontSize:'0.9rem', fontFamily:'Cairo, sans-serif' }}
            onMouseEnter={e=>e.currentTarget.style.background='#3a7a31'} onMouseLeave={e=>e.currentTarget.style.background='#2D5A27'}>
            + Add Employee
          </button>
        )}
      </div>

      {/* Summary Cards */}
      {user?.role === 'admin' && (
        <div className="summary-grid">
          {[
            { label:'Total Employees', value:employees.length,                                   color:'#2D5A27', icon:'👥' },
            { label:'Monthly Payroll',  value:`PKR ${totalSalary.toLocaleString()}`,            color:'#5D4037', icon:'💰' },
            { label:'Total Paid',       value:`PKR ${totalPaid.toLocaleString()}`,              color:'#27ae60', icon:'✅' },
            { label:'Pending Payment',  value:`PKR ${totalPending.toLocaleString()}`,           color:'#e74c3c', icon:'⏳' },
          ].map(c => (
            <div key={c.label} style={{ background:'white', borderRadius:12, padding:'18px 20px', boxShadow:'0 2px 12px rgba(0,0,0,0.07)', borderLeft:`4px solid ${c.color}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontSize:'0.74rem', color:'#888', textTransform:'uppercase', marginBottom:4 }}>{c.label}</div>
                <div style={{ fontWeight:800, fontSize:'1.2rem', color:c.color, fontFamily:'Playfair Display' }}>{c.value}</div>
              </div>
              <span style={{ fontSize:'1.6rem' }}>{c.icon}</span>
            </div>
          ))}
        </div>
      )}

      <div className={`main-grid ${selected ? 'split' : ''}`}>

        {/* Employee List */}
        <div>
          <div style={{ background:'white', borderRadius:12, padding:'14px 18px', marginBottom:16, boxShadow:'0 2px 8px rgba(0,0,0,0.05)' }}>
            <input type="text" placeholder="🔍 Search employees..." value={search} onChange={e=>setSearch(e.target.value)}
              style={{ ...inp }} onFocus={onF} onBlur={onB} />
          </div>

          {loading ? (
            <div style={{ padding:60, textAlign:'center', color:'#888' }}>
              <div style={{ width:40, height:40, border:'4px solid #e8f5e3', borderTopColor:'#2D5A27', borderRadius:'50%', animation:'spin .8s linear infinite', margin:'0 auto 12px' }} />
              Loading...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ background:'white', borderRadius:14, padding:60, textAlign:'center', boxShadow:'0 2px 16px rgba(0,0,0,0.07)' }}>
              <div style={{ fontSize:48, marginBottom:16 }}>👥</div>
              <h3 style={{ fontFamily:'Playfair Display', marginBottom:8 }}>No Employees Yet</h3>
              <button onClick={openAdd} style={{ background:'#2D5A27', color:'white', border:'none', borderRadius:10, padding:'11px 24px', fontWeight:700, cursor:'pointer', fontFamily:'Cairo, sans-serif' }}>+ Add First Employee</button>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {filtered.map(emp => {
                const pending = (emp.salaryPayments||[]).filter(p=>!p.paid).length;
                const isSelected = selected?._id === emp._id;
                return (
                  <div key={emp._id} onClick={() => setSelected(isSelected ? null : emp)}
                    style={{ background:'white', borderRadius:12, padding:'14px 18px', boxShadow:'0 2px 10px rgba(0,0,0,0.06)', cursor:'pointer', border:`2px solid ${isSelected?'#2D5A27':'transparent'}`, transition:'all .2s' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                      <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                        <div style={{ width:44, height:44, borderRadius:'50%', background:'linear-gradient(135deg,#2D5A27,#4a8a42)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:800, fontSize:'1.1rem', flexShrink:0 }}>
                          {emp.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <div style={{ fontWeight:700, fontSize:'0.95rem', color:'#1a1a1a' }}>{emp.name}</div>
                          <div style={{ fontSize:'0.78rem', color:'#888' }}>{emp.role}</div>
                          <div style={{ fontSize:'0.75rem', color:'#2D5A27', fontWeight:700, marginTop:2 }}>PKR {Number(emp.baseSalary || 0).toLocaleString()}/month</div>
                        </div>
                      </div>
                      <div style={{ display:'flex', flex:'column', alignItems:'flex-end', gap:6 }}>
                        <span style={{ background: emp.status==='active'?'#e8f5e3':'#f5f5f5', color: emp.status==='active'?'#2D5A27':'#888', borderRadius:20, padding:'3px 10px', fontSize:'0.72rem', fontWeight:700 }}>
                          {emp.status}
                        </span>
                        {pending > 0 && <span style={{ background:'#fde8e8', color:'#e74c3c', borderRadius:20, padding:'2px 8px', fontSize:'0.68rem', fontWeight:700 }}>{pending} pending</span>}
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:8, marginTop:10 }} onClick={e=>e.stopPropagation()}>
                      {user?.role === 'admin' && (
                        <>
                          <button onClick={()=>openEdit(emp)} style={{ background:'#e8f5e3', color:'#2D5A27', border:'none', borderRadius:7, padding:'5px 14px', cursor:'pointer', fontWeight:700, fontSize:'0.78rem', fontFamily:'Cairo, sans-serif' }}>Edit</button>
                          <button onClick={()=>setDelId(emp._id)} style={{ background:'#fde8e8', color:'#e74c3c', border:'none', borderRadius:7, padding:'5px 10px', cursor:'pointer', fontWeight:700, fontSize:'0.78rem', fontFamily:'Cairo, sans-serif' }}>Del</button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Salary Detail Panel */}
        {selected && (
          <div style={{ background:'white', borderRadius:14, boxShadow:'0 2px 16px rgba(0,0,0,0.07)', overflow:'hidden' }}>
            <div style={{ background:'linear-gradient(135deg,#1a2e18,#2D5A27)', padding:'20px 24px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ color:'#C8A951', fontFamily:'Playfair Display', fontSize:'1.1rem', fontWeight:700 }}>{selected.name}</div>
                <div style={{ color:'rgba(255,255,255,0.6)', fontSize:'0.82rem' }}>{selected.role} · PKR {Number(selected.baseSalary || 0).toLocaleString()}/month</div>
              </div>
              {user?.role === 'admin' && (
                <button onClick={()=>setSalModal(true)}
                  style={{ background:'#C8A951', color:'#1a1a1a', border:'none', borderRadius:8, padding:'8px 16px', fontWeight:700, cursor:'pointer', fontSize:'0.82rem', fontFamily:'Cairo, sans-serif' }}>
                  + Add Payment
                </button>
              )}
            </div>

            {/* Contact Info */}
            <div style={{ padding:'14px 20px', borderBottom:'1px solid #f0f0f0', display:'flex', gap:20, flexWrap:'wrap', fontSize:'0.82rem', color:'#666' }}>
              {selected.phone  && <span>📞 {selected.phone}</span>}
              {selected.email  && <span>✉️ {selected.email}</span>}
              {selected.address && <span>📍 {selected.address}</span>}
              {selected.area && <span>🏘️ {selected.area}</span>}
              {selected.region && <span>🌍 {selected.region}</span>}
            </div>

            {/* Salary summary */}
            <div className="salary-stats">
              {[
                ['Total Paid', (selected.salaryPayments||[]).filter(p=>p.paid).reduce((s,p)=>s+p.amount,0), '#27ae60'],
                ['Pending',   (selected.salaryPayments||[]).filter(p=>!p.paid).reduce((s,p)=>s+p.amount,0), '#e74c3c'],
                ['Records',   (selected.salaryPayments||[]).length, '#2D5A27'],
              ].map(([l,v,c]) => (
                <div key={l} className="salary-stat-item">
                  <div style={{ fontSize:'0.72rem', color:'#888', textTransform:'uppercase', marginBottom:4 }}>{l}</div>
                  <div style={{ fontWeight:800, color:c, fontSize:'1rem', fontFamily:'Playfair Display' }}>{typeof v==='number' && l!=='Records' ? `PKR ${v.toLocaleString()}` : v}</div>
                </div>
              ))}
            </div>

            {/* Payment records */}
            <div style={{ maxHeight:400, overflowY:'auto' }}>
              {(selected.salaryPayments||[]).length === 0 ? (
                <div style={{ padding:40, textAlign:'center', color:'#aaa' }}>
                  <div style={{ fontSize:32, marginBottom:8 }}>💳</div>
                  <p>No salary records yet. {user?.role === 'admin' && 'Click + Add Payment to start.'}</p>
                </div>
              ) : (
                [...(selected.salaryPayments||[])].reverse().map(sal => (
                  <div key={sal._id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 20px', borderBottom:'1px solid #f8f8f8' }}>
                    <div>
                      <div style={{ fontWeight:700, fontSize:'0.88rem' }}>{sal.month}</div>
                      {sal.note && <div style={{ fontSize:'0.74rem', color:'#aaa', marginTop:2 }}>📝 {sal.note}</div>}
                      {sal.paid && sal.paidDate && <div style={{ fontSize:'0.72rem', color:'#27ae60', marginTop:2 }}>Paid on {new Date(sal.paidDate).toLocaleDateString('en-PK')}</div>}
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ fontWeight:700, color:'#2D5A27', fontSize:'0.9rem' }}>PKR {Number(sal.amount).toLocaleString()}</span>
                      <button onClick={()=>togglePaid(sal._id, sal.paid)}
                        disabled={user?.role !== 'admin'}
                        style={{ background: sal.paid?'#e8f5e3':'#fff3cd', color: sal.paid?'#27ae60':'#856404', border:'none', borderRadius:20, padding:'4px 12px', cursor: user?.role === 'admin' ? 'pointer' : 'default', fontWeight:700, fontSize:'0.74rem', fontFamily:'Cairo, sans-serif', whiteSpace:'nowrap' }}>
                        {sal.paid ? '✅ Paid' : '⏳ Pending'}
                      </button>
                      {user?.role === 'admin' && (
                        <button onClick={()=>delSalary(sal._id)}
                          style={{ background:'#fde8e8', color:'#e74c3c', border:'none', borderRadius:6, padding:'4px 8px', cursor:'pointer', fontSize:'0.76rem' }}>✕</button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Delete confirm */}
      {delId && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:3000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ background:'white', borderRadius:16, padding:32, maxWidth:360, width:'100%', textAlign:'center' }}>
            <div style={{ fontSize:48, marginBottom:16 }}>🗑️</div>
            <h3 style={{ fontFamily:'Playfair Display', marginBottom:10 }}>Remove Employee?</h3>
            <p style={{ color:'#888', marginBottom:24, fontSize:'0.9rem' }}>All salary records will be kept.</p>
            <div className="form-buttons">
              <button onClick={()=>del(delId)} style={{ flex:1, background:'#e74c3c', color:'white', border:'none', borderRadius:10, padding:12, fontWeight:700, cursor:'pointer', fontFamily:'Cairo, sans-serif' }}>Remove</button>
              <button onClick={()=>setDelId(null)} style={{ flex:1, background:'#f5f5f5', color:'#555', border:'none', borderRadius:10, padding:12, fontWeight:700, cursor:'pointer', fontFamily:'Cairo, sans-serif' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Employee Modal */}
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
          onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div style={{ background:'white', borderRadius:18, width:'100%', maxWidth:520, maxHeight:'92vh', overflowY:'auto' }}>
            <div style={{ padding:'22px 26px 0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <h2 style={{ fontFamily:'Playfair Display', fontSize:'1.3rem', margin:0 }}>{editing?'✏️ Edit Employee':'👤 Add Employee'}</h2>
              <button onClick={()=>setModal(false)} style={{ background:'#f5f5f5', border:'none', borderRadius:8, width:34, height:34, cursor:'pointer', fontSize:'1rem', color:'#666' }}>✕</button>
            </div>
            <div style={{ padding:'18px 26px 26px', display:'flex', flexDirection:'column', gap:13 }}>
              {[['name','Full Name *','text'],['role','Job Title / Role *','text'],['phone','Phone','tel'],['email','Email','email'],['address','Address','text'],['area','Area','text'],['region','Region','text']].map(([k,l,t])=>(
                <div key={k}>
                  <label style={{ display:'block', marginBottom:5, fontWeight:700, fontSize:'0.82rem', color:'#444' }}>{l}</label>
                  <input type={t} value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} style={inp} onFocus={onF} onBlur={onB} />
                </div>
              ))}
              <div className="form-row-2col">
                <div>
                  <label style={{ display:'block', marginBottom:5, fontWeight:700, fontSize:'0.82rem', color:'#444' }}>Base Salary (PKR)</label>
                  <input type="number" value={form.baseSalary} onChange={e=>setForm(f=>({...f,baseSalary:e.target.value}))} placeholder="0" min="0" style={inp} onFocus={onF} onBlur={onB} />
                </div>
                <div>
                  <label style={{ display:'block', marginBottom:5, fontWeight:700, fontSize:'0.82rem', color:'#444' }}>Status</label>
                  <select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))} style={{ ...inp }}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display:'block', marginBottom:5, fontWeight:700, fontSize:'0.82rem', color:'#444' }}>Notes</label>
                <textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} rows={2} style={{ ...inp, resize:'vertical' }} onFocus={onF} onBlur={onB} />
              </div>
              <div className="form-buttons">
                <button onClick={save} style={{ flex:1, background:'#2D5A27', color:'white', border:'none', borderRadius:10, padding:13, fontWeight:700, cursor:'pointer', fontFamily:'Cairo, sans-serif' }}
                  onMouseEnter={e=>e.currentTarget.style.background='#3a7a31'} onMouseLeave={e=>e.currentTarget.style.background='#2D5A27'}>
                  {editing?'💾 Save Changes':'👤 Add Employee'}
                </button>
                <button onClick={()=>setModal(false)} style={{ flex:1, background:'#f5f5f5', color:'#555', border:'none', borderRadius:10, padding:13, fontWeight:700, cursor:'pointer', fontFamily:'Cairo, sans-serif' }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Salary Modal */}
      {salModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
          onClick={e=>e.target===e.currentTarget&&setSalModal(false)}>
          <div style={{ background:'white', borderRadius:18, width:'100%', maxWidth:440 }}>
            <div style={{ padding:'22px 26px 0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <h2 style={{ fontFamily:'Playfair Display', fontSize:'1.3rem', margin:0 }}>💳 Add Salary Record</h2>
              <button onClick={()=>setSalModal(false)} style={{ background:'#f5f5f5', border:'none', borderRadius:8, width:34, height:34, cursor:'pointer', color:'#666' }}>✕</button>
            </div>
            <div style={{ padding:'18px 26px 26px', display:'flex', flexDirection:'column', gap:13 }}>
              <div>
                <label style={{ display:'block', marginBottom:5, fontWeight:700, fontSize:'0.82rem', color:'#444' }}>Month *</label>
                <input type="month" value={salForm.month} onChange={e=>setSalForm(f=>({...f,month:e.target.value}))} style={inp} onFocus={onF} onBlur={onB} />
              </div>
              <div>
                <label style={{ display:'block', marginBottom:5, fontWeight:700, fontSize:'0.82rem', color:'#444' }}>Amount (PKR) *</label>
                <input type="number" value={salForm.amount} onChange={e=>setSalForm(f=>({...f,amount:e.target.value}))} placeholder={String(selected?.baseSalary||0)} min="0" style={inp} onFocus={onF} onBlur={onB} />
                <p style={{ color:'#aaa', fontSize:'0.74rem', margin:'4px 0 0' }}>Base salary: PKR {(selected?.baseSalary||0).toLocaleString()}</p>
              </div>
              <div>
                <label style={{ display:'block', marginBottom:5, fontWeight:700, fontSize:'0.82rem', color:'#444' }}>Note (optional)</label>
                <input type="text" value={salForm.note} onChange={e=>setSalForm(f=>({...f,note:e.target.value}))} placeholder="e.g. includes bonus" style={inp} onFocus={onF} onBlur={onB} />
              </div>
              <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', fontWeight:600, fontSize:'0.85rem', color:'#444' }}>
                <input type="checkbox" checked={salForm.paid} onChange={e=>setSalForm(f=>({...f,paid:e.target.checked}))} style={{ width:16, height:16, accentColor:'#2D5A27' }} />
                Mark as Paid immediately
              </label>
              <div className="form-buttons">
                <button onClick={addSalary} style={{ flex:1, background:'#2D5A27', color:'white', border:'none', borderRadius:10, padding:13, fontWeight:700, cursor:'pointer', fontFamily:'Cairo, sans-serif' }}
                  onMouseEnter={e=>e.currentTarget.style.background='#3a7a31'} onMouseLeave={e=>e.currentTarget.style.background='#2D5A27'}>
                  💳 Add Record
                </button>
                <button onClick={()=>setSalModal(false)} style={{ flex:1, background:'#f5f5f5', color:'#555', border:'none', borderRadius:10, padding:13, fontWeight:700, cursor:'pointer', fontFamily:'Cairo, sans-serif' }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        
        .emp-container {
          padding: 32px;
          max-width: 1200px;
          margin: 0 auto;
          font-family: 'Cairo', sans-serif;
          box-sizing: border-box;
        }
        
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }
        
        .main-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }
        
        .form-row-2col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .salary-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0;
          border-bottom: 1px solid #f0f0f0;
        }

        .salary-stat-item {
          padding: 14px;
          text-align: center;
          border-right: 1px solid #f0f0f0;
        }
        
        @media (min-width: 901px) {
          .main-grid.split {
            grid-template-columns: 1fr 1.4fr;
          }
        }
        
        @media (max-width: 1024px) {
          .summary-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        
        @media (max-width: 768px) {
          .emp-container {
            padding: 16px;
          }
        }
        
        @media (max-width: 480px) {
          .summary-grid {
            grid-template-columns: 1fr;
          }
          .form-row-2col {
            grid-template-columns: 1fr;
          }
          .salary-stats {
            grid-template-columns: 1fr;
          }
          .salary-stat-item {
            border-right: none;
            border-bottom: 1px solid #f0f0f0;
          }
          .salary-stat-item:last-child {
            border-bottom: none;
          }
          .form-buttons {
            display: flex;
            flex-direction: column-reverse;
            gap: 12px;
            margin-top: 6px;
          }
          .form-buttons button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};
export default EmployeeManager;