import { useState, useEffect } from 'react';
import { Users, Shield, UserX, UserCheck, Search, Plus, Trash2, X, ShieldCheck, ShieldAlert, Eye } from 'lucide-react';
import { format } from 'date-fns';
import api from '../api/axios';

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  ADMIN: { label: 'Admin', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', icon: ShieldAlert },
  ANALYST: { label: 'Analyst', color: '#6366f1', bg: 'rgba(99,102,241,0.12)', icon: ShieldCheck },
  VIEWER: { label: 'Viewer', color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', icon: Eye },
};

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #6366f1, #8b5cf6)',
  'linear-gradient(135deg, #ec4899, #f43f5e)',
  'linear-gradient(135deg, #14b8a6, #06b6d4)',
  'linear-gradient(135deg, #f97316, #eab308)',
  'linear-gradient(135deg, #3b82f6, #6366f1)',
];

const UserManagementPage = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: string; user: any } | null>(null);
  const [createForm, setCreateForm] = useState({ username: '', fullName: '', email: '', password: '', role: 'ANALYST' });

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/users', createForm);
      setShowCreateModal(false);
      setCreateForm({ username: '', fullName: '', email: '', password: '', role: 'ANALYST' });
      fetchUsers();
    } catch (err) { console.error(err); }
  };

  const handleToggleStatus = async (id: number) => {
    try { await api.patch(`/users/${id}/toggle-active`); fetchUsers(); } catch (err) { console.error(err); }
    setConfirmAction(null);
  };

  const handleChangeRole = async (id: number, role: string) => {
    try { await api.put(`/users/${id}/role?role=${role}`); fetchUsers(); } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: number) => {
    try { await api.delete(`/users/${id}`); fetchUsers(); } catch (err) { console.error(err); }
    setConfirmAction(null);
  };

  const filtered = users.filter(u =>
    u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: users.length,
    active: users.filter(u => u.active).length,
    inactive: users.filter(u => !u.active).length,
    admins: users.filter(u => u.role === 'ADMIN').length,
  };

  const getInitials = (name: string) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="h2">User Management</h1>
          <p className="text-secondary">Manage SOC team members, roles, and access controls</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="hover-lift flex items-center gap-2"
          style={{ padding: '0.625rem 1.25rem', background: 'var(--primary)', color: 'white', borderRadius: 'var(--radius-md)', fontWeight: 600 }}
        >
          <Plus size={18} /> Add Team Member
        </button>
      </div>

      {/* Stats Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {[
          { label: 'Total Users', value: stats.total, color: 'var(--primary)', bg: 'var(--primary-transparent)' },
          { label: 'Active', value: stats.active, color: 'var(--success)', bg: 'var(--success-bg)' },
          { label: 'Inactive', value: stats.inactive, color: 'var(--critical)', bg: 'var(--critical-bg)' },
          { label: 'Administrators', value: stats.admins, color: 'var(--high)', bg: 'var(--high-bg)' },
        ].map((s, i) => (
          <div key={i} className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: '12px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={22} style={{ color: s.color }} />
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: s.color }}>{s.value}</div>
              <div className="text-xs text-muted">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="glass-panel" style={{ padding: '1rem' }}>
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search by name, username, or email..."
            className="form-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>
      </div>

      {/* User Table */}
      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }} className="text-muted">Loading team members...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <Users size={48} className="text-muted" style={{ marginBottom: '1rem', opacity: 0.3 }} />
            <p className="text-muted">No users found matching your search.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 600 }}>Team Member</th>
                <th style={{ padding: '1rem', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 600 }}>Role</th>
                <th style={{ padding: '1rem', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '1rem', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 600 }}>Joined</th>
                <th style={{ padding: '1rem', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user, idx) => {
                const roleConf = ROLE_CONFIG[user.role] || ROLE_CONFIG.VIEWER;
                const RoleIcon = roleConf.icon;
                return (
                  <tr key={user.id} style={{ borderBottom: '1px solid var(--border-light)', transition: 'background 0.15s' }}
                    onMouseOver={(e) => (e.currentTarget.style.background = 'var(--bg-surface-hover)')}
                    onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <div className="flex items-center gap-3">
                        <div style={{
                          width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length], color: 'white', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.05em',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                        }}>
                          {getInitials(user.fullName)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user.fullName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{user.username} · {user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <select
                        value={user.role}
                        onChange={(e) => handleChangeRole(user.id, e.target.value)}
                        style={{
                          background: roleConf.bg, color: roleConf.color, border: 'none',
                          padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer'
                        }}
                      >
                        <option value="VIEWER">👁 Viewer</option>
                        <option value="ANALYST">🛡 Analyst</option>
                        <option value="ADMIN">⚡ Admin</option>
                      </select>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                        padding: '0.3rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700,
                        background: user.active ? 'var(--success-bg)' : 'var(--critical-bg)',
                        color: user.active ? 'var(--success)' : 'var(--critical)',
                      }}>
                        <span style={{
                          width: 7, height: 7, borderRadius: '50%',
                          background: user.active ? 'var(--success)' : 'var(--critical)',
                          boxShadow: user.active ? '0 0 6px var(--success)' : '0 0 6px var(--critical)',
                          animation: user.active ? 'pulse 2s infinite' : 'none'
                        }} />
                        {user.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {user.createdAt ? format(new Date(user.createdAt), 'MMM dd, yyyy') : '—'}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <div className="flex items-center gap-1" style={{ justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => setConfirmAction({ type: 'toggle', user })}
                          title={user.active ? 'Deactivate' : 'Activate'}
                          style={{
                            padding: '0.4rem', borderRadius: '8px', transition: 'all 0.15s',
                            color: 'var(--text-muted)'
                          }}
                          onMouseOver={(e) => { e.currentTarget.style.background = user.active ? 'var(--critical-bg)' : 'var(--success-bg)'; e.currentTarget.style.color = user.active ? 'var(--critical)' : 'var(--success)'; }}
                          onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                        >
                          {user.active ? <UserX size={17} /> : <UserCheck size={17} />}
                        </button>
                        <button
                          onClick={() => setConfirmAction({ type: 'delete', user })}
                          title="Delete User"
                          style={{ padding: '0.4rem', borderRadius: '8px', transition: 'all 0.15s', color: 'var(--text-muted)' }}
                          onMouseOver={(e) => { e.currentTarget.style.background = 'var(--critical-bg)'; e.currentTarget.style.color = 'var(--critical)'; }}
                          onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-panel animate-scale-up" style={{ width: '480px', padding: '2rem' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
              <h3 className="h3">Add Team Member</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-muted"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label">Username</label>
                  <input type="text" className="form-input" required value={createForm.username}
                    onChange={e => setCreateForm({ ...createForm, username: e.target.value })} placeholder="john.doe" />
                </div>
                <div>
                  <label className="form-label">Full Name</label>
                  <input type="text" className="form-input" required value={createForm.fullName}
                    onChange={e => setCreateForm({ ...createForm, fullName: e.target.value })} placeholder="John Doe" />
                </div>
              </div>
              <div>
                <label className="form-label">Email</label>
                <input type="email" className="form-input" required value={createForm.email}
                  onChange={e => setCreateForm({ ...createForm, email: e.target.value })} placeholder="john@company.com" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label">Password</label>
                  <input type="password" className="form-input" required value={createForm.password}
                    onChange={e => setCreateForm({ ...createForm, password: e.target.value })} placeholder="Min 8 characters" />
                </div>
                <div>
                  <label className="form-label">Role</label>
                  <select className="form-input" value={createForm.role}
                    onChange={e => setCreateForm({ ...createForm, role: e.target.value })}>
                    <option value="VIEWER">Viewer</option>
                    <option value="ANALYST">Analyst</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2" style={{ marginTop: '0.5rem' }}>
                <button type="submit" style={{ flex: 1, padding: '0.7rem', background: 'var(--primary)', color: 'white', borderRadius: 'var(--radius-md)', fontWeight: 600, transition: 'all 0.15s' }}>
                  Create Account
                </button>
                <button type="button" onClick={() => setShowCreateModal(false)} className="glass-panel" style={{ flex: 1, padding: '0.7rem', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmAction && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-panel animate-scale-up" style={{ width: '400px', padding: '2rem', textAlign: 'center' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', margin: '0 auto 1.5rem',
              background: confirmAction.type === 'delete' ? 'var(--critical-bg)' : (confirmAction.user.active ? 'var(--critical-bg)' : 'var(--success-bg)'),
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {confirmAction.type === 'delete'
                ? <Trash2 size={28} style={{ color: 'var(--critical)' }} />
                : confirmAction.user.active
                  ? <UserX size={28} style={{ color: 'var(--critical)' }} />
                  : <UserCheck size={28} style={{ color: 'var(--success)' }} />
              }
            </div>
            <h3 className="h4" style={{ marginBottom: '0.5rem' }}>
              {confirmAction.type === 'delete' ? 'Delete User?' : (confirmAction.user.active ? 'Deactivate User?' : 'Activate User?')}
            </h3>
            <p className="text-sm text-secondary" style={{ marginBottom: '1.5rem' }}>
              {confirmAction.type === 'delete'
                ? `This will permanently remove ${confirmAction.user.fullName} from the platform.`
                : confirmAction.user.active
                  ? `${confirmAction.user.fullName} will lose access to all SOC features.`
                  : `${confirmAction.user.fullName} will regain access to the platform.`
              }
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => confirmAction.type === 'delete' ? handleDelete(confirmAction.user.id) : handleToggleStatus(confirmAction.user.id)}
                style={{
                  flex: 1, padding: '0.7rem', borderRadius: 'var(--radius-md)', fontWeight: 600,
                  background: confirmAction.type === 'delete' || confirmAction.user.active ? 'var(--critical)' : 'var(--success)', color: 'white'
                }}
              >
                {confirmAction.type === 'delete' ? 'Delete' : (confirmAction.user.active ? 'Deactivate' : 'Activate')}
              </button>
              <button onClick={() => setConfirmAction(null)} className="glass-panel" style={{ flex: 1, padding: '0.7rem', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementPage;
