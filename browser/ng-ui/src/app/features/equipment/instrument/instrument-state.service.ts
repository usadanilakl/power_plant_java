import { DestroyRef, inject, Injectable } from "@angular/core";
import { Instrument } from "../../../models/equipment/instrument.model";
import { BaseStateService } from "../../../services/base-state.service";
import { HttpClient } from "@angular/common/http";
import { map, take } from "rxjs";
import { InstrumentLogEntry } from "../../../models/equipment/instrument-log.model";
import { InstrumentLogEntryApiService } from "./instrument-log/instrument-log-api.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Injectable({
  providedIn: 'root'
})
export class InstrumentStateService extends BaseStateService<Instrument> {
    private http = inject(HttpClient);
    private instrumentLogEntryApiService = inject(InstrumentLogEntryApiService);
    destroyRef = inject(DestroyRef);


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
        this.globalMessageService.showMessage('Function is not implemented yet.');
        
    }
    submitLogForm(instrumentLog: InstrumentLogEntry) {
        this.globalMessageService.showMessage('Submitting log...', 'white', 20000);
      this.instrumentLogEntryApiService.createLog(instrumentLog).pipe(
        takeUntilDestroyed(this.destroyRef),
      ).subscribe({
        next: () => {
          this.globalMessageService.showMessage('Log submitted successfully.', 'green', 2000);
        },
        error: (err) => {
          console.error('Log submission failed!', err);
          this.globalMessageService.showMessage('Failed to submit log. Please try again or contact your supervisor.', 'red', 7000);
        }
      });
    }
}