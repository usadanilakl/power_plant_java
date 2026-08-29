import { Clipboard } from '@angular/cdk/clipboard';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { Observable, Subject, finalize, of } from 'rxjs';
import { SpringApiResponse } from '../../../models/api/spring-api-response.model';
import { LogDiagnosticsApiService } from '../services/log-diagnostics-api.service';
import { LogEvent, LogEventsResponse } from '../services/log-diagnostics.models';
import { LogDiagnosticsPageComponent } from './log-diagnostics-page.component';

describe('LogDiagnosticsPageComponent', () => {
  let fixture: ComponentFixture<LogDiagnosticsPageComponent>;
  let component: LogDiagnosticsPageComponent;
  let getEvents: jasmine.Spy;

  beforeEach(async () => {
    getEvents = jasmine.createSpy('getEvents');
    await TestBed.configureTestingModule({
      imports: [LogDiagnosticsPageComponent],
      providers: [
        { provide: LogDiagnosticsApiService, useValue: { getEvents } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap({}) } },
        },
        {
          provide: Router,
          useValue: { navigate: jasmine.createSpy('navigate').and.resolveTo(true) },
        },
        { provide: Clipboard, useValue: { copy: () => true } },
      ],
    }).compileComponents();
  });

  afterEach(() => fixture?.destroy());

  it('cancels an obsolete request when filters change', () => {
    const pending = new Subject<SpringApiResponse<LogEventsResponse>>();
    let cancelled = false;
    getEvents.and.returnValues(
      pending.pipe(finalize(() => cancelled = true)),
      of(apiResponse([event('error-1', '2026-08-02T18:00:00Z')], null, false)),
    );
    createComponent();

    component.level = 'ERROR';
    component.onDropdownChange();

    expect(cancelled).toBeTrue();
    expect(component.events.map(item => item.eventId)).toEqual(['error-1']);
  });

  it('does not let polling cancel a slow initial request', fakeAsync(() => {
    const pending = new Subject<SpringApiResponse<LogEventsResponse>>();
    let cancelled = false;
    getEvents.and.returnValues(
      pending.pipe(finalize(() => cancelled = true)),
      of(apiResponse([event('refresh-1', '2026-08-02T18:01:00Z')], null, false)),
    );
    createComponent();

    tick(20_000);

    expect(getEvents).toHaveBeenCalledTimes(1);
    expect(cancelled).toBeFalse();

    pending.next(apiResponse([event('initial-1', '2026-08-02T18:00:00Z')], null, false));
    pending.complete();
    tick();

    expect(component.events.map(item => item.eventId)).toEqual(['initial-1']);

    tick(10_000);

    expect(getEvents).toHaveBeenCalledTimes(2);
    expect(component.events.map(item => item.eventId)).toEqual(['refresh-1']);
  }));

  it('loads cursor results, upserts a refreshed tail version, and manually refreshes while polling is off', () => {
    const newest = event('newest-v1', '2026-08-02T18:00:00Z', 'newest');
    const refreshedNewest = event('newest-v2', '2026-08-02T18:00:00Z', 'newest');
    const older = event('older', '2026-08-02T17:59:00Z');
    getEvents.and.returnValues(
      of(apiResponse([newest], 'cursor-1', true)),
      of(apiResponse([older], null, false)),
      of(apiResponse([refreshedNewest], 'cursor-1', true)),
    );
    createComponent();
    component.setAutoRefresh(false);
    component.toggleRow(newest, 0);

    component.requestOlderEvents();

    expect(component.events.map(item => item.eventId)).toEqual(['newest-v1', 'older']);
    expect(component.expandedEventId).toBe('newest');

    component.refresh();

    expect(getEvents).toHaveBeenCalledTimes(3);
    expect(component.events.map(item => item.eventId)).toEqual(['newest-v2', 'older']);
    expect(component.expandedEventId).toBe('newest');
  });

  function createComponent(): void {
    fixture = TestBed.createComponent(LogDiagnosticsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  function apiResponse(
    events: LogEvent[],
    nextCursor: string | null,
    hasMore: boolean,
  ): SpringApiResponse<LogEventsResponse> {
    return {
      responseData: {
        totalMatched: events.length,
        summary: {
          totalEvents: events.length,
          infoEvents: events.length,
          warnEvents: 0,
          errorEvents: 0,
        },
        sourceFiles: ['power-plant.log'],
        subsystems: ['Application'],
        eventCodes: [],
        events,
        nextCursor,
        hasMore,
        truncated: false,
      },
      message: 'ok',
      timestamp: '2026-08-02T18:00:00Z',
    };
  }

  function event(eventId: string, timestamp: string, logicalEventId?: string): LogEvent {
    return {
      eventId,
      logicalEventId,
      timestamp,
      level: 'INFO',
      subsystem: 'Application',
      sourceFile: 'power-plant.log',
      logger: 'example.Logger',
      thread: 'main',
      eventCode: null,
      message: eventId,
      details: null,
      requestId: null,
      userId: null,
      machineId: null,
      jobName: null,
      jobRunId: null,
      syncRunId: null,
      entityType: null,
      entityId: null,
      sharepointId: null,
      method: null,
      path: null,
      remoteIp: null,
      status: null,
      durationMs: null,
    };
  }
});
