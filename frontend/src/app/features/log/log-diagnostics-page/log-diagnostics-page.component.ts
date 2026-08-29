import { Clipboard } from '@angular/cdk/clipboard';
import { CommonModule, DOCUMENT } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit, Pipe, PipeTransform } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  BehaviorSubject,
  EMPTY,
  Subject,
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  finalize,
  fromEvent,
  interval,
  map,
  merge,
  switchMap,
  takeUntil,
  tap,
  withLatestFrom,
} from 'rxjs';
import { LogDiagnosticsApiService } from '../services/log-diagnostics-api.service';
import {
  LogEvent,
  LogEventsQuery,
  LogEventsResponse,
  LogSortDirection,
  LogSummary,
} from '../services/log-diagnostics.models';

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
type QueryBehavior = 'replace' | 'refresh' | 'append';
type CorrelationFilter = 'requestId' | 'syncRunId' | 'machineId';

interface LogFilterState {
  windowMinutes: number;
  eventLimit: number;
  level: LevelFilter;
  sourceFile: string;
  subsystem: string;
  eventCode: string;
  text: string;
  requestId: string;
  syncRunId: string;
  machineId: string;
  sort: LogSortDirection;
}

interface QueryCommand {
  behavior: QueryBehavior;
  state: LogFilterState;
  cursor?: string;
}

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
  subsystems: string[] = [];
  eventCodes: string[] = [];
  totalMatched = 0;

  windowMinutes = 240;
  eventLimit = 500;
  level: LevelFilter = 'ALL';
  sourceFile = '';
  subsystem = '';
  eventCode = '';
  text = '';
  requestId = '';
  syncRunId = '';
  machineId = '';
  sort: LogSortDirection = 'desc';
  showAdvancedFilters = false;

  readonly limitOptions = [200, 500, 1000];
  readonly windowOptions = [
    { label: '15 min', value: 15 },
    { label: '1 hour', value: 60 },
    { label: '4 hours', value: 240 },
    { label: '24 hours', value: 1440 },
  ];

  loading = false;
  refreshing = false;
  loadingOlder = false;
  errorMessage = '';
  autoRefresh = true;
  documentVisible = true;
  expandedEventId: string | null = null;
  nextCursor: string | null = null;
  hasMore = false;
  truncated = false;
  lastUpdated: Date | null = null;
  requestDurationMs: number | null = null;
  dataStale = false;
  copyMessage = '';

  private loadedAdditionalPages = false;
  private activeRequestId = 0;
  private queryInFlight = false;
  private copyMessageTimeout: ReturnType<typeof setTimeout> | null = null;
  private readonly manualRefresh$ = new Subject<void>();
  private readonly loadOlder$ = new Subject<void>();
  private readonly textChanged$ = new Subject<void>();
  private readonly destroy$ = new Subject<void>();
  private readonly filterState$ = new BehaviorSubject<LogFilterState>(this.captureFilterState());

  constructor(
    private readonly diagnosticsApi: LogDiagnosticsApiService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly clipboard: Clipboard,
    @Inject(DOCUMENT) private readonly document: Document,
  ) {}

  get isStale(): boolean {
    if (!this.lastUpdated) return false;
    return this.dataStale || Date.now() - this.lastUpdated.getTime() > 30_000;
  }

  get canLoadOlder(): boolean {
    return this.hasMore && !!this.nextCursor && !this.queryInFlight;
  }

  get loadOlderLabel(): string {
    return this.sort === 'desc' ? 'Load older' : 'Load newer';
  }

  ngOnInit(): void {
    this.restoreFiltersFromUrl();
    this.documentVisible = this.document.visibilityState !== 'hidden';
    this.filterState$.next(this.captureFilterState());

    this.textChanged$.pipe(
      debounceTime(300),
      takeUntil(this.destroy$),
    ).subscribe(() => this.commitFilters());

    fromEvent(this.document, 'visibilitychange').pipe(
      takeUntil(this.destroy$),
    ).subscribe(() => {
      const wasVisible = this.documentVisible;
      this.documentVisible = this.document.visibilityState !== 'hidden';
      if (!wasVisible && this.documentVisible && this.autoRefresh) {
        this.manualRefresh$.next();
      }
    });

    const filterCommands$ = this.filterState$.pipe(
      distinctUntilChanged((left, right) => this.filtersEqual(left, right)),
      tap(state => this.persistFiltersInUrl(state)),
      map(state => ({ behavior: 'replace', state }) satisfies QueryCommand),
    );

    const manualCommands$ = this.manualRefresh$.pipe(
      filter(() => !this.queryInFlight),
      withLatestFrom(this.filterState$),
      map(([, state]) => ({ behavior: 'refresh', state }) satisfies QueryCommand),
    );

    const pollingCommands$ = interval(10_000).pipe(
      // A slow first scan on a busy hub can legitimately exceed one polling interval.
      // Do not let a background tick cancel it and leave the page permanently empty.
      filter(() => this.autoRefresh && this.documentVisible && !this.queryInFlight),
      withLatestFrom(this.filterState$),
      map(([, state]) => ({ behavior: 'refresh', state }) satisfies QueryCommand),
    );

    const olderCommands$ = this.loadOlder$.pipe(
      withLatestFrom(this.filterState$),
      filter(() => !!this.nextCursor && !this.queryInFlight),
      map(([, state]) => ({
        behavior: 'append',
        state,
        cursor: this.nextCursor ?? undefined,
      }) satisfies QueryCommand),
    );

    // Every request goes through one switchMap. A changed filter, refresh, or
    // cursor request therefore cancels any obsolete in-flight HTTP request.
    merge(filterCommands$, manualCommands$, pollingCommands$, olderCommands$).pipe(
      switchMap(command => this.executeQuery(command)),
      takeUntil(this.destroy$),
    ).subscribe();
  }

  ngOnDestroy(): void {
    if (this.copyMessageTimeout) clearTimeout(this.copyMessageTimeout);
    this.destroy$.next();
    this.destroy$.complete();
  }

  refresh(): void {
    // Capture any text that is still inside the debounce window, then refresh.
    const filtersChanged = this.commitFilters();
    if (!filtersChanged) this.manualRefresh$.next();
  }

  setAutoRefresh(enabled: boolean): void {
    this.autoRefresh = enabled;
    if (enabled && this.documentVisible) this.manualRefresh$.next();
  }

  onDropdownChange(): void {
    this.commitFilters();
  }

  onTextInput(): void {
    this.textChanged$.next();
  }

  clearFilters(): void {
    this.level = 'ALL';
    this.text = '';
    this.sourceFile = '';
    this.subsystem = '';
    this.eventCode = '';
    this.requestId = '';
    this.syncRunId = '';
    this.machineId = '';
    this.sort = 'desc';
    this.commitFilters();
  }

  requestOlderEvents(): void {
    if (this.canLoadOlder) this.loadOlder$.next();
  }

  toggleRow(event: LogEvent, index: number): void {
    const eventId = this.eventIdentity(event, index);
    this.expandedEventId = this.expandedEventId === eventId ? null : eventId;
  }

  onRowKeydown(keyboardEvent: KeyboardEvent, event: LogEvent, index: number): void {
    if (keyboardEvent.key !== 'Enter' && keyboardEvent.key !== ' ') return;
    keyboardEvent.preventDefault();
    this.toggleRow(event, index);
  }

  isExpanded(event: LogEvent, index: number): boolean {
    return this.expandedEventId === this.eventIdentity(event, index);
  }

  hasContext(event: LogEvent): boolean {
    return !!(event.requestId || event.syncRunId || event.jobRunId
      || event.machineId || event.entityType || event.userId || event.path
      || event.status != null || event.durationMs != null);
  }

  trackEvent(index: number, event: LogEvent): string {
    return this.eventIdentity(event, index);
  }

  levelClass(level: string): string {
    switch (level?.toUpperCase()) {
      case 'ERROR': return 'level-error';
      case 'WARN': return 'level-warn';
      default: return 'level-info';
    }
  }

  copyEvent(event: LogEvent): void {
    this.copyText(JSON.stringify(event, null, 2), 'Sanitized event copied');
  }

  copyCorrelation(label: string, value: string): void {
    this.copyText(value, `${label} copied`);
  }

  applyCorrelationFilter(field: CorrelationFilter, value: string): void {
    this[field] = value;
    this.showAdvancedFilters = true;
    this.commitFilters();
  }

  private executeQuery(command: QueryCommand) {
    const requestId = ++this.activeRequestId;
    const startedAt = Date.now();
    this.queryInFlight = true;
    this.loading = command.behavior === 'replace';
    this.refreshing = command.behavior === 'refresh';
    this.loadingOlder = command.behavior === 'append';
    this.errorMessage = '';

    const state = command.state;
    const query: LogEventsQuery = {
      windowMinutes: state.windowMinutes,
      limit: state.eventLimit,
      level: state.level === 'ALL' ? undefined : state.level,
      text: state.text || undefined,
      sourceFile: state.sourceFile || undefined,
      subsystem: state.subsystem || undefined,
      eventCode: state.eventCode || undefined,
      requestId: state.requestId || undefined,
      syncRunId: state.syncRunId || undefined,
      machineId: state.machineId || undefined,
      cursor: command.cursor,
      sort: state.sort,
    };

    return this.diagnosticsApi.getEvents(query).pipe(
      tap(response => {
        if (requestId !== this.activeRequestId) return;
        this.applyResponse(command, response.responseData);
        this.lastUpdated = new Date();
        this.requestDurationMs = Date.now() - startedAt;
        this.dataStale = false;
      }),
      catchError((error: unknown) => {
        if (requestId === this.activeRequestId) {
          this.errorMessage = this.readErrorMessage(error);
          this.dataStale = this.events.length > 0;
        }
        return EMPTY;
      }),
      finalize(() => {
        if (requestId !== this.activeRequestId) return;
        this.queryInFlight = false;
        this.loading = false;
        this.refreshing = false;
        this.loadingOlder = false;
      }),
    );
  }

  private applyResponse(command: QueryCommand, data: LogEventsResponse): void {
    const preserveCursor = command.behavior === 'refresh' && this.loadedAdditionalPages;

    if (command.behavior === 'replace') {
      this.events = [...data.events];
      this.loadedAdditionalPages = false;
    } else if (command.behavior === 'append') {
      this.events = this.mergeEvents(this.events, data.events, command.state.sort);
      this.loadedAdditionalPages = true;
    } else if (this.loadedAdditionalPages) {
      this.events = this.mergeEvents(this.events, data.events, command.state.sort);
    } else {
      this.events = [...data.events];
    }

    this.summary = data.summary;
    this.totalMatched = data.totalMatched;
    this.sourceFiles = this.mergeOptions(this.sourceFiles, data.sourceFiles);
    this.subsystems = this.mergeOptions(this.subsystems, data.subsystems ?? []);
    this.eventCodes = this.mergeOptions(this.eventCodes, data.eventCodes ?? []);

    if (!preserveCursor) {
      this.nextCursor = data.nextCursor ?? null;
      this.hasMore = data.hasMore ?? !!data.nextCursor;
    }
    this.truncated = command.behavior === 'append'
      ? this.truncated || (data.truncated ?? false)
      : (data.truncated ?? false);

    if (this.expandedEventId && !this.events.some((event, index) =>
      this.eventIdentity(event, index) === this.expandedEventId)) {
      this.expandedEventId = null;
    }
  }

  private mergeEvents(
    first: LogEvent[],
    second: LogEvent[],
    sort: LogSortDirection,
  ): LogEvent[] {
    const byId = new Map<string, LogEvent>();
    [...first, ...second].forEach((event, index) => {
      byId.set(this.eventIdentity(event, index), event);
    });

    return [...byId.values()].sort((left, right) => {
      const difference = this.eventTime(left) - this.eventTime(right);
      return sort === 'asc' ? difference : -difference;
    });
  }

  private mergeOptions(current: string[], incoming: string[]): string[] {
    return [...new Set([...current, ...incoming].filter(Boolean))]
      .sort((left, right) => left.localeCompare(right));
  }

  private eventIdentity(event: LogEvent, _index: number): string {
    return event.logicalEventId
      || event.eventId
      || `${event.sourceFile}|${event.timestamp}|${event.logger}|${event.eventCode ?? ''}|${event.message}`;
  }

  private eventTime(event: LogEvent): number {
    const timestamp = new Date(event.timestamp).getTime();
    return Number.isFinite(timestamp) ? timestamp : 0;
  }

  private commitFilters(): boolean {
    const nextState = this.captureFilterState();
    const changed = !this.filtersEqual(this.filterState$.value, nextState);
    this.filterState$.next(nextState);
    return changed;
  }

  private captureFilterState(): LogFilterState {
    return {
      windowMinutes: this.windowMinutes,
      eventLimit: this.eventLimit,
      level: this.level,
      sourceFile: this.sourceFile.trim(),
      subsystem: this.subsystem.trim(),
      eventCode: this.eventCode.trim(),
      text: this.text.trim(),
      requestId: this.requestId.trim(),
      syncRunId: this.syncRunId.trim(),
      machineId: this.machineId.trim(),
      sort: this.sort,
    };
  }

  private filtersEqual(left: LogFilterState, right: LogFilterState): boolean {
    return JSON.stringify(left) === JSON.stringify(right);
  }

  private restoreFiltersFromUrl(): void {
    const params = this.route.snapshot.queryParamMap;
    const requestedWindow = Number(params.get('windowMinutes'));
    const requestedLimit = Number(params.get('limit'));
    const requestedLevel = params.get('level');
    const requestedSort = params.get('sort');

    if (this.windowOptions.some(option => option.value === requestedWindow)) {
      this.windowMinutes = requestedWindow;
    }
    if (this.limitOptions.includes(requestedLimit)) this.eventLimit = requestedLimit;
    if (requestedLevel === 'INFO' || requestedLevel === 'WARN' || requestedLevel === 'ERROR') {
      this.level = requestedLevel;
    }
    if (requestedSort === 'asc' || requestedSort === 'desc') this.sort = requestedSort;

    this.sourceFile = params.get('sourceFile') ?? '';
    this.subsystem = params.get('subsystem') ?? '';
    this.eventCode = params.get('eventCode') ?? '';
    this.text = params.get('text') ?? '';
    this.requestId = params.get('requestId') ?? '';
    this.syncRunId = params.get('syncRunId') ?? '';
    this.machineId = params.get('machineId') ?? '';
    this.showAdvancedFilters = !!(this.eventCode || this.requestId || this.syncRunId || this.machineId);
  }

  private persistFiltersInUrl(state: LogFilterState): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      replaceUrl: true,
      queryParams: {
        windowMinutes: state.windowMinutes,
        limit: state.eventLimit,
        level: state.level === 'ALL' ? null : state.level,
        sort: state.sort,
        sourceFile: state.sourceFile || null,
        subsystem: state.subsystem || null,
        eventCode: state.eventCode || null,
        text: state.text || null,
        requestId: state.requestId || null,
        syncRunId: state.syncRunId || null,
        machineId: state.machineId || null,
      },
    });
  }

  private copyText(value: string, successMessage: string): void {
    const copied = this.clipboard.copy(value);
    this.copyMessage = copied ? successMessage : 'Copy failed';
    if (this.copyMessageTimeout) clearTimeout(this.copyMessageTimeout);
    this.copyMessageTimeout = setTimeout(() => {
      this.copyMessage = '';
      this.copyMessageTimeout = null;
    }, 2500);
  }

  private readErrorMessage(error: unknown): string {
    const response = error as { error?: { message?: string }; message?: string };
    return response.error?.message || response.message || 'Failed to load log events.';
  }
}
