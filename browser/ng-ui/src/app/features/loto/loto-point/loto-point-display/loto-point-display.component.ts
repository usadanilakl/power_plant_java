import { Component, computed, inject, input } from '@angular/core';
import { LotoPointStateService } from '../loto-point-state.service';
import { LotoPoint } from '../../../../models/permits/loto/loto-point.model';
import { toSignal } from '@angular/core/rxjs-interop';
import { ButtonConfig, ButtonsComponent } from "../../../../shared/menus/buttons/buttons.component";
import { QrScannerService } from '../../../../shared/qr-scanner/qr-scanner.service';
import { take } from 'rxjs';

@Component({
  selector: 'app-loto-point-display',
  imports: [ButtonsComponent],
  templateUrl: './loto-point-display.component.html',
  styleUrl: './loto-point-display.component.css'
})
export class LotoPointDisplayComponent {
  
  qrScannerService = inject(QrScannerService);


  private lotoPointStateService = inject(LotoPointStateService);

  isFullDetailList = input<boolean>(false);
  lotoPointInput = input<LotoPoint>();
  customButtons = input<ButtonConfig[] | null>(null);
  lotoPointFromService = toSignal(this.lotoPointStateService.selectedLotoPoint$, { initialValue: new LotoPoint() });

  lotoPoint = computed(() => this.lotoPointInput()?? this.lotoPointFromService());
  defaultButtons: ButtonConfig[] = [
    { name: 'Scan To Compare', action: () => this.scanForCamparingTags(), color: 'primary' },
    { name: 'Scan To Complete', action: () => this.scanToComplete(), color:'primary' },
  ];
  buttons = computed(() => this.customButtons()?? this.defaultButtons);
  

  scanForCamparingTags() {
    this.qrScannerService.openScanner()
      .pipe(take(1)) // Ensure the subscription is automatically cleaned up
      .subscribe(resultString => {
        console.log('Scanned Equpment QR Code:', resultString);
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
  scanToComplete() {
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
