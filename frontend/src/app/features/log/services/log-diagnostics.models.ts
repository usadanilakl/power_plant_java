export interface LogDiagnosticsEvent {
  timestamp: string;
  level: string;
  subsystem: string;
  sourceFile: string;
  logger: string;
  thread: string;
  eventCode: string | null;
  message: string;
  details: string | null;
  requestId: string | null;
  userId: string | null;
  machineId: string | null;
  jobName: string | null;
  jobRunId: string | null;
  syncRunId: string | null;
  entityType: string | null;
  entityId: string | null;
  sharepointId: string | null;
  method: string | null;
  path: string | null;
  remoteIp: string | null;
  status: number | null;
  durationMs: number | null;
}

export interface LogDiagnosticsFinding {
  groupKey: string;
  type: string;
  severity: 'critical' | 'warning' | 'info';
  subsystem: string;
  title: string;
  summary: string;
  recommendation: string;
  count: number;
  firstSeen: string;
  lastSeen: string;
  machineId: string | null;
  path: string | null;
  sampleMessage: string | null;
}

export interface LogDiagnosticsSummary {
  totalEvents: number;
  infoEvents: number;
  warnEvents: number;
  errorEvents: number;
  findings: number;
  criticalFindings: number;
}

export interface LogDiagnosticsOverview {
  generatedAt: string;
  windowMinutes: number;
  summary: LogDiagnosticsSummary;
  sourceFiles: string[];
  incidents: LogDiagnosticsIncident[];
  findings: LogDiagnosticsFinding[];
  recentEvents: LogDiagnosticsEvent[];
}

export interface LogDiagnosticsEventsResponse {
  totalMatched: number;
  events: LogDiagnosticsEvent[];
}

export interface LogDiagnosticsIncident {
  incidentId: string;
  incidentKey: string;
  status: 'open' | 'acknowledged' | 'resolved';
  severity: 'critical' | 'warning' | 'info';
  subsystem: string;
  title: string;
  summary: string;
  recommendation: string;
  suspectedCause: string;
  count: number;
  firstSeen: string;
  lastSeen: string;
  machineId: string | null;
  path: string | null;
  requestId: string | null;
  syncRunId: string | null;
  findingTypes: string[];
}

export interface LogDiagnosticsIncidentDetail {
  incident: LogDiagnosticsIncident;
  findings: LogDiagnosticsFinding[];
  timeline: LogDiagnosticsEvent[];
}

export interface LogDiagnosticsIncidentsResponse {
  totalMatched: number;
  incidents: LogDiagnosticsIncident[];
}
