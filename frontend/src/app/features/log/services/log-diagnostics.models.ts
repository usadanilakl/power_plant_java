export interface LogEvent {
  /** Stable identifier supplied by the diagnostics API. */
  eventId?: string;
  /** Stable identity shared by successive versions of the active tail event. */
  logicalEventId?: string;
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

export type LogSortDirection = 'asc' | 'desc';

export interface LogEventsQuery {
  windowMinutes: number;
  limit: number;
  level?: string;
  text?: string;
  sourceFile?: string;
  subsystem?: string;
  eventCode?: string;
  requestId?: string;
  syncRunId?: string;
  machineId?: string;
  from?: string;
  to?: string;
  cursor?: string;
  sort?: LogSortDirection;
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
  subsystems: string[];
  eventCodes: string[];
  events: LogEvent[];
  nextCursor?: string | null;
  hasMore?: boolean;
  truncated?: boolean;
}
