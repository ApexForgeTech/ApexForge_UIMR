import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, AlertTriangle, Info, Shield, Plus, X, Check } from 'lucide-react';
import api from '../api/axios';
import { IncidentSources, SeverityColors } from '../utils/constants';

const STEPS = ['Basic Info', 'Classification', 'Initial IOCs', 'Review'];

const SOURCE_ICONS: Record<string, string> = {
  MANUAL: '✏️', SIEM: '📡', EDR: '🛡️', XDR: '🔎', FIREWALL: '🧱', IDS_IPS: '🚨', EMAIL_GATEWAY: '📧', THREAT_INTEL: '🌐', OTHER: '📋'
};

const CreateIncidentPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '', description: '', severity: 'MEDIUM', source: 'MANUAL', sourceRef: ''
  });
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [iocs, setIocs] = useState<{ type: string; value: string }[]>([]);
  const [newIoc, setNewIoc] = useState({ type: 'IP', value: '' });

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await api.post('/incidents', formData);
      const incId = res.data.id;
      // Add IOCs if any
      for (const ioc of iocs) {
        try { await api.post(`/incidents/${incId}/iocs`, ioc); } catch (e) { console.error(e); }
      }
      navigate(`/incidents/${incId}`);
    } catch (err) {
      console.error(err);
      alert('Failed to create incident');
    } finally { setLoading(false); }
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const addIoc = () => {
    if (newIoc.value.trim()) {
      setIocs([...iocs, { ...newIoc }]);
      setNewIoc({ type: 'IP', value: '' });
    }
  };

  const canProceed = () => {
    if (step === 0) return formData.title.trim().length > 0;
    return true;
  };

  return (
    <div className="animate-fade-in flex flex-col gap-6" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div>
        <h1 className="h2">Create Incident</h1>
        <p className="text-secondary">Register a new security incident with detailed classification</p>
      </div>

      {/* Step Indicator */}
      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        <div className="flex items-center justify-between">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center" style={{ flex: i < STEPS.length - 1 ? 1 : 'none' }}>
              <div className="flex items-center gap-2" style={{ cursor: i < step ? 'pointer' : 'default' }} onClick={() => i < step && setStep(i)}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '0.8rem', transition: 'all 0.2s',
                  background: i <= step ? 'var(--primary)' : 'var(--bg-elevated)',
                  color: i <= step ? 'white' : 'var(--text-muted)',
                  boxShadow: i === step ? '0 0 12px rgba(99,102,241,0.4)' : 'none'
                }}>
                  {i < step ? <Check size={16} /> : i + 1}
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: i === step ? 600 : 400, color: i <= step ? 'var(--text-primary)' : 'var(--text-muted)' }}>{s}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ flex: 1, height: '2px', margin: '0 1rem', background: i < step ? 'var(--primary)' : 'var(--bg-elevated)', transition: 'background 0.3s' }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="glass-panel animate-fade-in" style={{ padding: '2rem' }}>
        {step === 0 && (
          <div className="flex flex-col gap-4">
            <h3 className="h4" style={{ marginBottom: '0.5rem' }}>Basic Information</h3>
            <div>
              <label className="form-label">Incident Title *</label>
              <input type="text" className="form-input" value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Suspected phishing campaign targeting finance dept" required />
            </div>
            <div>
              <label className="form-label">Description</label>
              <textarea className="form-input" rows={6} value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Provide detailed context about the incident, including initial observations, affected systems, and any preliminary analysis..." />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="form-label">Severity</label>
                <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                  {Object.keys(SeverityColors).map(s => (
                    <button key={s} onClick={() => setFormData({ ...formData, severity: s })} style={{
                      padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', fontWeight: 600,
                      border: formData.severity === s ? `2px solid ${SeverityColors[s]}` : '2px solid var(--border-light)',
                      background: formData.severity === s ? `var(--${s.toLowerCase()}-bg)` : 'transparent',
                      color: formData.severity === s ? SeverityColors[s] : 'var(--text-muted)', transition: 'all 0.15s'
                    }}>{s}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="form-label">Source</label>
                <select className="form-input" value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}>
                  {IncidentSources.map(s => (
                    <option key={s} value={s}>{SOURCE_ICONS[s] || '📋'} {s}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-4">
            <h3 className="h4" style={{ marginBottom: '0.5rem' }}>Classification & Tags</h3>
            <div>
              <label className="form-label">Source Reference ID (Alert ID, Ticket #, etc.)</label>
              <input type="text" className="form-input" value={formData.sourceRef}
                onChange={(e) => setFormData({ ...formData, sourceRef: e.target.value })}
                placeholder="e.g. SIEM-2026-1234 or EDR-ALERT-5678" />
            </div>
            <div>
              <label className="form-label">MITRE ATT&CK Tags</label>
              <div className="flex gap-2" style={{ marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                {tags.map((tag, i) => (
                  <span key={i} style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                    padding: '0.3rem 0.6rem', borderRadius: '16px', fontSize: '0.75rem', fontWeight: 600,
                    background: 'var(--primary-transparent)', color: 'var(--primary)'
                  }}>
                    {tag}
                    <button onClick={() => setTags(tags.filter((_, j) => j !== i))} style={{ color: 'var(--primary)', display: 'flex' }}><X size={12} /></button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input type="text" className="form-input" value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="e.g. T1566.001 (Phishing), T1059 (Command Execution)" />
                <button onClick={addTag} className="btn-ghost" style={{ padding: '0.5rem' }}><Plus size={18} /></button>
              </div>
            </div>
            <div style={{ padding: '1rem', background: 'rgba(99,102,241,0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(99,102,241,0.1)' }}>
              <p className="text-xs text-muted"><Info size={14} style={{ display: 'inline', marginRight: '0.3rem', verticalAlign: 'middle' }} />Tags help categorize incidents using the MITRE ATT&CK framework for better analysis and reporting.</p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            <h3 className="h4" style={{ marginBottom: '0.5rem' }}>Initial Indicators of Compromise</h3>
            <p className="text-sm text-secondary">Add any known IOCs related to this incident. You can always add more later.</p>
            {iocs.length > 0 && (
              <div className="flex flex-col gap-2">
                {iocs.map((ioc, i) => (
                  <div key={i} className="flex items-center gap-3" style={{ padding: '0.75rem 1rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                    <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'var(--primary-transparent)', color: 'var(--primary)', fontSize: '0.7rem', fontWeight: 700, minWidth: '50px', textAlign: 'center' }}>{ioc.type}</span>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', flex: 1 }}>{ioc.value}</span>
                    <button onClick={() => setIocs(iocs.filter((_, j) => j !== i))} style={{ color: 'var(--text-muted)' }}><X size={16} /></button>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr auto', gap: '0.5rem' }}>
              <select className="form-input" value={newIoc.type} onChange={(e) => setNewIoc({ ...newIoc, type: e.target.value })}>
                {['IP', 'DOMAIN', 'URL', 'HASH_MD5', 'HASH_SHA1', 'HASH_SHA256', 'EMAIL', 'FILENAME'].map(t => (
                  <option key={t} value={t}>{t.replace('HASH_', '')}</option>
                ))}
              </select>
              <input type="text" className="form-input" value={newIoc.value} onChange={(e) => setNewIoc({ ...newIoc, value: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addIoc())}
                placeholder="e.g. 192.168.1.100 or malicious.exe" />
              <button onClick={addIoc} className="btn-primary" style={{ padding: '0.5rem 1rem' }}><Plus size={16} /> Add</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-4">
            <h3 className="h4" style={{ marginBottom: '0.5rem' }}>Review & Submit</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ padding: '1rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}>
                <div className="text-xs text-muted" style={{ marginBottom: '0.25rem' }}>Title</div>
                <div style={{ fontWeight: 600 }}>{formData.title}</div>
              </div>
              <div style={{ padding: '1rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}>
                <div className="text-xs text-muted" style={{ marginBottom: '0.25rem' }}>Severity / Source</div>
                <div className="flex gap-2">
                  <span style={{ color: SeverityColors[formData.severity], fontWeight: 700 }}>{formData.severity}</span>
                  <span className="text-muted">·</span>
                  <span>{SOURCE_ICONS[formData.source]} {formData.source}</span>
                </div>
              </div>
            </div>
            {formData.description && (
              <div style={{ padding: '1rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}>
                <div className="text-xs text-muted" style={{ marginBottom: '0.25rem' }}>Description</div>
                <div className="text-sm text-secondary" style={{ whiteSpace: 'pre-wrap' }}>{formData.description}</div>
              </div>
            )}
            {tags.length > 0 && (
              <div style={{ padding: '1rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}>
                <div className="text-xs text-muted" style={{ marginBottom: '0.5rem' }}>Tags</div>
                <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                  {tags.map((tag, i) => <span key={i} style={{ padding: '0.2rem 0.5rem', borderRadius: '12px', background: 'var(--primary-transparent)', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600 }}>{tag}</span>)}
                </div>
              </div>
            )}
            {iocs.length > 0 && (
              <div style={{ padding: '1rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}>
                <div className="text-xs text-muted" style={{ marginBottom: '0.5rem' }}>IOCs ({iocs.length})</div>
                {iocs.map((ioc, i) => (
                  <div key={i} className="text-sm" style={{ fontFamily: 'monospace' }}>
                    <span style={{ color: 'var(--primary)', fontWeight: 600 }}>[{ioc.type}]</span> {ioc.value}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button onClick={() => step > 0 ? setStep(step - 1) : navigate('/incidents')} className="btn-ghost">
          <ChevronLeft size={16} /> {step > 0 ? 'Back' : 'Cancel'}
        </button>
        {step < 3 ? (
          <button onClick={() => setStep(step + 1)} disabled={!canProceed()} className="btn-primary" style={{ opacity: canProceed() ? 1 : 0.5 }}>
            Next <ChevronRight size={16} />
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={loading} className="btn-primary" style={{ background: 'var(--success)' }}>
            {loading ? 'Creating...' : '🚀 Create Incident'}
          </button>
        )}
      </div>
    </div>
  );
};

export default CreateIncidentPage;
