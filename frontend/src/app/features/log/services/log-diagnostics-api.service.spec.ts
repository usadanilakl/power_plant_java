import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { LogDiagnosticsApiService } from './log-diagnostics-api.service';

describe('LogDiagnosticsApiService', () => {
  let service: LogDiagnosticsApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        LogDiagnosticsApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(LogDiagnosticsApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('serializes cursor, sort, time range, and trimmed filters', () => {
    service.getEvents({
      windowMinutes: 60,
      limit: 200,
      level: 'ERROR',
      text: '  timeout  ',
      from: '2026-08-01T00:00:00Z',
      to: '2026-08-01T01:00:00Z',
      cursor: 'opaque+cursor/value',
      sort: 'desc',
    }).subscribe();

    const request = http.expectOne(req => req.url.endsWith('/log-diagnostics/events'));
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('windowMinutes')).toBe('60');
    expect(request.request.params.get('limit')).toBe('200');
    expect(request.request.params.get('level')).toBe('ERROR');
    expect(request.request.params.get('text')).toBe('timeout');
    expect(request.request.params.get('from')).toBe('2026-08-01T00:00:00Z');
    expect(request.request.params.get('to')).toBe('2026-08-01T01:00:00Z');
    expect(request.request.params.get('cursor')).toBe('opaque+cursor/value');
    expect(request.request.params.get('sort')).toBe('desc');

    request.flush({
      responseData: {
        totalMatched: 0,
        summary: { totalEvents: 0, infoEvents: 0, warnEvents: 0, errorEvents: 0 },
        sourceFiles: [],
        subsystems: [],
        eventCodes: [],
        events: [],
        nextCursor: null,
        hasMore: false,
        truncated: false,
      },
      message: 'ok',
      timestamp: '2026-08-01T01:00:00Z',
    });
  });
});
