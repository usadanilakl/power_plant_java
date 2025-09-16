import { Component, EventEmitter, inject, Input, OnInit, Output, DestroyRef, signal, computed } from '@angular/core';
import { FormContainerDto } from '../../../../models/forms/form-container.model';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrentPrintableFormService } from '../../../../services/forms/current-printable-form.service';
import { FormField } from '../../../../models/ui/form-field.model';


@Component({
  selector: 'app-form-container-properties',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './form-container-properties.component.html',
  styleUrl: './form-container-properties.component.css'
})
export class FormContainerPropertiesComponent implements OnInit {
  @Input() container: FormContainerDto | null = null;
  @Input() availableFields: FormField[] = [];
  @Output() updateContainer = new EventEmitter<FormContainerDto>();
  @Output() deleteContainer = new EventEmitter<number>();

  private propertyChange$ = new Subject<void>();
  private currentPrintableFormService = inject(CurrentPrintableFormService);
  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.propertyChange$
      .pipe(
        debounceTime(700), // Wait for 300ms of inactivity
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        if (this.container) {
          // Emit a new instance to ensure change detection and immutability
          this.submitChanges(new FormContainerDto(this.container));
          console.log('Updated container (debounced):', this.container);
        }
      });
  }

  onPropertyChange(): void {
    this.propertyChange$.next();
  }

  onDelete(): void {
    this.deleteContainer.emit(this.container?.id?? 0);
  }

  getContainerName(): string {
    return this.container?.name?? 'No Name';
  }

  submitChanges(container: FormContainerDto): void {
    if (this.updateContainer.observed) {
      this.updateContainer.emit(container);
    } else {
      this.currentPrintableFormService.updateContainer(container);
    }
  }

  toggleBorder(side: 'Top' | 'Right' | 'Bottom' | 'Left'): void {
    if (!this.container) return;
    const borderSide = `border${side}Width` as keyof CSSStyleDeclaration;
    const style = this.container.style as any;
    const currentWidth = style[borderSide];

    if (currentWidth === '0px' || !currentWidth) {
      style[borderSide] = '1px';
    } else {
      style[borderSide] = '0px';
    }
    this.onPropertyChange();
  }

  isBorderVisible(side: 'Top' | 'Right' | 'Bottom' | 'Left'): boolean {
    if (!this.container) return false;
    const borderSide = `border${side}Width` as keyof CSSStyleDeclaration;
    const width = this.container.style[borderSide];
    return width !== '0px' && !!width;
  }






  onContentTypeChange(): void {
    if (this.container) {
      this.container.content = null;
    }
    this.onPropertyChange();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0] && this.container) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        if (this.container) {
          this.container.content = e.target?.result as string;
          this.onPropertyChange();
        }
      };
      reader.readAsDataURL(file);
    }
  }

  compareFields(f1: FormField, f2: FormField): boolean {
    return f1 && f2 ? f1.name === f2.name : f1 === f2;
  }

}
