import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Search, Filter, X, ChevronDown, AlertTriangle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import api from '../api/axios';
import { SeverityColors, StatusColors } from '../utils/constants';

const IncidentListPage = () => {
  const [searchParams] = useSearchParams();
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ severity: '', status: '', source: '' });
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => { fetchIncidents(); }, [search, filters, page]);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const params: any = { search, size: 15, page };
      if (filters.severity) params.severity = filters.severity;
      if (filters.status) params.status = filters.status;
      if (filters.source) params.source = filters.source;
      const res = await api.get('/incidents', { params });
      setIncidents(res.data.content || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const clearFilters = () => {
    setFilters({ severity: '', status: '', source: '' });
    setSearch('');
  };

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="h2">Incidents</h1>
          <p className="text-secondary">Manage, investigate, and resolve security incidents</p>
        </div>
        <Link to="/incidents/new" className="btn-primary hover-lift"><Plus size={18} /> New Incident</Link>
      </div>

      {/* Search + Filter Bar */}
      <div className="glass-panel" style={{ padding: '1rem' }}>
        <div className="flex gap-3 items-center">
          <div className="flex items-center" style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
            <input type="text" placeholder="Search incidents by title, description, or IOC..."
              className="form-input" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              style={{ paddingLeft: '2.5rem' }} />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className="btn-ghost" style={{ position: 'relative' }}>
            <Filter size={16} /> Filters
            {activeFilterCount > 0 && (
              <span style={{
                position: 'absolute', top: '-6px', right: '-6px', width: 20, height: 20, borderRadius: '50%',
                background: 'var(--primary)', color: 'white', fontSize: '0.65rem', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>{activeFilterCount}</span>
            )}
          </button>
          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="text-xs text-muted flex items-center gap-1" style={{ padding: '0.3rem' }}>
              <X size={14} /> Clear
            </button>
          )}
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
            <div>
              <label className="form-label text-xs">Severity</label>
              <select className="form-input" value={filters.severity} onChange={e => setFilters({ ...filters, severity: e.target.value })}>
                <option value="">All Severities</option>
                {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label text-xs">Status</label>
              <select className="form-input" value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>
                <option value="">All Statuses</option>
                {['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label text-xs">Source</label>
              <select className="form-input" value={filters.source} onChange={e => setFilters({ ...filters, source: e.target.value })}>
                <option value="">All Sources</option>
                {['MANUAL', 'SIEM', 'EDR', 'XDR', 'FIREWALL', 'IDS_IPS', 'EMAIL_GATEWAY', 'THREAT_INTEL'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Incidents Table */}
      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="flex flex-col gap-2" style={{ padding: '1rem' }}>
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton" style={{ height: '52px', width: '100%' }} />)}
          </div>
        ) : incidents.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center' }}>
            <AlertTriangle size={48} className="text-muted" style={{ marginBottom: '1rem', opacity: 0.3 }} />
            <h3 className="h4" style={{ marginBottom: '0.5rem' }}>No Incidents Found</h3>
            <p className="text-secondary text-sm" style={{ marginBottom: '1.5rem' }}>
              {search || activeFilterCount > 0 ? 'Try adjusting your search or filters.' : 'Create your first incident to get started.'}
            </p>
            {!search && activeFilterCount === 0 && <Link to="/incidents/new" className="btn-primary"><Plus size={16} /> Create First Incident</Link>}
          </div>
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                  {['ID', 'Title', 'Severity', 'Status', 'Source', 'Assignee', 'Created'].map(h => (
                    <th key={h} style={{ padding: '1rem 1.25rem', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {incidents.map(inc => (
                  <tr key={inc.id} style={{ borderBottom: '1px solid var(--border-light)', transition: 'background 0.15s', cursor: 'pointer' }}
                    onMouseOver={(e) => (e.currentTarget.style.background = 'var(--bg-surface-hover)')}
                    onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '0.85rem 1.25rem' }}>
                      <Link to={`/incidents/${inc.id}`} style={{ fontWeight: 700, color: 'var(--primary)' }}>#{inc.id}</Link>
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem' }}>
                      <Link to={`/incidents/${inc.id}`} style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', textDecoration: 'none' }}>{inc.title}</Link>
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem' }}>
                      <span style={{
                        padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700,
                        background: `var(--${inc.severity.toLowerCase()}-bg)`, color: SeverityColors[inc.severity]
                      }}>{inc.severity}</span>
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem' }}>
                      <span className="flex items-center gap-1" style={{ color: StatusColors[inc.status], fontWeight: 600, fontSize: '0.8rem' }}>
                        {inc.status === 'CLOSED' && <CheckCircle size={14} />}
                        {inc.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem' }}>
                      <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'var(--bg-elevated)', fontSize: '0.75rem', fontWeight: 500 }}>{inc.source}</span>
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', fontSize: '0.8rem', color: inc.assigneeName ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      {inc.assigneeName || 'Unassigned'}
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {format(new Date(inc.createdAt), 'MMM dd, HH:mm')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between" style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--border-light)' }}>
                <span className="text-xs text-muted">Page {page + 1} of {totalPages}</span>
                <div className="flex gap-2">
                  <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="btn-ghost" style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', opacity: page === 0 ? 0.4 : 1 }}>Previous</button>
                  <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1} className="btn-ghost" style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', opacity: page >= totalPages - 1 ? 0.4 : 1 }}>Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default IncidentListPage;
