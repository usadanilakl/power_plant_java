import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CurrentLotoService } from '../../../services/current-items-services/current-loto.service';
import { RfLotoFormComponent } from './rf-loto-form.component';
import { LotoPaperFormComponent } from '../../loto/loto-paper-form/loto-paper-form.component';
import { RedTagProgressPanelComponent } from '../../../shared/automation/red-tag-progress-panel/red-tag-progress-panel.component';
import { LotoWoLinkComponent } from './loto-wo-link.component';

@Component({
  selector: 'app-loto-permit',
  standalone: true,
  imports: [CommonModule, RfLotoFormComponent, LotoPaperFormComponent, RedTagProgressPanelComponent, LotoWoLinkComponent],
  template: `
    @if(currentLotoService.isPaperViewActive()){
      <app-loto-paper-form></app-loto-paper-form>
    }@else{
      <div class="lp-scroll">
        <app-rf-loto-form></app-rf-loto-form>
        @if (currentLotoService.currentLoto$ | async; as loto) {
          @if (loto.id) { <app-loto-wo-link [lotoId]="loto.id"></app-loto-wo-link> }
        }
      </div>
    }
    <app-red-tag-progress-panel></app-red-tag-progress-panel>
  `,
  styles: [`
    :host { display: block; height: 100%; overflow: hidden; }
    .lp-scroll { height: 100%; overflow-y: auto; }
  `]
})
export class LotoPermitComponent {
  currentLotoService = inject(CurrentLotoService);
}
