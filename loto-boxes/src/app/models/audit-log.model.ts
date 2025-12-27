/**
 * Log Level Enum
 */
export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  SUCCESS = 'SUCCESS'
}

/**
 * Audit Log Entry
 */
export interface AuditLogEntry {
  id: string;                   // Unique log ID
  timestamp: Date;              // When the event occurred
  level: LogLevel;              // Log severity
  message: string;              // Human-readable message
  context?: LogContext;         // Additional context
  userId?: string;              // User who triggered the action
  userName?: string;            // User display name
}

/**
 * Log Context (additional metadata)
 */
export interface LogContext {
  boxNumber?: number;
  controllerId?: number;
  fromStatus?: string;
  toStatus?: string;
  r?: number;
  g?: number;
  b?: number;
  brightness?: number;
  errorMessage?: string;
  responseTime?: number;
  bulkCount?: number;
  successCount?: number;
  failureCount?: number;
}

/**
 * Log Export Format
 */
export interface LogExport {
  exportDate: Date;
  totalEntries: number;
  logs: AuditLogEntry[];
}
