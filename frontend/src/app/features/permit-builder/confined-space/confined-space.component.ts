import { Component, inject, OnInit, signal } from '@angular/core';
import { ConfinedSpaceFormComponent } from "./confined-space-form/confined-space-form.component";
import { CurrentConfinedSpaceService } from '../../../services/current-items-services/current-confined-space.service';
import { FormField } from '../../../models/ui/form-field.model';
import { ConfinedSpaceDto } from '../../../models/permits/confined-space.model';
import { toSignal } from '@angular/core/rxjs-interop';
import { ConfinedSpacePaperFormComponent } from "./confined-space-paper-form/confined-space-paper-form.component";

@Component({
  selector: 'app-confined-space',
  imports: [ConfinedSpaceFormComponent, ConfinedSpacePaperFormComponent],
  templateUrl: './confined-space.component.html',
  styleUrl: './confined-space.component.css'
})
export class ConfinedSpaceComponent implements OnInit {

  currentConfinedSpaceService = inject(CurrentConfinedSpaceService);
  currentSpaceSignal = toSignal(this.currentConfinedSpaceService.selectedConfinedSpace$, { initialValue: new ConfinedSpaceDto() });

  ngOnInit(): void {

  }
}
