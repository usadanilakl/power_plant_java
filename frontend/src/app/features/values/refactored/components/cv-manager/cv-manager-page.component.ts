import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../../environments/environment';
import { CvManagerApiService } from '../../services/cv-manager-api.service';
import { RfCategoryDto, RfValueDto } from '../../models/rf-value.model';
import {
  CategoryWithCountDto,
  DuplicateCategoryDto,
  DuplicateValueDto,
  ValueWithDependenciesDto,
  OrphanValueDto,
  DedupOrphansResultDto
} from '../../models/cv-manager.model';
import { TableComponent } from '../../../../../shared/table/table.component';
import { Column } from '../../../../../models/column.model';
import { RfPopupProjectionComponent } from '../../../../../shared/popup-projection/rf-popup-projection.component';
import { ValueService, ValueReferenceReport } from '../../../../../services/value.service';

type TabType = 'categories' | 'values' | 'zeroEnergy';
type FormMode = 'create' | 'edit';

interface ZeroEnergyHealth {
  sharedRows: number;
  extraCopiesIfUnshared: number;
  orphanRows: number;
  rowsWithUnresolvedPlaceholders: number;
}

@Component({
  selector: 'app-cv-manager-page',
  standalone: true,
  imports: [CommonModule, FormsModule, TableComponent, RfPopupProjectionComponent],
  templateUrl: './cv-manager-page.component.html',
  styleUrl: './cv-manager-page.component.css'
})
export class CvManagerPageComponent implements OnInit {
  private apiService = inject(CvManagerApiService);
  private http = inject(HttpClient);
  /** Reference scan / re-point / gated delete — /ng/values endpoints. */
  private valueService = inject(ValueService);
  private lotoPointsUrl = `${environment.apiUrl}/loto-points`;

  // Tab state
  activeTab = signal<TabType>('categories');

  // Zero Energy health tab
  zeHealth = signal<ZeroEnergyHealth | null>(null);
  zeLoading = signal(false);
  zeMessage = signal<string>('');

  // Data signals
  categories = signal<CategoryWithCountDto[]>([]);
  values = signal<RfValueDto[]>([]);
  selectedCategoryFilter = signal<number | null>(null);

  // Loading states
  isLoading = signal(false);
  errorMessage = signal<string>('');

  // Form dialog state
  isFormOpen = signal(false);
  formMode = signal<FormMode>('create');
  formType = signal<TabType>('categories');

  // Category form
  categoryFormName = signal('');
  categoryFormAlias = signal('');
  editingCategoryId = signal<number | null>(null);

  // Value form
  valueFormName = signal('');
  valueFormAlias = signal('');
  valueFormCategoryId = signal<number | null>(null);
  editingValueId = signal<number | null>(null);

  // Delete dialog state
  isDeleteDialogOpen = signal(false);
  deleteType = signal<TabType>('categories');
  deleteItemId = signal<number | null>(null);
  deleteItemName = signal('');
  deleteTransferId = signal<number | null>(null);
  deleteRequiresTransfer = signal(false);
  valueDependencies = signal<ValueWithDependenciesDto | null>(null);

  // Duplicate resolver state
  isDuplicateDialogOpen = signal(false);
  categoryDuplicates = signal<DuplicateCategoryDto[]>([]);
  valueDuplicates = signal<DuplicateValueDto[]>([]);
  selectedKeepIds = signal<Map<string, number>>(new Map());

  // ── Cross-category orphan dedup state ────────────────────────────────────
  // Discovers and merges Values whose name matches a canonical in a target
  // Category but live outside it (the cause of empty value-select dropdowns
  // when entity FKs point at the wrong-category Value).
  isOrphanDialogOpen = signal(false);
  orphanCategoryAlias = signal<string>('');
  orphans = signal<OrphanValueDto[]>([]);
  orphanScanCompleted = signal(false); // true once a scan has been run for the current alias
  dedupResult = signal<DedupOrphansResultDto | null>(null);
  isOrphanLoading = signal(false);
  orphanError = signal<string>('');

  // Computed filtered values
  filteredValues = computed(() => {
    const filter = this.selectedCategoryFilter();
    const allValues = this.values();
    if (filter === null) return allValues;
    return allValues.filter(v => v.category?.id === filter);
  });

  // Table columns
  categoryColumns: Column[] = [
    { id: 'id', header: 'ID', accessorKey: 'id' },
    { id: 'name', header: 'Name', accessorKey: 'name' },
    { id: 'alias', header: 'Alias', accessorKey: 'alias' },
    {
      id: 'valueCount',
      header: 'Values',
      accessorKey: 'valueCount',
      conditionalStyling: (item: CategoryWithCountDto, _column: Column): { [key: string]: string } =>
        item.valueCount === 0 ? { 'background-color': '#ffcccc' } : {}
    }
  ];

  valueColumns: Column[] = [
    { id: 'id', header: 'ID', accessorKey: 'id' },
    { id: 'name', header: 'Name', accessorKey: 'name' },
    { id: 'alias', header: 'Alias', accessorKey: 'alias' },
    { id: 'category', header: 'Category', accessorKey: 'category.name' },
    // Fed by one aggregate call for the whole list, not a lookup per row.
    { id: 'refCount', header: 'Refs', accessorFn: (item: any) => String(this.referenceCountFor(item.id)) }
  ];

  ngOnInit() {
    this.loadCategories();
    this.loadValues();
  }

  // ==================== TAB NAVIGATION ====================

  setActiveTab(tab: TabType) {
    this.activeTab.set(tab);
    if (tab === 'zeroEnergy' && !this.zeHealth()) {
      this.loadZeHealth();
    }
  }

  // ==================== ZERO ENERGY HEALTH ====================

  loadZeHealth() {
    this.zeLoading.set(true);
    this.zeMessage.set('');
    this.http.get<{ responseData: ZeroEnergyHealth }>(`${this.lotoPointsUrl}/zero-energy/health`)
      .subscribe({
        next: (res) => { this.zeHealth.set(res.responseData); this.zeLoading.set(false); },
        error: (e) => { this.zeMessage.set('Failed to load: ' + (e.error?.message || e.message)); this.zeLoading.set(false); }
      });
  }

  runUnshare() {
    if (!confirm('Give every LOTO point its own copy of its zero-energy row? This is a one-time, safe operation.')) return;
    this.zeLoading.set(true);
    this.zeMessage.set('');
    this.http.post<{ message: string }>(`${this.lotoPointsUrl}/unshare-zero-energy`, {})
      .subscribe({
        next: (res) => { this.zeMessage.set(res.message); this.loadZeHealth(); },
        error: (e) => { this.zeMessage.set('Failed: ' + (e.error?.message || e.message)); this.zeLoading.set(false); }
      });
  }

  runCleanupOrphans() {
    this.zeLoading.set(true);
    this.zeMessage.set('');
    this.http.post<{ message: string }>(`${this.lotoPointsUrl}/zero-energy/cleanup-orphans`, {})
      .subscribe({
        next: (res) => { this.zeMessage.set(res.message); this.loadZeHealth(); },
        error: (e) => { this.zeMessage.set('Failed: ' + (e.error?.message || e.message)); this.zeLoading.set(false); }
      });
  }

  // ==================== DATA LOADING ====================

  loadCategories() {
    this.isLoading.set(true);
    this.apiService.getAllCategories().subscribe({
      next: (data) => {
        this.categories.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Failed to load categories');
        this.isLoading.set(false);
      }
    });
  }

  loadValues() {
    this.isLoading.set(true);
    this.apiService.getAllValues().subscribe({
      next: (data) => {
        this.values.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Failed to load values');
        this.isLoading.set(false);
      }
    });
    this.loadReferenceCounts();
  }

  /**
   * Reference counts for the whole list in one call. Failure is non-fatal — the column falls back
   * to showing 0 rather than blocking the page, since it is informational.
   */
  private loadReferenceCounts() {
    this.valueService.getValueReferenceCounts().subscribe({
      next: response => this.referenceCounts.set(response.responseData ?? {}),
      error: () => this.referenceCounts.set({})
    });
  }

  referenceCountFor(valueId: number): number {
    return this.referenceCounts()[String(valueId)] ?? 0;
  }

  // ==================== CATEGORY CRUD ====================

  openCreateCategoryDialog() {
    this.formType.set('categories');
    this.formMode.set('create');
    this.categoryFormName.set('');
    this.categoryFormAlias.set('');
    this.editingCategoryId.set(null);
    this.errorMessage.set('');
    this.isFormOpen.set(true);
  }

  openEditCategoryDialog(category: CategoryWithCountDto) {
    this.formType.set('categories');
    this.formMode.set('edit');
    this.categoryFormName.set(category.name);
    this.categoryFormAlias.set(category.alias || '');
    this.editingCategoryId.set(category.id);
    this.errorMessage.set('');
    this.isFormOpen.set(true);
  }

  saveCategory() {
    const name = this.categoryFormName();
    const alias = this.categoryFormAlias() || undefined;

    if (!name.trim()) {
      this.errorMessage.set('Category name is required');
      return;
    }

    this.isLoading.set(true);

    if (this.formMode() === 'create') {
      this.apiService.createCategory({ name, alias }).subscribe({
        next: () => {
          this.isFormOpen.set(false);
          this.loadCategories();
        },
        error: (err) => {
          this.errorMessage.set(err.error?.message || 'Failed to create category');
          this.isLoading.set(false);
        }
      });
    } else {
      const id = this.editingCategoryId()!;
      this.apiService.updateCategory(id, { name, alias }).subscribe({
        next: () => {
          this.isFormOpen.set(false);
          this.loadCategories();
          this.loadValues(); // Refresh values to update category names
        },
        error: (err) => {
          this.errorMessage.set(err.error?.message || 'Failed to update category');
          this.isLoading.set(false);
        }
      });
    }
  }

  openDeleteCategoryDialog(category: CategoryWithCountDto) {
    this.deleteType.set('categories');
    this.deleteItemId.set(category.id);
    this.deleteItemName.set(category.name);
    this.deleteTransferId.set(null);
    this.deleteRequiresTransfer.set(category.valueCount > 0);
    this.errorMessage.set('');
    this.isDeleteDialogOpen.set(true);
  }

  confirmDeleteCategory() {
    const id = this.deleteItemId()!;
    const transferTo = this.deleteTransferId();

    if (this.deleteRequiresTransfer() && !transferTo) {
      this.errorMessage.set('Please select a category to transfer values to');
      return;
    }

    this.isLoading.set(true);
    this.apiService.deleteCategory(id, transferTo || undefined).subscribe({
      next: () => {
        this.isDeleteDialogOpen.set(false);
        this.loadCategories();
        this.loadValues();
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Failed to delete category');
        this.isLoading.set(false);
      }
    });
  }

  // ==================== VALUE CRUD ====================

  openCreateValueDialog() {
    this.formType.set('values');
    this.formMode.set('create');
    this.valueFormName.set('');
    this.valueFormAlias.set('');
    this.valueFormCategoryId.set(this.selectedCategoryFilter());
    this.editingValueId.set(null);
    this.errorMessage.set('');
    this.isFormOpen.set(true);
  }

  openEditValueDialog(value: RfValueDto) {
    this.formType.set('values');
    this.formMode.set('edit');
    this.valueFormName.set(value.name);
    this.valueFormAlias.set(value.alias || '');
    this.valueFormCategoryId.set(value.category?.id || null);
    this.editingValueId.set(value.id);
    this.errorMessage.set('');
    this.isFormOpen.set(true);
    this.loadReferences(value.id);
  }

  // ===== References / re-point / gated delete =====

  /** Everything pointing at the value being edited; null while unknown. */
  /** {valueId: count} for the whole values list; missing key = 0. */
  referenceCounts = signal<Record<string, number>>({});
  references = signal<ValueReferenceReport | null>(null);
  referencesLoading = signal(false);
  repointTargetId = signal<number | null>(null);
  refBusy = signal(false);
  refMessage = signal<{ text: string; kind: 'ok' | 'error' } | null>(null);

  referenceCount = computed(() => this.references()?.totalCount ?? null);

  /** Candidate replacements: every other value in the same category. */
  repointTargets = computed(() => {
    const categoryId = this.valueFormCategoryId();
    const editingId = this.editingValueId();
    return this.values().filter(v => v.id !== editingId && (v.category?.id ?? null) === categoryId);
  });

  /**
   * Delete unlocks only once nothing references the value. The server re-checks and answers 409,
   * so this is the affordance, not the safety mechanism.
   */
  canDeleteValue = computed(() =>
    this.formMode() === 'edit' &&
    !this.referencesLoading() &&
    !this.refBusy() &&
    this.references() !== null &&
    this.references()!.totalCount === 0
  );

  canRepoint = computed(() =>
    this.repointTargetId() !== null &&
    this.repointTargetId() !== this.editingValueId() &&
    !this.refBusy() &&
    (this.references()?.totalCount ?? 0) > 0
  );

  private loadReferences(valueId: number) {
    this.references.set(null);
    this.repointTargetId.set(null);
    this.refMessage.set(null);
    this.referencesLoading.set(true);
    this.valueService.getValueReferences(valueId).subscribe({
      next: response => {
        this.references.set(response.responseData);
        this.referencesLoading.set(false);
      },
      error: () => {
        this.referencesLoading.set(false);
        this.refMessage.set({ text: 'Could not load references — delete stays disabled.', kind: 'error' });
      }
    });
  }

  refreshReferences() {
    const id = this.editingValueId();
    if (id !== null) this.loadReferences(id);
  }

  /** Move every reference onto the chosen value, then re-check so Delete can unlock. */
  submitRepoint() {
    const id = this.editingValueId();
    const targetId = this.repointTargetId();
    if (!id || !targetId) return;

    this.refBusy.set(true);
    this.valueService.repointValue(id, targetId).subscribe({
      next: response => {
        this.refBusy.set(false);
        const moved = response.responseData ?? 0;
        this.refMessage.set({ text: `Re-pointed ${moved} reference${moved === 1 ? '' : 's'}.`, kind: 'ok' });
        this.loadReferences(id);
        this.loadValues();
      },
      error: () => {
        this.refBusy.set(false);
        this.refMessage.set({ text: 'Failed to re-point references.', kind: 'error' });
      }
    });
  }

  submitSafeDelete() {
    const id = this.editingValueId();
    if (!id || !this.canDeleteValue()) return;
    if (!confirm(`Delete "${this.valueFormName()}"? Nothing references it.`)) return;

    this.refBusy.set(true);
    this.valueService.deleteValueIfUnreferenced(id).subscribe({
      next: () => {
        this.refBusy.set(false);
        this.isFormOpen.set(false);
        this.loadValues();
      },
      error: (err) => {
        this.refBusy.set(false);
        // 409 = references appeared since the last check; re-sync the list rather than guess.
        this.refMessage.set({
          text: err?.status === 409
            ? 'Value still has references — refreshed the list below.'
            : 'Failed to delete value.',
          kind: 'error'
        });
        this.loadReferences(id);
      }
    });
  }

  saveValue() {
    const name = this.valueFormName();
    const alias = this.valueFormAlias() || undefined;
    const categoryId = this.valueFormCategoryId();

    if (!name.trim()) {
      this.errorMessage.set('Value name is required');
      return;
    }

    this.isLoading.set(true);

    if (this.formMode() === 'create') {
      if (!categoryId) {
        this.errorMessage.set('Please select a category');
        this.isLoading.set(false);
        return;
      }
      this.apiService.createValue({ categoryId, name, alias }).subscribe({
        next: () => {
          this.isFormOpen.set(false);
          this.loadValues();
          this.loadCategories(); // Update value counts
        },
        error: (err) => {
          this.errorMessage.set(err.error?.message || 'Failed to create value');
          this.isLoading.set(false);
        }
      });
    } else {
      const id = this.editingValueId()!;
      this.apiService.updateValue(id, { name, alias }).subscribe({
        next: () => {
          this.isFormOpen.set(false);
          this.loadValues();
        },
        error: (err) => {
          this.errorMessage.set(err.error?.message || 'Failed to update value');
          this.isLoading.set(false);
        }
      });
    }
  }

  openDeleteValueDialog(value: RfValueDto) {
    this.deleteType.set('values');
    this.deleteItemId.set(value.id);
    this.deleteItemName.set(value.name);
    this.deleteTransferId.set(null);
    this.deleteRequiresTransfer.set(false);
    this.valueDependencies.set(null);
    this.errorMessage.set('');

    // Load dependencies
    this.apiService.getValueDependencies(value.id).subscribe({
      next: (deps) => {
        this.valueDependencies.set(deps);
        const total = deps.equipmentCount + deps.fileCount + deps.lotoPointCount;
        this.deleteRequiresTransfer.set(total > 0);
        this.isDeleteDialogOpen.set(true);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Failed to load dependencies');
      }
    });
  }

  confirmDeleteValue() {
    const id = this.deleteItemId()!;
    const transferTo = this.deleteTransferId();

    if (this.deleteRequiresTransfer() && !transferTo) {
      this.errorMessage.set('Please select a value to transfer references to');
      return;
    }

    this.isLoading.set(true);
    this.apiService.deleteValue(id, transferTo || undefined).subscribe({
      next: () => {
        this.isDeleteDialogOpen.set(false);
        this.loadValues();
        this.loadCategories();
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Failed to delete value');
        this.isLoading.set(false);
      }
    });
  }

  // ==================== DUPLICATE RESOLUTION ====================

  findDuplicates() {
    this.isLoading.set(true);
    this.categoryDuplicates.set([]);
    this.valueDuplicates.set([]);
    this.selectedKeepIds.set(new Map());

    // Load both category and value duplicates in parallel
    Promise.all([
      this.apiService.findDuplicateCategories().toPromise(),
      this.apiService.findDuplicateValues().toPromise()
    ]).then(([catDups, valDups]) => {
      this.categoryDuplicates.set(catDups || []);
      this.valueDuplicates.set(valDups || []);
      this.isLoading.set(false);

      if ((catDups?.length || 0) === 0 && (valDups?.length || 0) === 0) {
        this.errorMessage.set('No duplicates found');
        setTimeout(() => this.errorMessage.set(''), 3000);
      } else {
        this.isDuplicateDialogOpen.set(true);
      }
    }).catch((err) => {
      this.errorMessage.set(err.error?.message || 'Failed to find duplicates');
      this.isLoading.set(false);
    });
  }

  selectKeepId(type: 'category' | 'value', groupKey: string, id: number) {
    const map = new Map(this.selectedKeepIds());
    map.set(`${type}-${groupKey}`, id);
    this.selectedKeepIds.set(map);
  }

  getKeepId(type: 'category' | 'value', groupKey: string): number | undefined {
    return this.selectedKeepIds().get(`${type}-${groupKey}`);
  }

  mergeCategoryGroup(group: DuplicateCategoryDto) {
    const keepId = this.getKeepId('category', group.name);
    if (!keepId) {
      this.errorMessage.set('Please select which category to keep');
      return;
    }

    const duplicateIds = group.categories.map(c => c.id);
    this.isLoading.set(true);

    this.apiService.mergeCategories({ keepId, duplicateIds }).subscribe({
      next: () => {
        // Remove this group from the list
        this.categoryDuplicates.update(dups => dups.filter(d => d.name !== group.name));
        this.loadCategories();
        this.loadValues();
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Failed to merge categories');
        this.isLoading.set(false);
      }
    });
  }

  mergeValueGroup(group: DuplicateValueDto) {
    const keepId = this.getKeepId('value', `${group.categoryId}-${group.name}`);
    if (!keepId) {
      this.errorMessage.set('Please select which value to keep');
      return;
    }

    const duplicateIds = group.values.map(v => v.id);
    this.isLoading.set(true);

    this.apiService.mergeValues({ keepId, duplicateIds }).subscribe({
      next: () => {
        // Remove this group from the list
        this.valueDuplicates.update(dups =>
          dups.filter(d => !(d.categoryId === group.categoryId && d.name === group.name))
        );
        this.loadValues();
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Failed to merge values');
        this.isLoading.set(false);
      }
    });
  }

  closeDuplicateDialog() {
    this.isDuplicateDialogOpen.set(false);
  }

  // ==================== TABLE CALLBACKS ====================

  onCategoryClick = (category: CategoryWithCountDto) => {
    this.openEditCategoryDialog(category);
  };

  onValueClick = (value: RfValueDto) => {
    this.openEditValueDialog(value);
  };

  // ==================== HELPERS ====================

  closeForm() {
    this.isFormOpen.set(false);
    this.errorMessage.set('');
  }

  closeDeleteDialog() {
    this.isDeleteDialogOpen.set(false);
    this.errorMessage.set('');
  }

  getFormTitle(): string {
    const mode = this.formMode() === 'create' ? 'Create' : 'Edit';
    const type = this.formType() === 'categories' ? 'Category' : 'Value';
    return `${mode} ${type}`;
  }

  getTransferOptions(): CategoryWithCountDto[] | RfValueDto[] {
    if (this.deleteType() === 'categories') {
      return this.categories().filter(c => c.id !== this.deleteItemId());
    } else {
      const currentValue = this.values().find(v => v.id === this.deleteItemId());
      if (currentValue?.category) {
        return this.values().filter(v =>
          v.id !== this.deleteItemId() &&
          v.category?.id === currentValue.category.id
        );
      }
      return this.values().filter(v => v.id !== this.deleteItemId());
    }
  }

  // ==================== ORPHAN DEDUP ====================

  openOrphanDialog() {
    this.orphanCategoryAlias.set('');
    this.orphans.set([]);
    this.dedupResult.set(null);
    this.orphanScanCompleted.set(false);
    this.orphanError.set('');
    this.isOrphanDialogOpen.set(true);
  }

  closeOrphanDialog() {
    this.isOrphanDialogOpen.set(false);
    this.orphans.set([]);
    this.dedupResult.set(null);
    this.orphanCategoryAlias.set('');
    this.orphanScanCompleted.set(false);
    this.orphanError.set('');
  }

  /** Read-only scan. Populates {@link orphans} sorted by referenceCount desc (backend already sorts). */
  findOrphans() {
    const alias = this.orphanCategoryAlias().trim();
    if (!alias) {
      this.orphanError.set('Pick a category first');
      return;
    }
    this.orphanError.set('');
    this.dedupResult.set(null);
    this.isOrphanLoading.set(true);
    this.apiService.findOrphanValues(alias).subscribe({
      next: (data) => {
        this.orphans.set(data ?? []);
        this.orphanScanCompleted.set(true);
        this.isOrphanLoading.set(false);
      },
      error: (err) => {
        this.orphans.set([]);
        this.orphanScanCompleted.set(true);
        this.orphanError.set(err?.error?.message ?? err?.message ?? 'Failed to find orphans');
        this.isOrphanLoading.set(false);
      }
    });
  }

  /**
   * Run the dedup. `dryRun=true` returns a preview without mutating; the apply
   * path also re-loads the page's Categories/Values lists so the rest of the UI
   * reflects the post-merge state.
   */
  runOrphanDedup(dryRun: boolean) {
    const alias = this.orphanCategoryAlias().trim();
    if (!alias) {
      this.orphanError.set('Pick a category first');
      return;
    }
    if (!dryRun) {
      const refs = this.orphans().reduce((sum, o) => sum + (o.referenceCount || 0), 0);
      const ok = confirm(
        `Apply dedup for "${alias}"?\n\n` +
        `${this.orphans().length} orphan value(s) will be merged into their canonical.\n` +
        `${refs} entity reference(s) will be re-pointed.\n\n` +
        `Continue?`
      );
      if (!ok) return;
    }
    this.orphanError.set('');
    this.isOrphanLoading.set(true);
    this.apiService.dedupOrphans(alias, dryRun).subscribe({
      next: (result) => {
        this.dedupResult.set(result);
        this.isOrphanLoading.set(false);
        if (!dryRun) {
          // Refresh page data so the rest of the UI reflects the merged state.
          this.loadCategories();
          this.loadValues();
          // After applying, the orphan list is stale; clear so the operator
          // can re-scan to confirm zero remaining.
          this.orphans.set([]);
          this.orphanScanCompleted.set(false);
        }
      },
      error: (err) => {
        this.orphanError.set(err?.error?.message ?? err?.message ?? 'Dedup failed');
        this.isOrphanLoading.set(false);
      }
    });
  }

  /** Sum of references the current orphan list would re-point on apply. */
  totalOrphanReferences = computed(() =>
    this.orphans().reduce((sum, o) => sum + (o.referenceCount || 0), 0)
  );

  // ==================== RECOVERY ====================
  //
  // Resurrects Values that are still referenced by an entity FK (file.vendor_id,
  // loto_point.location_id, ...) but were soft-deleted by a prior unsafe merge.
  // Use this if value-select dropdowns appear empty across forms after a dedup.

  isRecovering = signal(false);
  recoveryResult = signal<{ referencedIds: number; resurrected: number; scannedTables: number } | null>(null);

  runRecovery() {
    const ok = confirm(
      'Resurrect soft-deleted Values that are still referenced by entity FKs?\n\n' +
      'This is the recovery action — it flips deleted=false on any Value row that ' +
      'is referenced by file.vendor_id, loto_point.location_id, etc. but was ' +
      'soft-deleted (so dropdowns display empty for those entities).\n\n' +
      'Safe to run multiple times. Continue?'
    );
    if (!ok) return;
    this.isRecovering.set(true);
    this.recoveryResult.set(null);
    this.apiService.recoverDanglingReferences().subscribe({
      next: (result) => {
        this.recoveryResult.set(result);
        this.isRecovering.set(false);
        // Reload the page data so the resurrected values appear.
        this.loadCategories();
        this.loadValues();
      },
      error: (err) => {
        this.isRecovering.set(false);
        this.errorMessage.set(err?.error?.message ?? err?.message ?? 'Recovery failed');
      }
    });
  }
}
