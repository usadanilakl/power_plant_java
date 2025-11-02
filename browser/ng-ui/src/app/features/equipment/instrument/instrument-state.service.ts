import { inject, Injectable } from "@angular/core";
import { Instrument } from "../../../models/equipment/instrument.model";
import { BaseStateService } from "../../../services/base-state.service";
import { HttpClient } from "@angular/common/http";
import { map, take } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class InstrumentStateService extends BaseStateService<Instrument> {
    private http = inject(HttpClient);
    public allInstruments$ = this.allItems$;
    public selectedInstrument$ = this.selectedItem$;

    constructor() {
        super(Instrument);
        this.loadAllInstruments();
    }

    loadAllInstruments() {
        // Fetch the large dataset from the public folder.
        this.http.get<Partial<Instrument>[]>('data/default-instruments.json').pipe(
            map(instrumentsData => instrumentsData.map(data => new Instrument(data))),
            take(1) // Ensure the subscription is automatically unsubscribed after the first emission.
        ).subscribe({
            next: instruments => {
                this.allItemsSubject.next(instruments);
            },
            error: err => {
                console.error('Failed to load default instruments:', err);
                this.globalMessageService.showMessage('Could not load instrument data.');
            }
        });
    }


    selectInstrument(instrument: Instrument) {
        this.selectItem(instrument);
    }

    getSelectedInstrument(): Instrument | null {
        return this.getSelectedItem();
    }
    submitForm(instrument: Instrument) {
        // Assuming an API call to submit the instrument form
        // For now, we'll just update the status locally
        this.globalMessageService.showMessage('Instrument submitted successfully.');
        
    }
}