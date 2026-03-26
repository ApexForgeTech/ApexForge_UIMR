export const SeverityColors: Record<string, string> = {
  CRITICAL: 'var(--critical)',
  HIGH: 'var(--high)',
  MEDIUM: 'var(--medium)',
  LOW: 'var(--low)',
  INFO: 'var(--info)'
};

export const StatusColors: Record<string, string> = {
  OPEN: 'var(--critical)',
  IN_PROGRESS: 'var(--medium)',
  ESCALATED: 'var(--high)',
  RESOLVED: 'var(--success)',
  CLOSED: 'var(--text-muted)'
};

export const TiStatusConfig: Record<string, { color: string; label: string }> = {
  PENDING: { color: 'var(--text-muted)', label: 'Pending' },
  CLEAN: { color: 'var(--success)', label: 'Clean' },
  SUSPICIOUS: { color: 'var(--warning)', label: 'Suspicious' },
  MALICIOUS: { color: 'var(--critical)', label: 'Malicious' },
  ERROR: { color: 'var(--text-secondary)', label: 'Error' }
};

export const IocTypes = [
  'IP', 'DOMAIN', 'URL', 'HASH_MD5', 'HASH_SHA1', 'HASH_SHA256', 'EMAIL', 'FILE'
];

export const IncidentSources = [
  'MANUAL', 'SIEM', 'EDR', 'XDR', 'FIREWALL', 'API', 'SYSLOG'
];
