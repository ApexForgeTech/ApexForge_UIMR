import { useState, useEffect } from 'react';
import { FileText, Download, Plus, RefreshCcw, Trash2, X, BarChart3, FileSpreadsheet, FileJson, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import api from '../api/axios';

const FORMAT_CONFIG: Record<string, { color: string; bg: string; icon: any }> = {
  PDF: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', icon: FileText },
  CSV: { color: '#10b981', bg: 'rgba(16,185,129,0.12)', icon: FileSpreadsheet },
  JSON: { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', icon: FileJson },
};

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: any; label: string }> = {
  READY: { color: 'var(--success)', bg: 'var(--success-bg)', icon: CheckCircle2, label: 'Ready' },
  GENERATING: { color: 'var(--medium)', bg: 'var(--medium-bg)', icon: RefreshCcw, label: 'Generating' },
  FAILED: { color: 'var(--critical)', bg: 'var(--critical-bg)', icon: XCircle, label: 'Failed' },
};

const ReportsPage = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'INCIDENT_SUMMARY', format: 'PDF', dateFrom: '', dateTo: '' });

  useEffect(() => {
    fetchReports();
    const interval = setInterval(fetchReports, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchReports = async () => {
    try {
      const res = await api.get('/reports');
      setReports(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/reports/generate', form);
      setShowModal(false);
      setForm({ name: '', type: 'INCIDENT_SUMMARY', format: 'PDF', dateFrom: '', dateTo: '' });
      fetchReports();
    } catch (err) { console.error(err); }
  };

  const handleDownload = async (id: number) => {
    try {
      const res = await api.get(`/reports/download/${id}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      const disposition = res.headers['content-disposition'];
      const filename = disposition ? disposition.split('filename="')[1]?.replace('"', '') : `report_${id}.txt`;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) { console.error('Download failed', err); }
  };


  const handleDelete = async (id: number) => {
    try { await api.delete(`/reports/${id}`); fetchReports(); } catch (err) { console.error(err); }
  };

  const stats = {
    total: reports.length,
    ready: reports.filter(r => r.status === 'READY').length,
    generating: reports.filter(r => r.status === 'GENERATING').length,
    failed: reports.filter(r => r.status === 'FAILED').length,
  };

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="h2">Reports</h1>
          <p className="text-secondary">Generate, manage, and export security analysis reports</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary hover-lift">
          <Plus size={18} /> Generate Report
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {[
          { label: 'Total Reports', value: stats.total, color: 'var(--primary)', bg: 'var(--primary-transparent)', icon: <BarChart3 size={22} /> },
          { label: 'Ready', value: stats.ready, color: 'var(--success)', bg: 'var(--success-bg)', icon: <CheckCircle2 size={22} /> },
          { label: 'Generating', value: stats.generating, color: 'var(--medium)', bg: 'var(--medium-bg)', icon: <Clock size={22} /> },
          { label: 'Failed', value: stats.failed, color: 'var(--critical)', bg: 'var(--critical-bg)', icon: <XCircle size={22} /> },
        ].map((s, i) => (
          <div key={i} className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: '12px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: s.color }}>{s.value}</div>
              <div className="text-xs text-muted">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Reports Table */}
      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }} className="text-muted">Loading reports...</div>
        ) : reports.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--primary-transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <FileText size={36} className="text-primary" />
            </div>
            <h3 className="h4" style={{ marginBottom: '0.5rem' }}>No Reports Yet</h3>
            <p className="text-secondary text-sm" style={{ marginBottom: '1.5rem' }}>Generate your first report to analyze incident trends and SOC performance.</p>
            <button onClick={() => setShowModal(true)} className="btn-primary">
              <Plus size={16} /> Generate First Report
            </button>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                {['Report Name', 'Type', 'Format', 'Status', 'Created', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '1rem 1.25rem', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reports.map(report => {
                const fmtConf = FORMAT_CONFIG[report.format] || FORMAT_CONFIG.PDF;
                const statusConf = STATUS_CONFIG[report.status] || STATUS_CONFIG.READY;
                const FmtIcon = fmtConf.icon;
                const StatusIcon = statusConf.icon;
                return (
                  <tr key={report.id} style={{ borderBottom: '1px solid var(--border-light)', transition: 'background 0.15s' }}
                    onMouseOver={(e) => (e.currentTarget.style.background = 'var(--bg-surface-hover)')}
                    onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div className="flex items-center gap-3">
                        <div style={{ width: 36, height: 36, borderRadius: '8px', background: fmtConf.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: fmtConf.color }}>
                          <FmtIcon size={18} />
                        </div>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{report.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.8rem' }}>
                      <span style={{ padding: '0.25rem 0.6rem', borderRadius: '6px', background: 'var(--bg-elevated)', fontSize: '0.75rem', fontWeight: 500 }}>
                        {report.type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ padding: '0.25rem 0.6rem', borderRadius: '6px', background: fmtConf.bg, color: fmtConf.color, fontSize: '0.75rem', fontWeight: 700 }}>
                        {report.format}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span className="flex items-center gap-1" style={{ color: statusConf.color, fontSize: '0.8rem', fontWeight: 600 }}>
                        <StatusIcon size={14} className={report.status === 'GENERATING' ? 'animate-spin' : ''} />
                        {statusConf.label}
                      </span>
                      {report.status === 'GENERATING' && (
                        <div className="progress-bar" style={{ marginTop: '0.4rem', width: '80px' }}>
                          <div className="progress-bar-fill" style={{ width: '60%' }} />
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {format(new Date(report.createdAt), 'MMM dd, HH:mm')}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div className="flex items-center gap-1">
                        {report.status === 'READY' && (
                          <button onClick={() => handleDownload(report.id)} className="btn-ghost" style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}>
                            <Download size={14} /> Download
                          </button>
                        )}
                        <button onClick={() => handleDelete(report.id)} style={{ padding: '0.4rem', borderRadius: '8px', color: 'var(--text-muted)', transition: 'all 0.15s' }}
                          onMouseOver={(e) => { e.currentTarget.style.color = 'var(--critical)'; e.currentTarget.style.background = 'var(--critical-bg)'; }}
                          onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
                        >
                          <Trash2 size={16} />
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

      {/* Generate Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-panel animate-scale-up" style={{ width: '500px', padding: '2rem' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
              <h3 className="h3">Generate New Report</h3>
              <button onClick={() => setShowModal(false)} className="text-muted"><X size={20} /></button>
            </div>
            <form onSubmit={handleGenerate} className="flex flex-col gap-4">
              <div>
                <label className="form-label">Report Name</label>
                <input type="text" className="form-input" required value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Q1 2026 Incident Summary" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label">Report Type</label>
                  <select className="form-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                    <option value="INCIDENT_SUMMARY">📊 Incident Summary</option>
                    <option value="IOC_ANALYTICS">🔍 IOC Analytics</option>
                    <option value="SOC_PERFORMANCE">⚡ SOC Performance</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Format</label>
                  <select className="form-input" value={form.format} onChange={e => setForm({ ...form, format: e.target.value })}>
                    <option value="PDF">📄 PDF Document</option>
                    <option value="CSV">📊 CSV Spreadsheet</option>
                    <option value="JSON">🔧 Raw JSON</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label">Date From (Optional)</label>
                  <input type="date" className="form-input" value={form.dateFrom}
                    onChange={e => setForm({ ...form, dateFrom: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">Date To (Optional)</label>
                  <input type="date" className="form-input" value={form.dateTo}
                    onChange={e => setForm({ ...form, dateTo: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-2" style={{ marginTop: '0.5rem' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Generate Report</button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
