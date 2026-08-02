import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AdminFunctionalitiesService,
  SplitEquipmentResult,
  AssignAttributesResult,
  CounterpartAssociationResult
} from '../../../services/admin/admin-functionalities.service';

@Component({
  selector: 'app-admin-loto',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="admin-container">
      <!-- Split Equipment -->
      <div class="admin-section">
        <h3>Split Equipment with Multiple Loto Points</h3>
        <p class="description">
          Separates equipment entries that have multiple loto points into individual equipment entries,
          each with exactly one loto point.
        </p>
        <div class="button-group">
          <button (click)="splitEquipment()" [disabled]="loading.splitEquipment" class="action-btn">
            {{ loading.splitEquipment ? 'Splitting...' : 'Split Equipment' }}
          </button>
        </div>

        <div class="error" *ngIf="errors.splitEquipment">{{ errors.splitEquipment }}</div>

        <div class="result" *ngIf="splitEquipmentResult">
          <div class="result-summary">
            <span class="badge" [class.success]="splitEquipmentResult.success">
              {{ splitEquipmentResult.message }}
            </span>
            <span class="badge">Split Count: {{ splitEquipmentResult.splitCount }}</span>
          </div>

          <div class="details-section" *ngIf="splitEquipmentResult?.splitEquipment?.length && splitEquipmentResult.splitEquipment.length > 0">
            <button class="toggle-btn" (click)="toggleSection('splitEquipment')">
              {{ expandedSections['splitEquipment'] ? 'Hide' : 'Show' }} Split Equipment Details
            </button>
            <div class="details-list" *ngIf="expandedSections['splitEquipment']">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tag Number</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let eq of splitEquipmentResult.splitEquipment">
                    <td>{{ eq.id }}</td>
                    <td>{{ eq.tagNumber }}</td>
                    <td>{{ eq.description }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Assign Equipment Attributes -->
      <div class="admin-section">
        <h3>Assign Equipment Attributes to Loto Points</h3>
        <p class="description">
          Copies Location and Equipment Type from Equipment to their associated Loto Points
          (only for loto points that don't already have these values set).
        </p>
        <div class="button-group">
          <button (click)="assignAttributes()" [disabled]="loading.assignAttributes" class="action-btn">
            {{ loading.assignAttributes ? 'Assigning...' : 'Assign Attributes' }}
          </button>
        </div>

        <div class="error" *ngIf="errors.assignAttributes">{{ errors.assignAttributes }}</div>

        <div class="result" *ngIf="assignAttributesResult">
          <div class="result-summary">
            <span class="badge" [class.success]="assignAttributesResult.success">
              {{ assignAttributesResult.message }}
            </span>
            <span class="badge">Points Updated: {{ assignAttributesResult.pointsUpdated }}</span>
            <span class="badge">Before: {{ assignAttributesResult.pointsWithoutAttributesBefore }}</span>
            <span class="badge">After: {{ assignAttributesResult.pointsWithoutAttributesAfter }}</span>
          </div>
        </div>
      </div>

      <!-- Associate Counterparts -->
      <div class="admin-section">
        <h3>Associate Loto Point Counterparts (U1/U2)</h3>
        <p class="description">
          Links loto points with their counterparts from the other unit.
          Finds points starting with "01" and matches them with corresponding "02" points.
        </p>
        <div class="button-group">
          <button (click)="associateCounterparts(true)" [disabled]="loading.counterparts">
            {{ loading.counterparts ? 'Checking...' : 'Preview (Dry Run)' }}
          </button>
          <button (click)="associateCounterparts(false)" [disabled]="loading.counterparts" class="action-btn">
            {{ loading.counterparts ? 'Linking...' : 'Link Counterparts' }}
          </button>
        </div>

        <div class="error" *ngIf="errors.counterparts">{{ errors.counterparts }}</div>

        <div class="result" *ngIf="counterpartResult">
          <div class="result-summary">
            <span class="badge" [class.info]="counterpartResult.dryRun">
              {{ counterpartResult.dryRun ? 'DRY RUN' : 'EXECUTED' }}
            </span>
            <span class="badge">Processed: {{ counterpartResult.processedCount }}</span>
            <span class="badge success">Linked: {{ counterpartResult.linkedCount }}</span>
            <span class="badge warning" *ngIf="counterpartResult.skippedCount > 0">
              Skipped: {{ counterpartResult.skippedCount }}
            </span>
          </div>

          <!-- Linked Pairs -->
          <div class="details-section" *ngIf="counterpartResult?.linkedPairs?.length && counterpartResult.linkedPairs.length > 0">
            <button class="toggle-btn" (click)="toggleSection('linkedPairs')">
              {{ expandedSections['linkedPairs'] ? 'Hide' : 'Show' }} Linked Pairs
            </button>
            <div class="details-list" *ngIf="expandedSections['linkedPairs']">
              <table>
                <thead>
                  <tr>
                    <th>Unit 1 ID</th>
                    <th>Unit 1 Tag</th>
                    <th>Unit 2 ID</th>
                    <th>Unit 2 Tag</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let pair of counterpartResult.linkedPairs">
                    <td>{{ pair.point1Id }}</td>
                    <td>{{ pair.point1Tag }}</td>
                    <td>{{ pair.point2Id }}</td>
                    <td>{{ pair.point2Tag }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Skipped Points -->
          <div class="details-section" *ngIf="counterpartResult?.skippedPoints?.length && counterpartResult.skippedPoints.length > 0">
            <button class="toggle-btn" (click)="toggleSection('skippedPoints')">
              {{ expandedSections['skippedPoints'] ? 'Hide' : 'Show' }} Skipped Points
            </button>
            <div class="details-list" *ngIf="expandedSections['skippedPoints']">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tag Number</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let point of counterpartResult.skippedPoints">
                    <td>{{ point.id }}</td>
                    <td>{{ point.tagNumber }}</td>
                    <td>{{ point.reason }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- LOTO Management -->
      <div class="admin-section">
        <h3>LOTO Management</h3>

        <!-- Seed Boxes & Locks -->
        <div class="sub-section">
          <h4>Seed Boxes & Locks</h4>
          <p class="description">
            Creates 72 LOTO boxes (with LED strip mappings), lock sets for boxes 1-38,
            and 200 single locks (numbered 200-399). Idempotent — only creates if not already present.
          </p>
          <div class="button-group">
            <button (click)="seedLotoBoxes()" [disabled]="lotoLoading.seed">
              {{ lotoLoading.seed ? 'Seeding...' : 'Seed Boxes & Locks' }}
            </button>
          </div>
          <div class="error" *ngIf="lotoErrors.seed">{{ lotoErrors.seed }}</div>
          <div class="result" *ngIf="lotoMessages.seed">
            <span class="badge success">{{ lotoMessages.seed }}</span>
          </div>
        </div>

        <!-- Reconcile Existing LOTOs -->
        <div class="sub-section">
          <h4>Reconcile LOTOs with Boxes</h4>
          <p class="description">
            Links existing LOTOs (that have a box number from RedTag) to their matching LotoBox entity.
            Sets LED colors based on current permit status. Run after seeding or when LOTOs are out of sync with boxes.
          </p>
          <div class="button-group">
            <button (click)="reconcileLotos()" [disabled]="lotoLoading.reconcile">
              {{ lotoLoading.reconcile ? 'Reconciling...' : 'Reconcile LOTOs' }}
            </button>
          </div>
          <div class="error" *ngIf="lotoErrors.reconcile">{{ lotoErrors.reconcile }}</div>
          <div class="result" *ngIf="lotoMessages.reconcile">
            <span class="badge success">{{ lotoMessages.reconcile }}</span>
          </div>
        </div>

        <!-- Heal LED Strips (one-shot migration) -->
        <div class="sub-section">
          <h4>Heal LED Strips</h4>
          <p class="description">
            One-shot data migration: fix LED strip <code>totalLeds</code> and <code>sequence</code>
            rows to match WLED hardware ([240,237,237] for ESP-1, [245,245,260] for ESP-2).
            Historical seed used 260 for every strip, which made WLED return HTTP 400 on any
            actuation. Idempotent — run once per node after upgrade; safe to run again.
            Does NOT touch box or LOTO state.
          </p>
          <div class="button-group">
            <button (click)="healLedStrips()" [disabled]="lotoLoading.heal">
              {{ lotoLoading.heal ? 'Healing...' : 'Heal LED Strips' }}
            </button>
          </div>
          <div class="error" *ngIf="lotoErrors.heal">{{ lotoErrors.heal }}</div>
          <div class="result" *ngIf="lotoMessages.heal">
            <span class="badge success">{{ lotoMessages.heal }}</span>
          </div>
        </div>

        <!-- Sync to ESP Controllers -->
        <div class="sub-section">
          <h4>Sync All Boxes to ESP</h4>
          <p class="description">
            Pushes current LED colors for all 72 boxes to the physical ESP WLED controllers.
            Requires ESP devices to be online (192.168.190.145, 192.168.190.146).
          </p>
          <div class="button-group">
            <button (click)="syncEspDevices()" [disabled]="lotoLoading.espSync">
              {{ lotoLoading.espSync ? 'Syncing...' : 'Sync to ESP' }}
            </button>
            <button (click)="loadWledQueueStatus()" [disabled]="lotoLoading.queue">
              {{ lotoLoading.queue ? 'Loading...' : 'Check WLED Queue' }}
            </button>
          </div>
          <div class="error" *ngIf="lotoErrors.espSync">{{ lotoErrors.espSync }}</div>
          <div class="result" *ngIf="lotoMessages.espSync">
            <span class="badge success">{{ lotoMessages.espSync }}</span>
          </div>
          <div class="error" *ngIf="lotoErrors.queue">{{ lotoErrors.queue }}</div>
          <div class="result" *ngIf="wledQueueStatus">
            <span class="badge" [class.warning]="wledQueueStatus.pending > 0" [class.success]="wledQueueStatus.pending === 0">
              Pending: {{ wledQueueStatus.pending }}
            </span>
            <span class="badge" [class.warning]="wledQueueStatus.expired > 0" [class.success]="wledQueueStatus.expired === 0">
              Expired: {{ wledQueueStatus.expired }}
            </span>
          </div>
        </div>
      </div>

      <!-- Activate All LOTOs -->
    </div>
  `,
  styles: [`
    .admin-container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    .admin-section { background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .admin-section h3 { color: #333; margin-top: 0; margin-bottom: 10px; }
    .description { color: #666; font-size: 14px; margin-bottom: 15px; line-height: 1.5; }
    .button-group { display: flex; gap: 10px; margin-bottom: 15px; }
    button { padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; transition: background-color 0.2s; }
    button:disabled { opacity: 0.6; cursor: not-allowed; }
    button:not(.action-btn):not(.toggle-btn) { background-color: #6c757d; color: white; }
    button:not(.action-btn):not(.toggle-btn):hover:not(:disabled) { background-color: #5a6268; }
    .action-btn { background-color: #007bff; color: white; }
    .action-btn:hover:not(:disabled) { background-color: #0056b3; }
    .toggle-btn { background-color: #e9ecef; color: #333; padding: 8px 15px; font-size: 13px; }
    .toggle-btn:hover { background-color: #dee2e6; }
    .error { background-color: #f8d7da; color: #721c24; padding: 10px 15px; border-radius: 4px; margin-bottom: 15px; }
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
    .sub-section { margin-bottom: 10px; }
    .sub-section h4 { color: #495057; margin-top: 0; margin-bottom: 8px; font-size: 15px; }
  `]
})
export class AdminLotoComponent {
  loading = {
    splitEquipment: false,
    assignAttributes: false,
    counterparts: false
  };

  errors = {
    splitEquipment: '',
    assignAttributes: '',
    counterparts: ''
  };

  splitEquipmentResult: SplitEquipmentResult | null = null;
  assignAttributesResult: AssignAttributesResult | null = null;
  counterpartResult: CounterpartAssociationResult | null = null;

  lotoLoading = { seed: false, reconcile: false, espSync: false, queue: false, heal: false };
  lotoMessages = { seed: '', reconcile: '', espSync: '', queue: '', heal: '' };
  lotoErrors = { seed: '', reconcile: '', espSync: '', queue: '', heal: '' };
  wledQueueStatus: { pending: number; expired: number } | null = null;

  expandedSections: { [key: string]: boolean } = {
    splitEquipment: false,
    linkedPairs: false,
    skippedPoints: false
  };

  constructor(private adminService: AdminFunctionalitiesService) {}

  toggleSection(section: string) {
    this.expandedSections[section] = !this.expandedSections[section];
  }

  splitEquipment() {
    if (!confirm('This will split all equipment with multiple loto points. Continue?')) {
      return;
    }

    this.loading.splitEquipment = true;
    this.errors.splitEquipment = '';
    this.splitEquipmentResult = null;

    this.adminService.splitEquipmentWithMultipleLotoPoints().subscribe({
      next: (response) => {
        this.splitEquipmentResult = response.responseData;
        this.loading.splitEquipment = false;
      },
      error: (error) => {
        this.errors.splitEquipment = error.error?.message || error.message || 'An error occurred';
        this.loading.splitEquipment = false;
      }
    });
  }

  assignAttributes() {
    if (!confirm('This will assign Location and EqType from Equipment to LotoPoints. Continue?')) {
      return;
    }

    this.loading.assignAttributes = true;
    this.errors.assignAttributes = '';
    this.assignAttributesResult = null;

    this.adminService.assignEquipmentAttributesToLotoPoints().subscribe({
      next: (response) => {
        this.assignAttributesResult = response.responseData;
        this.loading.assignAttributes = false;
      },
      error: (error) => {
        this.errors.assignAttributes = error.error?.message || error.message || 'An error occurred';
        this.loading.assignAttributes = false;
      }
    });
  }

  associateCounterparts(dryRun: boolean = true) {
    if (!dryRun && !confirm('This will link all matching U1/U2 loto point pairs. Continue?')) {
      return;
    }

    this.loading.counterparts = true;
    this.errors.counterparts = '';
    this.counterpartResult = null;

    this.adminService.associateLotoPointCounterparts(dryRun).subscribe({
      next: (response) => {
        this.counterpartResult = response.responseData;
        this.loading.counterparts = false;
      },
      error: (error) => {
        this.errors.counterparts = error.error?.message || error.message || 'An error occurred';
        this.loading.counterparts = false;
      }
    });
  }

  seedLotoBoxes() {
    this.lotoLoading.seed = true;
    this.lotoErrors.seed = '';
    this.lotoMessages.seed = '';

    this.adminService.seedLotoBoxes().subscribe({
      next: (res) => {
        this.lotoMessages.seed = res.message || 'Boxes and locks seeded successfully';
        this.lotoLoading.seed = false;
      },
      error: (err) => {
        this.lotoErrors.seed = err.error?.message || err.message || 'Failed';
        this.lotoLoading.seed = false;
      }
    });
  }

  reconcileLotos() {
    this.lotoLoading.reconcile = true;
    this.lotoErrors.reconcile = '';
    this.lotoMessages.reconcile = '';

    this.adminService.reconcileLotos().subscribe({
      next: (res) => {
        this.lotoMessages.reconcile = res.message || 'Reconciliation complete';
        this.lotoLoading.reconcile = false;
      },
      error: (err) => {
        this.lotoErrors.reconcile = err.error?.message || err.message || 'Failed';
        this.lotoLoading.reconcile = false;
      }
    });
  }

  healLedStrips() {
    this.lotoLoading.heal = true;
    this.lotoErrors.heal = '';
    this.lotoMessages.heal = '';

    this.adminService.healLedStrips().subscribe({
      next: (res) => {
        this.lotoMessages.heal = res.message || 'LED strips healed';
        this.lotoLoading.heal = false;
      },
      error: (err) => {
        this.lotoErrors.heal = err.error?.message || err.message || 'Failed';
        this.lotoLoading.heal = false;
      }
    });
  }

  syncEspDevices() {
    this.lotoLoading.espSync = true;
    this.lotoErrors.espSync = '';
    this.lotoMessages.espSync = '';

    this.adminService.initializeEspDevices().subscribe({
      next: (res) => {
        this.lotoMessages.espSync = res.message || 'ESP devices synced';
        this.lotoLoading.espSync = false;
      },
      error: (err) => {
        this.lotoErrors.espSync = err.error?.message || err.message || 'Failed — are ESP controllers online?';
        this.lotoLoading.espSync = false;
      }
    });
  }

  loadWledQueueStatus() {
    this.lotoLoading.queue = true;
    this.lotoErrors.queue = '';

    this.adminService.getLotoBoxWledQueueStatus().subscribe({
      next: (res) => {
        this.wledQueueStatus = res.responseData;
        this.lotoLoading.queue = false;
      },
      error: (err) => {
        this.lotoErrors.queue = err.error?.message || err.message || 'Failed';
        this.lotoLoading.queue = false;
      }
    });
  }

}
