// Salary management page with secure authorization guards
import React, { useState, useEffect, useMemo } from 'react';
import apiClient from '../../utils/apiClient';
import { useAuth } from '../../context/AuthContext';



const Toast = ({ msg, type = 'success' }) => msg ? (
  <div style={{ position: 'fixed', top: 24, right: 24, background: type === 'success' ? '#2D5A27' : '#e74c3c', color: 'white', padding: '12px 22px', borderRadius: 10, zIndex: 9999, fontWeight: 600, fontSize: '0.9rem', boxShadow: '0 6px 24px rgba(0,0,0,0.2)' }}>
    {type === 'success' ? '✅' : '❌'} {msg}
  </div>
) : null;

const EMPTY = { employeeId: '', month: '', amount: '', paid: false, note: '' };

const SalaryManager = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ msg: '', type: 'success' });
  const [modal, setModal] = useState(false);
  
  const [form, setForm] = useState(EMPTY);
  const [filterMonth, setFilterMonth] = useState('');
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [delInfo, setDelInfo] = useState(null);

  const { user } = useAuth();

  const fetchEmployees = () => {
    setLoading(true);
    // If employee, they can only fetch their own data
    apiClient.get('/employees')
      .then(r => setEmployees(r.data.employees || []))
      .catch(() => setEmployees([]))
      .finally(() => setLoading(false));
  };
  useEffect(() => { fetchEmployees(); }, []);

  const flash = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast({ msg: '', type: 'success' }), 2500); };

  const openAdd = () => {
    if (user?.role !== 'admin') return;
    const now = new Date();
    setForm({ employeeId: '', month: `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`, amount: '', paid: false, note: '' });
    setModal(true);
  };

  const handleEmployeeSelect = (empId) => {
    const emp = employees.find(e => e._id === empId);
    setForm(f => ({ ...f, employeeId: empId, amount: emp ? String(emp.baseSalary || '') : f.amount }));
  };

  const save = async () => {
    if (user?.role !== 'admin') return;
    if (!form.employeeId || !form.month || !form.amount) { flash('Employee, Month, and Amount are required', 'error'); return; }
    setSaving(true);
    try {
      const { data } = await apiClient.post(`/employees/${form.employeeId}/salary`, {
        month: form.month, amount: Number(form.amount), paid: form.paid,
        paidDate: form.paid ? new Date() : null, note: form.note
      });
      setEmployees(prev => prev.map(e => e._id === form.employeeId ? data.employee : e));
      flash('Salary record added');
      setModal(false);
    } catch (err) { flash(err.response?.data?.message || 'Failed', 'error'); }
    finally { setSaving(false); }
  };

  const togglePaid = async (empId, salId, currentPaid) => {
    if (user?.role !== 'admin') return;
    try {
      const { data } = await apiClient.put(`/employees/${empId}/salary/${salId}`, { paid: !currentPaid, paidDate: !currentPaid ? new Date() : null });
      setEmployees(prev => prev.map(e => e._id === empId ? data.employee : e));
      flash(currentPaid ? 'Marked unpaid' : 'Marked as paid ✅');
    } catch { flash('Failed to update', 'error'); }
  };

  const delSalary = async () => {
    if (user?.role !== 'admin') return;
    if (!delInfo) return;
    try {
      const { data } = await apiClient.delete(`/employees/${delInfo.empId}/salary/${delInfo.salId}`);
      setEmployees(prev => prev.map(e => e._id === delInfo.empId ? data.employee : e));
      flash('Salary record removed');
      setDelInfo(null);
    } catch { flash('Failed to delete', 'error'); }
  };

  /* Flatten all salary records for the table */
  const allRecords = useMemo(() => {
    const records = [];
    employees.forEach(emp => {
      (emp.salaryPayments || []).forEach(sal => {
        records.push({ ...sal, empId: emp._id, empName: emp.name, empRole: emp.role, baseSalary: emp.baseSalary });
      });
    });
    // Sort by month descending
    records.sort((a, b) => (b.month || '').localeCompare(a.month || ''));
    
    return records.filter(r => {
      const matchSearch = r.empName.toLowerCase().includes(search.toLowerCase()) || r.empRole.toLowerCase().includes(search.toLowerCase());
      const matchMonth = filterMonth ? r.month === filterMonth : true;
      return matchSearch && matchMonth;
    });
  }, [employees, search, filterMonth]);

  const stats = useMemo(() => {
    const totalPaid = allRecords.filter(r => r.paid).reduce((s, r) => s + r.amount, 0);
    const totalPending = allRecords.filter(r => !r.paid).reduce((s, r) => s + r.amount, 0);
    return { totalPaid, totalPending, count: allRecords.length };
  }, [allRecords]);

  const inp = { border: '1.5px solid #e0e0e0', borderRadius: 8, fontSize: '0.88rem', outline: 'none', fontFamily: 'Cairo, sans-serif', padding: '10px 12px', width: '100%', boxSizing: 'border-box' };
  const onF = e => e.target.style.borderColor = '#2D5A27';
  const onB = e => e.target.style.borderColor = '#e0e0e0';

  return (
    <div style={{ padding: 'clamp(16px, 3vw, 32px)', maxWidth: 1100, fontFamily: 'Cairo, sans-serif' }}>
      <Toast msg={toast.msg} type={toast.type} />
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: 'Playfair Display', fontSize: '1.9rem', marginBottom: 4 }}>
            {user?.role === 'employee' ? 'My Salaries' : 'Employee Salaries'}
          </h1>
          <p style={{ color: '#888', fontSize: '0.88rem' }}>
            {user?.role === 'employee' ? 'View your monthly salary disbursements' : 'Manage monthly salary disbursements'}
          </p>
        </div>
        {user?.role === 'admin' && (
          <button onClick={openAdd}
            style={{ background: '#2D5A27', color: 'white', border: 'none', borderRadius: 10, padding: '12px 24px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem', fontFamily: 'Cairo, sans-serif' }}
            onMouseEnter={e => e.currentTarget.style.background = '#3a7a31'} onMouseLeave={e => e.currentTarget.style.background = '#2D5A27'}>
            + Add Salary
          </button>
        )}
      </div>

      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
        <div style={{ background: 'linear-gradient(135deg,#2D5A27,#3a7a31)', borderRadius: 14, padding: '18px 20px', color: 'white' }}>
          <div style={{ fontSize: '0.78rem', opacity: 0.7, marginBottom: 4 }}>Total Paid</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'Playfair Display' }}>PKR {stats.totalPaid.toLocaleString()}</div>
        </div>
        <div style={{ background: 'white', borderRadius: 14, padding: '18px 20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: '0.78rem', color: '#888', marginBottom: 4 }}>Pending Disbursement</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#e74c3c', fontFamily: 'Playfair Display' }}>PKR {stats.totalPending.toLocaleString()}</div>
        </div>
        <div style={{ background: 'white', borderRadius: 14, padding: '18px 20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: '0.78rem', color: '#888', marginBottom: 4 }}>Records</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#333', fontFamily: 'Playfair Display' }}>{stats.count}</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        {user?.role === 'admin' && (
          <input type="text" placeholder="🔍 Search employee by name or role..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ ...inp, width: 'auto', flex: 1, minWidth: 200 }} onFocus={onF} onBlur={onB} />
        )}
        <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} style={{ ...inp, width: 'auto' }} onFocus={onF} onBlur={onB} />
        {filterMonth && <button onClick={() => setFilterMonth('')} style={{ background: '#fde8e8', color: '#e74c3c', border: 'none', borderRadius: 8, padding: '10px 14px', fontWeight: 600, cursor: 'pointer', fontSize: '0.82rem', fontFamily: 'Cairo, sans-serif' }}>Clear Month</button>}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: '#888' }}>
          <div style={{ width: 40, height: 40, border: '4px solid #e8f5e3', borderTopColor: '#2D5A27', borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto 16px' }} />
          Loading Salaries...
        </div>
      ) : allRecords.length === 0 ? (
        <div style={{ background: 'white', borderRadius: 14, padding: 60, textAlign: 'center', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>💳</div>
          <h3 style={{ fontFamily: 'Playfair Display', marginBottom: 8 }}>No Salary Records Found</h3>
          <p style={{ color: '#888', fontSize: '0.88rem', marginBottom: 20 }}>There are no salary records matching your search.</p>
          {user?.role === 'admin' && <button onClick={openAdd} style={{ background: '#2D5A27', color: 'white', border: 'none', borderRadius: 10, padding: '11px 24px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>+ Add First Salary</button>}
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: 14, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 780 }}>
              <thead>
                <tr style={{ background: '#2D5A27' }}>
                  {['Month', 'Employee', 'Role', 'Amount', 'Status', 'Paid Date', 'Notes'].map(h => (
                    <th key={h} style={{ padding: '13px 14px', textAlign: 'left', color: 'white', fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                  {user?.role === 'admin' && <th style={{ padding: '13px 14px', textAlign: 'left', color: 'white', fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {allRecords.map(r => (
                  <tr key={r._id} style={{ borderBottom: '1px solid #f0f0f0' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                    onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                    <td style={{ padding: '14px', fontWeight: 700, fontSize: '0.9rem', color: '#333' }}>{r.month}</td>
                    <td style={{ padding: '14px', fontWeight: 600, color: '#1a1a1a', fontSize: '0.9rem' }}>{r.empName}</td>
                    <td style={{ padding: '14px', fontSize: '0.82rem', color: '#888' }}>{r.empRole}</td>
                    <td style={{ padding: '14px', fontWeight: 800, color: '#2D5A27', fontSize: '0.95rem' }}>PKR {r.amount?.toLocaleString()}</td>
                    <td style={{ padding: '14px' }}>
                      <button onClick={() => togglePaid(r.empId, r._id, r.paid)}
                        disabled={user?.role !== 'admin'}
                        style={{ background: r.paid ? '#e8f5e3' : '#fff3cd', color: r.paid ? '#27ae60' : '#856404', border: 'none', borderRadius: 20, padding: '4px 14px', cursor: user?.role === 'admin' ? 'pointer' : 'default', fontWeight: 700, fontSize: '0.78rem', fontFamily: 'Cairo, sans-serif', transition: 'transform 0.1s' }}
                        onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'} onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}>
                        {r.paid ? '✅ Paid' : '⏳ Pending'}
                      </button>
                    </td>
                    <td style={{ padding: '14px', fontSize: '0.82rem', color: '#888', whiteSpace: 'nowrap' }}>{r.paid && r.paidDate ? new Date(r.paidDate).toLocaleDateString('en-PK') : '—'}</td>
                    <td style={{ padding: '14px', fontSize: '0.82rem', color: '#555', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.note || '—'}</td>
                    {user?.role === 'admin' && (
                      <td style={{ padding: '14px' }}>
                        <button onClick={() => setDelInfo({ empId: r.empId, salId: r._id })} style={{ background: '#fde8e8', color: '#e74c3c', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', fontFamily: 'Cairo, sans-serif' }}>Remove</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {delInfo && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 32, maxWidth: 360, width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🗑️</div>
            <h3 style={{ fontFamily: 'Playfair Display', marginBottom: 10 }}>Remove Record?</h3>
            <p style={{ color: '#888', marginBottom: 24, fontSize: '0.9rem' }}>This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={delSalary} style={{ flex: 1, background: '#e74c3c', color: 'white', border: 'none', borderRadius: 10, padding: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>Remove</button>
              <button onClick={() => setDelInfo(null)} style={{ flex: 1, background: '#f5f5f5', color: '#555', border: 'none', borderRadius: 10, padding: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div style={{ background: 'white', borderRadius: 18, width: '100%', maxWidth: 460, fontFamily: 'Cairo, sans-serif', boxShadow: '0 24px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ padding: '22px 26px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontFamily: 'Playfair Display', fontSize: '1.3rem', margin: 0 }}>💳 Add Salary Record</h2>
              <button onClick={() => setModal(false)} style={{ background: '#f5f5f5', border: 'none', borderRadius: 8, width: 34, height: 34, cursor: 'pointer', color: '#666' }}>✕</button>
            </div>
            <div style={{ padding: '18px 26px 26px', display: 'flex', flexDirection: 'column', gap: 15 }}>
              
              <div>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 700, fontSize: '0.82rem', color: '#444' }}>Employee *</label>
                <select value={form.employeeId} onChange={e => handleEmployeeSelect(e.target.value)} style={inp} onFocus={onF} onBlur={onB}>
                  <option value="">Select Employee...</option>
                  {employees.map(emp => <option key={emp._id} value={emp._id}>{emp.name} — {emp.role}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 5, fontWeight: 700, fontSize: '0.82rem', color: '#444' }}>Month *</label>
                  <input type="month" value={form.month} onChange={e => setForm(f => ({ ...f, month: e.target.value }))} style={inp} onFocus={onF} onBlur={onB} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 5, fontWeight: 700, fontSize: '0.82rem', color: '#444' }}>Amount (PKR) *</label>
                  <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0" min="0" style={inp} onFocus={onF} onBlur={onB} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 700, fontSize: '0.82rem', color: '#444' }}>Notes (optional)</label>
                <input type="text" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="Bonus, deduction, etc." style={inp} onFocus={onF} onBlur={onB} />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', color: '#444', background: '#f8fdf6', padding: '12px 14px', borderRadius: 8 }}>
                <input type="checkbox" checked={form.paid} onChange={e => setForm(f => ({ ...f, paid: e.target.checked }))} style={{ accentColor: '#2D5A27', width: 18, height: 18 }} />
                Mark as Paid Immediately
              </label>

              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button onClick={save} disabled={saving} style={{ flex: 1, background: saving ? '#aaa' : '#2D5A27', color: 'white', border: 'none', borderRadius: 10, padding: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'Cairo, sans-serif' }}
                  onMouseEnter={e => { if (!saving) e.currentTarget.style.background = '#3a7a31' }} onMouseLeave={e => { if (!saving) e.currentTarget.style.background = '#2D5A27' }}>
                  {saving ? 'Saving...' : '💳 Save Record'}
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

export default SalaryManager;
