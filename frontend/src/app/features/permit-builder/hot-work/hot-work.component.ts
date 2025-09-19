import { Component, inject } from '@angular/core';
import { HotWorkFormComponent } from "./hot-work-form/hot-work-form.component";
import { CurrentHotWorkService } from '../../../services/current-items-services/current-hot-work.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { HotWorkDto } from '../../../models/permits/hot-work.model';
import { HotWorkPaperFormComponent } from "./hot-work-paper-form/hot-work-paper-form.component";

@Component({
  selector: 'app-hot-work',
  imports: [HotWorkFormComponent, HotWorkPaperFormComponent],
  templateUrl: './hot-work.component.html',
  styleUrl: './hot-work.component.css'
})
export class HotWorkComponent {
  currentHotWorkService = inject(CurrentHotWorkService);
  currentHotWorkSignal = toSignal(this.currentHotWorkService.selectedHotWork$, { initialValue: new HotWorkDto() } );

}
