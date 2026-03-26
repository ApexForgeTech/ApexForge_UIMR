import { NavLink } from 'react-router-dom';
import { useLanguageStore } from '../../store/languageStore';
import { useAuthStore } from '../../store/authStore';
import { LayoutDashboard, AlertTriangle, Book, FileText, Settings, ShieldAlert, Users, Inbox, Bell, Radar } from 'lucide-react';

const Sidebar = () => {
  const { t } = useLanguageStore();
  const { user } = useAuthStore();
  const menuItems = [
    { name: t('dashboard'), path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: t('incidents'), path: '/incidents', icon: <AlertTriangle size={20} /> },
    { name: 'Ingestion', path: '/ingestion', icon: <Radar size={20} /> },
    { name: t('playbooks'), path: '/playbooks', icon: <ShieldAlert size={20} /> },
    { name: t('kb'), path: '/kb', icon: <Book size={20} /> },
    { name: t('reports'), path: '/reports', icon: <FileText size={20} /> },
    { name: 'Notifications', path: '/notifications', icon: <Bell size={20} /> }
  ];

  if (user?.role === 'ADMIN') {
    menuItems.push({ name: t('users'), path: '/users', icon: <Users size={20} /> });
  }

  return (
    <aside
      className="glass-panel flex flex-col"
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        width: '250px',
        padding: '1.5rem 1rem',
        borderRadius: 0,
        borderRight: '1px solid var(--border-light)',
        borderTop: 'none',
        borderBottom: 'none',
        borderLeft: 'none',
        zIndex: 40
      }}
    >
      <div className="flex items-center gap-3" style={{ marginBottom: '3rem', padding: '0 0.5rem' }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          background: 'var(--primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-glow)'
        }}>
          <ShieldAlert size={20} color="white" />
        </div>
        <h1 className="h4" style={{ fontWeight: 700, letterSpacing: '2px' }}>UIMR</h1>
      </div>

      <nav className="flex flex-col gap-2" style={{ flex: 1 }}>
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `flex items-center gap-3 ${isActive ? 'active-link' : ''}`}
            style={({ isActive }) => ({
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              background: isActive ? 'var(--bg-surface-hover)' : 'transparent',
              fontWeight: isActive ? 500 : 400,
              transition: 'all var(--transition-fast)'
            })}
          >
            {item.icon}
            {item.name}
          </NavLink>
        ))}
      </nav>

      <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-light)', paddingTop: '1rem' }}>
        {user?.role === 'ADMIN' && (
          <NavLink
            to="/settings"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-secondary)'
            }}
          >
            <Settings size={20} />
            Settings
          </NavLink>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
