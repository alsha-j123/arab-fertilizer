import React, { useState, useEffect } from 'react';
import apiClient from '../../utils/apiClient';
import { motion, AnimatePresence } from 'framer-motion';



const ReviewManager = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [filter, setFilter]   = useState('all'); // all, pending, approved

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/admin/reviews');
      if (data.success) setReviews(data.reviews);
      else setError(data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReviews(); }, []);

  const toggleApproval = async (productId, reviewId) => {
    try {
      const { data } = await apiClient.put(`/admin/reviews/${productId}/${reviewId}`, {});
      if (data.success) {
        setReviews(prev => prev.map(r => r._id === reviewId ? { ...r, isApproved: !r.isApproved } : r));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Update failed');
    }
  };

  const deleteReview = async (productId, reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      const { data } = await apiClient.delete(`/admin/reviews/${productId}/${reviewId}`);
      if (data.success) {
        setReviews(prev => prev.filter(r => r._id !== reviewId));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  const filteredReviews = reviews.filter(r => {
    if (filter === 'pending') return !r.isApproved;
    if (filter === 'approved') return r.isApproved;
    return true;
  });

  return (
    <div style={{ padding: '32px clamp(16px, 4vw, 40px)', minHeight: '100vh', background: '#f5f5f5', fontFamily: 'Cairo, sans-serif' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32, gap: 20, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontFamily: 'Playfair Display', fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', color: '#1a2e18', margin: '0 0 8px' }}>Reviews Management</h1>
            <p style={{ color: '#666', margin: 0, fontSize: '0.95rem' }}>Moderate and manage product ratings and feedback.</p>
          </div>
          
          <div style={{ display: 'flex', background: 'white', padding: 4, borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            {['all', 'pending', 'approved'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{
                  padding: '8px 20px', borderRadius: 9, border: 'none', cursor: 'pointer',
                  background: filter === f ? '#2D5A27' : 'transparent',
                  color: filter === f ? 'white' : '#666',
                  fontWeight: 700, fontSize: '0.85rem', textTransform: 'capitalize',
                  transition: 'all 0.2s'
                }}>
                {f} {f === 'pending' && reviews.filter(r => !r.isApproved).length > 0 && 
                  <span style={{ marginLeft: 6, background: '#e74c3c', color: 'white', padding: '1px 6px', borderRadius: 6, fontSize: '0.7rem' }}>
                    {reviews.filter(r => !r.isApproved).length}
                  </span>
                }
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div style={{ background: '#fde8e8', color: '#c0392b', padding: '16px 20px', borderRadius: 12, marginBottom: 24, fontWeight: 600 }}>
            ⚠️ {error}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
            <div style={{ width: 48, height: 48, border: '4px solid #e0e0e0', borderTopColor: '#2D5A27', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : filteredReviews.length === 0 ? (
          <div style={{ background: 'white', borderRadius: 20, padding: '80px 40px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: 64, marginBottom: 20 }}>💬</div>
            <h3 style={{ color: '#1a2e18', margin: '0 0 10px' }}>No reviews found</h3>
            <p style={{ color: '#888' }}>There are no reviews matching the current filter.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 16 }}>
            <AnimatePresence mode="popLayout">
              {filteredReviews.map((r) => (
                <motion.div key={r._id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                  style={{ background: 'white', borderRadius: 16, padding: '20px 24px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid #eee', display: 'flex', gap: 24, alignItems: 'flex-start' }}>
                  
                  {/* Rating Badge */}
                  <div style={{ background: '#f8fdf6', padding: '12px', borderRadius: 12, textAlign: 'center', minWidth: 60 }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2D5A27' }}>{r.rating}</div>
                    <div style={{ fontSize: '0.7rem', color: '#C8A951', fontWeight: 800 }}>STARS</div>
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div>
                        <h4 style={{ margin: '0 0 4px', color: '#1a1a1a', fontSize: '1.05rem' }}>{r.name}</h4>
                        <div style={{ fontSize: '0.8rem', color: '#888' }}>
                          Product: <span style={{ color: '#2D5A27', fontWeight: 700 }}>{r.productName}</span> • {new Date(r.createdAt).toLocaleDateString('en-PK')}
                        </div>
                      </div>
                      <div style={{ 
                        padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 800, 
                        background: r.isApproved ? '#e8f5e3' : '#fff3cd', 
                        color: r.isApproved ? '#2D5A27' : '#856404',
                        textTransform: 'uppercase', height: 'fit-content'
                      }}>
                        {r.isApproved ? 'Approved' : 'Pending'}
                      </div>
                    </div>
                    <p style={{ color: '#444', lineHeight: 1.6, margin: 0, fontSize: '0.95rem' }}>"{r.comment}"</p>
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => toggleApproval(r.productId, r._id)}
                      style={{
                        padding: '10px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
                        background: r.isApproved ? '#f5f5f5' : '#2D5A27',
                        color: r.isApproved ? '#666' : 'white',
                        fontWeight: 700, fontSize: '0.82rem', transition: 'all 0.2s'
                      }}>
                      {r.isApproved ? 'Unapprove' : 'Approve'}
                    </button>
                    <button onClick={() => deleteReview(r.productId, r._id)}
                      style={{
                        padding: '10px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
                        background: '#fde8e8', color: '#e74c3c',
                        fontWeight: 700, fontSize: '0.82rem'
                      }}>
                      Delete
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
};

export default ReviewManager;
