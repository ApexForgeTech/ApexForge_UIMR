import { useState } from 'react';
import { Send, Wifi, Server, Shield, AlertTriangle, CheckCircle, Code, ChevronDown, Copy, RefreshCcw } from 'lucide-react';
import api from '../api/axios';

const SOURCE_PRESETS = [
  {
    name: 'SIEM Alert', source: 'SIEM', severity: 'HIGH', icon: '📡',
    title: 'SIEM: Brute Force Login Detected',
    description: 'Multiple failed login attempts detected from IP 10.0.0.55. 47 failed attempts in 5 minutes against user "admin". Source: Splunk SIEM correlation rule BF-001.'
  },
  {
    name: 'EDR Alert', source: 'EDR', severity: 'CRITICAL', icon: '🛡️',
    title: 'EDR: Suspicious Process Execution',
    description: 'powershell.exe spawned by winword.exe on HOST-PC01. Command line: powershell -enc UwB0AGEAcg... Base64 encoded payload detected. CrowdStrike Falcon alert ID: CS-2026-4521.'
  },
  {
    name: 'Firewall Alert', source: 'FIREWALL', severity: 'HIGH', icon: '🧱',
    title: 'FW: C2 Communication Blocked',
    description: 'Outbound TCP connection to known C2 IP 185.220.101.34:443 from internal host 192.168.10.25. Connection blocked by Palo Alto PA-3260. TI match: APT29 infrastructure.'
  },
  {
    name: 'Email Gateway', source: 'EMAIL_GATEWAY', severity: 'MEDIUM', icon: '📧',
    title: 'Email: Phishing Campaign Detected',
    description: 'Phishing email blocked from sender spoofed@legitimate-bank.com. Subject: "Urgent: Account Verification Required". Proofpoint TAP alert. 12 recipients targeted in finance department.'
  },
  {
    name: 'IDS/IPS Alert', source: 'IDS_IPS', severity: 'HIGH', icon: '🚨',
    title: 'IDS: SQL Injection Attempt',
    description: 'SQL injection attempt detected on web application /api/login. Payload: \' OR 1=1 --. Source IP: 203.0.113.42. Snort rule SID:1234567 triggered. Attack signature matches OWASP Top 10 A03.'
  },
  {
    name: 'Threat Intel Feed', source: 'THREAT_INTEL', severity: 'MEDIUM', icon: '🌐',
    title: 'TI: IOC Match - Known Malware Domain',
    description: 'DNS query to malicious domain evil-download.xyz resolved by internal host 10.0.1.100. Domain is associated with Emotet campaign (MISP Event #8923). First seen: 2026-03-25.'
  }
];

const IngestionPage = () => {
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [payload, setPayload] = useState('');
  const [rawSyslog, setRawSyslog] = useState('<134>Mar 26 12:00:00 fw01 sshd[12345]: Failed password for root from 192.168.1.100 port 22 ssh2');
  const [mode, setMode] = useState<'webhook' | 'syslog'>('webhook');
  const [response, setResponse] = useState<any>(null);
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  const getPayloadJson = () => {
    const preset = SOURCE_PRESETS[selectedPreset];
    return JSON.stringify({
      title: preset.title,
      source: preset.source,
      severity: preset.severity,
      description: preset.description,
      source_ref: `ALERT-${Date.now()}`
    }, null, 2);
  };

  const sendWebhook = async () => {
    setSending(true);
    try {
      const data = payload ? JSON.parse(payload) : JSON.parse(getPayloadJson());
      const res = await api.post('/ingest/webhook', data);
      setResponse({ status: 'success', data: res.data, timestamp: new Date().toISOString() });
      setHistory(prev => [{ type: 'webhook', source: data.source, title: data.title, time: new Date(), status: 'accepted' }, ...prev.slice(0, 9)]);
    } catch (err: any) {
      setResponse({ status: 'error', data: err.response?.data || err.message, timestamp: new Date().toISOString() });
    }
    setSending(false);
  };

  const sendSyslog = async () => {
    setSending(true);
    try {
      const res = await api.post('/ingest/syslog', rawSyslog, { headers: { 'Content-Type': 'text/plain' } });
      setResponse({ status: 'success', data: res.data, timestamp: new Date().toISOString() });
      setHistory(prev => [{ type: 'syslog', source: 'SYSLOG', title: 'Syslog Message', time: new Date(), status: 'accepted' }, ...prev.slice(0, 9)]);
    } catch (err: any) {
      setResponse({ status: 'error', data: err.response?.data || err.message, timestamp: new Date().toISOString() });
    }
    setSending(false);
  };

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <div>
        <h1 className="h2">Alert Ingestion</h1>
        <p className="text-secondary">Receive and test alerts from external security sources (SIEM, EDR, Firewall, etc.)</p>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2">
        <button onClick={() => setMode('webhook')} className={mode === 'webhook' ? 'btn-primary' : 'btn-ghost'}
          style={{ padding: '0.5rem 1.25rem' }}>
          <Code size={16} /> Webhook (JSON)
        </button>
        <button onClick={() => setMode('syslog')} className={mode === 'syslog' ? 'btn-primary' : 'btn-ghost'}
          style={{ padding: '0.5rem 1.25rem' }}>
          <Server size={16} /> Syslog (Raw)
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Left: Input Panel */}
        <div className="flex flex-col gap-4">
          {mode === 'webhook' ? (
            <>
              {/* Source Presets */}
              <div className="glass-panel" style={{ padding: '1.25rem' }}>
                <h3 className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>Source Presets</h3>
                <div className="flex flex-col gap-2">
                  {SOURCE_PRESETS.map((preset, i) => (
                    <button key={i} onClick={() => { setSelectedPreset(i); setPayload(''); }}
                      className="flex items-center gap-3"
                      style={{
                        padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', textAlign: 'left',
                        border: selectedPreset === i ? '2px solid var(--primary)' : '2px solid var(--border-light)',
                        background: selectedPreset === i ? 'var(--primary-transparent)' : 'transparent',
                        transition: 'all 0.15s'
                      }}>
                      <span style={{ fontSize: '1.2rem' }}>{preset.icon}</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{preset.name}</div>
                        <div className="text-xs text-muted">{preset.source} · {preset.severity}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Payload Editor */}
              <div className="glass-panel" style={{ padding: '1.25rem' }}>
                <div className="flex justify-between items-center" style={{ marginBottom: '0.75rem' }}>
                  <h3 className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>JSON Payload</h3>
                  <button onClick={() => setPayload('')} className="text-xs text-muted flex items-center gap-1">
                    <RefreshCcw size={12} /> Reset
                  </button>
                </div>
                <textarea className="form-input" rows={10} value={payload || getPayloadJson()}
                  onChange={e => setPayload(e.target.value)}
                  style={{ fontFamily: 'monospace', fontSize: '0.8rem', lineHeight: '1.5', resize: 'vertical' }} />
                <button onClick={sendWebhook} disabled={sending} className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.75rem' }}>
                  {sending ? <><RefreshCcw size={16} className="spin" /> Sending...</> : <><Send size={16} /> Send Webhook Alert</>}
                </button>
              </div>
            </>
          ) : (
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <h3 className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>Syslog Message</h3>
              <textarea className="form-input" rows={6} value={rawSyslog}
                onChange={e => setRawSyslog(e.target.value)}
                style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
                placeholder="<134>Mar 26 12:00:00 hostname process[pid]: message" />
              <div style={{ padding: '0.75rem', background: 'rgba(99,102,241,0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(99,102,241,0.1)', margin: '0.75rem 0' }}>
                <p className="text-xs text-muted">Syslog messages are parsed and automatically created as incidents with source = SYSLOG and severity = MEDIUM.</p>
              </div>
              <button onClick={sendSyslog} disabled={sending} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                {sending ? <><RefreshCcw size={16} className="spin" /> Sending...</> : <><Send size={16} /> Send Syslog Message</>}
              </button>
            </div>
          )}
        </div>

        {/* Right: Response + History */}
        <div className="flex flex-col gap-4">
          {/* API Response */}
          <div className="glass-panel card-gradient-border" style={{ padding: '1.25rem' }}>
            <h3 className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>API Response</h3>
            {response ? (
              <div>
                <div className="flex items-center gap-2" style={{ marginBottom: '0.75rem' }}>
                  {response.status === 'success' ? (
                    <span className="flex items-center gap-1" style={{ color: 'var(--success)', fontWeight: 700, fontSize: '0.85rem' }}>
                      <CheckCircle size={16} /> Accepted
                    </span>
                  ) : (
                    <span className="flex items-center gap-1" style={{ color: 'var(--critical)', fontWeight: 700, fontSize: '0.85rem' }}>
                      <AlertTriangle size={16} /> Error
                    </span>
                  )}
                  <span className="text-xs text-muted">{response.timestamp}</span>
                </div>
                <pre style={{
                  padding: '1rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)',
                  fontFamily: 'monospace', fontSize: '0.78rem', overflow: 'auto', maxHeight: '200px',
                  color: response.status === 'success' ? 'var(--success)' : 'var(--critical)'
                }}>
                  {JSON.stringify(response.data, null, 2)}
                </pre>
              </div>
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Wifi size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
                <p className="text-sm">Send an alert to see the response</p>
              </div>
            )}
          </div>

          {/* Ingestion History */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <h3 className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>Ingestion History (This Session)</h3>
            {history.length === 0 ? (
              <p className="text-sm text-muted" style={{ padding: '1rem 0', textAlign: 'center' }}>No alerts sent yet</p>
            ) : (
              <div className="flex flex-col gap-2">
                {history.map((h, i) => (
                  <div key={i} className="flex items-center gap-3" style={{ padding: '0.6rem 0.8rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}>
                    <CheckCircle size={14} style={{ color: 'var(--success)' }} />
                    <div style={{ flex: 1 }}>
                      <div className="text-sm" style={{ fontWeight: 500 }}>{h.title}</div>
                      <div className="text-xs text-muted">{h.source} · {h.time.toLocaleTimeString()}</div>
                    </div>
                    <span style={{ padding: '0.15rem 0.5rem', borderRadius: '4px', background: 'var(--success-bg)', color: 'var(--success)', fontSize: '0.7rem', fontWeight: 700 }}>
                      {h.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* curl Examples */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <h3 className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>External Integration (curl)</h3>
            <pre style={{ padding: '0.75rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', fontFamily: 'monospace', fontSize: '0.7rem', overflow: 'auto', whiteSpace: 'pre-wrap' }}>
{`# Webhook (JSON)
curl -X POST http://localhost:8080/api/ingest/webhook \\
  -H "Content-Type: application/json" \\
  -d '{"title":"SIEM: Alert","source":"SIEM","severity":"HIGH"}'

# Syslog (Raw text)
curl -X POST http://localhost:8080/api/ingest/syslog \\
  -H "Content-Type: text/plain" \\
  -d '<134>Mar 26 12:00:00 fw01 sshd: Failed login'`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IngestionPage;
