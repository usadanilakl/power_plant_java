import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { RouterMenuComponent } from '../../shared/menu/router-menu/router-menu.component';
import { MainLayoutComponent } from '../../layout/refactored/main-layout.component';
import {
  AdminFunctionalitiesService,
  FileIntegrityResult,
  SplitEquipmentResult,
  AssignAttributesResult,
  CounterpartAssociationResult
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
    splitEquipment: false,
    assignAttributes: false,
    counterparts: false
  };

  // Results
  fileIntegrityResult: FileIntegrityResult | null = null;
  splitEquipmentResult: SplitEquipmentResult | null = null;
  assignAttributesResult: AssignAttributesResult | null = null;
  counterpartResult: CounterpartAssociationResult | null = null;

  // Error messages
  errors = {
    fileIntegrity: '',
    splitEquipment: '',
    assignAttributes: '',
    counterparts: ''
  };

  // Expanded sections for details
  expandedSections = {
    orphanedFiles: false,
    missingFiles: false,
    splitEquipment: false,
    linkedPairs: false,
    skippedPoints: false
  };

  constructor(private adminService: AdminFunctionalitiesService) {}

  // 1. File Integrity Check
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

  // 2. Split Equipment
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

  // 3. Assign Equipment Attributes to LotoPoints
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

  // 4. Associate Counterparts
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

  toggleSection(section: keyof typeof this.expandedSections) {
    this.expandedSections[section] = !this.expandedSections[section];
  }
}
