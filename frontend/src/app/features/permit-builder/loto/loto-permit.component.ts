import { Component, inject } from '@angular/core';
import { CurrentLotoService } from '../../../services/current-items-services/current-loto.service';
import { RfLotoFormComponent } from './rf-loto-form.component';
import { LotoPaperFormComponent } from '../../loto/loto-paper-form/loto-paper-form.component';

@Component({
  selector: 'app-loto-permit',
  standalone: true,
  imports: [RfLotoFormComponent, LotoPaperFormComponent],
  template: `
    @if(currentLotoService.isPaperViewActive()){
      <app-loto-paper-form></app-loto-paper-form>
    }@else{
      <app-rf-loto-form></app-rf-loto-form>
    }
  `,
  styles: [`:host { display: block; height: 100%; overflow: hidden; }`]
})
export class LotoPermitComponent {
  currentLotoService = inject(CurrentLotoService);
}
