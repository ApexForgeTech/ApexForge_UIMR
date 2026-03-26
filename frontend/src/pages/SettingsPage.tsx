import { useState, useEffect } from 'react';
import { Settings, Globe, Bell, Shield, Info, Save, CheckCircle, Sun, Moon, Zap } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';
import api from '../api/axios';

const TABS = [
  { id: 'general', label: 'General', icon: <Settings size={18} /> },
  { id: 'ti', label: 'Threat Intel', icon: <Globe size={18} /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
  { id: 'security', label: 'Security', icon: <Shield size={18} /> },
  { id: 'about', label: 'About', icon: <Info size={18} /> },
];

const THEMES = [
  { id: 'dark' as const, label: 'Dark', icon: <Moon size={18} />, desc: 'Classic SOC dark mode', colors: ['#0f111a', '#1a1d27', '#6366f1'] },
  { id: 'light' as const, label: 'Light', icon: <Sun size={18} />, desc: 'Clean light interface', colors: ['#f5f7fa', '#ffffff', '#6366f1'] },
  { id: 'neon' as const, label: 'Neon', icon: <Zap size={18} />, desc: 'Cyberpunk neon glow', colors: ['#050510', '#0a0a1f', '#00e5ff'] },
];

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [saved, setSaved] = useState(false);
  const { theme, setTheme } = useThemeStore();
  const [stats, setStats] = useState<any>(null);

  const [general, setGeneral] = useState({
    orgName: 'UIMR SOC', timezone: 'UTC+4', dateFormat: 'DD/MM/YYYY', refreshInterval: '30'
  });
  const [ti, setTi] = useState({
    vtKey: '', abuseIpKey: '', urlhausEnabled: true, autoCheck: true
  });
  const [notif, setNotif] = useState({
    emailEnabled: false, emailSmtp: '', telegramEnabled: false, telegramToken: '', telegramChatId: '',
    slackEnabled: false, slackWebhook: ''
  });

  useEffect(() => {
    if (activeTab === 'about') {
      api.get('/dashboard/stats').then(res => setStats(res.data)).catch(() => {});
    }
  }, [activeTab]);

  useEffect(() => {
    api.get('/settings').then(res => {
      const d = res.data;
      setGeneral({
        orgName: d['general.orgName'] || 'UIMR SOC', timezone: d['general.timezone'] || 'UTC+4',
        dateFormat: d['general.dateFormat'] || 'DD/MM/YYYY', refreshInterval: d['general.refreshInterval'] || '30'
      });
      setTi({
        vtKey: d['ti.virustotal.api-key'] || '', abuseIpKey: d['ti.abuseipdb.api-key'] || '',
        urlhausEnabled: d['ti.urlhaus.enabled'] === 'true', autoCheck: d['ti.autoCheck'] === 'true'
      });
      setNotif({
        emailEnabled: d['notif.email.enabled'] === 'true', emailSmtp: d['notif.email.smtp'] || '',
        telegramEnabled: d['notif.telegram.enabled'] === 'true', telegramToken: d['telegram.bot-token'] || '',
        telegramChatId: d['telegram.default-chat-id'] || '', slackEnabled: d['notif.slack.enabled'] === 'true',
        slackWebhook: d['notif.slack.webhook'] || ''
      });
    }).catch(console.error);
  }, []);

  const handleSave = async () => {
    const payload = {
      'general.orgName': general.orgName, 'general.timezone': general.timezone,
      'general.dateFormat': general.dateFormat, 'general.refreshInterval': general.refreshInterval,
      'ti.virustotal.api-key': ti.vtKey, 'ti.abuseipdb.api-key': ti.abuseIpKey,
      'ti.urlhaus.enabled': String(ti.urlhausEnabled), 'ti.autoCheck': String(ti.autoCheck),
      'notif.email.enabled': String(notif.emailEnabled), 'notif.email.smtp': notif.emailSmtp,
      'notif.telegram.enabled': String(notif.telegramEnabled), 'telegram.bot-token': notif.telegramToken,
      'telegram.default-chat-id': notif.telegramChatId, 'notif.slack.enabled': String(notif.slackEnabled),
      'notif.slack.webhook': notif.slackWebhook
    };
    try {
      await api.post('/settings/bulk', payload);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch(e) { console.error(e); }
  };

  const ToggleSwitch = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <button onClick={() => onChange(!checked)} style={{
      width: 44, height: 24, borderRadius: '12px', padding: '2px', transition: 'all 0.2s',
      background: checked ? 'var(--primary)' : 'var(--bg-elevated)', cursor: 'pointer'
    }}>
      <div style={{
        width: 20, height: 20, borderRadius: '50%', background: 'white', transition: 'transform 0.2s',
        transform: checked ? 'translateX(20px)' : 'translateX(0)'
      }} />
    </button>
  );

  const SettingRow = ({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) => (
    <div className="flex items-center justify-between" style={{ padding: '1rem 0', borderBottom: '1px solid var(--border-light)' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{label}</div>
        {description && <div className="text-xs text-muted" style={{ marginTop: '0.15rem' }}>{description}</div>}
      </div>
      <div style={{ minWidth: '250px', display: 'flex', justifyContent: 'flex-end' }}>{children}</div>
    </div>
  );

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <div>
        <h1 className="h2">Settings</h1>
        <p className="text-secondary">Configure platform settings, integrations, and security policies</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '1.5rem' }}>
        <div className="glass-panel" style={{ padding: '0.5rem', height: 'fit-content' }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="flex items-center gap-3" style={{
              width: '100%', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', textAlign: 'left',
              transition: 'all 0.15s', fontWeight: activeTab === tab.id ? 600 : 400, fontSize: '0.875rem',
              background: activeTab === tab.id ? 'var(--primary-transparent)' : 'transparent',
              color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-secondary)'
            }}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <div className="glass-panel card-gradient-border" style={{ padding: '2rem' }}>
          {activeTab === 'general' && (
            <div className="animate-fade-in">
              <h3 className="h4" style={{ marginBottom: '1.5rem' }}>General Settings</h3>

              {/* Theme Selector */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Interface Theme</label>
                <div className="flex gap-3">
                  {THEMES.map(t => (
                    <button key={t.id} onClick={() => setTheme(t.id)} style={{
                      flex: 1, padding: '1rem', borderRadius: 'var(--radius-md)', textAlign: 'center',
                      border: theme === t.id ? '2px solid var(--primary)' : '2px solid var(--border-light)',
                      background: theme === t.id ? 'var(--primary-transparent)' : 'transparent',
                      transition: 'all 0.2s', cursor: 'pointer'
                    }}>
                      <div className="flex items-center justify-center gap-2" style={{ marginBottom: '0.5rem' }}>
                        {t.colors.map((c, i) => (
                          <div key={i} style={{ width: 16, height: 16, borderRadius: '50%', background: c, border: '1px solid var(--border-light)' }} />
                        ))}
                      </div>
                      <div className="flex items-center justify-center gap-1" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                        {t.icon} {t.label}
                      </div>
                      <div className="text-xs text-muted" style={{ marginTop: '0.2rem' }}>{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <SettingRow label="Organization Name" description="Displayed in reports and notifications">
                <input type="text" className="form-input" style={{ width: '250px' }} value={general.orgName}
                  onChange={e => setGeneral({ ...general, orgName: e.target.value })} />
              </SettingRow>
              <SettingRow label="Timezone" description="Used for timestamps and SLA calculations">
                <select className="form-input" style={{ width: '250px' }} value={general.timezone}
                  onChange={e => setGeneral({ ...general, timezone: e.target.value })}>
                  {['UTC', 'UTC+1', 'UTC+2', 'UTC+3', 'UTC+4', 'UTC+5', 'UTC-5', 'UTC-8'].map(tz => <option key={tz}>{tz}</option>)}
                </select>
              </SettingRow>
              <SettingRow label="Date Format">
                <select className="form-input" style={{ width: '250px' }} value={general.dateFormat}
                  onChange={e => setGeneral({ ...general, dateFormat: e.target.value })}>
                  {['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'].map(f => <option key={f}>{f}</option>)}
                </select>
              </SettingRow>
              <SettingRow label="Auto-Refresh Interval" description="Dashboard refresh rate (seconds)">
                <select className="form-input" style={{ width: '250px' }} value={general.refreshInterval}
                  onChange={e => setGeneral({ ...general, refreshInterval: e.target.value })}>
                  {['10', '15', '30', '60', '120'].map(v => <option key={v} value={v}>{v}s</option>)}
                </select>
              </SettingRow>
              <div style={{ marginTop: '1.5rem' }}>
                <button onClick={handleSave} className="btn-primary"><Save size={16} /> Save Changes</button>
              </div>
            </div>
          )}

          {activeTab === 'ti' && (
            <div className="animate-fade-in">
              <h3 className="h4" style={{ marginBottom: '1.5rem' }}>Threat Intelligence Integrations</h3>
              <SettingRow label="VirusTotal API Key" description="Hash, IP, and domain reputation checks">
                <div className="flex gap-2">
                  <input type="password" className="form-input" style={{ width: '200px' }} value={ti.vtKey}
                    onChange={e => setTi({ ...ti, vtKey: e.target.value })} placeholder="Enter API key" />
                  <button className="btn-ghost" style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem' }}>Test</button>
                </div>
              </SettingRow>
              <SettingRow label="AbuseIPDB API Key" description="IP abuse reports and reputation">
                <div className="flex gap-2">
                  <input type="password" className="form-input" style={{ width: '200px' }} value={ti.abuseIpKey}
                    onChange={e => setTi({ ...ti, abuseIpKey: e.target.value })} placeholder="Enter API key" />
                  <button className="btn-ghost" style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem' }}>Test</button>
                </div>
              </SettingRow>
              <SettingRow label="URLHaus Integration" description="Malicious URL database (abuse.ch)">
                <ToggleSwitch checked={ti.urlhausEnabled} onChange={v => setTi({ ...ti, urlhausEnabled: v })} />
              </SettingRow>
              <SettingRow label="Auto-Check IOCs" description="Automatically query TI sources when IOCs are added">
                <ToggleSwitch checked={ti.autoCheck} onChange={v => setTi({ ...ti, autoCheck: v })} />
              </SettingRow>
              <div style={{ marginTop: '1.5rem' }}>
                <button onClick={handleSave} className="btn-primary"><Save size={16} /> Save Changes</button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="animate-fade-in">
              <h3 className="h4" style={{ marginBottom: '1.5rem' }}>Notification Channels</h3>
              <SettingRow label="Email Notifications" description="Send alerts via SMTP email">
                <ToggleSwitch checked={notif.emailEnabled} onChange={v => setNotif({ ...notif, emailEnabled: v })} />
              </SettingRow>
              {notif.emailEnabled && (
                <SettingRow label="SMTP Server">
                  <input type="text" className="form-input" style={{ width: '250px' }} value={notif.emailSmtp}
                    onChange={e => setNotif({ ...notif, emailSmtp: e.target.value })} placeholder="smtp.example.com:587" />
                </SettingRow>
              )}
              <SettingRow label="Telegram Notifications" description="Send alerts to Telegram channels">
                <ToggleSwitch checked={notif.telegramEnabled} onChange={v => setNotif({ ...notif, telegramEnabled: v })} />
              </SettingRow>
              {notif.telegramEnabled && (
                <>
                  <SettingRow label="Bot Token">
                    <input type="password" className="form-input" style={{ width: '250px' }} value={notif.telegramToken}
                      onChange={e => setNotif({ ...notif, telegramToken: e.target.value })} placeholder="Bot token" />
                  </SettingRow>
                  <SettingRow label="Chat ID">
                    <input type="text" className="form-input" style={{ width: '250px' }} value={notif.telegramChatId}
                      onChange={e => setNotif({ ...notif, telegramChatId: e.target.value })} placeholder="-1001234567890" />
                  </SettingRow>
                </>
              )}
              <SettingRow label="Slack Notifications" description="Send alerts via Slack webhook">
                <ToggleSwitch checked={notif.slackEnabled} onChange={v => setNotif({ ...notif, slackEnabled: v })} />
              </SettingRow>
              {notif.slackEnabled && (
                <SettingRow label="Webhook URL">
                  <input type="text" className="form-input" style={{ width: '250px' }} value={notif.slackWebhook}
                    onChange={e => setNotif({ ...notif, slackWebhook: e.target.value })} placeholder="https://hooks.slack.com/services/..." />
                </SettingRow>
              )}
              <div style={{ marginTop: '1.5rem' }}>
                <button onClick={handleSave} className="btn-primary"><Save size={16} /> Save Changes</button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="animate-fade-in">
              <h3 className="h4" style={{ marginBottom: '1.5rem' }}>Security Policies</h3>
              <SettingRow label="Minimum Password Length">
                <select className="form-input" style={{ width: '250px' }}>
                  {['6', '8', '10', '12', '16'].map(v => <option key={v} value={v}>{v} characters</option>)}
                </select>
              </SettingRow>
              <SettingRow label="Session Timeout" description="Auto-logout after inactivity period">
                <select className="form-input" style={{ width: '250px' }}>
                  {['15', '30', '60', '120', '480'].map(v => <option key={v} value={v}>{v} minutes</option>)}
                </select>
              </SettingRow>
              <SettingRow label="Two-Factor Authentication" description="Require 2FA for admin accounts">
                <ToggleSwitch checked={false} onChange={() => {}} />
              </SettingRow>
              <SettingRow label="IP Allowlist" description="Restrict access to specific IP ranges">
                <input type="text" className="form-input" style={{ width: '250px' }} placeholder="e.g. 10.0.0.0/8" />
              </SettingRow>
              <div style={{ marginTop: '1.5rem' }}>
                <button onClick={handleSave} className="btn-primary"><Save size={16} /> Save Changes</button>
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="animate-fade-in">
              <h3 className="h4" style={{ marginBottom: '1.5rem' }}>Platform Information</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ padding: '1.25rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}>
                  <div className="text-xs text-muted" style={{ marginBottom: '0.25rem' }}>Platform</div>
                  <div style={{ fontWeight: 600 }}>UIMR v2.0</div>
                  <div className="text-xs text-muted">Unified Incident Management & Response</div>
                </div>
                <div style={{ padding: '1.25rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}>
                  <div className="text-xs text-muted" style={{ marginBottom: '0.25rem' }}>Tech Stack</div>
                  <div style={{ fontWeight: 600 }}>Spring Boot + React + TypeScript</div>
                  <div className="text-xs text-muted">H2 / PostgreSQL Database</div>
                </div>
                {stats && (
                  <>
                    <div style={{ padding: '1.25rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}>
                      <div className="text-xs text-muted" style={{ marginBottom: '0.25rem' }}>Platform Statistics</div>
                      <div style={{ fontWeight: 600 }}>{stats.totalIncidents || 0} Incidents</div>
                      <div className="text-xs text-muted">
                        {stats.openIncidents || 0} Open · {stats.closedIncidents || 0} Closed
                      </div>
                    </div>
                    <div style={{ padding: '1.25rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}>
                      <div className="text-xs text-muted" style={{ marginBottom: '0.25rem' }}>System Status</div>
                      <div className="flex items-center gap-2" style={{ fontWeight: 600, color: 'var(--success)' }}>
                        <CheckCircle size={16} /> Online
                      </div>
                      <div className="text-xs text-muted">Backend API operational</div>
                    </div>
                  </>
                )}
              </div>
              <div style={{ marginTop: '1.5rem' }}>
                <h4 className="text-sm" style={{ fontWeight: 600, marginBottom: '0.75rem' }}>Capabilities</h4>
                <div className="flex flex-col gap-1" style={{ fontSize: '0.85rem' }}>
                  {[
                    '📋 İnsidentlərin yaradılması, düzəlişlər, IOC əlavəsi, bağlama (FP/TP)',
                    '📡 Müxtəlif mənbələrdən alert qəbulu (Webhook, Syslog, API)',
                    '🛡️ SOAR Playbook inteqrasiyası (API vasitəsilə)',
                    '🌐 TI inteqrasiyası (VirusTotal, AbuseIPDB, URLHaus)',
                    '📊 Hesabat generasiyası (Incident Summary, IOC Analytics, SOC Performance)',
                    '🔔 Bildiriş sistemi (In-App, WebSocket, Telegram)',
                    '👥 İstifadəçi idarəetməsi (yaratma, deaktiv, rol təyini)'
                  ].map((cap, i) => <div key={i} className="text-secondary">{cap}</div>)}
                </div>
              </div>
            </div>
          )}

          {saved && (
            <div className="animate-fade-in flex items-center gap-2" style={{
              position: 'fixed', bottom: '2rem', right: '2rem', padding: '0.85rem 1.5rem',
              background: 'var(--success)', color: 'white', borderRadius: 'var(--radius-md)',
              fontWeight: 600, boxShadow: 'var(--shadow-lg)', zIndex: 50
            }}>
              <CheckCircle size={18} /> Settings saved successfully
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
