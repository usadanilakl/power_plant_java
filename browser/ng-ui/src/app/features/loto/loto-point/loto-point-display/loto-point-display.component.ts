import { Component, computed, inject, input } from '@angular/core';
import { LotoPointStateService } from '../loto-point-state.service';
import { LotoPoint } from '../../../../models/permits/loto/loto-point.model';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-loto-point-display',
  imports: [],
  templateUrl: './loto-point-display.component.html',
  styleUrl: './loto-point-display.component.css'
})
export class LotoPointDisplayComponent {

  private lotoPointStateService = inject(LotoPointStateService);

  lotoPointInput = input<LotoPoint>();
  lotoPointFromService = toSignal(this.lotoPointStateService.selectedLotoPoint$, { initialValue: new LotoPoint() });

  lotoPoint = computed(() => this.lotoPointInput()?? this.lotoPointFromService());

}
