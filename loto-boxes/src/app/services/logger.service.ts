import { Injectable, signal } from '@angular/core';
import { AuditLogEntry, LogLevel, LogContext, LogExport } from '../models/audit-log.model';

@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  // Signal for reactive logs
  logs = signal<AuditLogEntry[]>([]);

  private readonly MAX_LOGS = 1000; // Keep last 1000 logs in memory

  constructor() {
    this.loadLogs();
  }

  /**
   * Log INFO level message
   */
  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Log WARN level message
   */
  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Log ERROR level message
   */
  error(message: string, context?: LogContext): void {
    this.log(LogLevel.ERROR, message, context);
  }

  /**
   * Log SUCCESS level message
   */
  success(message: string, context?: LogContext): void {
    this.log(LogLevel.SUCCESS, message, context);
  }

  /**
   * Core log method
   */
  log(level: LogLevel, message: string, context?: LogContext): void {
    const entry: AuditLogEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      level,
      message,
      context,
      userId: this.getCurrentUserId(),
      userName: this.getCurrentUserName()
    };

    const logs = [entry, ...this.logs()];

    // Keep only MAX_LOGS
    if (logs.length > this.MAX_LOGS) {
      logs.splice(this.MAX_LOGS);
    }

    this.logs.set(logs);
    this.saveLogs();

    // Console output with color
    const color = this.getConsoleColor(level);
    console.log(
      `%c[${level}] ${message}`,
      `color: ${color}`,
      context || ''
    );
  }

  /**
   * Get log history
   */
  getLogHistory(limit?: number): AuditLogEntry[] {
    const logs = this.logs();
    return limit ? logs.slice(0, limit) : logs;
  }

  /**
   * Filter logs by level
   */
  filterByLevel(level: LogLevel): AuditLogEntry[] {
    return this.logs().filter(log => log.level === level);
  }

  /**
   * Filter logs by box number
   */
  filterByBox(boxNumber: number): AuditLogEntry[] {
    return this.logs().filter(log => log.context?.boxNumber === boxNumber);
  }

  /**
   * Filter logs by date range
   */
  filterByDateRange(start: Date, end: Date): AuditLogEntry[] {
    return this.logs().filter(log =>
      log.timestamp >= start && log.timestamp <= end
    );
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs.set([]);
    localStorage.removeItem('audit-logs');
    this.info('Audit logs cleared');
  }

  /**
   * Export logs to JSON
   */
  exportToJSON(): LogExport {
    return {
      exportDate: new Date(),
      totalEntries: this.logs().length,
      logs: this.logs()
    };
  }

  /**
   * Export logs to CSV
   */
  exportToCSV(): string {
    const headers = ['Timestamp', 'Level', 'Message', 'Box', 'User', 'Details'];
    const rows = this.logs().map(log => [
      log.timestamp.toISOString(),
      log.level,
      log.message,
      log.context?.boxNumber || '',
      log.userName || '',
      JSON.stringify(log.context || {})
    ]);

    return [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
  }

  /**
   * Download logs as file
   */
  downloadLogs(format: 'json' | 'csv' = 'json'): void {
    let data: string;
    let filename: string;
    let mimeType: string;

    if (format === 'json') {
      data = JSON.stringify(this.exportToJSON(), null, 2);
      filename = `audit-logs-${new Date().toISOString()}.json`;
      mimeType = 'application/json';
    } else {
      data = this.exportToCSV();
      filename = `audit-logs-${new Date().toISOString()}.csv`;
      mimeType = 'text/csv';
    }

    const blob = new Blob([data], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);

    this.info(`Exported logs as ${format.toUpperCase()}`, { bulkCount: this.logs().length });
  }

  /**
   * Load logs from localStorage
   */
  private loadLogs(): void {
    const stored = localStorage.getItem('audit-logs');
    if (stored) {
      try {
        const logs = JSON.parse(stored);
        this.logs.set(logs.map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp)
        })));
      } catch (e) {
        console.error('Failed to load audit logs', e);
      }
    }
  }

  /**
   * Save logs to localStorage
   */
  private saveLogs(): void {
    localStorage.setItem('audit-logs', JSON.stringify(this.logs()));
  }

  /**
   * Generate unique log ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current user ID (stub - replace with actual auth)
   */
  private getCurrentUserId(): string | undefined {
    return undefined; // TODO: Implement authentication
  }

  /**
   * Get current user name (stub - replace with actual auth)
   */
  private getCurrentUserName(): string | undefined {
    return undefined; // TODO: Implement authentication
  }

  /**
   * Get console color for log level
   */
  private getConsoleColor(level: LogLevel): string {
    switch (level) {
      case LogLevel.INFO: return '#2196F3';
      case LogLevel.WARN: return '#FF9800';
      case LogLevel.ERROR: return '#F44336';
      case LogLevel.SUCCESS: return '#4CAF50';
      default: return '#000000';
    }
  }
}
