import { Component, DestroyRef, inject } from '@angular/core';
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

  isNewInstrumentPopupOpen = false;
  isSelectInstrumentPopupOpen = false;

  constructor() {
    this.instrumentStateService.openNewInstrumentPopup$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.isNewInstrumentPopupOpen = true;
    });
  }

  openNewInstrumentPopup() {
    this.isNewInstrumentPopupOpen = true;
  }

  closeNewInstrumentPopup() {
    this.isNewInstrumentPopupOpen = false;
  }

  openSelectInstrument() {
    this.isSelectInstrumentPopupOpen = true;
  }

  closeSelectInstrument() {
    this.isSelectInstrumentPopupOpen = false;
  }

  onInstrumentSelected() {
    this.isSelectInstrumentPopupOpen = false;
  }
}
