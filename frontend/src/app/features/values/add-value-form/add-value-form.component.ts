import { Component, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ValueService } from '../../../services/value.service';
import { SharedDataService } from '../../../services/shared-data.service';
import { CurrentValueService } from '../../../services/current-value.service';
@Component({
  selector: 'app-add-value-form',
  imports: [FormsModule],
  templateUrl: './add-value-form.component.html',
  styleUrl: './add-value-form.component.css',
  standalone: true
})
export class AddValueFormComponent {

  private valueService = inject(ValueService);
  private sharedDataService = inject(SharedDataService);
  private currentValueService = inject(CurrentValueService);

  categoryName = input<string>('');
  submitEvent = output<void>();
  valueName: string = '';

  onSubmit() {
    if (this.valueName) {
      this.currentValueService.updateCategoryWithNewValue(this.categoryName(), this.valueName);
      this.submitEvent.emit();
      this.valueName = '';
    }
  }

}
