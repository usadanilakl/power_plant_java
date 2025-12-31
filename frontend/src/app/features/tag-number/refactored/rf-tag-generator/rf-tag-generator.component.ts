import { Component, DestroyRef, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TagNumberService } from '../../../../services/tag-number.service';
import { SpringApiResponse } from '../../../../models/api/spring-api-response.model';
import { ClipboardService } from '../../../../services/util/clipboard.service';
import { NamingConventionComponent } from "../../naming-convention/naming-convention.component";
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-rf-tag-generator',
  standalone: true,
  imports: [CommonModule, FormsModule, NamingConventionComponent],
  templateUrl: './rf-tag-generator.component.html',
  styleUrls: ['./rf-tag-generator.component.css']
})
export class RfTagGeneratorComponent {
  private tagNumberService = inject(TagNumberService);
  private clipboardService = inject(ClipboardService);
  private destroyRef = inject(DestroyRef);

  // Form state
  unit = signal<string>('');
  equipmentType = signal<string>('');
  system = signal<string>('');
  generatedTagNumber = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  isLoading = signal<boolean>(false);

  // Outputs
  tagGenerated = output<string>();
  cancelled = output<void>();

  onSubmit() {
    if (!this.unit() || !this.equipmentType() || !this.system()) {
      this.errorMessage.set('Please fill in all fields');
      return;
    }

    const tagNumberData = {
      unit: this.unit(),
      eqType: this.equipmentType(),
      system: this.system()
    };

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.tagNumberService.createTagNumber(tagNumberData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: SpringApiResponse<string>) => {
          this.generatedTagNumber.set(response.responseData);
          this.clipboardService.setClipboardData(response.responseData);
          this.errorMessage.set(null);
          this.isLoading.set(false);
          this.tagGenerated.emit(response.responseData);
        },
        error: (error) => {
          this.errorMessage.set('Error generating tag number. Please try again.');
          this.generatedTagNumber.set(null);
          this.isLoading.set(false);
          console.error('Error:', error);
        }
      });
  }

  onCancel() {
    this.cancelled.emit();
  }

  onUseTagNumber() {
    if (this.generatedTagNumber()) {
      this.tagGenerated.emit(this.generatedTagNumber()!);
    }
  }

  reset() {
    this.unit.set('');
    this.equipmentType.set('');
    this.system.set('');
    this.generatedTagNumber.set(null);
    this.errorMessage.set(null);
    this.isLoading.set(false);
  }
}
