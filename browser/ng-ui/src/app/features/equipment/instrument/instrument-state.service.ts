import { DestroyRef, inject, Injectable } from "@angular/core";
import { Instrument } from "../../../models/equipment/instrument.model";
import { BaseStateService } from "../../../services/base-state.service";
import { HttpClient } from "@angular/common/http";
import { BehaviorSubject, map, of, switchMap, take } from "rxjs";
import { InstrumentLogEntry } from "../../../models/equipment/instrument-log.model";
import { IAttachment } from "../../../models/permits/attachment.model";
import { SubmissionOrchestratorService, SubmissionResult } from "../../../services/submission-orchestrator.service";
import { PwaInstrumentDto } from "../../../services/server-api.service";
import { UserSetupService } from "../../../services/user-setup.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { InstrumentLogEntryLocalStorageService } from "./instrument-log/instrument-log-local-storage.service";
import { InstrumentDbService } from "./instrument-db.service";
import { InstrumentLogDbService } from "./instrument-log/instrument-log-db.service";

@Injectable({
  providedIn: 'root'
})
export class InstrumentStateService extends BaseStateService<Instrument> {
    private http = inject(HttpClient);
    private orchestrator = inject(SubmissionOrchestratorService);
    private userSetupService = inject(UserSetupService);
    private instrumentLogDraftStorage = inject(InstrumentLogEntryLocalStorageService);
    private instrumentDbService = inject(InstrumentDbService);
    private instrumentLogDbService = inject(InstrumentLogDbService);
    private readonly instrumentsStateCacheKey = 'instrument-state-version-v1';
    destroyRef = inject(DestroyRef);

    public allInstruments$ = this.allItems$;
    public selectedInstrument$ = this.selectedItem$;
    private instrumentLogsSubject = new BehaviorSubject<InstrumentLogEntry[]>([]);
    public instrumentLogs$ = this.instrumentLogsSubject.asObservable();

    constructor() {
        super(Instrument);
        this.observeInstrumentsFromDb();
        this.loadAllInstruments();
    }

    private observeInstrumentsFromDb() {
        this.instrumentDbService.getAllInstruments()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (instruments) => this.allItemsSubject.next(instruments),
                error: (error) => console.error('Failed to load cached instruments:', error)
            });
    }

    loadAllInstruments() {
        this.orchestrator.fetchInstrumentsState().pipe(
            take(1),
            switchMap(stateResult => {
                const hasCached = this.allItemsSubject.getValue().length > 0;
                const currentVersion = stateResult.state?.version;
                const cachedVersion = localStorage.getItem(this.instrumentsStateCacheKey) ?? undefined;

                // Cache already matches server state; skip full data transfer.
                if (stateResult.success && hasCached && currentVersion && cachedVersion === currentVersion) {
                    return of({ success: false, method: 'cache' as const, instruments: [] });
                }

                return this.orchestrator.fetchInstruments().pipe(
                    map(result => ({
                        ...result,
                        stateVersion: currentVersion
                    }))
                );
            })
        ).subscribe({
            next: (result: any) => {
                if (result.success) {
                    const instruments = result.instruments.map((dto: any) => new Instrument(dto));
                    this.allItemsSubject.next(instruments);
                    if (result.stateVersion) {
                        localStorage.setItem(this.instrumentsStateCacheKey, result.stateVersion);
                    }
                    this.instrumentDbService.replaceAll(instruments).pipe(take(1)).subscribe({
                        error: (err) => console.error('Failed to cache instruments:', err)
                    });
                    return;
                }
                if (this.allItemsSubject.getValue().length === 0) this.loadFromStaticJson();
            },
            error: () => {
                if (this.allItemsSubject.getValue().length === 0) this.loadFromStaticJson();
            }
        });
    }

    private loadFromStaticJson() {
        this.http.get<Partial<Instrument>[]>('data/default-instruments.json').pipe(
            map(data => data.map(d => new Instrument(d))),
            take(1)
        ).subscribe({
            next: instruments => {
                this.allItemsSubject.next(instruments);
                this.instrumentDbService.replaceAll(instruments).pipe(take(1)).subscribe();
            },
            error: err => {
                console.error('Failed to load default instruments:', err);
                this.globalMessageService.showMessage('Could not load instrument data.');
            }
        });
    }


    selectInstrument(instrument: Instrument) {
        this.selectItem(instrument);
        this.loadLogsForInstrument(instrument.tagNumber);
    }

    getSelectedInstrument(): Instrument | null {
        return this.getSelectedItem();
    }

    loadLogsForInstrument(tagNumber: string) {
        if (!tagNumber) {
            this.instrumentLogsSubject.next([]);
            return;
        }

        this.instrumentLogDbService.getByInstrumentTag(tagNumber).pipe(take(1)).subscribe({
            next: logs => this.instrumentLogsSubject.next(logs)
        });

        this.orchestrator.fetchInstrumentLogs(tagNumber).pipe(take(1)).subscribe({
            next: logs => {
                const mapped = logs.map(dto => new InstrumentLogEntry({
                    localUuid: dto.localUuid,
                    instrumentTagNumber: dto.instrumentTagNumber,
                    instrumentDescription: dto.instrumentDescription,
                    status: dto.status as any,
                    date: new Date(dto.date),
                    time: dto.time,
                    name: dto.name,
                    comment: dto.comment,
                    attachments: []
                }));
                this.instrumentLogDbService.replaceForInstrument(tagNumber, mapped).pipe(take(1)).subscribe({
                    next: () => this.instrumentLogsSubject.next(mapped)
                });
            }
        });
    }

    submitForm(instrument: Instrument) {
        const dto: PwaInstrumentDto = {
            tagNumber: instrument.tagNumber,
            description: instrument.description,
            vendor: instrument.vendor,
            location: instrument.location,
            type: instrument.type,
            currentStatus: 'Normal Operation',
            mergePolicy: 'none'
        };
        this.submitInstrumentCreate(dto, false);
    }

    private submitInstrumentCreate(dto: PwaInstrumentDto, mergeRetryUsed: boolean) {
        this.globalMessageService.showMessage('Creating instrument...', 'white', 20000);
        this.orchestrator.createInstrument(dto).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (result: SubmissionResult) => {
                if (result.success) {
                    this.globalMessageService.showMessage('Instrument created.', 'green', 3000);
                    this.loadAllInstruments();
                } else if (result.requiresMerge && !mergeRetryUsed) {
                    const userConfirmed = window.confirm(
                        `${result.message || 'A record with this tag already exists.'}\n\nSelect OK to merge your non-empty values into the existing instrument record.`
                    );
                    if (userConfirmed) {
                        const mergedDto: PwaInstrumentDto = { ...dto, mergePolicy: 'merge' };
                        this.submitInstrumentCreate(mergedDto, true);
                    } else {
                        this.globalMessageService.showMessage('Instrument creation canceled due to duplicate tag.', 'orange', 5000);
                    }
                } else if (result.requiresEmail) {
                    this.globalMessageService.showMessage(
                        'All creation methods failed. Please submit via email.', 'red', 7000);
                } else {
                    this.globalMessageService.showMessage(
                        result.message || 'Creation failed.', 'red', 5000);
                }
            },
            error: (err) => {
                console.error('Instrument creation failed!', err);
                this.globalMessageService.showMessage(
                    'Failed to create instrument. Please try again.', 'red', 7000);
            }
        });
    }
    submitLogForm(instrumentLog: InstrumentLogEntry) {
        if (!instrumentLog.localUuid) {
            instrumentLog.localUuid = crypto.randomUUID();
        }

        const formData = instrumentLog as any;
        const attachments: IAttachment[] = [
            ...(Array.isArray(formData.files) ? formData.files : []),
        ];
        const userSignature = this.userSetupService.getUserData()?.signature;
        if (userSignature) {
            const base64 = userSignature.includes(',')
                ? userSignature.split(',')[1]
                : userSignature;
            attachments.push({
                fileName: 'signature.png',
                contentType: 'image/png',
                base64Content: base64,
                type: 'signature'
            });
        }
        instrumentLog.attachments = attachments;
        this.instrumentLogDraftStorage.saveDraft(instrumentLog);

        this.globalMessageService.showMessage('Submitting log...', 'white', 20000);
        this.orchestrator.submitInstrumentLog(instrumentLog).pipe(
            takeUntilDestroyed(this.destroyRef),
        ).subscribe({
            next: (result: SubmissionResult) => {
                if (result.success) {
                    this.instrumentLogDraftStorage.clearDraft();
                    instrumentLog.localUuid = undefined;
                    this.globalMessageService.showMessage(
                        `Log submitted via ${result.method}.`, 'green', 3000);
                    this.loadLogsForInstrument(instrumentLog.instrumentTagNumber);
                } else if (result.requiresEmail) {
                    this.globalMessageService.showMessage(
                        'All submission methods failed. Please submit via email.', 'red', 7000);
                } else {
                    this.globalMessageService.showMessage(
                        result.message || 'Submission failed.', 'red', 5000);
                }
            },
            error: (err) => {
                console.error('Log submission failed!', err);
                this.globalMessageService.showMessage(
                    'Failed to submit log. Please try again or contact your supervisor.', 'red', 7000);
            }
        });
    }
}
