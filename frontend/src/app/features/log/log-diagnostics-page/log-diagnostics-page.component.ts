import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LogDiagnosticsApiService } from '../services/log-diagnostics-api.service';
import {
  LogDiagnosticsEvent,
  LogDiagnosticsEventsResponse,
  LogDiagnosticsFinding,
  LogDiagnosticsIncident,
  LogDiagnosticsIncidentDetail,
  LogDiagnosticsIncidentsResponse,
  LogDiagnosticsOverview,
} from '../services/log-diagnostics.models';

type LevelFilter = 'ALL' | 'INFO' | 'WARN' | 'ERROR';
type IncidentStatusFilter = 'ALL' | 'open' | 'acknowledged' | 'resolved';

@Component({
  selector: 'app-log-diagnostics-page',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './log-diagnostics-page.component.html',
  styleUrl: './log-diagnostics-page.component.css',
})
export class LogDiagnosticsPageComponent implements OnInit {
  overview: LogDiagnosticsOverview | null = null;
  events: LogDiagnosticsEvent[] = [];
  totalMatched = 0;
  incidents: LogDiagnosticsIncident[] = [];
  selectedIncidentId: string | null = null;
  selectedIncidentDetail: LogDiagnosticsIncidentDetail | null = null;
  totalIncidents = 0;

  windowMinutes = 240;
  eventLimit = 150;
  level: LevelFilter = 'ALL';
  incidentStatus: IncidentStatusFilter = 'ALL';
  text = '';
  sourceFile = '';
  requestId = '';
  syncRunId = '';
  machineId = '';

  loadingOverview = false;
  loadingEvents = false;
  loadingIncidents = false;
  loadingIncidentDetail = false;
  errorMessage = '';

  readonly windowOptions = [
    { label: '15 min', value: 15 },
    { label: '1 hour', value: 60 },
    { label: '4 hours', value: 240 },
    { label: '24 hours', value: 1440 },
  ];

  constructor(private diagnosticsApi: LogDiagnosticsApiService) {}

  ngOnInit(): void {
    this.refreshAll();
  }

  get findings(): LogDiagnosticsFinding[] {
    return this.overview?.findings ?? [];
  }

  get incidentDetail(): LogDiagnosticsIncidentDetail | null {
    return this.selectedIncidentDetail;
  }

  get sourceFiles(): string[] {
    return this.overview?.sourceFiles ?? [];
  }

  refreshAll(): void {
    this.loadOverview();
    this.loadIncidents();
    this.loadEvents();
  }

  applyFilters(): void {
    this.loadEvents();
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

  useFinding(finding: LogDiagnosticsFinding): void {
    this.level = finding.severity === 'critical' ? 'ERROR' : 'WARN';
    this.machineId = finding.machineId ?? '';
    this.requestId = '';
    this.syncRunId = '';
    this.text = finding.path || finding.type;
    this.loadEvents();
  }

  selectIncident(incident: LogDiagnosticsIncident): void {
    this.selectedIncidentId = incident.incidentId;
    this.loadingIncidentDetail = true;
    this.errorMessage = '';
    this.diagnosticsApi
      .getIncidentDetail(incident.incidentId, this.windowMinutes, this.eventLimit)
      .subscribe({
        next: (response) => {
          this.selectedIncidentDetail = response.responseData;
          this.loadingIncidentDetail = false;
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'Failed to load incident detail.';
          this.loadingIncidentDetail = false;
        },
      });
  }

  setIncidentStatus(
    incident: LogDiagnosticsIncident,
    status: 'open' | 'acknowledged' | 'resolved'
  ): void {
    this.diagnosticsApi.updateIncidentStatus(incident.incidentId, status, this.windowMinutes).subscribe({
      next: () => {
        this.loadIncidents();
        if (this.selectedIncidentId === incident.incidentId) {
          this.selectIncident({ ...incident, status });
        }
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Failed to update incident status.';
      },
    });
  }

  useIncident(incident: LogDiagnosticsIncident): void {
    this.level = incident.severity === 'critical' ? 'ERROR' : 'WARN';
    this.requestId = incident.requestId ?? '';
    this.syncRunId = incident.syncRunId ?? '';
    this.machineId = incident.machineId ?? '';
    this.text = incident.path || incident.incidentKey;
    this.loadEvents();
  }

  severityClass(severity: string): string {
    if (severity === 'warn' || severity === 'warning') {
      return 'severity-warning';
    }
    if (severity === 'error' || severity === 'critical') {
      return 'severity-critical';
    }
    return 'severity-info';
  }

  statusClass(status: string): string {
    if (status === 'resolved') {
      return 'status-resolved';
    }
    if (status === 'acknowledged') {
      return 'status-acknowledged';
    }
    return 'status-open';
  }

  trackEvent(_: number, event: LogDiagnosticsEvent): string {
    return `${event.timestamp}-${event.logger}-${event.message}`;
  }

  trackIncident(_: number, incident: LogDiagnosticsIncident): string {
    return incident.incidentId;
  }

  private loadOverview(): void {
    this.loadingOverview = true;
    this.errorMessage = '';
    this.diagnosticsApi.getOverview(this.windowMinutes, this.eventLimit).subscribe({
      next: (response) => {
        this.overview = response.responseData;
        this.loadingOverview = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Failed to load diagnostics overview.';
        this.loadingOverview = false;
      },
    });
  }

  loadIncidents(): void {
    this.loadingIncidents = true;
    this.errorMessage = '';
    this.diagnosticsApi
      .getIncidents({
        windowMinutes: this.windowMinutes,
        limit: 50,
        status: this.incidentStatus === 'ALL' ? undefined : this.incidentStatus,
      })
      .subscribe({
        next: (response) => {
          const payload: LogDiagnosticsIncidentsResponse = response.responseData;
          this.incidents = payload.incidents;
          this.totalIncidents = payload.totalMatched;
          this.loadingIncidents = false;

          if (!this.selectedIncidentId && this.incidents.length > 0) {
            this.selectIncident(this.incidents[0]);
            return;
          }

          const active = this.incidents.find(
            (incident) => incident.incidentId === this.selectedIncidentId
          );
          if (active) {
            this.selectIncident(active);
          } else {
            this.selectedIncidentId = this.incidents[0]?.incidentId ?? null;
            this.selectedIncidentDetail = null;
            if (this.incidents[0]) {
              this.selectIncident(this.incidents[0]);
            }
          }
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'Failed to load incidents.';
          this.loadingIncidents = false;
        },
      });
  }

  private loadEvents(): void {
    this.loadingEvents = true;
    this.diagnosticsApi
      .getEvents({
        windowMinutes: this.windowMinutes,
        limit: this.eventLimit,
        level: this.level,
        text: this.text,
        sourceFile: this.sourceFile,
        requestId: this.requestId,
        syncRunId: this.syncRunId,
        machineId: this.machineId,
      })
      .subscribe({
        next: (response) => {
          const payload: LogDiagnosticsEventsResponse = response.responseData;
          this.events = payload.events;
          this.totalMatched = payload.totalMatched;
          this.loadingEvents = false;
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'Failed to load diagnostic events.';
          this.loadingEvents = false;
        },
      });
  }
}
