import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { RouterMenuComponent } from '../../shared/menu/router-menu/router-menu.component';
import { MainLayoutComponent } from '../../layout/refactored/main-layout.component';
import {
  AdminFunctionalitiesService,
  FileIntegrityResult,
  FixExtensionsResult,
  SplitEquipmentResult,
  AssignAttributesResult,
  CounterpartAssociationResult,
  SyncQueueStatus,
  SyncAuditMachineCompareReport,
  SyncAuditEntityReport,
  SyncAuditFilters,
  SyncAuditReconstruction,
  SyncAuditRecentEntity,
  SyncAuditTypeSummary,
  SpListStatus
} from '../../services/admin/admin-functionalities.service';

@Component({
  selector: 'app-admin-functionalities',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterMenuComponent, MainLayoutComponent],
  templateUrl: './admin-functionalities.component.html',
  styleUrls: ['./admin-functionalities.component.css']
})
export class AdminFunctionalitiesComponent implements OnInit {
  // Loading states
  loading = {
    fileIntegrity: false,
    fixExtensions: false,
    splitEquipment: false,
    assignAttributes: false,
    counterparts: false,
    pwaSync: false,
    syncQueue: false,
    syncAction: false,
    spProvision: false,
    syncAuditTypes: false,
    syncAuditRecent: false,
    syncAuditEntity: false,
    syncAuditCompare: false,
    syncAuditExport: false,
    syncAuditReconstruct: false,
    syncAuditIncidentExport: false
  };

  // Results
  fileIntegrityResult: FileIntegrityResult | null = null;
  fixExtensionsResult: FixExtensionsResult | null = null;
  splitEquipmentResult: SplitEquipmentResult | null = null;
  assignAttributesResult: AssignAttributesResult | null = null;
  counterpartResult: CounterpartAssociationResult | null = null;
  syncQueueStatus: SyncQueueStatus | null = null;
  syncAuditTypes: SyncAuditTypeSummary[] = [];
  recentSyncAuditEntities: SyncAuditRecentEntity[] = [];
  syncAuditReport: SyncAuditEntityReport | null = null;
  syncAuditCompareReport: SyncAuditMachineCompareReport | null = null;
  syncAuditReconstruction: SyncAuditReconstruction | null = null;
  syncActionMessage: string = '';
  pwaSyncMessage: string = '';
  spListStatuses: SpListStatus[] = [];
  spProvisioningList: string = ''; // currently provisioning this list title

  // Sync queue controls
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

  // Error messages
  errors = {
    fileIntegrity: '',
    fixExtensions: '',
    splitEquipment: '',
    assignAttributes: '',
    counterparts: '',
    pwaSync: '',
    syncQueue: '',
    spProvision: '',
    syncAudit: ''
  };

  // Expanded sections for details
  expandedSections: { [key: string]: boolean } = {
    orphanedFiles: false,
    missingFiles: false,
    fixedFiles: false,
    splitEquipment: false,
    linkedPairs: false,
    skippedPoints: false,
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

  // File Integrity Check
  checkFileIntegrity(dryRun: boolean = true) {
    this.loading.fileIntegrity = true;
    this.errors.fileIntegrity = '';
    this.fileIntegrityResult = null;

    this.adminService.restoreFileIntegrity(dryRun).subscribe({
      next: (response) => {
        this.fileIntegrityResult = response.responseData;
        this.loading.fileIntegrity = false;
      },
      error: (error) => {
        this.errors.fileIntegrity = error.error?.message || error.message || 'An error occurred';
        this.loading.fileIntegrity = false;
      }
    });
  }

  // Fix File Extensions
  fixFileExtensions(dryRun: boolean = true) {
    if (!dryRun && !confirm('This will update extensions on all FileObjects based on actual files on disk. Continue?')) {
      return;
    }

    this.loading.fixExtensions = true;
    this.errors.fixExtensions = '';
    this.fixExtensionsResult = null;

    this.adminService.fixFileExtensions(dryRun).subscribe({
      next: (response) => {
        this.fixExtensionsResult = response.responseData;
        this.loading.fixExtensions = false;
      },
      error: (error) => {
        this.errors.fixExtensions = error.error?.message || error.message || 'An error occurred';
        this.loading.fixExtensions = false;
      }
    });
  }

  // Split Equipment
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

  // Assign Equipment Attributes to LotoPoints
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

  // Associate Counterparts
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

  toggleSection(section: string) {
    this.expandedSections[section] = !this.expandedSections[section];
  }

  // ==================== Sync Queue ====================

  getEntityBreakdownEntries(): [string, number][] {
    if (!this.syncQueueStatus?.entityBreakdown) return [];
    return Object.entries(this.syncQueueStatus.entityBreakdown);
  }

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

  // ==================== PWA Sync ====================

  syncPwaData(target: 'all' | 'areas' | 'map' | 'categories') {
    const labels: Record<'all' | 'areas' | 'map' | 'categories', string> = {
      all: 'all PWA work-request data',
      areas: 'PWA work areas and shape links',
      map: 'the PWA work-area map image',
      categories: 'PWA work categories'
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

  // ==================== SharePoint Provisioning ====================

  checkSpListStatuses() {
    this.loading.spProvision = true;
    this.errors.spProvision = '';

    this.adminService.getSharePointListStatuses().subscribe({
      next: (statuses) => {
        this.spListStatuses = statuses;
        this.loading.spProvision = false;
      },
      error: (error) => {
        this.errors.spProvision = error.error?.message || error.message || 'Failed to check list statuses';
        this.loading.spProvision = false;
      }
    });
  }

  provisionSingleList(title: string) {
    this.spProvisioningList = title;
    this.errors.spProvision = '';

    this.adminService.provisionSharePointList(title).subscribe({
      next: (result) => {
        this.spProvisioningList = '';
        if (result.success) {
          const entry = this.spListStatuses.find(s => s.title === title);
          if (entry) entry.exists = true;
        } else {
          this.errors.spProvision = `${title}: ${result.error}`;
        }
      },
      error: (error) => {
        this.spProvisioningList = '';
        this.errors.spProvision = `${title}: ${error.error?.message || error.message || 'Failed'}`;
      }
    });
  }

  provisionAllLists() {
    if (!confirm('Create all missing SharePoint lists? Existing lists will be skipped.')) return;

    this.loading.spProvision = true;
    this.errors.spProvision = '';

    this.adminService.provisionAllSharePointLists().subscribe({
      next: () => {
        this.loading.spProvision = false;
        this.checkSpListStatuses();
      },
      error: (error) => {
        this.errors.spProvision = error.error?.message || error.message || 'Failed to provision lists';
        this.loading.spProvision = false;
      }
    });
  }

  getMissingListCount(): number {
    return this.spListStatuses.filter(s => !s.exists).length;
  }

  getSharePointListUrl(title: string): string {
    return `https://jpowerusa.sharepoint.com/sites/JG/Lists/${encodeURIComponent(title)}`;
  }
}
