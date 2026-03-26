import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ShieldAlert, Terminal, MessageSquare, Play, Info, Plus, X, Sparkles, CheckCircle2 } from 'lucide-react';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';
import { SeverityColors, StatusColors, TiStatusConfig } from '../utils/constants';

const IncidentDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuthStore();
  const [incident, setIncident] = useState<any>(null);
  const [iocs, setIocs] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [newNote, setNewNote] = useState('');
  const [showIocModal, setShowIocModal] = useState(false);
  const [newIoc, setNewIoc] = useState({ type: 'IP', value: '' });
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeForm, setCloseForm] = useState({ classification: 'TRUE_POSITIVE', notes: '' });
  const [availablePlaybooks, setAvailablePlaybooks] = useState<any[]>([]);
  const [playbookExecutions, setPlaybookExecutions] = useState<any[]>([]);
  const [showAIModal, setShowAIModal] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);

  useEffect(() => {
    if (id) {
        fetchIncidentData();
        fetchPlaybooks();
        fetchExecutions();
    }
  }, [id]);

  const fetchPlaybooks = async () => {
    try {
      const res = await api.get('/playbooks');
      setAvailablePlaybooks(res.data);
    } catch (err) {
      console.error('Error fetching playbooks:', err);
    }
  };

  const fetchExecutions = async () => {
    try {
      const res = await api.get(`/playbooks/executions/${id}`);
      setPlaybookExecutions(res.data);
    } catch (err) {
      console.error('Error fetching executions:', err);
    }
  };

  const handleExecutePlaybook = async (playbookId: number) => {
    try {
      await api.post(`/playbooks/${playbookId}/execute`, null, { params: { incidentId: id } });
      fetchExecutions();
    } catch (err) {
      console.error('Error executing playbook:', err);
    }
  };

  const fetchIncidentData = async () => {
    if (!id) return;
    try {
      const [incRes, iocRes, timeRes, noteRes] = await Promise.all([
        api.get(`/incidents/${id}`),
        api.get(`/incidents/${id}/iocs`),
        api.get(`/incidents/${id}/timeline`),
        api.get(`/incidents/${id}/notes`)
      ]);
      setIncident(incRes.data);
      setIocs(iocRes.data);
      setTimeline(timeRes.data);
      setNotes(noteRes.data);
    } catch (err: any) {
      console.error('Error fetching incident data:', err.response?.data || err.message);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    try {
      await api.post(`/incidents/${id}/notes`, { content: newNote });
      setNewNote('');
      fetchIncidentData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddIoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIoc.value.trim()) return;
    try {
      await api.post(`/incidents/${id}/iocs`, newIoc);
      setNewIoc({ type: 'IP', value: '' });
      setShowIocModal(false);
      fetchIncidentData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAIAnalysis = async () => {
    setShowAIModal(true);
    setAnalyzing(true);
    setTimeout(() => {
      setAiAnalysis({
        summary: `This incident involves ${incident.title}. Based on the current IOCs and context, this appears to be a ${incident.severity.toLowerCase()} priority event requiring immediate investigation of lateral movement.`,
        recommendations: [
          "Isolate the affected workstation if suspicious activity persists.",
          "Check for lateral movement in internal application logs.",
          "Run the 'Malware Containment' playbook if confirmed malicious."
        ],
        confidence: 85
      });
      setAnalyzing(false);
    }, 2000);
  };

  const handleRunTi = async (iocId: number) => {
    try {
      await api.post(`/iocs/${iocId}/check-ti`);
      fetchIncidentData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssign = async () => {
    if (!user?.id) return;
    try {
        await api.patch(`/incidents/${id}/assign`, { assigneeId: user.id });
        fetchIncidentData();
    } catch (err) {
        console.error(err);
    }
  };

  const handleClose = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        await api.patch(`/incidents/${id}/close`, { 
            classification: closeForm.classification,
            closingNotes: closeForm.notes 
        });
        setShowCloseModal(false);
        fetchIncidentData();
    } catch (err) {
        console.error(err);
    }
  };

  if (!incident) return <div className="animate-fade-in p-8">Loading incident...</div>;

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="h2">#{incident.id} {incident.title}</h1>
            <span style={{ 
              padding: '0.25rem 0.75rem', 
              borderRadius: 'var(--radius-full)', 
              fontSize: '0.875rem', 
              fontWeight: 600,
              backgroundColor: `var(--${incident.severity.toLowerCase()}-bg)`,
              color: SeverityColors[incident.severity]
            }}>{incident.severity}</span>
            <span style={{ 
              padding: '0.25rem 0.75rem', 
              border: `1px solid ${StatusColors[incident.status]}`,
              borderRadius: 'var(--radius-full)', 
              fontSize: '0.875rem', 
              color: StatusColors[incident.status]
            }}>{incident.status}</span>
          </div>
          <p className="text-secondary text-sm">Created {format(new Date(incident.createdAt), 'PPP p')} by {incident.createdByName}</p>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={handleAIAnalysis}
            className="hover-lift glass-panel px-4 py-2 text-sm text-primary flex items-center gap-2"
            style={{ background: 'var(--primary-transparent)' }}
          >
            <Sparkles size={16} /> AI Analysis
          </button>
          <button onClick={handleAssign} className="hover-lift glass-panel px-4 py-2 text-sm text-primary">Assign to me</button>
          <button 
            onClick={() => setShowCloseModal(true)} 
            className="hover-lift glass-panel px-4 py-2 text-sm text-critical border-critical"
            disabled={incident.status === 'CLOSED'}
          >
            Close Incident
          </button>
        </div>
      </div>

      <div className="flex gap-4 border-b border-light pb-2 mb-2" style={{ borderBottom: '1px solid var(--border-light)' }}>
        {[ 'overview', 'iocs', 'timeline', 'playbooks' ].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '0.5rem 1rem',
              color: activeTab === tab ? 'var(--primary)' : 'var(--text-secondary)',
              borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
              fontWeight: activeTab === tab ? 600 : 400,
              textTransform: 'capitalize'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
          <div className="flex flex-col gap-6">
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h3 className="h4 mb-4" style={{ marginBottom: '1rem' }}><Info size={18} className="inline mr-2"/> Description</h3>
              <p style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>{incident.description || 'No description provided.'}</p>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h3 className="h4 mb-4" style={{ marginBottom: '1rem' }}><MessageSquare size={18} className="inline mr-2"/> Analyst Notes ({notes.length})</h3>
              <form onSubmit={handleAddNote} className="mb-6 flex gap-2" style={{ marginBottom: '1.5rem' }}>
                <input 
                  type="text" 
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  placeholder="Add a note..." 
                  className="form-input" 
                  style={{ flex: 1 }} 
                />
                <button type="submit" className="glass-panel px-4 py-2 hover-lift text-primary" style={{ padding: '0 1.5rem' }}>Add</button>
              </form>
              <div className="flex flex-col gap-4">
                {notes.map(note => (
                   <div key={note.id} style={{ padding: '1rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                     <div className="flex justify-between items-center" style={{ marginBottom: '0.5rem' }}>
                       <span style={{ fontWeight: 600 }}>{note.authorName}</span>
                       <span className="text-xs text-muted">{format(new Date(note.createdAt), 'MMM dd, HH:mm')}</span>
                     </div>
                     <p className="text-sm">{note.content}</p>
                   </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h3 className="h4" style={{ marginBottom: '1rem' }}>Details</h3>
              <div className="flex flex-col gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-secondary">Source:</span>
                  <span>{incident.source}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">Assignee:</span>
                  <span>{incident.assigneeName || 'Unassigned'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">Classification:</span>
                  <span>{incident.classification}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'iocs' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div className="flex justify-between items-center mb-4" style={{ marginBottom: '1rem' }}>
            <h3 className="h4">Indicators of Compromise</h3>
            <button 
              onClick={() => setShowIocModal(true)}
              className="glass-panel px-4 py-2 hover-lift text-primary text-sm flex items-center gap-2"
            >
              <Plus size={16}/> Add IOC
            </button>
          </div>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '1rem' }}>Type</th>
                <th style={{ padding: '1rem' }}>Value</th>
                <th style={{ padding: '1rem' }}>TI Status</th>
                <th style={{ padding: '1rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {iocs.map(ioc => (
                <tr key={ioc.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '1rem', fontSize: '0.875rem' }}>{ioc.type}</td>
                  <td style={{ padding: '1rem', fontFamily: 'monospace' }}>{ioc.value}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      color: TiStatusConfig[ioc.tiStatus]?.color || 'white',
                      background: 'var(--bg-elevated)',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem'
                    }}>
                      {TiStatusConfig[ioc.tiStatus]?.label || ioc.tiStatus}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <button 
                      onClick={() => handleRunTi(ioc.id)}
                      className="text-primary text-sm hover-lift"
                    >
                      Check TI
                    </button>
                  </td>
                </tr>
              ))}
              {iocs.length === 0 && (
                <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No IOCs found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'playbooks' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 className="h4 mb-4" style={{ marginBottom: '1.5rem' }}>Available Playbooks</h3>
            <div className="flex flex-col gap-3">
              {availablePlaybooks.map(pb => (
                <div key={pb.id} className="flex justify-between items-center p-3 cursor-pointer hover:bg-surface-hover" style={{ 
                  background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: '1rem' 
                }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{pb.name}</div>
                    <div className="text-xs text-secondary">{pb.description}</div>
                  </div>
                  <button 
                    onClick={() => handleExecutePlaybook(pb.id)}
                    className="glass-panel px-3 py-1 text-xs hover-lift text-primary border-primary flex items-center gap-2"
                  >
                    <Play size={14}/> Run
                  </button>
                </div>
              ))}
              {availablePlaybooks.length === 0 && <div className="text-muted">No playbooks configured.</div>}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 className="h4 mb-4" style={{ marginBottom: '1.5rem' }}>Execution History</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    <th style={{ padding: '0.75rem' }}>Playbook</th>
                    <th style={{ padding: '0.75rem' }}>Status</th>
                    <th style={{ padding: '0.75rem' }}>Started</th>
                  </tr>
                </thead>
                <tbody>
                  {playbookExecutions.map(exec => (
                    <tr key={exec.id} style={{ borderBottom: '1px solid var(--border-light)', fontSize: '0.875rem' }}>
                      <td style={{ padding: '0.75rem' }}>{exec.playbookName}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{ 
                          color: exec.status === 'SUCCESS' ? 'var(--success)' : exec.status === 'FAILED' ? 'var(--critical)' : 'var(--medium)',
                          fontWeight: 600
                        }}>
                          {exec.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>
                        {format(new Date(exec.startedAt), 'HH:mm:ss')}
                      </td>
                    </tr>
                  ))}
                  {playbookExecutions.length === 0 && (
                    <tr><td colSpan={3} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No executions yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 className="h4" style={{ marginBottom: '1.5rem' }}>Audit Timeline</h3>
          <div className="flex flex-col gap-4">
            {timeline.map((event: any, i: number) => (
              <div key={event.id} className="flex gap-4">
                <div style={{ width: '2px', background: 'var(--border-light)', position: 'relative', marginTop: '8px' }}>
                  <div style={{ 
                    position: 'absolute', top: 0, left: '-4px', width: '10px', height: '10px', 
                    borderRadius: '50%', background: 'var(--primary)' 
                  }}/>
                </div>
                <div style={{ paddingBottom: i === timeline.length -1 ? 0 : '1.5rem' }}>
                  <div className="text-sm font-medium">{event.eventType}</div>
                  <div className="text-sm text-secondary">{event.description}</div>
                  <div className="text-xs text-muted mt-1" style={{ marginTop: '0.25rem' }}>
                    {format(new Date(event.createdAt), 'MMM dd, HH:mm:ss')} • {event.userName}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showIocModal && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 
        }}>
          <div className="glass-panel animate-scale-up" style={{ width: '400px', padding: '2rem' }}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="h3">Add Indicator</h3>
              <button 
                onClick={() => setShowIocModal(false)}
                className="text-muted hover:text-primary transition-colors"
              >
                <X size={20}/>
              </button>
            </div>
            <form onSubmit={handleAddIoc} className="flex flex-col gap-4">
              <div>
                <label className="text-sm text-secondary block mb-1">IOC Type</label>
                <select 
                  className="form-input" 
                  value={newIoc.type} 
                  onChange={e => setNewIoc({...newIoc, type: e.target.value})}
                >
                  <option value="IP">IP Address</option>
                  <option value="DOMAIN">Domain</option>
                  <option value="URL">URL</option>
                  <option value="HASH_SHA256">SHA-256 Hash</option>
                  <option value="EMAIL">Email Address</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-secondary block mb-1">Value</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={newIoc.value}
                  onChange={e => setNewIoc({...newIoc, value: e.target.value})}
                  placeholder="e.g. 8.8.8.8"
                  required
                />
              </div>
              <div className="flex gap-2 mt-4">
                <button type="submit" className="glass-panel px-4 py-2 hover-lift text-primary flex-1">Add Indicator</button>
                <button type="button" onClick={() => setShowIocModal(false)} className="glass-panel px-4 py-2 hover-lift text-muted flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCloseModal && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 
        }}>
          <div className="glass-panel animate-scale-up" style={{ width: '450px', padding: '2rem' }}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="h3">Close Incident</h3>
              <button 
                onClick={() => setShowCloseModal(false)}
                className="text-muted hover:text-primary transition-colors"
              >
                <X size={20}/>
              </button>
            </div>
            <form onSubmit={handleClose} className="flex flex-col gap-4">
              <div>
                <label className="text-sm text-secondary block mb-1">Classification</label>
                <select 
                  className="form-input" 
                  value={closeForm.classification} 
                  onChange={e => setCloseForm({...closeForm, classification: e.target.value})}
                  required
                >
                  <option value="TRUE_POSITIVE">True Positive</option>
                  <option value="FALSE_POSITIVE">False Positive</option>
                  <option value="BENIGN">Benign</option>
                  <option value="UNDETERMINED">Undetermined</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-secondary block mb-1">Closing Notes</label>
                <textarea 
                  className="form-input" 
                  rows={4}
                  value={closeForm.notes}
                  onChange={e => setCloseForm({...closeForm, notes: e.target.value})}
                  placeholder="Summary of findings and remediation steps..."
                  required
                />
              </div>
              <div className="flex gap-2 mt-4">
                <button type="submit" className="glass-panel px-4 py-2 hover-lift text-critical flex-1">Close Incident</button>
                <button type="button" onClick={() => setShowCloseModal(false)} className="glass-panel px-4 py-2 hover-lift text-muted flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showAIModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-panel animate-scale-up" style={{ width: '600px', padding: '2rem' }}>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <Sparkles size={24} className="text-primary" />
                <h3 className="h3">AI Assistant Analysis</h3>
              </div>
              <button onClick={() => setShowAIModal(false)} className="text-muted hover:text-white"><X size={20} /></button>
            </div>
            
            {analyzing ? (
              <div className="flex flex-col items-center py-12 gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <div className="text-secondary animate-pulse">Analyzing incident data and threat context...</div>
              </div>
            ) : aiAnalysis && (
              <div className="flex flex-col gap-6">
                <div>
                  <h4 className="text-sm font-bold text-muted uppercase tracking-wider mb-2">Executive Summary</h4>
                  <p className="text-secondary leading-relaxed bg-surface/30 p-4 rounded-lg">{aiAnalysis.summary}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-bold text-muted uppercase tracking-wider mb-2">Recommended Next Steps</h4>
                  <ul className="flex flex-col gap-2">
                    {aiAnalysis.recommendations.map((rec: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-secondary bg-surface-hover/20 p-2 rounded border-l-2 border-primary">
                        <CheckCircle2 size={16} className="text-primary mt-0.5" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="flex justify-between items-center pt-4 border-t border-light mt-2" style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1rem' }}>
                  <div className="text-xs text-muted">AI Confidence Score: <span className="text-primary font-bold">{aiAnalysis.confidence}%</span></div>
                  <button onClick={() => setShowAIModal(false)} className="glass-panel px-6 py-2 hover-lift bg-primary text-white font-medium">Dismiss</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default IncidentDetailPage;
