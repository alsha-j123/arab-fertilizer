import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import apiClient from '../../utils/apiClient';
import { useAuth } from '../../context/AuthContext';



const Analytics = () => {
  useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dates, setDates] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [error, setError] = useState(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(`/admin/analytics?startDate=${dates.start}&endDate=${dates.end}&employeeId=${selectedEmployee}`);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dates, selectedEmployee]); // eslint-disable-line react-hooks/exhaustive-deps

  const KPI = ({ title, value, sub, icon, color }) => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }}
      style={{ background: 'white', borderRadius: 16, padding: '20px 24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', borderLeft: `5px solid ${color}`, flex: 1, minWidth: 240 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: '#888', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>{title}</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1a1a1a', fontFamily: 'Playfair Display' }}>{value}</div>
          <div style={{ fontSize: '0.72rem', color: '#555', marginTop: 4 }}>{sub}</div>
        </div>
        <div style={{ width: 50, height: 50, borderRadius: 14, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>{icon}</div>
      </div>
    </motion.div>
  );

  const ChartPlaceholder = ({ title, stats }) => {
    if (!stats || stats.length === 0) return (
      <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: '0.9rem' }}>No data available for this range</div>
    );

    const maxVal = Math.max(...stats.map(s => s.revenue || s.orders || 1));
    
    return (
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', height: 220, paddingTop: 30, overflowX: 'auto' }}>
        {stats.map((s, i) => {
          const h = ((s.revenue || s.orders || 0) / maxVal) * 160;
          return (
            <div key={i} style={{ flex: '1 0 45px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <motion.div 
                initial={{ height: 0 }} 
                animate={{ height: Math.max(h, 4) }} 
                transition={{ duration: 1, delay: i * 0.05 }}
                style={{ width: 14, background: 'linear-gradient(180deg,#2D5A27,#4a8a42)', borderRadius: '10px 10px 0 0', position: 'relative' }}
              >
                <div style={{ position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)', fontSize: '0.62rem', fontWeight: 700, color: '#2D5A27' }}>
                   {s.revenue ? `${(s.revenue/1000).toFixed(1)}k` : s.orders}
                </div>
              </motion.div>
              <span style={{ fontSize: '0.65rem', color: '#888', transform: 'rotate(-45deg)', marginTop: 10, whiteSpace: 'nowrap' }}>{s._id.split('-').slice(1).join('/')}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const SectionHeader = ({ title, sub }) => (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{ fontFamily: 'Playfair Display', fontSize: '1.4rem', color: '#1a1a1a', margin: 0 }}>{title}</h2>
      <p style={{ color: '#888', fontSize: '0.88rem', margin: '4px 0 0' }}>{sub}</p>
    </div>
  );

  if (loading && !data) return (
    <div style={{ padding: 100, textAlign: 'center' }}>
      <div className="analytics-spinner" style={{ width: 50, height: 50, border: '5px solid #e8f5e3', borderTopColor: '#2D5A27', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 20px' }} />
      <h3 style={{ color: '#555' }}>Preparing your data...</h3>
    </div>
  );

  return (
    <div style={{ padding: '32px clamp(16px, 4vw, 40px)', maxWidth: 1250, margin: '0 auto', fontFamily: 'Cairo, sans-serif' }}>
      
      {/* Header & Filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 36, flexWrap: 'wrap', gap: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'Playfair Display', fontSize: '2.2rem', color: '#1a1a1a', marginBottom: 6 }}>Business Analytics</h1>
          <p style={{ color: '#888', fontSize: '0.95rem' }}>Detailed performance insights and sales metrics</p>
        </div>

        <div style={{ display: 'flex', gap: 12, background: 'white', padding: '14px 20px', borderRadius: 16, boxShadow: '0 4px 15px rgba(0,0,0,0.04)', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#aaa', display: 'block', marginBottom: 4 }}>FROM</label>
            <input type="date" value={dates.start} onChange={e => setDates(prev => ({ ...prev, start: e.target.value }))}
              style={{ border: '1.5px solid #eee', borderRadius: 8, padding: '8px 10px', fontSize: '0.85rem', outline: 'none', cursor: 'pointer' }} />
          </div>
          <div style={{ color: '#ddd', fontSize: '1.2rem', marginTop: 15 }}>→</div>
          <div>
            <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#aaa', display: 'block', marginBottom: 4 }}>TO</label>
            <input type="date" value={dates.end} onChange={e => setDates(prev => ({ ...prev, end: e.target.value }))}
              style={{ border: '1.5px solid #eee', borderRadius: 8, padding: '8px 10px', fontSize: '0.85rem', outline: 'none', cursor: 'pointer' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#aaa', display: 'block', marginBottom: 4 }}>EMPLOYEE</label>
            <select value={selectedEmployee} onChange={e => setSelectedEmployee(e.target.value)}
              style={{ border: '1.5px solid #eee', borderRadius: 8, padding: '8px 10px', fontSize: '0.85rem', outline: 'none', cursor: 'pointer', background: 'white', minWidth: 150 }}>
              <option value="all">All Employees</option>
              {data?.employees?.map(emp => (
                <option key={emp._id} value={emp._id}>{emp.name} ({emp.role})</option>
              ))}
            </select>
          </div>
          <button onClick={fetchAnalytics} style={{ background: '#2D5A27', color: 'white', border: 'none', borderRadius: 10, padding: '12px 20px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', marginTop: 15 }}>
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: '#fde8e8', color: '#e74c3c', padding: 16, borderRadius: 12, marginBottom: 24, fontWeight: 600 }}>
          ⚠️ {error}
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 40, flexWrap: 'wrap' }}>
        <KPI title="Total Revenue" value={`PKR ${data?.summary?.totalRevenue?.toLocaleString()}`} sub="Paid orders in range" icon="💰" color="#C8A951" />
        <KPI title="Total Orders" value={data?.summary?.totalOrders} sub="Total placed in range" icon="🧾" color="#2D5A27" />
        <KPI title="Avg. Order Value" value={`PKR ${Math.round(data?.summary?.avgOrderValue || 0).toLocaleString()}`} sub="Revenue per order" icon="📈" color="#5D4037" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 28, marginBottom: 40 }}>
        
        {/* Daily Trend */}
        <div style={{ background: 'white', borderRadius: 20, padding: 28, boxShadow: '0 4px 25px rgba(0,0,0,0.06)' }}>
          <SectionHeader title="Daily Revenue Trend" sub="Visual representation of daily income" />
          <ChartPlaceholder stats={data?.dailyStats} />
        </div>

        {/* Customer Leaderboard */}
        <div style={{ background: 'white', borderRadius: 20, padding: 28, boxShadow: '0 4px 25px rgba(0,0,0,0.06)' }}>
          <SectionHeader title="Top Customers" sub="Highest spending clients by revenue" />
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid #f8f8f8' }}>
                  <th style={{ padding: '12px 8px', fontSize: '0.78rem', color: '#888', fontWeight: 600 }}>Customer</th>
                  <th style={{ padding: '12px 8px', fontSize: '0.78rem', color: '#888', fontWeight: 600 }}>Orders</th>
                  <th style={{ padding: '12px 8px', fontSize: '0.78rem', color: '#888', fontWeight: 600, textAlign: 'right' }}>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data?.customerStats?.map((c, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #fcfcfc' }}>
                    <td style={{ padding: '14px 8px' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1a1a1a' }}>{c.name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#aaa' }}>{c.email}</div>
                    </td>
                    <td style={{ padding: '14px 8px', fontSize: '0.85rem', color: '#555' }}>{c.orders}</td>
                    <td style={{ padding: '14px 8px', fontSize: '0.88rem', fontWeight: 800, color: '#2D5A27', textAlign: 'right' }}>PKR {c.revenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>


      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        ::-webkit-scrollbar { height: 6px; width: 6px; }
        ::-webkit-scrollbar-track { background: #f1f1f1; }
        ::-webkit-scrollbar-thumb { background: #ccc; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #2D5A27; }
      `}</style>
    </div>
  );
};

export default Analytics;