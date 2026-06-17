import React, { useState, useEffect, useMemo } from 'react';
import apiClient from '../../utils/apiClient';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';



const EMPTY = { title: '', amount: '', category: '', date: new Date().toISOString().split('T')[0], notes: '', employee: '' };

const Toast = ({ msg }) => msg ? (
  <div style={{ position: 'fixed', top: 24, right: 24, background: '#2D5A27', color: 'white', padding: '12px 22px', borderRadius: 10, zIndex: 9999, fontWeight: 600, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
    ✅ {msg}
  </div>
) : null;

const ExpenseManager = () => {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [employees, setEmployees]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(false);
  const [catModal, setCatModal] = useState(false);
  const [editing, setEditing]   = useState(null);
  const [form, setForm]         = useState(EMPTY);
  const [toast, setToast]       = useState('');
  const [saving, setSaving]     = useState(false);
  const [filterMonth, setFilterMonth] = useState('');
  const [filterCat, setFilterCat]     = useState('');
  
  // Category management state
  const [newCat, setNewCat] = useState({ name: '', description: '', color: '#2D5A27' });

  const { user, loading: authLoading } = useAuth();

  const fetchCategories = async () => {
    try {
      const r = await apiClient.get('/expenses/categories');
      setCategories(r.data.categories || []);
      if (r.data.categories?.length > 0 && !form.category) {
        setForm(f => ({ ...f, category: r.data.categories[0]._id }));
      }
    } catch (err) { console.error('Failed to fetch categories', err); }
  };

  const fetchExpenses = () => {
    setLoading(true);
    const params = {};
    if (filterMonth) params.month = filterMonth;
    if (filterCat) params.category = filterCat;
    apiClient.get('/expenses', { params })
      .then(r => setExpenses(r.data.expenses || []))
      .catch(err => {
        console.error('Failed to fetch expenses:', err?.response?.status, err?.response?.data?.message || err.message);
        // Do NOT reset to [] on error — keep previous data so a transient failure doesn't blank the page
      })
      .finally(() => setLoading(false));
  };

  const fetchEmployees = async () => {
    if (user?.role === 'admin') {
      try {
        const r = await apiClient.get('/employees');
        setEmployees(r.data.employees || []);
      } catch (err) { console.error('Failed to fetch employees', err); }
    }
  };

  useEffect(() => { 
    // Wait for AuthContext to finish loading the user before making authenticated API calls.
    // Without this guard, on page refresh the API calls fire before the token is ready,
    // returning 401/403 which caused the blank page bug.
    if (authLoading) return;
    fetchCategories();
    fetchExpenses(); 
    fetchEmployees();
  }, [filterMonth, filterCat, authLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  const flash = msg => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const stats = useMemo(() => {
    const total = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
    const byCategory = {};
    expenses.forEach(e => { 
      const catName = e.category?.name || 'Uncategorized';
      byCategory[catName] = (byCategory[catName] || 0) + Number(e.amount || 0); 
    });
    return { total, byCategory, count: expenses.length };
  }, [expenses]);

  /* ── Category helpers ── */
  const saveCategory = async () => {
    if (!newCat.name.trim()) return;
    try {
      const { data } = await apiClient.post('/expenses/categories', newCat);
      setCategories([...categories, data.category]);
      setNewCat({ name: '', description: '', color: '#2D5A27' });
      flash('Category added');
    } catch (err) { alert(err.response?.data?.message || 'Failed to add category'); }
  };

  const deleteCategory = async id => {
    if (!window.confirm('Deactivate this category? It will no longer appear in selection.')) return;
    try {
      await apiClient.delete(`/expenses/categories/${id}`);
      setCategories(categories.filter(c => c._id !== id));
      flash('Category removed');
    } catch { alert('Failed to delete'); }
  };

  /* ── Expense helpers ── */
  const openAdd = () => { 
    setEditing(null); 
    setForm({ ...EMPTY, category: categories[0]?._id || '' }); 
    setModal(true); 
  };

  const openEdit = exp => {
    setEditing(exp);
    const validDate = exp.date && !isNaN(new Date(exp.date).getTime())
      ? new Date(exp.date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];
    setForm({
      title: exp.title || '',
      amount: String(exp.amount || ''),
      category: exp.category?._id || '',
      date: validDate,
      notes: exp.notes || '',
      employee: exp.employee?._id || exp.employee || '',
    });
    setModal(true);
  };

  const save = async () => {
    if (!form.title.trim() || !form.amount || !form.category) { alert('Title, amount and category are required'); return; }
    setSaving(true);
    try {
      if (editing) {
        const { data } = await apiClient.put(`/expenses/${editing._id}`, form);
        setExpenses(prev => prev.map(e => e._id === editing._id ? data.expense : e));
        flash('Expense updated');
      } else {
        const { data } = await apiClient.post('/expenses', form);
        setExpenses(prev => [data.expense, ...prev]);
        flash('Expense added');
      }
      setModal(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const del = async id => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await apiClient.delete(`/expenses/${id}`);
      setExpenses(prev => prev.filter(e => e._id !== id));
      flash('Expense deleted');
    } catch { alert('Failed to delete'); }
  };

  /* ── Styles ── */
  const inp = { border: '1.5px solid #e0e0e0', borderRadius: 8, fontSize: '0.88rem', outline: 'none', fontFamily: 'Cairo, sans-serif', padding: '10px 12px', width: '100%', boxSizing: 'border-box', transition: 'border-color .2s' };
  
  return (
    <div style={{ padding: '32px clamp(16px,4vw,32px)', maxWidth: 1150, margin: '0 auto', fontFamily: 'Cairo, sans-serif' }}>
      <Toast msg={toast} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: 'Playfair Display', fontSize: 'clamp(1.6rem,4vw,2.2rem)', color: '#1a1a1a', marginBottom: 6 }}>
            {user?.role === 'employee' ? 'My Expenses' : 'Expense Management'}
          </h1>
          <p style={{ color: '#888', fontSize: '0.95rem' }}>Track and manage company expenditures across {categories.length} categories</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {user?.role === 'admin' && (
            <button onClick={() => setCatModal(true)} style={{ background: 'white', color: '#2D5A27', border: '1.5px solid #2D5A27', borderRadius: 10, padding: '11px 22px', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem' }}>
              ⚙️ Categories
            </button>
          )}
          {user?.role === 'admin' && (
            <button onClick={openAdd} style={{ background: '#2D5A27', color: 'white', border: 'none', borderRadius: 10, padding: '11px 22px', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem' }}>
              + Add Expense
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 32 }}>
        <div style={{ background: 'linear-gradient(135deg,#2D5A27,#3a7a31)', borderRadius: 20, padding: '24px', color: 'white', boxShadow: '0 10px 30px rgba(45,90,39,0.15)' }}>
          <div style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: 8, fontWeight: 600 }}>TOTAL SPENDING</div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, fontFamily: 'Playfair Display' }}>PKR {stats.total.toLocaleString()}</div>
          <div style={{ fontSize: '0.75rem', marginTop: 10, opacity: 0.7 }}>Across {stats.count} individual logs</div>
        </div>
        
        <div style={{ background: 'white', borderRadius: 20, padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid #f0f0f0' }}>
          <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: 12, fontWeight: 700 }}>TOP SPENDING CATEGORY</div>
          {Object.entries(stats.byCategory).length > 0 ? (
            <>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1a1a1a', fontFamily: 'Playfair Display' }}>
                {Object.entries(stats.byCategory).sort((a, b) => b[1] - a[1])[0][0]}
              </div>
              <div style={{ color: '#e74c3c', fontWeight: 700, marginTop: 4 }}>
                PKR {Object.entries(stats.byCategory).sort((a, b) => b[1] - a[1])[0][1].toLocaleString()}
              </div>
            </>
          ) : <div style={{ color: '#ccc' }}>No data yet</div>}
        </div>

        <div style={{ background: 'white', borderRadius: 20, padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid #f0f0f0' }}>
          <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: 12, fontWeight: 700 }}>ENTRIES THIS PERIOD</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2D5A27', fontFamily: 'Playfair Display' }}>{stats.count}</div>
          <div style={{ fontSize: '0.75rem', color: '#888', marginTop: 4 }}>Total logs found</div>
        </div>
      </div>

      {/* Filters & Actions */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center', background: 'white', padding: 16, borderRadius: 16, boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#888' }}>FILTER:</span>
          <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
            style={{ ...inp, width: 'auto', padding: '8px 12px' }} />
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ ...inp, width: 'auto', minWidth: 160, padding: '8px 12px' }}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>
        {(filterMonth || filterCat) && (
          <button onClick={() => { setFilterMonth(''); setFilterCat(''); }} style={{ background: '#fde8e8', color: '#e74c3c', border: 'none', borderRadius: 8, padding: '9px 16px', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}>
            ✕ Clear
          </button>
        )}
      </div>

      {/* List / Table */}
      <div style={{ background: 'white', borderRadius: 20, boxShadow: '0 10px 40px rgba(0,0,0,0.06)', overflow: 'hidden', border: '1px solid #f0f0f0' }}>
        {(loading || authLoading) ? (
          <div style={{ padding: 80, textAlign: 'center' }}>
            <div className="spin" style={{ width: 40, height: 40, border: '4px solid #f3f3f3', borderTop: '4px solid #2D5A27', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
            <p style={{ color: '#888' }}>Fetching expenses...</p>
          </div>
        ) : expenses.length === 0 ? (
          <div style={{ padding: 80, textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>📊</div>
            <h3 style={{ fontFamily: 'Playfair Display' }}>No Records Found</h3>
            <p style={{ color: '#888' }}>Try adjusting your filters or add a new expense.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fdf6', borderBottom: '2px solid #edf5ec' }}>
                  <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '0.8rem', color: '#2D5A27', fontWeight: 700 }}>DATE</th>
                  <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '0.8rem', color: '#2D5A27', fontWeight: 700 }}>EXPENSE TITLE</th>
                  <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '0.8rem', color: '#2D5A27', fontWeight: 700 }}>CATEGORY</th>
                  <th style={{ padding: '16px 20px', textAlign: 'right', fontSize: '0.8rem', color: '#2D5A27', fontWeight: 700 }}>AMOUNT</th>
                  {user?.role === 'admin' && <th style={{ padding: '16px 20px', textAlign: 'center', fontSize: '0.8rem', color: '#2D5A27', fontWeight: 700 }}>ACTIONS</th>}
                </tr>
              </thead>
              <tbody>
                {expenses.map(exp => (
                  <tr key={exp._id} style={{ borderBottom: '1px solid #f8f8f8' }}>
                    <td style={{ padding: '16px 20px', fontSize: '0.88rem', color: '#666' }}>
                      {exp.date && !isNaN(new Date(exp.date).getTime())
                        ? new Date(exp.date).toLocaleDateString('en-PK', { day: '2-digit', month: 'short' })
                        : '—'}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#1a1a1a' }}>{exp.title}</div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4, flexWrap: 'wrap' }}>
                        {exp.notes && <span style={{ fontSize: '0.72rem', color: '#aaa' }}>{exp.notes}</span>}
                        {exp.employee?.name && (
                          <span style={{ background: '#f0f4ff', color: '#3949ab', padding: '2px 8px', borderRadius: 12, fontSize: '0.68rem', fontWeight: 700 }}>
                            👤 {exp.employee.name}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ background: `${exp.category?.color || '#2D5A27'}12`, color: exp.category?.color || '#2D5A27', padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700 }}>
                        {exp.category?.name || 'Uncategorized'}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right', fontWeight: 800, color: '#e74c3c', fontSize: '0.95rem' }}>
                      PKR {Number(exp.amount || 0).toLocaleString()}
                    </td>
                    {user?.role === 'admin' && (
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                          <button onClick={() => openEdit(exp)} style={{ background: '#e8f5e3', color: '#2D5A27', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem' }}>Edit</button>
                          <button onClick={() => del(exp._id)} style={{ background: '#fde8e8', color: '#e74c3c', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem' }}>✕</button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Category breakdown footer */}
        <div style={{ padding: '20px 24px', background: '#fafafa', borderTop: '1px solid #f0f0f0', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#888', marginRight: 4 }}>BREAKDOWN BY CATEGORY:</span>
          {Object.entries(stats.byCategory).map(([name, total]) => (
            <div key={name} style={{ background: 'white', border: '1px solid #eee', padding: '5px 12px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 700 }}>
              {name}: <span style={{ color: '#e74c3c' }}>PKR {Number(total || 0).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Category Management Modal */}
      <AnimatePresence>
        {catModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              style={{ background: 'white', borderRadius: 24, padding: 32, width: '100%', maxWidth: 500, boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontFamily: 'Playfair Display', margin: 0 }}>Manage Categories</h2>
                <button onClick={() => setCatModal(false)} style={{ background: '#f5f5f5', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer' }}>✕</button>
              </div>

              {/* Add New Category */}
              <div style={{ background: '#f9f9f9', padding: 16, borderRadius: 16, marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                  <input type="text" value={newCat.name} onChange={e => setNewCat({ ...newCat, name: e.target.value })} placeholder="New category name..." style={{ ...inp, flex: 1 }} />
                  <input type="color" value={newCat.color} onChange={e => setNewCat({ ...newCat, color: e.target.value })} style={{ width: 45, height: 45, padding: 0, border: 'none', borderRadius: 8, cursor: 'pointer', background: 'none' }} />
                </div>
                <button onClick={saveCategory} style={{ width: '100%', background: '#2D5A27', color: 'white', border: 'none', borderRadius: 10, padding: 12, fontWeight: 700, cursor: 'pointer' }}>
                  Create Category
                </button>
              </div>

              {/* Category List */}
              <div style={{ maxHeight: 250, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {categories.map(cat => (
                  <div key={cat._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#fff', border: '1px solid #eee', borderRadius: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 12, height: 12, borderRadius: '50%', background: cat.color }} />
                      <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{cat.name}</span>
                    </div>
                    <button onClick={() => deleteCategory(cat._id)} style={{ color: '#e74c3c', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}>✕ Remove</button>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Expense Modal */}
      <AnimatePresence>
        {modal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
              style={{ background: 'white', borderRadius: 24, padding: 32, width: '100%', maxWidth: 500, boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
              <h2 style={{ fontFamily: 'Playfair Display', marginBottom: 24 }}>{editing ? 'Edit Expense' : 'Add New Expense'}</h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 700, fontSize: '0.85rem' }}>Expense Title *</label>
                  <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Office Stationeries" style={inp} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: 6, fontWeight: 700, fontSize: '0.85rem' }}>Amount (PKR) *</label>
                    <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="500" style={inp} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 6, fontWeight: 700, fontSize: '0.85rem' }}>Category *</label>
                    <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={inp}>
                      <option value="">Select Category</option>
                      {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 700, fontSize: '0.85rem' }}>Date *</label>
                  <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={inp} />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 700, fontSize: '0.85rem' }}>Notes</label>
                  <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} style={{ ...inp, resize: 'none' }} placeholder="Optional details..." />
                </div>

                {user?.role === 'admin' && (
                  <div>
                    <label style={{ display: 'block', marginBottom: 6, fontWeight: 700, fontSize: '0.85rem' }}>Link to Employee (Optional)</label>
                    <select value={form.employee} onChange={e => setForm({ ...form, employee: e.target.value })} style={inp}>
                      <option value="">No Employee (General Expense)</option>
                      {employees.map(emp => <option key={emp._id} value={emp._id}>{emp.name} ({emp.role})</option>)}
                    </select>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
                  <button onClick={save} disabled={saving} style={{ flex: 2, background: '#2D5A27', color: 'white', border: 'none', borderRadius: 12, padding: 14, fontWeight: 700, cursor: 'pointer' }}>
                    {saving ? 'Processing...' : editing ? 'Update Expense' : 'Save Expense'}
                  </button>
                  <button onClick={() => setModal(false)} style={{ flex: 1, background: '#f5f5f5', color: '#666', border: 'none', borderRadius: 12, padding: 14, fontWeight: 700, cursor: 'pointer' }}>
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
};

export default ExpenseManager;