import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
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
  SpListStatus,
  SpProvisionSingleResult
} from '../../services/admin/admin-functionalities.service';

@Component({
  selector: 'app-admin-functionalities',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterMenuComponent, MainLayoutComponent],
  templateUrl: './admin-functionalities.component.html',
  styleUrls: ['./admin-functionalities.component.css']
})
export class AdminFunctionalitiesComponent {
  // Loading states
  loading = {
    fileIntegrity: false,
    fixExtensions: false,
    splitEquipment: false,
    assignAttributes: false,
    counterparts: false,
    syncQueue: false,
    syncAction: false,
    spProvision: false
  };

  // Results
  fileIntegrityResult: FileIntegrityResult | null = null;
  fixExtensionsResult: FixExtensionsResult | null = null;
  splitEquipmentResult: SplitEquipmentResult | null = null;
  assignAttributesResult: AssignAttributesResult | null = null;
  counterpartResult: CounterpartAssociationResult | null = null;
  syncQueueStatus: SyncQueueStatus | null = null;
  syncActionMessage: string = '';
  spListStatuses: SpListStatus[] = [];
  spProvisioningList: string = ''; // currently provisioning this list title

  // Sync queue controls
  clearOldDays: number = 30;
  markSyncedMachineId: string = '';

  // Error messages
  errors = {
    fileIntegrity: '',
    fixExtensions: '',
    splitEquipment: '',
    assignAttributes: '',
    counterparts: '',
    syncQueue: '',
    spProvision: ''
  };

  // Expanded sections for details
  expandedSections: { [key: string]: boolean } = {
    orphanedFiles: false,
    missingFiles: false,
    fixedFiles: false,
    splitEquipment: false,
    linkedPairs: false,
    skippedPoints: false,
    entityBreakdown: false
  };

  constructor(private adminService: AdminFunctionalitiesService) {}

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
}
