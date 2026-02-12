import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { BehaviorSubject, map, Observable, switchMap, tap } from 'rxjs';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormField } from '../../../models/ui/form-field.model';
import { FormContainerDto } from '../models/form-container.model';
import { PrintableFormDto } from '../models/printable-form.model';
import { FormApiService } from './form-api.service';

@Injectable({ providedIn: 'root' })
export class FormStateService {
  private api = inject(FormApiService);
  private destroyRef = inject(DestroyRef);

  currentEntity: any;
  currentEntityFields: FormField[] = [];

  // --- Observables ---
  private formsSubject = new BehaviorSubject<PrintableFormDto[]>([]);
  allForms$: Observable<PrintableFormDto[]> = this.formsSubject.asObservable();

  private formSubject = new BehaviorSubject<PrintableFormDto>(new PrintableFormDto());
  form$: Observable<PrintableFormDto> = this.formSubject.asObservable();

  private formContainersSubject = new BehaviorSubject<FormContainerDto[]>([]);
  formContainers$: Observable<FormContainerDto[]> = this.formContainersSubject.asObservable();
  allContainers = toSignal(this.formContainers$, { initialValue: [] });

  // --- Signals ---
  currentPage = signal<number>(1);
  selectedContainers = signal<FormContainerDto[]>([]);
  hoveredContainer = signal<FormContainerDto | null>(null);
  propertiesOfContainer = signal<FormContainerDto | null>(null);

  // --- Computed ---
  currentPageContainers = computed<FormContainerDto[]>(() => {
    const page = this.currentPage();
    return this.allContainers().filter(c => (c.pageNumber ?? 1) === page);
  });

  totalPages = computed(() => {
    const containers = this.allContainers();
    if (!containers || containers.length === 0) return 1;
    return containers.reduce((max, c) => {
      const p = c.pageNumber ?? 1;
      return p > max ? p : max;
    }, 1);
  });

  constructor() {
    this.loadForms();
  }

  // ==================== Form CRUD ====================

  loadForms(): void {
    this.api.getAllForms().pipe(
      takeUntilDestroyed(this.destroyRef),
      map(r => r.responseData),
    ).subscribe({
      next: forms => this.formsSubject.next(forms),
      error: err => console.error('Error loading forms:', err),
    });
  }

  setCurrentFormById(formId: number): void {
    this.api.getFormById(formId).pipe(
      takeUntilDestroyed(this.destroyRef),
      map(r => r.responseData),
    ).subscribe({
      next: (form: PrintableFormDto) => {
        this.formSubject.next(form);
        this.formContainersSubject.next(form.formContainers);
      },
      error: err => console.error('Error loading form:', err),
    });
  }

  setCurrentFormWithDto(dto: PrintableFormDto): void {
    this.formSubject.next(dto);
    this.formContainersSubject.next(dto.formContainers);
  }

  updateForm(formDto: PrintableFormDto): void {
    this.api.saveForm(formDto).pipe(
      takeUntilDestroyed(this.destroyRef),
      map(r => new PrintableFormDto(r.responseData)),
    ).subscribe({
      next: (form: PrintableFormDto) => {
        this.formSubject.next(form);
        this.updateFormInArray(form);
      },
      error: err => console.error('Error updating form:', err),
    });
  }

  updateFormInArray(form: PrintableFormDto): void {
    const current = this.formsSubject.value;
    const idx = current.findIndex(f => f.id === form.id);
    if (idx !== -1) {
      const updated = [...current];
      updated[idx] = form;
      this.formsSubject.next(updated);
    } else {
      this.formsSubject.next([...current, form]);
    }
  }

  copyForm(formId: number): void {
    this.api.copyForm(formId).pipe(
      takeUntilDestroyed(this.destroyRef),
      map(r => new PrintableFormDto(r.responseData)),
    ).subscribe({
      next: form => this.updateFormInArray(form),
      error: err => console.error('Error copying form:', err),
    });
  }

  // ==================== Page Operations ====================

  goToPage(page: number): void {
    this.currentPage.set(page);
    if (page > this.totalPages()) this.createNewContainer(new FormContainerDto());
  }

  copyPage(): void {
    const newItems = this.currentPageContainers().map(c => new FormContainerDto({ ...c, id: undefined }));
    this.createNewContainers(newItems, this.totalPages() + 1);
  }

  deletePage(): void {
    const containers = this.currentPageContainers();
    if (!containers || containers.length === 0) return;
    this.deleteContainers(containers);
  }

  // ==================== Container CRUD ====================

  createNewContainer(container: FormContainerDto): void {
    const currentContainers = this.formContainersSubject.value;
    const maxZIndex = currentContainers.reduce((max, c) => {
      const z = Number(c.style?.zIndex ?? 0);
      return z > max ? z : max;
    }, 0);

    const containerWithZ = new FormContainerDto({
      ...container,
      style: { ...container.style, zIndex: (maxZIndex + 1) + '' },
      pageNumber: this.currentPage(),
    });

    this.api.saveContainer(containerWithZ).pipe(
      takeUntilDestroyed(this.destroyRef),
      map(r => r.responseData),
      switchMap((saved: FormContainerDto) => {
        const formId = this.formSubject.value.id;
        return this.api.addContainerToForm(formId, saved.id).pipe(
          map(r => new PrintableFormDto(r.responseData)),
        );
      }),
    ).subscribe({
      next: (updatedForm: PrintableFormDto) => {
        this.formSubject.next(updatedForm);
        this.formContainersSubject.next(updatedForm.formContainers);
      },
      error: err => console.error('Error creating container:', err),
    });
  }

  createNewContainers(containers: FormContainerDto[], pageNumber: number = this.currentPage()): void {
    const formId = this.formSubject.value.id;
    const currentContainers = this.formContainersSubject.value;
    let maxZIndex = currentContainers.reduce((max, c) => {
      const z = Number(c.style?.zIndex ?? 0);
      return z > max ? z : max;
    }, 0);

    const prepared = containers.map(c => {
      maxZIndex++;
      return new FormContainerDto({
        ...c,
        style: { ...c.style, zIndex: maxZIndex + '' },
        pageNumber: pageNumber ?? this.currentPage(),
      });
    });

    this.api.saveAllContainers(prepared).pipe(
      takeUntilDestroyed(this.destroyRef),
      map(r => r.responseData),
      switchMap((created: FormContainerDto[]) =>
        this.api.addAllContainers(formId, created).pipe(
          map(r => new PrintableFormDto(r.responseData)),
        ),
      ),
    ).subscribe({
      next: (updatedForm: PrintableFormDto) => {
        this.formSubject.next(updatedForm);
        this.formContainersSubject.next(updatedForm.formContainers);
      },
      error: err => console.error('Error creating containers:', err),
    });
  }

  copySelectedContainers(): void {
    const selected = this.selectedContainers();
    if (selected.length === 0) return;

    const groupMapping = new Map<string, string>();
    const copies = selected.map(c => {
      let newGroupId: string | null = null;
      if (c.groupId) {
        if (!groupMapping.has(c.groupId)) {
          groupMapping.set(c.groupId, `group-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);
        }
        newGroupId = groupMapping.get(c.groupId)!;
      }
      return new FormContainerDto({ ...c, id: undefined, groupId: newGroupId });
    });

    this.createNewContainers(copies);
  }

  updateContainer(container: FormContainerDto): void {
    if (!container?.id) return;

    this.api.saveContainer(container).pipe(
      takeUntilDestroyed(this.destroyRef),
      map(r => new FormContainerDto(r.responseData)),
    ).subscribe({
      next: updated => this.updateContainerInArray(updated),
      error: err => console.error('Error updating container:', err),
    });
  }

  updateContainerInArray(container: FormContainerDto): void {
    const current = this.formContainersSubject.value;
    const idx = current.findIndex(c => c.id === container.id);
    if (idx !== -1) {
      const updated = [...current];
      updated[idx] = container;
      this.formContainersSubject.next(updated);
    } else {
      this.formContainersSubject.next([...current, container]);
    }

    this.selectedContainers.update(sel =>
      sel.map(s => s.id === container.id ? container : s),
    );
  }

  updateContainers(containers: FormContainerDto[]): void {
    if (!containers || containers.length === 0) return;

    this.api.saveAllContainers(containers).pipe(
      takeUntilDestroyed(this.destroyRef),
      map(r => r.responseData.map(c => new FormContainerDto(c))),
    ).subscribe({
      next: updated => this.updateContainersInArray(updated),
      error: err => console.error('Error updating containers:', err),
    });
  }

  updateContainersInArray(containers: FormContainerDto[]): void {
    const map = new Map(containers.map(c => [c.id, c]));
    const updated = this.formContainersSubject.value.map(c => map.get(c.id) || c);
    this.formContainersSubject.next(updated);

    this.selectedContainers.update(sel =>
      sel.map(s => map.get(s.id) || s),
    );
  }

  deleteContainer(id: number): void {
    this.api.deleteContainer(id).pipe(
      takeUntilDestroyed(this.destroyRef),
      tap(() => this.removeContainerFromArray(id)),
    ).subscribe({
      error: err => console.error('Error deleting container:', err),
    });
  }

  deleteContainers(containers: FormContainerDto[]): void {
    if (!containers || containers.length === 0) return;

    this.api.deleteAllContainers(containers.map(c => c.id)).pipe(
      takeUntilDestroyed(this.destroyRef),
      tap(() => this.removeContainersFromArray(containers.map(c => c.id))),
    ).subscribe({
      error: err => console.error('Error deleting containers:', err),
    });
  }

  removeContainerFromArray(id: number): void {
    this.formContainersSubject.next(
      this.formContainersSubject.value.filter(c => c.id !== id),
    );
  }

  removeContainersFromArray(ids: number[]): void {
    this.formContainersSubject.next(
      this.formContainersSubject.value.filter(c => !ids.includes(c.id)),
    );
  }

  // ==================== Z-Index ====================

  updateZIndexes(reorderedContainers: FormContainerDto[]): void {
    const currentForm = this.formSubject.value;
    if (!currentForm) return;

    const maxZ = reorderedContainers.length;
    const updated = reorderedContainers.map((c, i) => ({
      ...c,
      style: { ...c.style, zIndex: (maxZ - i) + '' },
    }));

    const updatedMap = new Map(updated.map(c => [c.id, c]));
    const updatedArray = this.formContainersSubject.value.map(c =>
      new FormContainerDto(updatedMap.get(c.id) || c),
    );
    this.updateContainers(updatedArray);
  }

  // ==================== Selection ====================

  selectContainer(container: FormContainerDto, event: MouseEvent): void {
    if (container.locked) return;

    const all = this.formContainersSubject.value;
    const group = container.groupId
      ? all.filter(c => c.groupId === container.groupId)
      : [container];

    this.selectedContainers.update(current => {
      const isPartiallySelected = group.some(c => current.some(s => s.id === c.id));

      if (event.ctrlKey) {
        if (isPartiallySelected) {
          const groupIds = new Set(group.map(c => c.id));
          return current.filter(c => !groupIds.has(c.id));
        }
        return [...current, ...group];
      }

      const isSoleSelection = current.length === group.length &&
        group.every(c => current.some(s => s.id === c.id));

      if (isSoleSelection) return current;
      return group;
    });
  }

  isContainerSelected(container: FormContainerDto): boolean {
    return this.selectedContainers().some(c => c.id === container.id);
  }

  hoverContainer(container: FormContainerDto | null): void {
    this.hoveredContainer.set(container);
    this.formContainersSubject.next([...this.formContainersSubject.value]);
  }

  isContainerHovered(container: FormContainerDto): boolean {
    return this.hoveredContainer()?.id === container.id;
  }

  // ==================== Local State ====================

  getFormContainers(): FormContainerDto[] {
    return this.formContainersSubject.value;
  }

  setFormContainers(containers: FormContainerDto[]): void {
    this.formContainersSubject.next(containers);
  }

  updateContainersState(updatedContainers: FormContainerDto[]): void {
    const map = new Map(updatedContainers.map(c => [c.id, c]));
    const newContainers = this.formContainersSubject.getValue().map(c => map.get(c.id) || c);
    this.formContainersSubject.next(newContainers);
  }

  // ==================== Bulk Edit ====================

  bulkUpdateContainers(
    target: string,
    containerType: string | undefined,
    propertiesToUpdate: Partial<FormContainerDto>,
  ): void {
    const allContainers = this.allContainers();
    const page = this.currentPage();

    const targets = allContainers.filter(c => {
      switch (target) {
        case 'selected': return this.isContainerSelected(c);
        case 'page': return (c.pageNumber ?? 1) === page;
        case 'type':
          return c.contentType === 'formField' &&
            typeof c.content === 'object' && c.content !== null &&
            (c.content as any).type === containerType;
        default: return false;
      }
    });

    if (targets.length === 0) return;

    const updated = targets.map(c => new FormContainerDto({
      ...c,
      ...propertiesToUpdate,
      style: { ...c.style, ...propertiesToUpdate.style },
      contentStyle: { ...c.contentStyle, ...propertiesToUpdate.contentStyle },
    }));

    this.api.saveAllContainers(updated).pipe(
      takeUntilDestroyed(this.destroyRef),
      map(r => r.responseData.map(c => new FormContainerDto(c))),
    ).subscribe({
      next: (results: FormContainerDto[]) => {
        const resultsMap = new Map(results.map(c => [c.id, c]));
        const newAll = allContainers.map(c => resultsMap.get(c.id) || c);
        this.formContainersSubject.next(newAll);

        const currentForm = this.formSubject.value;
        if (currentForm) {
          this.formSubject.next(new PrintableFormDto({
            ...currentForm,
            formContainers: newAll,
          }));
        }
      },
      error: err => console.error('Error during bulk update:', err),
    });
  }
}
