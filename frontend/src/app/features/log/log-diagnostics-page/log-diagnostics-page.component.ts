import { Component, OnInit, OnDestroy, Pipe, PipeTransform } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LogDiagnosticsApiService } from '../services/log-diagnostics-api.service';
import { LogEvent, LogSummary } from '../services/log-diagnostics.models';
import { Subject, interval, merge, debounceTime, takeUntil, startWith } from 'rxjs';

@Pipe({ name: 'relativeTime', standalone: true })
export class RelativeTimePipe implements PipeTransform {
  transform(value: string | null): string {
    if (!value) return '';
    const diff = Date.now() - new Date(value).getTime();
    if (diff < 0) return 'just now';
    if (diff < 60_000) return `${Math.max(1, Math.floor(diff / 1000))}s ago`;
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
    return `${Math.floor(diff / 86_400_000)}d ago`;
  }
}

type LevelFilter = 'ALL' | 'INFO' | 'WARN' | 'ERROR';

@Component({
  selector: 'app-log-diagnostics-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RelativeTimePipe],
  templateUrl: './log-diagnostics-page.component.html',
  styleUrl: './log-diagnostics-page.component.css',
})
export class LogDiagnosticsPageComponent implements OnInit, OnDestroy {
  events: LogEvent[] = [];
  summary: LogSummary = { totalEvents: 0, infoEvents: 0, warnEvents: 0, errorEvents: 0 };
  sourceFiles: string[] = [];
  totalMatched = 0;

  windowMinutes = 240;
  eventLimit = 200;
  level: LevelFilter = 'ALL';
  sourceFile = '';
  text = '';
  requestId = '';
  syncRunId = '';
  machineId = '';
  showAdvancedFilters = false;

  loading = false;
  errorMessage = '';
  autoRefresh = true;
  expandedIndex: number | null = null;

  readonly windowOptions = [
    { label: '15 min', value: 15 },
    { label: '1 hour', value: 60 },
    { label: '4 hours', value: 240 },
    { label: '24 hours', value: 1440 },
  ];

  private manualRefresh$ = new Subject<void>();
  private textChanged$ = new Subject<void>();
  private destroy$ = new Subject<void>();

  constructor(private diagnosticsApi: LogDiagnosticsApiService) {}

  ngOnInit(): void {
    const autoRefreshInterval$ = interval(10_000).pipe(
      startWith(0),
    );

    // Text input debounce — triggers a load after 300ms pause
    this.textChanged$.pipe(
      debounceTime(300),
      takeUntil(this.destroy$),
    ).subscribe(() => this.loadEvents());

    // Auto-refresh + manual refresh merge
    merge(
      this.manualRefresh$,
      autoRefreshInterval$,
    ).pipe(
      takeUntil(this.destroy$),
    ).subscribe(() => {
      if (this.autoRefresh || this.events.length === 0) {
        this.loadEvents();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  refresh(): void {
    this.manualRefresh$.next();
  }

  onDropdownChange(): void {
    this.loadEvents();
  }

  onTextInput(): void {
    this.textChanged$.next();
  }

  clearFilters(): void {
    this.level = 'ALL';
    this.text = '';
    this.sourceFile = '';
    this.requestId = '';
    this.syncRunId = '';
    this.machineId = '';
    this.loadEvents();
  }

  toggleRow(index: number): void {
    this.expandedIndex = this.expandedIndex === index ? null : index;
  }

  hasContext(event: LogEvent): boolean {
    return !!(event.requestId || event.syncRunId || event.jobRunId
      || event.machineId || event.entityType || event.durationMs);
  }

  trackEvent(index: number, event: LogEvent): string {
    return `${event.timestamp}-${event.logger}-${index}`;
  }

  levelClass(level: string): string {
    switch (level?.toUpperCase()) {
      case 'ERROR': return 'level-error';
      case 'WARN': return 'level-warn';
      default: return 'level-info';
    }
  }

  private loadEvents(): void {
    this.loading = true;
    this.errorMessage = '';
    this.diagnosticsApi.getEvents({
      windowMinutes: this.windowMinutes,
      limit: this.eventLimit,
      level: this.level === 'ALL' ? undefined : this.level,
      text: this.text || undefined,
      sourceFile: this.sourceFile || undefined,
      requestId: this.requestId || undefined,
      syncRunId: this.syncRunId || undefined,
      machineId: this.machineId || undefined,
    }).subscribe({
      next: (response) => {
        const data = response.responseData;
        this.events = data.events;
        this.summary = data.summary;
        this.sourceFiles = data.sourceFiles;
        this.totalMatched = data.totalMatched;
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Failed to load log events.';
        this.loading = false;
      },
    });
  }
}
