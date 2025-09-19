import { computed, DestroyRef, inject, Injectable, signal } from "@angular/core";
import { FormContainerService } from "./form-container.service";
import { FormContainerDto } from "../../models/forms/form-container.model";
import { BehaviorSubject, forkJoin, map, Observable, switchMap, tap } from "rxjs";
import { PrintableFormDto } from "../../models/forms/printable-form.model";
import { PrintableFormService } from "./printable-form.service";
import { takeUntilDestroyed, toSignal } from "@angular/core/rxjs-interop";
import { Form } from "@angular/forms";

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
    allContainers = toSignal(this.formContainers$, { initialValue: [] });

    currentPage = signal<number>(1);
    currentPageContainers = computed<FormContainerDto[]>(() => {
        const page = this.currentPage();
        return this.allContainers().filter(container => (container.pageNumber ?? 1) === page);
    });
    totalPages = computed(() => {
        const containers = this.allContainers();
        if (!containers || containers.length === 0) {
            return 1;
        }
        return containers.reduce((maxPage, container) => {
            const pageNum = container.pageNumber ?? 1;
            return pageNum > maxPage ? pageNum : maxPage;
        }, 1);
    });

  

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

    goToPage(page: number): void {
        this.currentPage.set(page);
        if(page > this.totalPages()) this.createNewContainer(new FormContainerDto());
    }

    copyPage(){
        console.log('Copying page',this.totalPages());
        const newItems = this.currentPageContainers().map(container => (new FormContainerDto({...container, id:undefined})));
        console.log('New items:', newItems);
        this.createNewContainers(newItems,this.totalPages()+1);
    }
    
    deletePage(){
        const containers = this.currentPageContainers();
        if(!containers || containers.length === 0) return;
        this.deleteContainers(containers);
    }

    copyForm(formId: number) {
        this.formService.copyForm(formId).pipe(
            takeUntilDestroyed(this.destroyRef),
            map(response => new PrintableFormDto(response.responseData))
        ).subscribe({
            next: (form: PrintableFormDto) => {
                this.updateFormInArray(form);
            },
            error: (err) => {
                console.error('Error copying form:', err);
                // Here you could implement user-facing error messages
            }
        });
    }


    

    addFormContainer(formId: number, containerId: number): Observable<PrintableFormDto> {
        return this.formService.addContainerToForm(formId, containerId).pipe(
            map(response => new PrintableFormDto(response.responseData))
        );
    }

    addFormContainers(formId: number, containers: FormContainerDto[]): Observable<PrintableFormDto> {
        return this.formService.addAllContainers(formId, containers).pipe(
            map(response => new PrintableFormDto(response.responseData))
        );
    }

  updateZIndexes(reorderedContainers: FormContainerDto[]): void {
    const currentForm = this.formSubject.value;
    if (!currentForm) return;

    const maxZIndex = reorderedContainers.length;
    const updatedContainers = reorderedContainers.map((container, index) => {
      const newZIndex = maxZIndex - index;
      // Create a new object to ensure change detection is triggered
      return {
        ...container,
        style: {
          ...container.style,
          zIndex: newZIndex+''
        }
      };
    });

    // Create a map of updated containers for efficient lookup
    const updatedContainerMap = new Map(updatedContainers.map(c => [c.id, c]));

    // Create a new form object with the updated containers
    const updatedForm: PrintableFormDto = new PrintableFormDto({
      ...currentForm,
      formContainers: currentForm.formContainers.map(c => updatedContainerMap.get(c.id) || c)
    });

    const updatedArray = this.formContainersSubject.value.map(c => new FormContainerDto(updatedContainerMap.get(c.id) || c));
    this.formContainersSubject.next(updatedArray);

  }



    createNewContainer(container: FormContainerDto) {
        const currentContainers = this.formContainersSubject.value;
        const maxZIndex = currentContainers.reduce((max, c) => {
            const zIndex = Number(c.style?.zIndex ?? 0);
            return zIndex > max ? zIndex : max;
        }, 0);

        const containerWithZIndex = new FormContainerDto({
            ...container,
            style: {
                ...container.style,
                zIndex: maxZIndex + 1+''
            },
            pageNumber: this.currentPage()
        });

        console.log('Creating new container with zIndex:', containerWithZIndex);

        this.formContainerService.save(containerWithZIndex).pipe(
            takeUntilDestroyed(this.destroyRef),
            map(response => response.responseData),
            switchMap((newContainer: FormContainerDto) => {
                const formId = this.formSubject.value.id;
                return this.addFormContainer(formId, newContainer.id);
            })
        ).subscribe({
            next: (updatedForm: PrintableFormDto) => {
                this.formSubject.next(updatedForm);
                this.formContainersSubject.next(updatedForm.formContainers);
            },
            error: (err) => {
                console.error('Error creating new container and adding to form:', err);
                // Here you could implement user-facing error messages
            }
        });
    }

    createNewContainers(containers: FormContainerDto[],pageNumber: number = this.currentPage()): void {
        const formId = this.formSubject.value.id;

        const currentContainers = this.formContainersSubject.value;
        let maxZIndex = currentContainers.reduce((max, c) => {
            const zIndex = Number(c.style?.zIndex ?? 0);
            return zIndex > max ? zIndex : max;
        }, 0);

        const containersWithZIndexAndPage = containers.map(container => {
            maxZIndex++;
            return new FormContainerDto({
                ...container,
                style: {
                    ...container.style,
                    zIndex: maxZIndex + ''
                },
                pageNumber: pageNumber?? this.currentPage()
            });
        });

        this.formContainerService.saveAll(containersWithZIndexAndPage).pipe(
            takeUntilDestroyed(this.destroyRef),
            map(response => response.responseData),
            switchMap((createdContainers: FormContainerDto[]) => {
                return this.addFormContainers(formId, createdContainers);
            })
        ).subscribe({
            next: (updatedForm: PrintableFormDto) => {
                this.formSubject.next(updatedForm);
                this.formContainersSubject.next(updatedForm.formContainers);
            },
            error: (err) => {
                console.error('Error creating new containers and adding to form:', err);
                // Here you could implement user-facing error messages
            }
        });
    }
    
    copySelectedContainers(){
        const selectedContainers = this.selectedContainers();
        if (selectedContainers.length === 0) {
            console.error("No containers selected to copy.");
            return;
        }

        const groupMapping = new Map<string, string>();

        const copiedContainers: FormContainerDto[] = selectedContainers.map(container => {
            let newGroupId: string | null = null;
            if (container.groupId) {
                if (!groupMapping.has(container.groupId)) {
                    groupMapping.set(container.groupId, `group-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);
                }
                newGroupId = groupMapping.get(container.groupId)!;
            }

            return new FormContainerDto({
                ...container,
                id: undefined,
                groupId: newGroupId
            });
        });

        this.createNewContainers(copiedContainers);
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

        // Also update the selected container if it is in the selection
        this.selectedContainers.update(currentSelection => 
            currentSelection.map(selectedContainer => 
                selectedContainer.id === container.id ? container : selectedContainer
            )
        );
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

        // Also update the selected containers if they are in the updated list
        this.selectedContainers.update(currentSelection => 
            currentSelection.map(selectedContainer => 
                containerMap.get(selectedContainer.id) || selectedContainer
            )
        );
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

    deleteContainers(containers: FormContainerDto[]) {
        if (!containers || containers.length === 0) {
            console.error("Delete failed: containers array is empty or null.");
            return;
        }
        this.formContainerService.deleteAll(containers.map(c => c.id)).pipe(
            takeUntilDestroyed(this.destroyRef),
            tap(() => {
                this.removeContainersFromArray(containers.map(c => c.id));
            })
        ).subscribe({
            error: (err) => {
                console.error('Error deleting containers:', err);
                // Here you could implement user-facing error messages
            }
        });
    }

    removeContainerFromArray(id: number): void {
        const currentContainers = this.formContainersSubject.value;
        const updatedContainers = currentContainers.filter(c => c.id!== id);
        this.formContainersSubject.next(updatedContainers);
    }

    removeContainersFromArray(ids: number[]): void {
        const currentContainers = this.formContainersSubject.value;
        const updatedContainers = currentContainers.filter(c =>!ids.includes(c.id));
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
        if(container.locked) return;
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
}