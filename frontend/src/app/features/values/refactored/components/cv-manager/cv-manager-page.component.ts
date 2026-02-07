import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CvManagerApiService } from '../../services/cv-manager-api.service';
import { RfCategoryDto, RfValueDto } from '../../models/rf-value.model';
import {
  CategoryWithCountDto,
  DuplicateCategoryDto,
  DuplicateValueDto,
  ValueWithDependenciesDto
} from '../../models/cv-manager.model';
import { TableComponent } from '../../../../../shared/table/table.component';
import { Column } from '../../../../../models/column.model';
import { RfPopupProjectionComponent } from '../../../../../shared/popup-projection/rf-popup-projection.component';

type TabType = 'categories' | 'values';
type FormMode = 'create' | 'edit';

@Component({
  selector: 'app-cv-manager-page',
  standalone: true,
  imports: [CommonModule, FormsModule, TableComponent, RfPopupProjectionComponent],
  templateUrl: './cv-manager-page.component.html',
  styleUrl: './cv-manager-page.component.css'
})
export class CvManagerPageComponent implements OnInit {
  private apiService = inject(CvManagerApiService);

  // Tab state
  activeTab = signal<TabType>('categories');

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
    { id: 'category', header: 'Category', accessorKey: 'category.name' }
  ];

  ngOnInit() {
    this.loadCategories();
    this.loadValues();
  }

  // ==================== TAB NAVIGATION ====================

  setActiveTab(tab: TabType) {
    this.activeTab.set(tab);
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
}
