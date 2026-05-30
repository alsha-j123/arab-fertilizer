import React, { useState, useEffect, useCallback, useRef } from 'react';
import apiClient from '../../utils/apiClient';
import { useAuth } from '../../context/AuthContext';

const EMPTY = { name: '', phone: '', city: '', area: '', address: '', employee: '', notes: '' };

const Toast = ({ msg, type = 'success' }) => msg ? (
  <div style={{
    position: 'fixed',
    top: 24,
    right: 24,
    background: type === 'success' ? '#2D5A27' : '#e74c3c',
    color: 'white',
    padding: '12px 22px',
    borderRadius: 10,
    zIndex: 9999,
    fontWeight: 600,
    fontSize: '0.9rem',
    boxShadow: '0 6px 24px rgba(0,0,0,0.2)'
  }}>
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

  // ✅ FIX 1: Toast cleanup (prevents memory leak warning)
  const toastTimer = useRef(null);

  const flash = (msg, type = 'success') => {
    setToast({ msg, type });

    if (toastTimer.current) clearTimeout(toastTimer.current);

    toastTimer.current = setTimeout(() => {
      setToast({ msg: '', type: 'success' });
    }, 2500);
  };

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  // ✅ FIX 2: Safe loadData + stable dependency
  const loadData = useCallback(() => {
    setLoading(true);

    const endpoints = [apiClient.get('/dealers')];

    if (user?.role === 'admin') {
      endpoints.push(apiClient.get('/employees'));
    }

    Promise.all(endpoints)
      .then(([dealersRes, employeesRes]) => {
        setDealers(dealersRes?.data?.dealers || []);

        // ✅ FIX 3: safe destructuring (no crash if undefined)
        if (employeesRes) {
          setEmployees(employeesRes?.data?.employees || []);
        } else {
          setEmployees([]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = dealers.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    (d.city || '').toLowerCase().includes(search.toLowerCase()) ||
    (d.area || '').toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditing(null);

    // ✅ FIX 4: safe employeeId fallback
    const safeEmployeeId =
      user?.employeeId || user?.employee?._id || '';

    setForm({
      ...EMPTY,
      employee: user?.role === 'employee' ? safeEmployeeId : ''
    });

    setModal(true);
  };

  const openEdit = d => {
    setEditing(d);
    setForm({
      name: d.name,
      phone: d.phone || '',
      city: d.city || '',
      area: d.area || '',
      address: d.address || '',
      employee: d.employee?._id || d.employee || '',
      notes: d.notes || ''
    });
    setModal(true);
  };

  const save = async () => {
    if (!form.name.trim() || !form.employee) {
      flash('Name and employee are required', 'error');
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        const { data } = await apiClient.put(`/dealers/${editing._id}`, form);

        setDealers(prev =>
          prev.map(d => (d._id === editing._id ? data.dealer : d))
        );

        flash(`${form.name} updated`);
      } else {
        const { data } = await apiClient.post('/dealers', form);

        setDealers(prev => [data.dealer, ...prev]);

        flash(`${form.name} added`);
      }

      setModal(false);
    } catch (err) {
      flash(err.response?.data?.message || 'Failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const del = async id => {
    try {
      await apiClient.delete(`/dealers/${id}`);
      setDealers(prev => prev.filter(d => d._id !== id));
      setDelId(null);
      flash('Dealer removed');
    } catch (err) {
      flash(err.response?.data?.message || 'Failed to delete', 'error');
    }
  };

  const inp = {
    border: '1.5px solid #e0e0e0',
    borderRadius: 8,
    fontSize: '0.88rem',
    outline: 'none',
    fontFamily: 'Cairo, sans-serif',
    padding: '10px 12px',
    width: '100%',
    boxSizing: 'border-box'
  };

  const onF = e => e.target.style.borderColor = '#2D5A27';
  const onB = e => e.target.style.borderColor = '#e0e0e0';

  return (
    <div style={{ padding: 32, maxWidth: 1200, fontFamily: 'Cairo, sans-serif' }}>
      <Toast msg={toast.msg} type={toast.type} />

      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: 'Playfair Display', fontSize: '1.9rem', marginBottom: 4 }}>
            {user?.role === 'employee' ? 'My Dealers' : 'Dealer Management'}
          </h1>
          <p style={{ color: '#888', fontSize: '0.88rem' }}>{dealers.length} active dealers</p>
        </div>

        {(user?.role === 'admin' || user?.role === 'employee') && (
          <button
            onClick={openAdd}
            style={{
              background: '#2D5A27',
              color: 'white',
              border: 'none',
              borderRadius: 10,
              padding: '12px 24px',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontFamily: 'Cairo, sans-serif'
            }}
          >
            + Add Dealer
          </button>
        )}
      </div>

      {/* SEARCH */}
      <div style={{ background: 'white', borderRadius: 12, padding: '14px 20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 20 }}>
        <input
          type="text"
          placeholder="🔍 Search dealers..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={inp}
          onFocus={onF}
          onBlur={onB}
        />
      </div>

      {/* LIST */}
      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: '#888' }}>
          Loading...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {filtered.map(d => (
            <div key={d._id} style={{ background: 'white', padding: 20, borderRadius: 14 }}>
              <div style={{ fontWeight: 700 }}>{d.name}</div>
              <div style={{ fontSize: 12, color: '#777' }}>
                {d.city} {d.area}
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
};

export default DealerManager;