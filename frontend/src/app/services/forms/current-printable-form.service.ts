import { DestroyRef, inject, Injectable } from "@angular/core";
import { FormContainerService } from "./form-container.service";
import { FormContainerDto } from "../../models/forms/form-container.model";
import { BehaviorSubject, map, Observable, switchMap } from "rxjs";
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
            },
            error: (err) => {
                console.error('Error loading form:', err);
                // Here you could implement user-facing error messages
            }
        });
    }

    setCurrentFormWithDto(dto: PrintableFormDto): void {
        this.formSubject.next(dto);
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
    
        const currentContainers = this.formContainersSubject.value;
        const index = currentContainers.findIndex(c => c.id === container.id);
    
        if (index !== -1) {
          const updatedContainers = [...currentContainers];
          updatedContainers[index] = container;
          this.formContainersSubject.next(updatedContainers);
        } else {
          console.warn(`Container with ID ${container.id} not found for update.`);
        }
      }
    
      removeContainer(containerId: number) {
        const currentContainers = this.formContainersSubject.value;
        const updatedContainers = currentContainers.filter(c => c.id !== containerId);
        this.formContainersSubject.next(updatedContainers);
      }
    
      getFormContainers(): FormContainerDto[] {
        return this.formContainersSubject.value;
      }
    
      setFormContainers(containers: FormContainerDto[]) {
        this.formContainersSubject.next(containers);
      }
}