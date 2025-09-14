import { Component, inject } from '@angular/core';
import { HotWorkFormComponent } from "./hot-work-form/hot-work-form.component";
import { CurrentHotWorkService } from '../../../services/current-items-services/current-hot-work.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { HotWorkDto } from '../../../models/permits/hot-work.model';

@Component({
  selector: 'app-hot-work',
  imports: [HotWorkFormComponent],
  templateUrl: './hot-work.component.html',
  styleUrl: './hot-work.component.css'
})
export class HotWorkComponent {
  currentHotWorkService = inject(CurrentHotWorkService);
  currentHotWorkSignal = toSignal(this.currentHotWorkService.selectedHotWork$, { initialValue: new HotWorkDto() } );

}
