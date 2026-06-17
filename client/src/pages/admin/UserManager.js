import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../utils/apiClient';
import { useAuth } from '../../context/AuthContext';



const UserManager = () => {
  const [users, setUsers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  
  // Upgrade Modal State
  const [selectedUser, setSelectedUser] = useState(null);
  const [employeeModal, setEmployeeModal] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [updating, setUpdating] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/admin');
      return;
    }
    loadData();
  }, [user, navigate]);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      apiClient.get('/admin/users'),
      apiClient.get('/employees')
    ])
      .then(([userRes, empRes]) => {
        setUsers(userRes.data.users || []);
        setEmployees(empRes.data.employees || []);
      })
      .catch(() => {
        setUsers([]);
        setEmployees([]);
      })
      .finally(() => setLoading(false));
  };

  const handleMakeEmployee = async () => {
    if (!selectedEmployeeId) return alert('Please select an employee profile to link');
    setUpdating(true);
    try {
      await apiClient.put(`/admin/users/${selectedUser._id}/role`, {
        role: 'employee',
        employeeId: selectedEmployeeId
      });
      
      // Refresh list
      const res = await apiClient.get('/admin/users');
      setUsers(res.data.users || []);
      
      setEmployeeModal(false);
      setSelectedUser(null);
      setSelectedEmployeeId('');
      alert('User successfully upgraded to Employee');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user role');
    } finally {
      setUpdating(false);
    }
  };

  const handleUnmarkEmployee = async (userObj) => {
    if (!window.confirm(`Are you sure you want to remove the employee role from ${userObj.name}?`)) return;
    setUpdating(true);
    try {
      await apiClient.put(`/admin/users/${userObj._id}/role`, {
        role: 'customer'
      });
      
      // Refresh list
      const res = await apiClient.get('/admin/users');
      setUsers(res.data.users || []);
      
      alert('User successfully reverted to customer role');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user role');
    } finally {
      setUpdating(false);
    }
  };

  const filtered = useMemo(() => users.filter(u => {
    const name = u.name || '';
    const email = u.email || '';
    const matchesSearch = name.toLowerCase().includes(search.toLowerCase()) || 
                          email.toLowerCase().includes(search.toLowerCase()) ||
                          (u.phone || '').includes(search);
    const matchesRole = filterRole === 'all' || u.role === filterRole;
    return matchesSearch && matchesRole;
  }), [users, search, filterRole]);

  const { totalAdmins, totalCustomers, totalEmployees } = useMemo(() => {
    let admins = 0, customers = 0, emps = 0;
    for (const u of users) {
      if (u.role === 'admin') admins++;
      else if (u.role === 'employee') emps++;
      else customers++;
    }
    return { totalAdmins: admins, totalCustomers: customers, totalEmployees: emps };
  }, [users]);

  const inp = { border: '1.5px solid #e0e0e0', borderRadius: 8, fontSize: '0.88rem', outline: 'none', fontFamily: 'Cairo, sans-serif', padding: '10px 12px', boxSizing: 'border-box' };
  const onF = e => e.target.style.borderColor = '#2D5A27';
  const onB = e => e.target.style.borderColor = '#e0e0e0';

  const availableEmployees = employees.filter(e => !e.userId || (selectedUser && e.userId === selectedUser._id));

  return (
    <div style={{ padding: 'clamp(16px, 3vw, 32px)', maxWidth: 1100, fontFamily: 'Cairo, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: 'Playfair Display', fontSize: '1.9rem', marginBottom: 4 }}>User Management</h1>
          <p style={{ color: '#888', fontSize: '0.88rem' }}>{users.length} registered users in the system</p>
        </div>
      </div>

      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
        <div style={{ background: 'linear-gradient(135deg,#2D5A27,#3a7a31)', borderRadius: 14, padding: '18px 20px', color: 'white' }}>
          <div style={{ fontSize: '0.78rem', opacity: 0.7, marginBottom: 4 }}>Total Users</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'Playfair Display' }}>{users.length}</div>
        </div>
        <div style={{ background: 'white', borderRadius: 14, padding: '18px 20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: '0.78rem', color: '#888', marginBottom: 4 }}>Customers</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#333', fontFamily: 'Playfair Display' }}>{totalCustomers}</div>
        </div>
        <div style={{ background: 'white', borderRadius: 14, padding: '18px 20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: '0.78rem', color: '#888', marginBottom: 4 }}>Employees</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#2D5A27', fontFamily: 'Playfair Display' }}>{totalEmployees}</div>
        </div>
        <div style={{ background: 'white', borderRadius: 14, padding: '18px 20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: '0.78rem', color: '#888', marginBottom: 4 }}>Admins</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#C8A951', fontFamily: 'Playfair Display' }}>{totalAdmins}</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <input type="text" placeholder="🔍 Search users by name, email or phone..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ ...inp, flex: 1, minWidth: 200 }} onFocus={onF} onBlur={onB} />
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)} style={{ ...inp, width: 'auto', minWidth: 150 }} onFocus={onF} onBlur={onB}>
          <option value="all">All Roles</option>
          <option value="customer">Customer</option>
          <option value="employee">Employee</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: '#888' }}>
          <div style={{ width: 40, height: 40, border: '4px solid #e8f5e3', borderTopColor: '#2D5A27', borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto 16px' }} />
          Loading Users...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: 'white', borderRadius: 14, padding: 60, textAlign: 'center', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
          <h3 style={{ fontFamily: 'Playfair Display', marginBottom: 8 }}>No Users Found</h3>
          <p style={{ color: '#888', fontSize: '0.88rem' }}>Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: 14, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 850 }}>
              <thead>
                <tr style={{ background: '#2D5A27' }}>
                  {['User', 'Role', 'Contact', 'Location', 'Registered On', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 14px', textAlign: 'left', color: 'white', fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u._id} style={{ borderBottom: '1px solid #f0f0f0' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                    onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {u.avatar ? (
                          <img src={u.avatar} alt="Avatar" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#2D5A27,#4a8a42)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '1rem', flexShrink: 0 }}>
                            {u.name?.[0]?.toUpperCase() || '?'}
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 600, color: '#1a1a1a', fontSize: '0.88rem' }}>{u.name}</div>
                          {u.googleId && <div style={{ fontSize: '0.68rem', color: '#db4437', fontWeight: 700 }}>Google User</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ 
                        background: u.role === 'admin' ? '#C8A95120' : u.role === 'employee' ? '#e3f2fd' : '#e8f5e3', 
                        color: u.role === 'admin' ? '#8a7331' : u.role === 'employee' ? '#1976d2' : '#2D5A27', 
                        borderRadius: 20, padding: '3px 10px', fontSize: '0.74rem', fontWeight: 700, textTransform: 'capitalize' 
                      }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '0.82rem', color: '#555' }}>
                      <div>✉️ {u.email}</div>
                      {u.phone && <div style={{ marginTop: 2 }}>📞 {u.phone}</div>}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '0.82rem', color: '#555' }}>
                      {u.address?.city ? (
                        <span>{u.address.city}{u.address.province ? `, ${u.address.province}` : ''}</span>
                      ) : '—'}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '0.82rem', color: '#888' }}>
                      {u.createdAt && !isNaN(new Date(u.createdAt).getTime())
                        ? new Date(u.createdAt).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })
                        : '—'}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {u.role === 'customer' && (
                        <button 
                          onClick={() => { setSelectedUser(u); setEmployeeModal(true); }}
                          style={{ background: '#2D5A27', color: 'white', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#3a7a31'}
                          onMouseLeave={e => e.currentTarget.style.background = '#2D5A27'}
                        >
                          Make Employee
                        </button>
                      )}
                      {u.role === 'employee' && (
                        <button 
                          onClick={() => handleUnmarkEmployee(u)}
                          style={{ background: '#e74c3c', color: 'white', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#c0392b'}
                          onMouseLeave={e => e.currentTarget.style.background = '#e74c3c'}
                        >
                          Unmark Employee
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upgrade to Employee Modal */}
      {employeeModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 28, maxWidth: 450, width: '100%', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
            <h2 style={{ fontFamily: 'Playfair Display', fontSize: '1.4rem', marginBottom: 10 }}>Upgrade to Employee</h2>
            <p style={{ fontSize: '0.88rem', color: '#666', marginBottom: 20 }}>
              You are upgrading <strong>{selectedUser?.name}</strong> to an employee role. Please select an existing employee profile to link this user with.
            </p>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 700, fontSize: '0.85rem', color: '#444' }}>Select Employee Profile</label>
              <select 
                value={selectedEmployeeId} 
                onChange={e => setSelectedEmployeeId(e.target.value)}
                style={{ ...inp, width: '100%' }}
                onFocus={onF} onBlur={onB}
              >
                <option value="">-- Choose Employee --</option>
                {availableEmployees.map(e => (
                  <option key={e._id} value={e._id}>{e.name} ({e.role})</option>
                ))}
              </select>
              {availableEmployees.length === 0 && (
                <p style={{ color: '#e74c3c', fontSize: '0.75rem', marginTop: 8 }}>
                  No available employee profiles found. Please create an employee record first in the Employee Management section.
                </p>
              )}
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                onClick={handleMakeEmployee}
                disabled={updating || !selectedEmployeeId}
                style={{ flex: 2, background: '#2D5A27', color: 'white', border: 'none', borderRadius: 10, padding: 12, fontWeight: 700, cursor: selectedEmployeeId ? 'pointer' : 'not-allowed', opacity: selectedEmployeeId ? 1 : 0.6 }}
              >
                {updating ? 'Processing...' : 'Confirm Upgrade'}
              </button>
              <button 
                onClick={() => { setEmployeeModal(false); setSelectedUser(null); setSelectedEmployeeId(''); }}
                style={{ flex: 1, background: '#f5f5f5', color: '#555', border: 'none', borderRadius: 10, padding: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
};

export default UserManager;
