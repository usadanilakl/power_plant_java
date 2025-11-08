
import { Component, computed, DestroyRef, inject, input, signal } from '@angular/core';
import { LotoProcessorStateService } from './loto-processor.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { Loto } from '../../../models/permits/loto/loto.model';
import { FormField } from '../../../models/inputs/form-field.model';
import { ReactiveFormComponent } from '../../../shared/forms/reactive-form/reactive-form.component';
import { QrScannerService } from '../../../shared/qr-scanner/qr-scanner.service';
import { take } from 'rxjs';
import { LotoPointDisplayComponent } from "../loto-point/loto-point-display/loto-point-display.component";
import { LotoPointStateService } from '../loto-point/loto-point-state.service';
import { LotoPoint } from '../../../models/permits/loto/loto-point.model';
import { PopupComponent } from "../../../shared/menus/popup/popup.component";

@Component({
  selector: 'app-loto-processor',
  standalone: true,
  imports: [ReactiveFormComponent, LotoPointDisplayComponent, PopupComponent],
  templateUrl: './loto-processor.component.html',
  styleUrl: './loto-processor.component.css'
})
export class LotoProcessorComponent {
  
  qrScannerService = inject(QrScannerService);

  lotoProcessorStateService = inject(LotoProcessorStateService);
  lotoPointStateService = inject(LotoPointStateService);
  destroyRef = inject(DestroyRef);

  entityInput = input<Loto>();
  fieldsInput = input<FormField[]>();

  private entityFromState = toSignal(this.lotoProcessorStateService.selectedLoto$, { initialValue: new Loto() });
  entity = computed(() => this.entityInput() ?? this.entityFromState());

  lotoPoints = computed(() => this.entity()?.lotoPoints?? []);

  pointDetailsPopupOpen = signal(false);

  onPointClicked(lp: LotoPoint){
    this.lotoPointStateService.setSelectedLotoPoint(lp);
    this.openPointDetailsPopup();
  }

  openPointDetailsPopup() {
    this.pointDetailsPopupOpen.set(true);
  }

  closePointDetailsPopup() {
    this.lotoPointStateService.setSelectedLotoPoint(new LotoPoint());
    this.pointDetailsPopupOpen.set(false);
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
