export interface LogEvent {
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

export interface LogSummary {
  totalEvents: number;
  infoEvents: number;
  warnEvents: number;
  errorEvents: number;
}

export interface LogEventsResponse {
  totalMatched: number;
  summary: LogSummary;
  sourceFiles: string[];
  events: LogEvent[];
}
