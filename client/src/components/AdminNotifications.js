import React, { useState, useEffect } from 'react';
import apiClient from '../utils/apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await apiClient.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.unreadCount);
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  const markAsRead = async (id) => {
    try {
      await apiClient.put(`/notifications/${id}/read`, {});
      setNotifications(
        notifications.map(n =>
          n._id === id ? { ...n, read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {}
  };

  const markAllAsRead = async () => {
    try {
      await apiClient.put('/notifications/read-all', {});
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {}
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'rgba(255,255,255,0.8)',
          padding: 6,
          borderRadius: '50%',
          transition: 'background 0.2s'
        }}
        onMouseEnter={e =>
          (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')
        }
        onMouseLeave={e =>
          (e.currentTarget.style.background = 'none')
        }
      >
        <span style={{ fontSize: '1.2rem' }}>🔔</span>

        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              background: '#e74c3c',
              color: 'white',
              fontSize: '0.6rem',
              fontWeight: 'bold',
              minWidth: 16,
              height: 16,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              border: '2px solid #1a2e18'
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 1000
              }}
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              style={{
                position: 'absolute',
                top: '100%',
                right: -120,
                marginTop: 8,
                width: 320,
                background: 'white',
                borderRadius: 12,
                boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                zIndex: 1001,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                maxHeight: 400
              }}
            >
              <div
                style={{
                  padding: '14px 16px',
                  background: '#2D5A27',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    color: 'white',
                    fontSize: '0.95rem',
                    fontFamily: 'Playfair Display'
                  }}
                >
                  Notifications
                </h3>

                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#C8A951',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div style={{ overflowY: 'auto', flex: 1 }}>
                {notifications.length === 0 ? (
                  <div
                    style={{
                      padding: 30,
                      textAlign: 'center',
                      color: '#888',
                      fontSize: '0.85rem'
                    }}
                  >
                    No notifications yet
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n._id}
                      onClick={() => !n.read && markAsRead(n._id)}
                      style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid #f0f0f0',
                        background: n.read ? 'white' : '#f8fae6',
                        cursor: n.read ? 'default' : 'pointer',
                        transition: 'background 0.2s',
                        display: 'flex',
                        gap: 12,
                        alignItems: 'flex-start'
                      }}
                    >
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          flexShrink: 0,
                          marginTop: 6,
                          background: n.read
                            ? 'transparent'
                            : '#e74c3c'
                        }}
                      />

                      <div style={{ flex: 1 }}>
                        <p
                          style={{
                            margin: 0,
                            color: '#333',
                            fontSize: '0.85rem',
                            fontWeight: n.read ? 400 : 600,
                            lineHeight: 1.4
                          }}
                        >
                          {n.message}
                        </p>

                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginTop: 4
                          }}
                        >
                          <span
                            style={{
                              fontSize: '0.7rem',
                              color: '#999'
                            }}
                          >
                            {new Date(n.createdAt).toLocaleDateString()}{' '}
                            {new Date(n.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>

                          {n.data?.orderId && (
                            <Link
                              to="/admin/orders"
                              onClick={() => setIsOpen(false)}
                              style={{
                                fontSize: '0.7rem',
                                color: '#2D5A27',
                                textDecoration: 'none',
                                fontWeight: 600
                              }}
                            >
                              View Order →
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminNotifications;