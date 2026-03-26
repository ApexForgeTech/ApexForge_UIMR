import { useState, useRef, useEffect } from 'react';
import { Bell, Search, User, LogOut, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useLanguageStore } from '../../store/languageStore';
import api from '../../api/axios';
import { format } from 'date-fns';

const Header = () => {
  const { user, logout } = useAuthStore();
  const { language, setLanguage, t } = useLanguageStore();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get('/notifications/unread-count');
      setUnreadCount(res.data.count);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      // Ensure content is an array
      setNotifications(res.data?.content || []);
      setShowNotifications(prev => !prev);
    } catch (err: any) {
      console.error('Notification fetch failed:', err);
      // Ensure we don't crash the UI
      setNotifications([]);
      setShowNotifications(true);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && search.trim()) {
      navigate(`/incidents?search=${encodeURIComponent(search.trim())}`);
      setSearch('');
    }
  };

  return (
    <header
      className="glass-panel flex items-center justify-between"
      style={{
        position: 'fixed', top: 0, right: 0, left: '250px', height: '64px', padding: '0 2rem', borderRadius: 0,
        borderBottom: '1px solid var(--border-light)', borderTop: 'none', borderLeft: 'none', borderRight: 'none', zIndex: 30
      }}
    >
      <div className="flex items-center" style={{ width: '400px', position: 'relative' }}>
        <Search size={18} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
        <input 
          type="text" 
          placeholder={t('search_placeholder')} 
          className="form-input"
          style={{ paddingLeft: '2.5rem', background: 'var(--bg-surface)', border: 'none' }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleSearch}
        />
      </div>

      <div className="flex items-center gap-6">
        <button 
          onClick={() => setLanguage(language === 'en' ? 'az' : 'en')}
          className="glass-panel px-3 py-1 text-xs font-bold hover:bg-primary-transparent transition-colors"
          style={{ minWidth: '40px' }}
        >
          {language.toUpperCase()}
        </button>
        <div className="relative" ref={notificationRef}>
          <button 
            onClick={fetchNotifications}
            style={{ position: 'relative', color: showNotifications ? 'var(--primary)' : 'var(--text-secondary)' }}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: '-4px', right: '-4px', width: '8px', height: '8px', background: 'var(--critical)',
                borderRadius: '50%', boxShadow: '0 0 8px var(--critical)'
              }} />
            )}
          </button>

          {showNotifications && (
            <div className="glass-panel animate-scale-up" style={{
              position: 'absolute', top: '150%', right: 0, width: '320px', maxHeight: '400px', overflowY: 'auto',
              padding: '1rem', boxShadow: 'var(--shadow-lg)', zIndex: 100
            }}>
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-semibold">Notifications</h4>
                <span className="text-xs text-muted">{unreadCount} unread</span>
              </div>
              <div className="flex flex-col gap-2">
                {notifications.map(n => (
                  <div 
                    key={n.id} 
                    className={`p-3 rounded-md transition-colors ${!n.read ? 'bg-surface-hover border-left-primary' : 'opacity-70'}`}
                    style={{ background: 'var(--bg-elevated)', borderLeft: !n.read ? '3px solid var(--primary)' : 'none' }}
                  >
                    <div className="flex justify-between items-start gap-2">
                       <div className="text-sm font-medium leading-tight">{n.title}</div>
                       {!n.read && (
                         <button onClick={() => markAsRead(n.id)} className="text-primary hover:text-success">
                           <Check size={14} />
                         </button>
                       )}
                    </div>
                    <div className="text-xs text-secondary mt-1">{n.message}</div>
                    <div className="text-[10px] text-muted mt-2">
                      {n.createdAt ? (() => {
                        try {
                          return format(new Date(n.createdAt), 'MMM dd, HH:mm');
                        } catch (e) {
                          return 'Unknown date';
                        }
                      })() : 'Unknown date'}
                    </div>
                  </div>
                ))}
                {notifications.length === 0 && <div className="text-center text-muted py-4">No notifications</div>}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 relative" ref={dropdownRef}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{user?.username || 'Admin User'}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user?.role || 'SOC Analyst'}</div>
          </div>
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            style={{
              width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-elevated)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-light)',
              color: 'var(--text-primary)'
            }}
          >
            <User size={20} />
          </button>

          {showDropdown && (
            <div className="glass-panel animate-fade-in" style={{
              position: 'absolute', top: '120%', right: 0, width: '200px', padding: '0.5rem', boxShadow: 'var(--shadow-lg)'
            }}>
              <button 
                onClick={logout}
                className="flex items-center gap-2"
                style={{
                  width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', color: 'var(--critical)',
                  textAlign: 'left', transition: 'background var(--transition-fast)'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-surface)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
