import { DestroyRef, inject, Injectable, signal } from "@angular/core";
import { FormContainerService } from "./form-container.service";
import { FormContainerDto } from "../../models/forms/form-container.model";
import { BehaviorSubject, forkJoin, map, Observable, switchMap, tap } from "rxjs";
import { PrintableFormDto } from "../../models/forms/printable-form.model";
import { PrintableFormService } from "./printable-form.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Injectable({
  providedIn: 'root'
})
export class CurrentPrintableFormService {
    private formContainerService = inject(FormContainerService);
    private formService = inject(PrintableFormService);
    private destroyRef = inject(DestroyRef);

    private formsSubject = new BehaviorSubject<PrintableFormDto[]>([]);
    allForms$: Observable<PrintableFormDto[]> = this.formsSubject.asObservable();

    private formSubject = new BehaviorSubject<PrintableFormDto>(new PrintableFormDto());
    form$: Observable<PrintableFormDto> = this.formSubject.asObservable();

    private formContainersSubject = new BehaviorSubject<FormContainerDto[]>([]);
    formContainers$: Observable<FormContainerDto[]> = this.formContainersSubject.asObservable();
  

    constructor() {
        this.loadForms();
    }

    loadForms(): void {
        this.formService.getAll().pipe(
            takeUntilDestroyed(this.destroyRef),
            map(forms => forms.responseData)
        ).subscribe({
            next: (forms: PrintableFormDto[]) => {
                this.formsSubject.next(forms);
            },
            error: (err) => {
                console.error('Error loading forms:', err);
                // Here you could implement user-facing error messages
            }
        });
    }

    setCurrentFormById(formId: number): void {
        this.formService.getById(formId).pipe(
            takeUntilDestroyed(this.destroyRef),
            map(form => form.responseData)
        ).subscribe({
            next: (form: PrintableFormDto) => {
                this.formSubject.next(form);
                this.formContainersSubject.next(form.formContainers);
            },
            error: (err) => {
                console.error('Error loading form:', err);
                // Here you could implement user-facing error messages
            }
        });
    }

    setCurrentFormWithDto(dto: PrintableFormDto): void {
        this.formSubject.next(dto);
        this.formContainersSubject.next(dto.formContainers);
    }

    updateForm(formDto: PrintableFormDto): void {
        this.formService.save(formDto).pipe(
            takeUntilDestroyed(this.destroyRef),
            map(response => new PrintableFormDto(response.responseData))
        ).subscribe({
            next: (form: PrintableFormDto) => {
                this.formSubject.next(form);
                this.updateFormInArray(form);
            },
            error: (err) => {
                console.error('Error updating form size:', err);
                // Here you could implement user-facing error messages
            }
        });
    }

    updateFormInArray(form: PrintableFormDto): void {
        const currentForms = this.formsSubject.value;
        const index = currentForms.findIndex(f => f.id === form.id);
        if (index!== -1) {
            const updatedForms = [...currentForms];
            updatedForms[index] = form;
            this.formsSubject.next(updatedForms);
        }else{
            const newForms = [...currentForms, form];
            this.formsSubject.next(newForms);
        }
    }

    addFormContainer(formId: number, containerId: number): Observable<PrintableFormDto> {
        return this.formService.addContainerToForm(formId, containerId).pipe(
            map(response => new PrintableFormDto(response.responseData))
        );
    }

    createNewContainer(container: FormContainerDto) {
        this.formContainerService.save(container).pipe(
            takeUntilDestroyed(this.destroyRef),
            map(response => response.responseData),
            switchMap((newContainer: FormContainerDto) => {
                const formId = this.formSubject.value.id;
                return this.addFormContainer(formId, newContainer.id);
            })
        ).subscribe({
            next: (updatedForm: PrintableFormDto) => {
                this.formContainersSubject.next(updatedForm.formContainers);
            },
            error: (err) => {
                console.error('Error creating new container and adding to form:', err);
                // Here you could implement user-facing error messages
            }
        });
    }
    
      updateContainer(container: FormContainerDto) {
        if (!container?.id) {
          console.error("Update failed: container or container ID is missing.");
          return;
        }
    
        this.formContainerService.save(container).pipe(
            takeUntilDestroyed(this.destroyRef),
            map(response => new FormContainerDto(response.responseData))
        ).subscribe({
            next: (updatedContainer: FormContainerDto) => {
                this.updateContainerInArray(updatedContainer);
            },
            error: (err) => {
                console.error("Error updating container:", err);
                // Here you could implement user-facing error messages
            }
        });
      }

      updateContainerInArray(container: FormContainerDto): void {
        const currentContainers = this.formContainersSubject.value;
        const index = currentContainers.findIndex(c => c.id === container.id);
        if (index!== -1) {
            const updatedContainers = [...currentContainers];
            updatedContainers[index] = container;
            this.formContainersSubject.next(updatedContainers);
        }else{
            const newContainers = [...currentContainers, container];
            this.formContainersSubject.next(newContainers);
        }
      }

    updateContainers(containers: FormContainerDto[]) {
      if (!containers || containers.length === 0) {
        console.error("Update failed: containers array is empty or null.");
        return;
      }
  
      // Assuming you add a `saveAll` method to FormContainerService
      this.formContainerService.saveAll(containers).pipe(
        takeUntilDestroyed(this.destroyRef),
        map(response => response.responseData.map(c => new FormContainerDto(c)))
      ).subscribe({
        next: (updatedContainers: FormContainerDto[]) => {
          this.updateContainersInArray(updatedContainers);
        },
        error: (err) => {
          console.error("Error updating containers:", err);
          // You could add logic here to revert optimistic UI updates if needed
        }
      });
    }

      updateContainersInArray(containers: FormContainerDto[]): void {
        const currentContainers = this.formContainersSubject.value;
        const containerMap = new Map(containers.map(c => [c.id, c]));
    
        const updatedContainers = currentContainers.map(existingContainer => 
            containerMap.get(existingContainer.id) || existingContainer
        );
    
        this.formContainersSubject.next(updatedContainers);
      }
    
      removeContainer(containerId: number) {
        const currentContainers = this.formContainersSubject.value;
        const updatedContainers = currentContainers.filter(c => c.id !== containerId);
        this.formContainersSubject.next(updatedContainers);
      }

    deleteContainer(id: number) {
        this.formContainerService.delete(id).pipe(
            takeUntilDestroyed(this.destroyRef),
            tap(() => {
                this.removeContainerFromArray(id);
            })
        ).subscribe({
            error: (err) => {
                console.error('Error deleting container:', err);
                // Here you could implement user-facing error messages
            }
        });
  
    }

    removeContainerFromArray(id: number): void {
        const currentContainers = this.formContainersSubject.value;
        const updatedContainers = currentContainers.filter(c => c.id!== id);
        this.formContainersSubject.next(updatedContainers);
      }
    
      getFormContainers(): FormContainerDto[] {
        return this.formContainersSubject.value;
      }
    
      setFormContainers(containers: FormContainerDto[]) {
        this.formContainersSubject.next(containers);
      }
  
  // methods to update only the local state
    selectedContainers = signal<FormContainerDto[]>([]);
    hoveredContainer = signal<FormContainerDto | null>(null);
    propertiesOfContainer = signal<FormContainerDto | null>(null);
    updateContainersState(updatedContainers: FormContainerDto[]) {
        const currentContainers = this.formContainersSubject.getValue();
        const updatedMap = new Map(updatedContainers.map(c => [c.id, c]));
        const newContainers = currentContainers.map(c => updatedMap.get(c.id) || c);
        this.formContainersSubject.next(newContainers);
    }

    selectContainer(container: FormContainerDto, event: MouseEvent) {
        const allContainers = this.formContainersSubject.value;
        const groupToSelect = container.groupId 
        ? allContainers.filter(c => c.groupId === container.groupId) 
        : [container];

        this.selectedContainers.update(currentSelection => {
        const isGroupPartiallyOrFullySelected = groupToSelect.some(c => currentSelection.includes(c));

        if (event.ctrlKey) {
            if (isGroupPartiallyOrFullySelected) {
            // Remove the entire group from selection
            const groupIds = new Set(groupToSelect.map(c => c.id));
            return currentSelection.filter(c => !groupIds.has(c.id));
            } else {
            // Add the entire group to the current selection
            return [...currentSelection, ...groupToSelect];
            }
        } else {
            // If not using Ctrl, the new selection is just the clicked group,
            // but only if it's not already the sole selection (to allow dragging).
            const isSoleSelection = currentSelection.length === groupToSelect.length && 
                                    groupToSelect.every(c => currentSelection.includes(c));
            
            if (isSoleSelection) {
            return currentSelection; // Do nothing to enable dragging the group
            }
            
            return groupToSelect;
        }
        });
    }

    isContainerSelected(container: FormContainerDto): boolean {
        return this.selectedContainers().some(c => c.id === container.id);
    }

    hoverContainer(container: FormContainerDto | null) {
        this.hoveredContainer.set(container);
        this.formContainersSubject.next([...this.formContainersSubject.value])
    }

    isContainerHovered(container: FormContainerDto): boolean {
        return this.hoveredContainer()?.id === container.id;
    }

    veiwPropertiesOfContainer(container: FormContainerDto | null, event: MouseEvent){
        this.propertiesOfContainer.set(container);
        event.preventDefault();
        console.log('Properties of container:', this.propertiesOfContainer());
    }
}