import { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, Mail, AlertTriangle, UserPlus, ArrowRightLeft, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import api from '../api/axios';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchNotifications(); }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications', { params: { size: 50 } });
      setNotifications(res.data.content || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const markAsRead = async (id: number) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) { console.error(err); }
  };

  const markAllRead = async () => {
    for (const n of notifications.filter(n => !n.isRead)) {
      try { await api.patch(`/notifications/${n.id}/read`); } catch (e) {}
    }
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getIcon = (title: string) => {
    if (title.includes('Assigned')) return <UserPlus size={18} />;
    if (title.includes('Status')) return <ArrowRightLeft size={18} />;
    if (title.includes('New')) return <AlertTriangle size={18} />;
    return <Bell size={18} />;
  };

  return (
    <div className="animate-fade-in flex flex-col gap-6" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="h2">Notifications</h1>
          <p className="text-secondary">{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="btn-ghost"><CheckCheck size={16} /> Mark All Read</button>
        )}
      </div>

      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="flex flex-col gap-2" style={{ padding: '1rem' }}>
            {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '60px' }} />)}
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center' }}>
            <Bell size={48} style={{ margin: '0 auto 1rem', opacity: 0.2, color: 'var(--text-muted)' }} />
            <h3 className="h4" style={{ marginBottom: '0.5rem' }}>No Notifications</h3>
            <p className="text-secondary text-sm">Notifications will appear here when incidents are created, assigned, or updated.</p>
          </div>
        ) : (
          <div>
            {notifications.map(n => (
              <div key={n.id} className="flex items-center gap-4"
                style={{
                  padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-light)',
                  background: n.isRead ? 'transparent' : 'rgba(99,102,241,0.04)',
                  transition: 'background 0.15s'
                }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: n.isRead ? 'var(--bg-elevated)' : 'var(--primary-transparent)',
                  color: n.isRead ? 'var(--text-muted)' : 'var(--primary)'
                }}>
                  {getIcon(n.title)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: n.isRead ? 400 : 600, fontSize: '0.9rem' }}>{n.title}</div>
                  <div className="text-sm text-secondary">{n.message}</div>
                  <div className="text-xs text-muted" style={{ marginTop: '0.2rem' }}>
                    {n.createdAt ? format(new Date(n.createdAt), 'MMM dd, yyyy HH:mm') : ''}
                    {n.incident && <> · <Link to={`/incidents/${n.incident.id}`} style={{ color: 'var(--primary)' }}>View Incident</Link></>}
                  </div>
                </div>
                {!n.isRead && (
                  <button onClick={() => markAsRead(n.id)} className="btn-ghost" style={{ padding: '0.4rem', fontSize: '0.75rem' }}>
                    <Check size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
