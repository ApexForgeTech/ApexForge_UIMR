import { useState, useEffect } from 'react';
import { Play, Plus, Clock, X, Zap, Check, MoreVertical, Settings, Trash2, Edit, Terminal, Users } from 'lucide-react';
import { format } from 'date-fns';
import api from '../api/axios';

const TRIGGER_TYPES = [
  { value: 'MANUAL', label: 'Manual', icon: '🖐️', color: 'var(--primary)' },
  { value: 'AUTOMATED', label: 'Automated', icon: '⚡', color: 'var(--success)' },
  { value: 'SCHEDULED', label: 'Scheduled', icon: '🕐', color: 'var(--medium)' },
];

const PlaybooksPage = () => {
  const [playbooks, setPlaybooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [executions, setExecutions] = useState<Record<number, any[]>>({});
  const [newPb, setNewPb] = useState({
    name: '', description: '', stepsJson: '[]', soarEndpoint: '', triggerType: 'MANUAL'
  });
  const [steps, setSteps] = useState<{ name: string; action: string }[]>([]);
  const [newStep, setNewStep] = useState({ name: '', action: '' });

  useEffect(() => { fetchPlaybooks(); }, []);

  const fetchPlaybooks = async () => {
    try {
      const res = await api.get('/playbooks');
      setPlaybooks(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchExecutions = async (pbId: number) => {
    try {
      const res = await api.get(`/playbooks/executions/incident/${pbId}`);
      setExecutions(prev => ({ ...prev, [pbId]: res.data }));
    } catch (err) { console.error(err); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/playbooks', { ...newPb, stepsJson: JSON.stringify(steps) });
      setShowModal(false);
      setNewPb({ name: '', description: '', stepsJson: '[]', soarEndpoint: '', triggerType: 'MANUAL' });
      setSteps([]);
      fetchPlaybooks();
    } catch (err) { console.error(err); }
  };

  const addStep = () => {
    if (newStep.name.trim()) {
      setSteps([...steps, { ...newStep }]);
      setNewStep({ name: '', action: '' });
    }
  };

  const parseSteps = (json: string) => {
    try { return JSON.parse(json) || []; } catch { return []; }
  };

  const toggleExpand = (id: number) => {
    if (expandedId === id) { setExpandedId(null); }
    else { setExpandedId(id); fetchExecutions(id); }
  };

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="h2">SOAR Playbooks</h1>
          <p className="text-secondary">Automate incident response with reusable playbooks</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary hover-lift">
          <Plus size={18} /> Create Playbook
        </button>
      </div>

      {/* Stats Mini Bar */}
      <div className="flex gap-4">
        <div className="glass-panel flex items-center gap-3" style={{ padding: '0.85rem 1.25rem' }}>
          <Zap size={18} className="text-primary" />
          <span className="text-sm"><strong>{playbooks.length}</strong> Total Playbooks</span>
        </div>
        <div className="glass-panel flex items-center gap-3" style={{ padding: '0.85rem 1.25rem' }}>
          <Terminal size={18} style={{ color: 'var(--success)' }} />
          <span className="text-sm"><strong>{playbooks.filter(p => p.soarEndpoint).length}</strong> SOAR Connected</span>
        </div>
      </div>

      {/* Playbook Cards */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '140px' }} />)}
        </div>
      ) : playbooks.length === 0 ? (
        <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--primary-transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <Play size={36} className="text-primary" />
          </div>
          <h3 className="h4" style={{ marginBottom: '0.5rem' }}>No Playbooks Yet</h3>
          <p className="text-secondary text-sm" style={{ marginBottom: '1.5rem' }}>Create your first playbook to automate incident response workflows.</p>
          <button onClick={() => setShowModal(true)} className="btn-primary"><Plus size={16} /> Create First Playbook</button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {playbooks.map(pb => {
            const pbSteps = parseSteps(pb.stepsJson);
            const isExpanded = expandedId === pb.id;
            return (
              <div key={pb.id} className="glass-panel hover-lift" style={{ overflow: 'hidden', transition: 'all 0.2s' }}>
                <div style={{ padding: '1.5rem', cursor: 'pointer' }} onClick={() => toggleExpand(pb.id)}>
                  <div className="flex items-center justify-between" style={{ marginBottom: '0.75rem' }}>
                    <div className="flex items-center gap-3">
                      <div style={{ padding: '10px', background: 'var(--primary-transparent)', borderRadius: '10px', color: 'var(--primary)' }}>
                        <Play size={20} />
                      </div>
                      <div>
                        <h3 className="h4">{pb.name}</h3>
                        <div className="flex items-center gap-3 text-xs text-muted" style={{ marginTop: '0.25rem' }}>
                          <span className="flex items-center gap-1"><Clock size={12} /> {format(new Date(pb.createdAt), 'MMM dd, yyyy')}</span>
                          <span>·</span>
                          <span>{pbSteps.length} steps</span>
                          {pb.soarEndpoint && <><span>·</span><span style={{ color: 'var(--success)' }}>🟢 SOAR</span></>}
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-secondary">{pb.description || 'No description provided.'}</p>
                </div>

                {/* Steps Preview */}
                {pbSteps.length > 0 && !isExpanded && (
                  <div style={{ padding: '0 1.5rem 1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {pbSteps.slice(0, 4).map((s: any, i: number) => (
                      <span key={i} style={{
                        padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 600,
                        background: 'var(--bg-elevated)', color: 'var(--text-secondary)'
                      }}>Step {i + 1}: {s.name || s}</span>
                    ))}
                    {pbSteps.length > 4 && <span className="text-xs text-muted">+{pbSteps.length - 4} more</span>}
                  </div>
                )}

                {/* Expanded Section */}
                {isExpanded && (
                  <div className="animate-fade-in" style={{ borderTop: '1px solid var(--border-light)', padding: '1.5rem' }}>
                    {pbSteps.length > 0 && (
                      <div style={{ marginBottom: '1.5rem' }}>
                        <h4 className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>Execution Steps</h4>
                        <div className="flex flex-col gap-2">
                          {pbSteps.map((s: any, i: number) => (
                            <div key={i} className="flex items-center gap-3" style={{ padding: '0.6rem 0.8rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--primary)' }}>
                              <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--primary-transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontSize: '0.7rem', fontWeight: 700 }}>{i + 1}</span>
                              <span className="text-sm" style={{ fontWeight: 500 }}>{s.name || s}</span>
                              {s.action && <span className="text-xs text-muted" style={{ marginLeft: 'auto' }}>{s.action}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {pb.soarEndpoint && (
                      <div style={{ padding: '0.75rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
                        <span className="text-xs text-muted">SOAR Endpoint: </span>
                        <code className="text-sm" style={{ color: 'var(--primary)' }}>{pb.soarEndpoint}</code>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-panel animate-scale-up" style={{ width: '600px', maxHeight: '85vh', overflow: 'auto', padding: '2rem' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
              <h3 className="h3">Create Playbook</h3>
              <button onClick={() => setShowModal(false)} className="text-muted"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div>
                <label className="form-label">Playbook Name</label>
                <input type="text" className="form-input" required value={newPb.name}
                  onChange={e => setNewPb({ ...newPb, name: e.target.value })} placeholder="e.g. Ransomware Containment" />
              </div>
              <div>
                <label className="form-label">Description</label>
                <textarea className="form-input" rows={3} value={newPb.description}
                  onChange={e => setNewPb({ ...newPb, description: e.target.value })}
                  placeholder="Step-by-step automated response for ransomware incidents..." />
              </div>
              <div>
                <label className="form-label">SOAR Endpoint (Optional)</label>
                <input type="text" className="form-input" value={newPb.soarEndpoint}
                  onChange={e => setNewPb({ ...newPb, soarEndpoint: e.target.value })} placeholder="/api/soar/remediate" />
              </div>

              {/* Step Builder */}
              <div>
                <label className="form-label">Execution Steps</label>
                {steps.length > 0 && (
                  <div className="flex flex-col gap-2" style={{ marginBottom: '0.75rem' }}>
                    {steps.map((s, i) => (
                      <div key={i} className="flex items-center gap-2" style={{ padding: '0.5rem 0.75rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--primary)' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--primary)' }}>{i + 1}.</span>
                        <span className="text-sm" style={{ flex: 1, fontWeight: 500 }}>{s.name}</span>
                        <span className="text-xs text-muted">{s.action}</span>
                        <button type="button" onClick={() => setSteps(steps.filter((_, j) => j !== i))} style={{ color: 'var(--text-muted)' }}><X size={14} /></button>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.5rem' }}>
                  <input type="text" className="form-input" value={newStep.name}
                    onChange={(e) => setNewStep({ ...newStep, name: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addStep())}
                    placeholder="Step name (e.g. Isolate Host)" />
                  <input type="text" className="form-input" value={newStep.action}
                    onChange={(e) => setNewStep({ ...newStep, action: e.target.value })}
                    placeholder="Action type (e.g. API Call)" />
                  <button type="button" onClick={addStep} className="btn-ghost" style={{ padding: '0.5rem' }}><Plus size={16} /></button>
                </div>
              </div>

              <div className="flex gap-2" style={{ marginTop: '0.5rem' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Save Playbook</button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlaybooksPage;
