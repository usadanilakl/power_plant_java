import { Component, computed, DestroyRef, inject, input, OnInit, output } from '@angular/core';
import { InstrumentStateService } from '../instrument-state.service';
import { Instrument } from '../../../../models/equipment/instrument.model';
import { toSignal } from '@angular/core/rxjs-interop';
import { ButtonConfig, ButtonsComponent } from '../../../../shared/menus/buttons/buttons.component';
import { TableComponent } from "../../../../shared/table/table.component";
import { PopupComponent } from "../../../../shared/menus/popup/popup.component";

@Component({
  selector: 'app-instrument-table',
  imports: [TableComponent, PopupComponent, ButtonsComponent],
  templateUrl: './instrument-table.component.html',
  styleUrl: './instrument-table.component.css'
})
export class InstrumentTableComponent implements OnInit {

  instrumentStateService = inject(InstrumentStateService);
  destroyRef = inject(DestroyRef);

  itemsInput = input<Instrument[]>();
  itemsFromService = toSignal(this.instrumentStateService.allInstruments$, { initialValue: [] });
  items = computed(() => this.itemsInput()?? this.itemsFromService());
  selectedItem = toSignal(this.instrumentStateService.selectedInstrument$, { initialValue: new Instrument() });

  actionPopupClosed = output<void>();

  columns = new Instrument().toTableColumns();
  actionButtons: ButtonConfig[] = [];

  isActionMenuOpen = false;

  constructor() { }

  ngOnInit(): void {
    // Populate items and columns as needed
    // this.actionButtons = [
    //   { name: 'Resubmit', action: () => this.resubmitSelected(), color: 'primary' },
    //   { name: 'Revoke', action: () => this.Revoke(), color: 'accent' },
    //   { name: 'Delete', action: () => this.deleteSelected(), color: 'warn' }
    // ];
  }

  onRowClick({ item }: { item: Instrument, event: MouseEvent}){
    this.instrumentStateService.selectInstrument(item);
    // this.isActionMenuOpen = true;
  }

  closeActionMenu() {
    this.isActionMenuOpen = false;
    this.actionPopupClosed.emit();
  }


}
