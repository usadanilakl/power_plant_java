import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { InstrumentLogFormComponent } from "./instrument-log/instrument-log-form/instrument-log-form.component";
import { InstrumentFormComponent } from "./instrument-form/instrument-form.component";
import { InstrumentTableComponent } from "./instrument-table/instrument-table.component";
import { PopupComponent } from "../../../shared/menus/popup/popup.component";
import { InstrumentStateService } from './instrument-state.service';

@Component({
  selector: 'app-instrument',
  imports: [InstrumentLogFormComponent, InstrumentFormComponent, InstrumentTableComponent, PopupComponent],
  templateUrl: './instrument.component.html',
  styleUrl: './instrument.component.css'
})
export class InstrumentComponent {

  private instrumentStateService = inject(InstrumentStateService);
  private destroyRef = inject(DestroyRef);
  selectedInstrument = toSignal(this.instrumentStateService.selectedInstrument$, { initialValue: null });

  mode = signal<'select' | 'log' | 'new'>('select');
  isSelectPopupOpen = false;

  constructor() {
    this.instrumentStateService.openNewInstrumentPopup$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.mode.set('new');
    });
  }

  selectExisting() {
    this.isSelectPopupOpen = true;
  }

  selectNew() {
    this.mode.set('new');
  }

  backToSelect() {
    this.mode.set('select');
    this.instrumentStateService.clearSelection();
  }

  closeSelectPopup() {
    this.isSelectPopupOpen = false;
  }

  onInstrumentSelected() {
    this.isSelectPopupOpen = false;
    this.mode.set('log');
  }
}
