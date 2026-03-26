import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Clock, ShieldAlert, ArrowRight, TrendingUp, Zap, Plus, FileText, Play } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip as ChartTooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import api from '../api/axios';
import { useLanguageStore } from '../store/languageStore';
import { SeverityColors } from '../utils/constants';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, ChartTooltip, Legend, ArcElement);

const DashboardPage = () => {
  const { t } = useLanguageStore();
  const [stats, setStats] = useState<any>(null);
  const [recentIncidents, setRecentIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const statsRes = await api.get('/dashboard/stats');
        setStats(statsRes.data);
      } catch (err) { console.error('Failed to fetch stats', err); }
      try {
        const incRes = await api.get('/incidents', { params: { size: 5 } });
        setRecentIncidents(incRes.data.content || []);
      } catch (err) { console.error('Failed to fetch recent incidents', err); }
      setLoading(false);
    };
    fetchAll();
  }, []);


  if (loading) return (
    <div className="animate-fade-in flex flex-col gap-6">
      {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: i === 1 ? '40px' : '120px', width: '100%' }} />)}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: '100px' }} />)}
      </div>
    </div>
  );

  if (!stats) return <div className="text-critical animate-fade-in">Failed to load statistics.</div>;

  const STAT_CARDS = [
    { label: t('total_incidents'), value: stats.totalIncidents, icon: <ShieldAlert size={24} />, gradient: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.08))', color: 'var(--primary)', borderColor: 'rgba(99,102,241,0.3)' },
    { label: t('open_incidents'), value: stats.openIncidents, icon: <AlertCircle size={24} />, gradient: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(249,115,22,0.08))', color: 'var(--critical)', borderColor: 'rgba(239,68,68,0.3)' },
    { label: t('in_progress'), value: stats.inProgressIncidents, icon: <Clock size={24} />, gradient: 'linear-gradient(135deg, rgba(234,179,8,0.15), rgba(249,115,22,0.08))', color: 'var(--medium)', borderColor: 'rgba(234,179,8,0.3)' },
    { label: t('closed'), value: stats.closedIncidents, icon: <CheckCircle size={24} />, gradient: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(6,182,212,0.08))', color: 'var(--success)', borderColor: 'rgba(16,185,129,0.3)' },
  ];

  const severityData = {
    labels: Object.keys(stats.bySeverity),
    datasets: [{
      data: Object.values(stats.bySeverity),
      backgroundColor: ['rgba(239,68,68,0.8)', 'rgba(249,115,22,0.8)', 'rgba(234,179,8,0.8)', 'rgba(59,130,246,0.8)', 'rgba(139,92,246,0.8)'],
      borderColor: 'transparent', borderWidth: 0
    }]
  };

  const statusData = {
    labels: Object.keys(stats.byStatus),
    datasets: [{
      label: 'Incidents by Status',
      data: Object.values(stats.byStatus),
      backgroundColor: ['rgba(239,68,68,0.7)', 'rgba(234,179,8,0.7)', 'rgba(99,102,241,0.7)', 'rgba(16,185,129,0.7)'],
      borderRadius: 6, borderSkipped: false as const
    }]
  };

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' as const, labels: { color: '#94a3b8', padding: 16, usePointStyle: true, pointStyle: 'circle' } } },
    scales: { y: { display: false }, x: { display: false } }
  };

  const barOptions = {
    ...chartOptions,
    scales: {
      y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#64748b', font: { size: 11 } } },
      x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 11 } } }
    }
  };

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="h2">{t('soc_overview')}</h1>
          <p className="text-secondary">Real-time security operations monitoring</p>
        </div>
        <div className="flex gap-2">
          <Link to="/incidents/new" className="btn-primary hover-lift"><Plus size={16} /> New Incident</Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {STAT_CARDS.map((s, i) => (
          <div key={i} className="glass-panel hover-lift" style={{
            padding: '1.5rem', background: s.gradient, borderLeft: `3px solid ${s.borderColor}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'default'
          }}>
            <div>
              <p className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: '0.25rem' }}>{s.label}</p>
              <h3 style={{ fontSize: '2rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</h3>
            </div>
            <div style={{ width: 48, height: 48, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', color: s.color }}>
              {s.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Charts + Recent Incidents */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
        {/* Severity Chart */}
        <div className="glass-panel card-gradient-border" style={{ padding: '1.5rem' }}>
          <h3 className="h4" style={{ marginBottom: '1.25rem' }}>{t('severity_dist')}</h3>
          <div style={{ height: '240px' }}>
            <Doughnut data={severityData} options={chartOptions} />
          </div>
        </div>

        {/* Status Chart */}
        <div className="glass-panel card-gradient-border" style={{ padding: '1.5rem' }}>
          <h3 className="h4" style={{ marginBottom: '1.25rem' }}>{t('status_pipeline')}</h3>
          <div style={{ height: '240px' }}>
            <Bar data={statusData} options={barOptions} />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="glass-panel card-gradient-border" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <h3 className="h4" style={{ marginBottom: '1.25rem' }}>Quick Actions</h3>
          <div className="flex flex-col gap-3" style={{ flex: 1 }}>
            {[
              { label: 'Create Incident', icon: <Plus size={18} />, path: '/incidents/new', color: 'var(--primary)', bg: 'var(--primary-transparent)' },
              { label: 'Run Playbook', icon: <Play size={18} />, path: '/playbooks', color: 'var(--info)', bg: 'rgba(139,92,246,0.12)' },
              { label: 'Generate Report', icon: <FileText size={18} />, path: '/reports', color: 'var(--success)', bg: 'var(--success-bg)' },
              { label: 'View Knowledge Base', icon: <Zap size={18} />, path: '/kb', color: 'var(--medium)', bg: 'var(--medium-bg)' },
            ].map((action, i) => (
              <Link key={i} to={action.path} className="flex items-center gap-3 hover-lift" style={{
                padding: '0.85rem 1rem', background: action.bg, borderRadius: 'var(--radius-md)', transition: 'all 0.15s', textDecoration: 'none', color: 'var(--text-primary)'
              }}>
                <div style={{ color: action.color }}>{action.icon}</div>
                <span style={{ fontWeight: 500, fontSize: '0.875rem', flex: 1 }}>{action.label}</span>
                <ArrowRight size={16} className="text-muted" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Incidents */}
      <div className="glass-panel card-gradient-border" style={{ padding: '1.5rem' }}>
        <div className="flex justify-between items-center" style={{ marginBottom: '1rem' }}>
          <h3 className="h4">Recent Incidents</h3>
          <Link to="/incidents" className="text-sm text-primary flex items-center gap-1">View All <ArrowRight size={14} /></Link>
        </div>
        {recentIncidents.length === 0 ? (
          <p className="text-muted text-sm">No incidents yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {recentIncidents.map(inc => (
              <Link key={inc.id} to={`/incidents/${inc.id}`} className="flex items-center gap-4 hover-lift" style={{
                padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', textDecoration: 'none', color: 'inherit', transition: 'all 0.15s'
              }}>
                <span style={{
                  padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700,
                  background: `var(--${inc.severity.toLowerCase()}-bg)`, color: SeverityColors[inc.severity], minWidth: '60px', textAlign: 'center'
                }}>{inc.severity}</span>
                <span style={{ fontWeight: 600, fontSize: '0.875rem', flex: 1 }}>#{inc.id} {inc.title}</span>
                <span className="text-xs text-muted">{inc.source}</span>
                <span className="text-xs text-muted">{format(new Date(inc.createdAt), 'MMM dd, HH:mm')}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
