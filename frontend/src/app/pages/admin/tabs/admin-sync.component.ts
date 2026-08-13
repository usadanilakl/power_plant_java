import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  AdminFunctionalitiesService,
  SyncQueueStatus,
  PendingBacklogBreakdown,
  SyncAuditTypeSummary,
  SyncAuditRecentEntity,
  SyncAuditEntityReport,
  SyncAuditMachineCompareReport,
  SyncAuditReconstruction,
  SyncAuditFilters
} from '../../../services/admin/admin-functionalities.service';

@Component({
  selector: 'app-admin-sync',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-container">
      <!-- PWA Sync -->
      <div class="admin-section">
        <h3>Sync Data to PWA</h3>
        <p class="description">
          Publish work-request static files to the GitHub-hosted PWA when Management-side changes are correct but the PWA is still showing stale work areas, map data, or work categories.
        </p>

        <div class="button-group">
          <button class="action-btn" (click)="syncPwaData('all')" [disabled]="loading.pwaSync">
            {{ loading.pwaSync ? 'Queueing...' : 'Sync All PWA Data' }}
          </button>
          <button (click)="syncPwaData('areas')" [disabled]="loading.pwaSync">Sync Work Areas</button>
          <button (click)="syncPwaData('map')" [disabled]="loading.pwaSync">Sync Work Map</button>
          <button (click)="syncPwaData('categories')" [disabled]="loading.pwaSync">Sync Work Categories</button>
          <button (click)="syncPwaData('fieldlisttypes')" [disabled]="loading.pwaSync">Sync Field List Types</button>
          <button (click)="syncPwaData('inventorytypes')" [disabled]="loading.pwaSync">Sync Inventory Types</button>
          <button (click)="syncPwaData('locations')" [disabled]="loading.pwaSync">Sync Locations</button>
          <button (click)="syncPwaData('lotopoints')" [disabled]="loading.pwaSync">Sync LOTO Points</button>
          <button (click)="syncPwaData('sdschemicals')" [disabled]="loading.pwaSync">Sync SDS Chemicals</button>
        </div>

        <div class="error" *ngIf="errors.pwaSync">{{ errors.pwaSync }}</div>
        <div class="success-msg" *ngIf="pwaSyncMessage">{{ pwaSyncMessage }}</div>
      </div>

      <!-- Sync Queue Monitoring & Control -->
      <div class="admin-section sync-section">
        <h3>Sync Queue Monitoring & Control</h3>
        <p class="description">
          Monitor and manage the FieldChange sync queue. Changes are tracked here and pushed to other machines during sync.
        </p>

        <div class="button-group">
          <button (click)="loadSyncQueueStatus()" [disabled]="loading.syncQueue">
            {{ loading.syncQueue ? 'Loading...' : 'Refresh Status' }}
          </button>
        </div>

        <div class="error" *ngIf="errors.syncQueue">{{ errors.syncQueue }}</div>

        <div class="success-msg" *ngIf="syncActionMessage">{{ syncActionMessage }}</div>

        <div class="result" *ngIf="syncQueueStatus">
          <div class="result-summary">
            <span class="badge" [class.warning]="syncQueueStatus.totalChanges > 1000"
                                [class.success]="syncQueueStatus.totalChanges <= 1000">
              Total Changes: {{ syncQueueStatus.totalChanges }}
            </span>
            <span class="badge" [class.warning]="syncQueueStatus.pendingForServer > 0"
                                [class.success]="syncQueueStatus.pendingForServer === 0">
              Pending for Server: {{ syncQueueStatus.pendingForServer }}
            </span>
          </div>

          <div class="result-summary" *ngIf="syncQueueStatus.oldestChange">
            <span class="badge info">Oldest: {{ syncQueueStatus.oldestChange }}</span>
            <span class="badge info">Newest: {{ syncQueueStatus.newestChange }}</span>
          </div>

          <div class="result-summary" *ngIf="syncQueueStatus.originMachines?.length">
            <span class="badge" *ngFor="let m of syncQueueStatus.originMachines">
              Origin: {{ m }}
            </span>
          </div>

          <!-- Entity Breakdown -->
          <div class="details-section" *ngIf="getEntityBreakdownEntries().length > 0">
            <button class="toggle-btn" (click)="toggleSection('entityBreakdown')">
              {{ expandedSections['entityBreakdown'] ? 'Hide' : 'Show' }} Entity Breakdown
              ({{ getEntityBreakdownEntries().length }} types)
            </button>
            <div class="details-list" *ngIf="expandedSections['entityBreakdown']">
              <table>
                <thead>
                  <tr>
                    <th>Entity Type</th>
                    <th>Count</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let entry of getEntityBreakdownEntries()">
                    <td>{{ entry[0] }}</td>
                    <td>{{ entry[1] }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <hr class="sub-divider">

        <!-- Actions -->
        <div class="sub-section">
          <h4>Mark as Synced</h4>
          <div class="button-group">
            <button class="action-btn" (click)="markAllSyncedToServer()" [disabled]="loading.syncAction">
              Mark All Synced to Server
            </button>
          </div>
          <div class="button-group">
            <input type="text" [(ngModel)]="markSyncedMachineId" placeholder="Machine ID (e.g. OPI)"
                   class="input-field">
            <button class="action-btn" (click)="markAllSyncedToMachine()"
                    [disabled]="loading.syncAction || !markSyncedMachineId.trim()">
              Mark Synced to Machine
            </button>
          </div>
        </div>

        <hr class="sub-divider">

        <div class="sub-section">
          <h4>Cleanup</h4>
          <div class="button-group">
            <label>Older than</label>
            <input type="number" [(ngModel)]="clearOldDays" min="1" max="365" class="input-field input-small">
            <label>days</label>
            <button (click)="clearOldChanges()" [disabled]="loading.syncAction">
              Clear Old Changes
            </button>
          </div>
          <div class="button-group">
            <button class="danger-btn" (click)="clearAllChanges()" [disabled]="loading.syncAction">
              Clear ALL Changes
            </button>
          </div>
        </div>
      </div>

      <!-- Client Backlog Diagnosis -->
      <div class="admin-section backlog-section">
        <h3>Client Backlog Diagnosis</h3>
        <p class="description">
          Explain a client's pending backlog: how much is GENUINE deliverable data vs inflation from
          <code>_entity_</code> markers and dead-letter-pinned history. A single (entity, field) with a huge
          count, matched by a large DEAD_LETTER count for that same type, means compaction is pinned — run
          <strong>Compact Now</strong> after a fix. Hub-only; heavy full-scan, so run it ad hoc.
        </p>

        <div class="button-group">
          <input type="text" [(ngModel)]="backlogMachineId" placeholder="Machine ID (e.g. OPI)" class="input-field">
          <label>Top</label>
          <input type="number" [(ngModel)]="backlogLimit" min="1" max="200" class="input-field input-small">
          <button class="action-btn" (click)="loadPendingBreakdown()"
                  [disabled]="loading.backlog || !backlogMachineId.trim()">
            {{ loading.backlog ? 'Diagnosing…' : 'Diagnose Backlog' }}
          </button>
        </div>

        <div class="error" *ngIf="errors.backlog">{{ errors.backlog }}</div>
        <div class="error" *ngIf="backlogResult && !backlogResult.success">
          {{ backlogResult.error || 'Not available (this is a hub-only diagnostic).' }}
        </div>

        <div class="result" *ngIf="backlogResult && backlogResult.success">
          <div class="result-summary">
            <span class="badge info">Machine: {{ backlogResult.machineId }}</span>
            <span class="badge" [class.warning]="backlogResult.rawPending > 1000">
              Raw pending rows: {{ backlogResult.rawPending | number }}
            </span>
            <span class="badge" [class.success]="backlogResult.distinctFieldPending <= 1000"
                                [class.warning]="backlogResult.distinctFieldPending > 1000">
              Genuine distinct fields: {{ backlogResult.distinctFieldPending | number }}
            </span>
            <span class="badge warning" *ngIf="backlogResult.inflationFactor && backlogResult.inflationFactor >= 3">
              Inflation ×{{ backlogResult.inflationFactor }}
            </span>
            <span class="badge info">Hub total FieldChanges: {{ backlogResult.totalFieldChanges | number }}</span>
          </div>

          <div class="result-summary" *ngIf="backlogResult.applyState">
            <span class="badge" [class.warning]="backlogResult.applyState.deadLetter > 0">
              Dead-letter: {{ backlogResult.applyState.deadLetter | number }}
            </span>
            <span class="badge">Deferred: {{ backlogResult.applyState.deferred | number }}</span>
            <span class="badge">Failed-retry: {{ backlogResult.applyState.failedRetryable | number }}</span>
            <span class="badge">Pending: {{ backlogResult.applyState.pending | number }}</span>
          </div>

          <div class="details-section" *ngIf="backlogResult.topPendingFields?.length">
            <h4>Busiest pending fields (top {{ backlogResult.topPendingFields.length }})</h4>
            <div class="details-list">
              <table>
                <thead>
                  <tr><th>Entity Type</th><th>Field</th><th>Pending Rows</th></tr>
                </thead>
                <tbody>
                  <tr *ngFor="let f of backlogResult.topPendingFields">
                    <td>{{ f.entityType }}</td>
                    <td>{{ f.fieldName }}</td>
                    <td>{{ f.count | number }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="details-section" *ngIf="backlogResult.applyState?.deadLetterByType?.length">
            <h4>Dead-letter apply-state by type (compaction-pin driver)</h4>
            <div class="details-list">
              <table>
                <thead>
                  <tr><th>Entity Type</th><th>Dead-lettered</th></tr>
                </thead>
                <tbody>
                  <tr *ngFor="let d of backlogResult.applyState.deadLetterByType">
                    <td>{{ d.entityType }}</td>
                    <td>{{ d.count | number }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Sync Audit -->
      <div class="admin-section sync-audit-section">
        <h3>Sync Audit</h3>
        <p class="description">
          Inspect <code>field_change</code> history for any sync entity, compare it with the current database row, and flag suspicious patterns like recreate-after-delete, detach changes, or missing current rows.
        </p>

        <div class="button-group audit-controls">
          <button (click)="loadSyncAuditTypes()" [disabled]="loading.syncAuditTypes">
            {{ loading.syncAuditTypes ? 'Refreshing...' : 'Refresh Entity Types' }}
          </button>
          <select [(ngModel)]="selectedAuditEntityType" class="input-field" [disabled]="loading.syncAuditTypes || syncAuditTypes.length === 0">
            <option value="" disabled>Select entity type</option>
            <option *ngFor="let type of syncAuditTypes" [value]="type.entityType">
              {{ type.entityType }} ({{ type.entityCount }} entities / {{ type.changeCount }} changes)
            </option>
          </select>
          <label>Recent limit</label>
          <input type="number" [(ngModel)]="auditRecentLimit" min="1" max="100" class="input-field input-small">
          <button class="action-btn" (click)="loadRecentSyncAuditEntities()"
                  [disabled]="loading.syncAuditRecent || !selectedAuditEntityType">
            {{ loading.syncAuditRecent ? 'Loading...' : 'Load Recent Entities' }}
          </button>
        </div>

        <div class="button-group audit-controls">
          <input type="text" [(ngModel)]="auditEntityIdInput" placeholder="Entity ID" class="input-field">
          <label>Timeline limit</label>
          <input type="number" [(ngModel)]="auditTimelineLimit" min="1" max="1000" class="input-field input-small">
          <button class="action-btn" (click)="loadSyncAuditEntityReport()"
                  [disabled]="loading.syncAuditEntity || !selectedAuditEntityType || !auditEntityIdInput.trim()">
            {{ loading.syncAuditEntity ? 'Inspecting...' : 'Inspect Entity' }}
          </button>
          <button (click)="exportSyncAuditEntityReport()"
                  [disabled]="loading.syncAuditExport || !selectedAuditEntityType || !auditEntityIdInput.trim()">
            {{ loading.syncAuditExport ? 'Exporting...' : 'Export JSON' }}
          </button>
          <button (click)="exportSyncAuditIncidentReport()"
                  [disabled]="loading.syncAuditIncidentExport || !selectedAuditEntityType || !auditEntityIdInput.trim()">
            {{ loading.syncAuditIncidentExport ? 'Exporting Incident...' : 'Export Incident' }}
          </button>
        </div>

        <div class="button-group audit-controls">
          <input type="text" [(ngModel)]="auditMachineIdFilter" placeholder="Machine ID filter" class="input-field">
          <input type="text" [(ngModel)]="auditFieldNameFilter" placeholder="Field name filter" class="input-field">
          <select [(ngModel)]="auditChangeTypeFilter" class="input-field">
            <option value="">All change types</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
          </select>
          <input type="text" [(ngModel)]="auditFromFilter" placeholder="From ISO time" class="input-field">
          <input type="text" [(ngModel)]="auditToFilter" placeholder="To ISO time" class="input-field">
          <button (click)="clearSyncAuditFilters()">Clear Filters</button>
        </div>

        <div class="button-group audit-controls">
          <input type="text" [(ngModel)]="auditCompareLeftMachineId" placeholder="Left machine ID" class="input-field">
          <input type="text" [(ngModel)]="auditCompareRightMachineId" placeholder="Right machine ID" class="input-field">
          <label>Compare limit</label>
          <input type="number" [(ngModel)]="auditCompareLimit" min="1" max="500" class="input-field input-small">
          <button class="action-btn" (click)="compareSyncAuditMachines()"
                  [disabled]="loading.syncAuditCompare || !selectedAuditEntityType || !auditCompareLeftMachineId.trim() || !auditCompareRightMachineId.trim()">
            {{ loading.syncAuditCompare ? 'Comparing...' : 'Compare Machines' }}
          </button>
        </div>

        <div class="button-group audit-controls">
          <input type="text" [(ngModel)]="auditReconstructAsOf" placeholder="As-of ISO time" class="input-field">
          <button class="action-btn" (click)="reconstructSyncAuditEntity()"
                  [disabled]="loading.syncAuditReconstruct || !selectedAuditEntityType || !auditEntityIdInput.trim() || !auditReconstructAsOf.trim()">
            {{ loading.syncAuditReconstruct ? 'Reconstructing...' : 'Reconstruct At Time' }}
          </button>
        </div>

        <div class="error" *ngIf="errors.syncAudit">{{ errors.syncAudit }}</div>

        <div class="result" *ngIf="syncAuditTypes.length > 0">
          <div class="result-summary">
            <span class="badge info">Types with Sync History: {{ syncAuditTypes.length }}</span>
            <span class="badge" *ngIf="selectedAuditEntityType">
              Selected: {{ selectedAuditEntityType }}
            </span>
          </div>
        </div>

        <div class="details-section" *ngIf="recentSyncAuditEntities.length > 0">
          <h4>Recent Entities</h4>
          <div class="details-list">
            <table>
              <thead>
                <tr>
                  <th>Entity ID</th>
                  <th>Total Changes</th>
                  <th>First Change</th>
                  <th>Last Change</th>
                  <th>Latest Change</th>
                  <th>Latest Machine</th>
                  <th>Warnings</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let entity of recentSyncAuditEntities">
                  <td>{{ entity.entityId }}</td>
                  <td>{{ entity.totalChanges }}</td>
                  <td>{{ entity.firstChangeAt || 'n/a' }}</td>
                  <td>{{ entity.lastChangeAt || 'n/a' }}</td>
                  <td>{{ entity.latestChangeType }} / {{ entity.latestFieldName }}</td>
                  <td>{{ entity.latestMachineId || 'n/a' }}</td>
                  <td>
                    <span *ngIf="entity.warnings.length === 0">None</span>
                    <span *ngIf="entity.warnings.length > 0">{{ entity.warnings.join(' | ') }}</span>
                  </td>
                  <td>
                    <button class="toggle-btn" (click)="inspectRecentSyncAuditEntity(entity.entityId)">Inspect</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="result" *ngIf="syncAuditCompareReport">
          <div class="result-summary">
            <span class="badge info">{{ syncAuditCompareReport.leftMachineId }} vs {{ syncAuditCompareReport.rightMachineId }}</span>
            <span class="badge">Compared: {{ syncAuditCompareReport.totalCompared }}</span>
            <span class="badge warning" *ngIf="syncAuditCompareReport.divergentCount > 0">
              Divergent: {{ syncAuditCompareReport.divergentCount }}
            </span>
            <span class="badge" *ngIf="syncAuditCompareReport.leftOnlyCount > 0">
              Left Only: {{ syncAuditCompareReport.leftOnlyCount }}
            </span>
            <span class="badge" *ngIf="syncAuditCompareReport.rightOnlyCount > 0">
              Right Only: {{ syncAuditCompareReport.rightOnlyCount }}
            </span>
          </div>

          <div class="details-section">
            <h4>Machine Comparison</h4>
            <div class="details-list">
              <table>
                <thead>
                  <tr>
                    <th>Entity ID</th>
                    <th>Status</th>
                    <th>{{ syncAuditCompareReport.leftMachineId }} Count</th>
                    <th>{{ syncAuditCompareReport.rightMachineId }} Count</th>
                    <th>{{ syncAuditCompareReport.leftMachineId }} Last</th>
                    <th>{{ syncAuditCompareReport.rightMachineId }} Last</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let row of syncAuditCompareReport.entities">
                    <td>{{ row.entityId }}</td>
                    <td>{{ row.status }}</td>
                    <td>{{ row.leftCount }}</td>
                    <td>{{ row.rightCount }}</td>
                    <td>{{ row.leftLastChangeAt || 'n/a' }}</td>
                    <td>{{ row.rightLastChangeAt || 'n/a' }}</td>
                    <td>
                      <button class="toggle-btn" (click)="inspectRecentSyncAuditEntity(row.entityId)">Inspect</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="result" *ngIf="syncAuditReconstruction">
          <div class="result-summary">
            <span class="badge info">As Of: {{ syncAuditReconstruction.asOf }}</span>
            <span class="badge">Applied Changes: {{ syncAuditReconstruction.appliedChangeCount }}</span>
            <span class="badge" *ngIf="syncAuditReconstruction.machinesSeen.length > 0">
              Machines: {{ syncAuditReconstruction.machinesSeen.join(', ') }}
            </span>
          </div>

          <div class="warning-list" *ngIf="syncAuditReconstruction.warnings.length > 0">
            <div class="warning-item" *ngFor="let warning of syncAuditReconstruction.warnings">
              {{ warning }}
            </div>
          </div>

          <div class="details-section">
            <button class="toggle-btn" (click)="toggleSection('syncAuditReconstruction')">
              {{ expandedSections['syncAuditReconstruction'] ? 'Hide' : 'Show' }} Reconstructed Fields
              ({{ syncAuditReconstruction.appliedChangeCount }})
            </button>
            <div class="details-list" *ngIf="expandedSections['syncAuditReconstruction']">
              <table>
                <thead>
                  <tr>
                    <th>Field</th>
                    <th>Reconstructed Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let entry of syncAuditReconstruction.reconstructedFields | keyvalue">
                    <td>{{ entry.key }}</td>
                    <td><pre class="cell-pre">{{ entry.value }}</pre></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="details-section" *ngIf="syncAuditReconstruction.diffsFromCurrent.length > 0">
            <h4>Diff From Current Row</h4>
            <div class="details-list">
              <table>
                <thead>
                  <tr>
                    <th>Field</th>
                    <th>Reconstructed</th>
                    <th>Current</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let diff of syncAuditReconstruction.diffsFromCurrent">
                    <td>{{ diff.fieldName }}</td>
                    <td><pre class="cell-pre">{{ diff.reconstructedValue || 'null' }}</pre></td>
                    <td><pre class="cell-pre">{{ diff.currentValue || 'null' }}</pre></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="result" *ngIf="syncAuditReport">
          <div class="result-summary">
            <span class="badge info">{{ syncAuditReport.entityType }} #{{ syncAuditReport.entityId }}</span>
            <span class="badge">Changes: {{ syncAuditReport.totalChanges }}</span>
            <span class="badge" [class.success]="syncAuditReport.currentRow.rowExists"
                                [class.warning]="!syncAuditReport.currentRow.rowExists">
              Current Row: {{ syncAuditReport.currentRow.rowExists ? 'Present' : 'Missing' }}
            </span>
            <span class="badge warning" *ngIf="syncAuditReport.currentRow.deleted">Soft Deleted</span>
          </div>

          <div class="result-summary">
            <span class="badge info">First: {{ syncAuditReport.firstChangeAt || 'n/a' }}</span>
            <span class="badge info">Last: {{ syncAuditReport.lastChangeAt || 'n/a' }}</span>
            <span class="badge" *ngIf="syncAuditReport.currentRow.version !== null">
              Version: {{ syncAuditReport.currentRow.version }}
            </span>
            <span class="badge" *ngIf="syncAuditReport.currentRow.tableName">
              Table: {{ syncAuditReport.currentRow.tableName }}
            </span>
            <span class="badge info" *ngIf="syncAuditReport.signals.timelineFiltered">
              Timeline Filtered: {{ syncAuditReport.visibleTimelineChanges }}/{{ syncAuditReport.totalChanges }}
            </span>
          </div>

          <div class="result-summary" *ngIf="syncAuditReport.machines.length > 0">
            <span class="badge" *ngFor="let machine of syncAuditReport.machines">
              Machine: {{ machine }}
            </span>
          </div>

          <div class="details-section" *ngIf="syncAuditReport.machineSummaries.length > 0">
            <h4>Machine Summary</h4>
            <div class="details-list">
              <table>
                <thead>
                  <tr>
                    <th>Machine ID</th>
                    <th>Machine Name</th>
                    <th>Changes</th>
                    <th>First Change</th>
                    <th>Last Change</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let machine of syncAuditReport.machineSummaries">
                    <td>{{ machine.machineId || 'n/a' }}</td>
                    <td>{{ machine.machineName || 'n/a' }}</td>
                    <td>{{ machine.changeCount }}</td>
                    <td>{{ machine.firstChangeAt || 'n/a' }}</td>
                    <td>{{ machine.lastChangeAt || 'n/a' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="result-summary">
            <span class="badge warning" *ngIf="syncAuditReport.signals.multipleCreates">Multiple Creates</span>
            <span class="badge warning" *ngIf="syncAuditReport.signals.deleteThenRecreate">Delete Then Recreate</span>
            <span class="badge warning" *ngIf="syncAuditReport.signals.relationshipDetachDetected">Relationship Detach</span>
            <span class="badge warning" *ngIf="syncAuditReport.signals.currentCreatedAfterHistory">Created After History</span>
            <span class="badge warning" *ngIf="syncAuditReport.signals.identicalCreatedModified">Created Equals Modified</span>
          </div>

          <div class="warning-list" *ngIf="syncAuditReport.warnings.length > 0">
            <div class="warning-item" *ngFor="let warning of syncAuditReport.warnings">
              {{ warning }}
            </div>
          </div>

          <div class="details-section" *ngIf="syncAuditReport.relatedEntities.length > 0">
            <h4>Related Entities</h4>
            <div class="details-list">
              <table>
                <thead>
                  <tr>
                    <th>Relation</th>
                    <th>Entity Type</th>
                    <th>Entity ID</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let related of syncAuditReport.relatedEntities">
                    <td>{{ related.relation }}</td>
                    <td>{{ related.entityType }}</td>
                    <td>{{ related.entityId }}</td>
                    <td>
                      <button class="toggle-btn" (click)="selectedAuditEntityType = related.entityType; inspectRecentSyncAuditEntity(related.entityId)">
                        Open
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="details-section">
            <button class="toggle-btn" (click)="toggleSection('syncAuditCurrentRow')">
              {{ expandedSections['syncAuditCurrentRow'] ? 'Hide' : 'Show' }} Current Row Snapshot
            </button>
            <div class="details-list" *ngIf="expandedSections['syncAuditCurrentRow']">
              <pre class="json-block">{{ syncAuditReport.currentRow.rawRow | json }}</pre>
            </div>
          </div>

          <div class="details-section">
            <button class="toggle-btn" (click)="toggleSection('syncAuditTimeline')">
              {{ expandedSections['syncAuditTimeline'] ? 'Hide' : 'Show' }} Timeline
              ({{ syncAuditReport.timeline.length }})
            </button>
            <div class="details-list" *ngIf="expandedSections['syncAuditTimeline']">
              <table>
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Type</th>
                    <th>Field</th>
                    <th>Relationship</th>
                    <th>Machine</th>
                    <th>Old Value</th>
                    <th>New Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let change of syncAuditReport.timeline">
                    <td>{{ change.timestamp || 'n/a' }}</td>
                    <td>{{ change.changeType || 'n/a' }}</td>
                    <td>{{ change.fieldName || 'n/a' }}</td>
                    <td>{{ change.relationshipType || '-' }}</td>
                    <td>{{ change.originMachineId || 'n/a' }}</td>
                    <td><pre class="cell-pre">{{ change.oldValue || 'null' }}</pre></td>
                    <td><pre class="cell-pre">{{ change.newValue || 'null' }}</pre></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    .admin-section { background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .admin-section h3 { color: #333; margin-top: 0; margin-bottom: 10px; }
    .description { color: #666; font-size: 14px; margin-bottom: 15px; line-height: 1.5; }
    .button-group { display: flex; gap: 10px; margin-bottom: 15px; }
    .button-group label { display: flex; align-items: center; font-size: 14px; color: #555; }
    button { padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; transition: background-color 0.2s; }
    button:disabled { opacity: 0.6; cursor: not-allowed; }
    button:not(.action-btn):not(.toggle-btn):not(.danger-btn) { background-color: #6c757d; color: white; }
    button:not(.action-btn):not(.toggle-btn):not(.danger-btn):hover:not(:disabled) { background-color: #5a6268; }
    .action-btn { background-color: #007bff; color: white; }
    .action-btn:hover:not(:disabled) { background-color: #0056b3; }
    .toggle-btn { background-color: #e9ecef; color: #333; padding: 8px 15px; font-size: 13px; }
    .toggle-btn:hover { background-color: #dee2e6; }
    .danger-btn { background-color: #dc3545; color: white; }
    .danger-btn:hover:not(:disabled) { background-color: #c82333; }
    .error { background-color: #f8d7da; color: #721c24; padding: 10px 15px; border-radius: 4px; margin-bottom: 15px; }
    .success-msg { background-color: #d4edda; color: #155724; padding: 10px 15px; border-radius: 4px; margin-bottom: 15px; }
    .result { background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin-top: 10px; }
    .result-summary { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 15px; }
    .badge { display: inline-block; padding: 5px 12px; border-radius: 20px; font-size: 13px; background-color: #e9ecef; color: #333; }
    .badge.success { background-color: #d4edda; color: #155724; }
    .badge.warning { background-color: #fff3cd; color: #856404; }
    .badge.info { background-color: #cce5ff; color: #004085; }
    .details-section { margin-top: 15px; }
    .details-list { margin-top: 10px; max-height: 400px; overflow-y: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    table th, table td { text-align: left; padding: 8px 12px; border-bottom: 1px solid #ddd; }
    table th { background-color: #f1f3f4; font-weight: 600; position: sticky; top: 0; }
    table tr:hover { background-color: #f8f9fa; }
    table td { word-break: break-word; }
    .sub-divider { border: none; border-top: 1px solid #e9ecef; margin: 20px 0; }
    .sub-section { margin-bottom: 10px; }
    .sub-section h4 { color: #495057; margin-top: 0; margin-bottom: 8px; font-size: 15px; }
    .sync-section { border-left: 4px solid #007bff; }
    .backlog-section { border-left: 4px solid #fd7e14; }
    .sync-audit-section { border-left: 4px solid #17a2b8; }
    .input-field { padding: 8px 12px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px; }
    .input-small { width: 70px; }
    .audit-controls { flex-wrap: wrap; align-items: center; }
    .warning-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 15px; }
    .warning-item { background-color: #fff3cd; color: #856404; border-radius: 4px; padding: 10px 12px; }
    .json-block, .cell-pre { margin: 0; white-space: pre-wrap; word-break: break-word; font-family: Consolas, 'Courier New', monospace; font-size: 12px; }
    .json-block { padding: 12px; background-color: #fff; border: 1px solid #dee2e6; border-radius: 4px; }
    code { background-color: #e9ecef; padding: 2px 6px; border-radius: 3px; font-size: 13px; }
  `]
})
export class AdminSyncComponent implements OnInit {
  loading = {
    pwaSync: false,
    syncQueue: false,
    syncAction: false,
    backlog: false,
    syncAuditTypes: false,
    syncAuditRecent: false,
    syncAuditEntity: false,
    syncAuditCompare: false,
    syncAuditExport: false,
    syncAuditReconstruct: false,
    syncAuditIncidentExport: false
  };

  errors = {
    pwaSync: '',
    syncQueue: '',
    syncAudit: '',
    backlog: ''
  };

  syncQueueStatus: SyncQueueStatus | null = null;
  backlogResult: PendingBacklogBreakdown | null = null;
  backlogMachineId: string = '';
  backlogLimit: number = 30;
  syncAuditTypes: SyncAuditTypeSummary[] = [];
  recentSyncAuditEntities: SyncAuditRecentEntity[] = [];
  syncAuditReport: SyncAuditEntityReport | null = null;
  syncAuditCompareReport: SyncAuditMachineCompareReport | null = null;
  syncAuditReconstruction: SyncAuditReconstruction | null = null;
  syncActionMessage: string = '';
  pwaSyncMessage: string = '';

  clearOldDays: number = 30;
  markSyncedMachineId: string = '';
  selectedAuditEntityType: string = '';
  auditEntityIdInput: string = '';
  auditRecentLimit: number = 25;
  auditTimelineLimit: number = 200;
  auditMachineIdFilter: string = '';
  auditFieldNameFilter: string = '';
  auditChangeTypeFilter: string = '';
  auditFromFilter: string = '';
  auditToFilter: string = '';
  auditCompareLeftMachineId: string = '';
  auditCompareRightMachineId: string = '';
  auditCompareLimit: number = 100;
  auditReconstructAsOf: string = '';

  expandedSections: { [key: string]: boolean } = {
    entityBreakdown: false,
    syncAuditTimeline: false,
    syncAuditCurrentRow: false,
    syncAuditReconstruction: false
  };

  constructor(
    private adminService: AdminFunctionalitiesService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadSyncAuditTypes();
    this.route.queryParamMap.subscribe(params => {
      const auditEntityType = params.get('auditEntityType');
      const auditSection = params.get('auditSection');

      if (auditEntityType) {
        this.selectedAuditEntityType = auditEntityType;
        this.loadRecentSyncAuditEntities();
      }

      if (auditSection === 'sync-audit') {
        setTimeout(() => {
          const element = document.querySelector('.sync-audit-section');
          element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 0);
      }
    });
  }

  toggleSection(section: string) {
    this.expandedSections[section] = !this.expandedSections[section];
  }

  getEntityBreakdownEntries(): [string, number][] {
    if (!this.syncQueueStatus?.entityBreakdown) return [];
    return Object.entries(this.syncQueueStatus.entityBreakdown);
  }

  // ==================== PWA Sync ====================

  syncPwaData(target: 'all' | 'areas' | 'map' | 'categories' | 'fieldlisttypes' | 'inventorytypes' | 'locations' | 'lotopoints' | 'sdschemicals') {
    const labels: Record<typeof target, string> = {
      all: 'all PWA work-request data',
      areas: 'PWA work areas and shape links',
      map: 'the PWA work-area map image',
      categories: 'PWA work categories',
      fieldlisttypes: 'PWA field list types',
      inventorytypes: 'PWA inventory types',
      locations: 'PWA locations',
      lotopoints: 'PWA LOTO points',
      sdschemicals: 'PWA SDS chemicals'
    };

    if (!confirm(`Queue a publish for ${labels[target]}?`)) return;

    this.loading.pwaSync = true;
    this.errors.pwaSync = '';
    this.pwaSyncMessage = '';

    this.adminService.publishPwaData(target).subscribe({
      next: (response) => {
        this.pwaSyncMessage = response.message || `Queued PWA sync for ${target}`;
        this.loading.pwaSync = false;
      },
      error: (error) => {
        this.errors.pwaSync = error.error?.message || error.message || 'Failed to queue PWA sync';
        this.loading.pwaSync = false;
      }
    });
  }

  // ==================== Sync Queue ====================

  loadSyncQueueStatus() {
    this.loading.syncQueue = true;
    this.errors.syncQueue = '';
    this.syncActionMessage = '';

    this.adminService.getSyncQueueStatus().subscribe({
      next: (response) => {
        this.syncQueueStatus = response.responseData;
        this.loading.syncQueue = false;
      },
      error: (error) => {
        this.errors.syncQueue = error.error?.message || error.message || 'Failed to load sync queue status';
        this.loading.syncQueue = false;
      }
    });
  }

  loadPendingBreakdown() {
    const machineId = this.backlogMachineId.trim();
    if (!machineId) return;

    this.loading.backlog = true;
    this.errors.backlog = '';
    this.backlogResult = null;

    this.adminService.getPendingBreakdown(machineId, this.backlogLimit).subscribe({
      next: (response) => {
        this.backlogResult = response.responseData;
        this.loading.backlog = false;
      },
      error: (error) => {
        this.errors.backlog = error.error?.message || error.message || 'Failed to load backlog breakdown';
        this.loading.backlog = false;
      }
    });
  }

  markAllSyncedToServer() {
    if (!confirm('Mark ALL changes as synced to SERVER? This means the server will not receive these changes.')) return;

    this.loading.syncAction = true;
    this.syncActionMessage = '';
    this.errors.syncQueue = '';

    this.adminService.markAllSyncedToServer().subscribe({
      next: (response) => {
        this.syncActionMessage = response.message || 'Done';
        this.loading.syncAction = false;
        this.loadSyncQueueStatus();
      },
      error: (error) => {
        this.errors.syncQueue = error.error?.message || error.message || 'Failed';
        this.loading.syncAction = false;
      }
    });
  }

  markAllSyncedToMachine() {
    if (!this.markSyncedMachineId.trim()) return;
    if (!confirm(`Mark ALL changes as synced to "${this.markSyncedMachineId}"?`)) return;

    this.loading.syncAction = true;
    this.syncActionMessage = '';
    this.errors.syncQueue = '';

    this.adminService.markAllSyncedToMachine(this.markSyncedMachineId.trim()).subscribe({
      next: (response) => {
        this.syncActionMessage = response.message || 'Done';
        this.loading.syncAction = false;
        this.loadSyncQueueStatus();
      },
      error: (error) => {
        this.errors.syncQueue = error.error?.message || error.message || 'Failed';
        this.loading.syncAction = false;
      }
    });
  }

  clearOldChanges() {
    if (!confirm(`Delete all sync changes older than ${this.clearOldDays} days?`)) return;

    this.loading.syncAction = true;
    this.syncActionMessage = '';
    this.errors.syncQueue = '';

    this.adminService.clearOldChanges(this.clearOldDays).subscribe({
      next: (response) => {
        this.syncActionMessage = response.message || 'Done';
        this.loading.syncAction = false;
        this.loadSyncQueueStatus();
      },
      error: (error) => {
        this.errors.syncQueue = error.error?.message || error.message || 'Failed';
        this.loading.syncAction = false;
      }
    });
  }

  clearAllChanges() {
    if (!confirm('DELETE ALL sync changes? This cannot be undone. All machines will need a fresh bulk sync.')) return;

    this.loading.syncAction = true;
    this.syncActionMessage = '';
    this.errors.syncQueue = '';

    this.adminService.clearAllChanges().subscribe({
      next: (response) => {
        this.syncActionMessage = response.message || 'Done';
        this.loading.syncAction = false;
        this.loadSyncQueueStatus();
      },
      error: (error) => {
        this.errors.syncQueue = error.error?.message || error.message || 'Failed';
        this.loading.syncAction = false;
      }
    });
  }

  // ==================== Sync Audit ====================

  loadSyncAuditTypes() {
    this.loading.syncAuditTypes = true;
    this.errors.syncAudit = '';

    this.adminService.getSyncAuditTypes().subscribe({
      next: (response) => {
        this.syncAuditTypes = response.responseData || [];
        if (!this.selectedAuditEntityType && this.syncAuditTypes.length > 0) {
          this.selectedAuditEntityType = this.syncAuditTypes[0].entityType;
          this.loadRecentSyncAuditEntities();
        }
        this.loading.syncAuditTypes = false;
      },
      error: (error) => {
        this.errors.syncAudit = error.error?.message || error.message || 'Failed to load sync audit types';
        this.loading.syncAuditTypes = false;
      }
    });
  }

  loadRecentSyncAuditEntities() {
    if (!this.selectedAuditEntityType) return;

    this.loading.syncAuditRecent = true;
    this.errors.syncAudit = '';

    this.adminService.getRecentSyncAuditEntities(
      this.selectedAuditEntityType,
      this.auditRecentLimit,
      this.getSyncAuditFilters()
    ).subscribe({
      next: (response) => {
        this.recentSyncAuditEntities = response.responseData || [];
        this.loading.syncAuditRecent = false;
      },
      error: (error) => {
        this.errors.syncAudit = error.error?.message || error.message || 'Failed to load recent sync-audited entities';
        this.loading.syncAuditRecent = false;
      }
    });
  }

  inspectRecentSyncAuditEntity(entityId: number) {
    this.auditEntityIdInput = entityId.toString();
    this.loadSyncAuditEntityReport();
  }

  loadSyncAuditEntityReport() {
    const entityId = Number(this.auditEntityIdInput);
    if (!this.selectedAuditEntityType || !Number.isFinite(entityId) || entityId <= 0) {
      this.errors.syncAudit = 'Select an entity type and enter a valid numeric entity ID.';
      return;
    }

    this.loading.syncAuditEntity = true;
    this.errors.syncAudit = '';
    this.syncAuditReport = null;

    this.adminService.getSyncAuditEntityReport(
      this.selectedAuditEntityType,
      entityId,
      this.auditTimelineLimit,
      this.getSyncAuditFilters()
    ).subscribe({
      next: (response) => {
        this.syncAuditReport = response.responseData;
        this.expandedSections['syncAuditTimeline'] = false;
        this.expandedSections['syncAuditCurrentRow'] = false;
        this.loading.syncAuditEntity = false;
      },
      error: (error) => {
        this.errors.syncAudit = error.error?.message || error.message || 'Failed to load sync audit report';
        this.loading.syncAuditEntity = false;
      }
    });
  }

  exportSyncAuditEntityReport() {
    const entityId = Number(this.auditEntityIdInput);
    if (!this.selectedAuditEntityType || !Number.isFinite(entityId) || entityId <= 0) {
      this.errors.syncAudit = 'Select an entity type and enter a valid numeric entity ID before exporting.';
      return;
    }

    this.loading.syncAuditExport = true;
    this.errors.syncAudit = '';

    this.adminService.exportSyncAuditEntityReport(
      this.selectedAuditEntityType,
      entityId,
      this.auditTimelineLimit,
      this.getSyncAuditFilters()
    ).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `sync-audit-${this.selectedAuditEntityType}-${entityId}.json`;
        anchor.click();
        window.URL.revokeObjectURL(url);
        this.loading.syncAuditExport = false;
      },
      error: (error) => {
        this.errors.syncAudit = error.error?.message || error.message || 'Failed to export sync audit report';
        this.loading.syncAuditExport = false;
      }
    });
  }

  exportSyncAuditIncidentReport() {
    const entityId = Number(this.auditEntityIdInput);
    if (!this.selectedAuditEntityType || !Number.isFinite(entityId) || entityId <= 0) {
      this.errors.syncAudit = 'Select an entity type and enter a valid numeric entity ID before exporting an incident report.';
      return;
    }

    this.loading.syncAuditIncidentExport = true;
    this.errors.syncAudit = '';

    this.adminService.exportSyncAuditIncidentReport(
      this.selectedAuditEntityType,
      entityId,
      this.auditTimelineLimit,
      this.getSyncAuditFilters(),
      this.auditCompareLeftMachineId,
      this.auditCompareRightMachineId,
      this.auditCompareLimit,
      this.auditReconstructAsOf
    ).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `sync-incident-${this.selectedAuditEntityType}-${entityId}.json`;
        anchor.click();
        window.URL.revokeObjectURL(url);
        this.loading.syncAuditIncidentExport = false;
      },
      error: (error) => {
        this.errors.syncAudit = error.error?.message || error.message || 'Failed to export incident report';
        this.loading.syncAuditIncidentExport = false;
      }
    });
  }

  compareSyncAuditMachines() {
    if (!this.selectedAuditEntityType || !this.auditCompareLeftMachineId.trim() || !this.auditCompareRightMachineId.trim()) {
      this.errors.syncAudit = 'Select an entity type and enter both machine IDs to compare.';
      return;
    }

    this.loading.syncAuditCompare = true;
    this.errors.syncAudit = '';
    this.syncAuditCompareReport = null;

    this.adminService.compareSyncAuditMachines(
      this.selectedAuditEntityType,
      this.auditCompareLeftMachineId.trim(),
      this.auditCompareRightMachineId.trim(),
      this.auditCompareLimit,
      this.getSyncAuditFilters()
    ).subscribe({
      next: (response) => {
        this.syncAuditCompareReport = response.responseData;
        this.loading.syncAuditCompare = false;
      },
      error: (error) => {
        this.errors.syncAudit = error.error?.message || error.message || 'Failed to compare machines';
        this.loading.syncAuditCompare = false;
      }
    });
  }

  reconstructSyncAuditEntity() {
    const entityId = Number(this.auditEntityIdInput);
    if (!this.selectedAuditEntityType || !Number.isFinite(entityId) || entityId <= 0 || !this.auditReconstructAsOf.trim()) {
      this.errors.syncAudit = 'Select an entity type, enter an entity ID, and provide an as-of timestamp.';
      return;
    }

    this.loading.syncAuditReconstruct = true;
    this.errors.syncAudit = '';
    this.syncAuditReconstruction = null;

    this.adminService.reconstructSyncAuditEntity(
      this.selectedAuditEntityType,
      entityId,
      this.auditReconstructAsOf.trim()
    ).subscribe({
      next: (response) => {
        this.syncAuditReconstruction = response.responseData;
        this.expandedSections['syncAuditReconstruction'] = false;
        this.loading.syncAuditReconstruct = false;
      },
      error: (error) => {
        this.errors.syncAudit = error.error?.message || error.message || 'Failed to reconstruct entity state';
        this.loading.syncAuditReconstruct = false;
      }
    });
  }

  clearSyncAuditFilters() {
    this.auditMachineIdFilter = '';
    this.auditFieldNameFilter = '';
    this.auditChangeTypeFilter = '';
    this.auditFromFilter = '';
    this.auditToFilter = '';
  }

  getSyncAuditFilters(): SyncAuditFilters {
    return {
      machineId: this.auditMachineIdFilter,
      fieldName: this.auditFieldNameFilter,
      changeType: this.auditChangeTypeFilter,
      from: this.auditFromFilter,
      to: this.auditToFilter
    };
  }
}
