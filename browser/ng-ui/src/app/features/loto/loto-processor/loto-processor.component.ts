
import { Component, computed, DestroyRef, inject, input } from '@angular/core';
import { LotoProcessorStateService } from './loto-processor.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { Loto } from '../../../models/permits/loto.model';
import { FormField } from '../../../models/inputs/form-field.model';
import { ReactiveFormComponent } from '../../../shared/forms/reactive-form/reactive-form.component';
import { QrScannerService } from '../../../shared/qr-scanner/qr-scanner.service';
import { take } from 'rxjs';

@Component({
  selector: 'app-loto-processor',
  standalone: true,
  imports: [ReactiveFormComponent],
  templateUrl: './loto-processor.component.html',
  styleUrl: './loto-processor.component.css'
})
export class LotoProcessorComponent {
  
  qrScannerService = inject(QrScannerService);

  lotoProcessorStateService = inject(LotoProcessorStateService);
  destroyRef = inject(DestroyRef);

  entityInput = input<Loto>();
  fieldsInput = input<FormField[]>();

  private entityFromState = toSignal(this.lotoProcessorStateService.selectedLoto$, { initialValue: new Loto() });
  entity = computed(() => this.entityInput() ?? this.entityFromState());

  private defaultFields = computed(() => this.entity()?.getFormFields() ?? []);
  fields = computed(() => this.fieldsInput() ?? this.defaultFields());

  constructor() { }

  onAnyValueChange(loto: Loto) {
    this.lotoProcessorStateService.saveDraft(loto);
  }

  onSubmit(loto: Loto) {
    this.lotoProcessorStateService.submitNewLoto(loto);
  }

  scanForCamparingTags() {
    this.qrScannerService.openScanner()
      .pipe(take(1)) // Ensure the subscription is automatically cleaned up
      .subscribe(resultString => {
        console.log('Scanned JHA QR Code:', resultString);
        // Here you can implement your custom logic
        // For example, parse the result and load a JHA
        try {
          const data = JSON.parse(resultString);
          if (data.jhaId) {
            alert(`Loading JHA with ID: ${data.jhaId}`);
            // Example: this.jhaStateService.loadJhaById(data.jhaId);
          }
        } catch (e) {
          alert(`Invalid QR Code Data: ${resultString}`);
        }
      });
  }

}
