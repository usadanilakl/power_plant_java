import { DestroyRef, inject, Injectable, signal } from "@angular/core";
import { Instrument } from "../../../models/equipment/instrument.model";
import { BaseStateService } from "../../../services/base-state.service";
import { HttpClient } from "@angular/common/http";
import { BehaviorSubject, map, Observable, of, Subject, switchMap, take } from "rxjs";
import { InstrumentLogEntry } from "../../../models/equipment/instrument-log.model";
import { IAttachment } from "../../../models/permits/attachment.model";
import { SubmissionOrchestratorService, SubmissionResult } from "../../../services/submission-orchestrator.service";
import { PwaInstrumentDto } from "../../../services/server-api.service";
import { UserSetupService } from "../../../services/user-setup.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { InstrumentLogEntryLocalStorageService } from "./instrument-log/instrument-log-local-storage.service";
import { InstrumentDbService } from "./instrument-db.service";
import { InstrumentLogDbService } from "./instrument-log/instrument-log-db.service";
import { InstrumentLogOutboxService } from "./instrument-log/instrument-log-outbox.service";
import { InstrumentRecentsService } from "./instrument-recents.service";

/** Outcome of a create attempt, surfaced to the create screen so it can navigate on success. */
export interface InstrumentCreateOutcome {
  status: 'created' | 'merged' | 'cancelled' | 'failed';
  tagNumber?: string;
  message?: string;
}

/**
 * Instrument register state for the PWA.
 *
 * Data flow (single direction, one source of truth):
 *
 *   SharePoint ⇄ hub H2  →  GET /api/pwa/secured/instruments  →  IndexedDB  →  screens
 *
 * The hub owns the register: its SharePoint syncable pulls SharePoint every 30s and CRDT sync keeps
 * the desktops level, so the PWA never talks to SharePoint for reads. IndexedDB is a local mirror of
 * what the hub last served — the screens always render from it, so the list is instant and works with
 * no signal. Refresh is version-gated: `/state` returns a cheap `count:lastModified` version and the
 * full list is only re-downloaded when that changes. Supabase is deliberately NOT in this path — it
 * carries no instrument snapshot, and adding one would create a second writer with no conflict story
 * for data SharePoint and the hub already reconcile.
 */
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
    private outbox = inject(InstrumentLogOutboxService);
    private recents = inject(InstrumentRecentsService);
    private readonly instrumentsStateCacheKey = 'instrument-state-version-v1';
    private readonly instrumentsSyncedAtKey = 'instrument-state-synced-at-v1';
    destroyRef = inject(DestroyRef);

    public allInstruments$ = this.allItems$;
    public selectedInstrument$ = this.selectedItem$;
    private instrumentLogsSubject = new BehaviorSubject<InstrumentLogEntry[]>([]);
    public instrumentLogs$ = this.instrumentLogsSubject.asObservable();

    /** True while the register is being re-downloaded from the hub (banner in the search screen). */
    readonly isRefreshing = signal(false);
    /** ISO timestamp of the last successful hub refresh — "Updated 3 min ago" in the UI. */
    readonly lastSyncedAt = signal<string | null>(localStorage.getItem(this.instrumentsSyncedAtKey));
    /** Set when the last refresh could not reach the hub, so the screen can say the list may be stale. */
    readonly isOffline = signal(false);

    emailFallbackData = signal<{ mailto: string; body: string; entry: InstrumentLogEntry } | null>(null);

    /**
     * Fires with the tag once a log has been accepted or queued. The form listens so it can rebuild
     * itself from a cleared draft — otherwise the just-sent values sit in the fields and the next
     * log on that instrument starts as an edit of the last one.
     */
    private logSubmittedSubject = new Subject<string>();
    readonly logSubmitted$ = this.logSubmittedSubject.asObservable();

    constructor() {
        super(Instrument);
        this.observeInstrumentsFromDb();
        this.loadAllInstruments();
        void this.outbox.flush();
    }

    private observeInstrumentsFromDb() {
        this.instrumentDbService.getAllInstruments()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (instruments) => this.allItemsSubject.next(instruments),
                error: (error) => console.error('Failed to load cached instruments:', error)
            });
    }

    /**
     * Refreshes the local mirror from the hub.
     *
     * Ordering matters: the cached rows are read from IndexedDB FIRST, so the version gate knows
     * whether anything is actually cached. Deciding that from an empty in-memory list (the old
     * behaviour, which raced the Dexie read) meant re-downloading all ~3000 rows on most cold starts.
     */
    loadAllInstruments() {
        this.isRefreshing.set(true);
        this.instrumentDbService.getAllInstruments().pipe(
            take(1),
            switchMap(cached => {
                if (cached.length > 0) this.allItemsSubject.next(cached);
                return this.orchestrator.fetchInstrumentsState().pipe(
                    take(1),
                    switchMap(stateResult => {
                        const currentVersion = stateResult.state?.version;
                        const cachedVersion = localStorage.getItem(this.instrumentsStateCacheKey) ?? undefined;

                        // Local mirror already matches the hub — skip the full transfer.
                        if (stateResult.success && cached.length > 0 && currentVersion && cachedVersion === currentVersion) {
                            return of({ success: true, method: 'cache' as const, instruments: [], stateVersion: currentVersion, upToDate: true });
                        }

                        return this.orchestrator.fetchInstruments().pipe(
                            map(result => ({ ...result, stateVersion: currentVersion, upToDate: false }))
                        );
                    })
                );
            })
        ).subscribe({
            next: (result: any) => {
                if (result.upToDate) {
                    this.markSynced();
                    this.isRefreshing.set(false);
                    return;
                }
                if (result.success) {
                    const instruments = result.instruments.map((dto: any) => new Instrument(dto));
                    this.allItemsSubject.next(instruments);
                    if (result.stateVersion) {
                        localStorage.setItem(this.instrumentsStateCacheKey, result.stateVersion);
                    } else {
                        // Served by the Power Automate fallback, which has no version — force the next
                        // load to re-check rather than trusting a version that describes other data.
                        localStorage.removeItem(this.instrumentsStateCacheKey);
                    }
                    this.markSynced();
                    this.instrumentDbService.replaceAll(instruments).pipe(take(1)).subscribe({
                        error: (err) => console.error('Failed to cache instruments:', err)
                    });
                    this.isRefreshing.set(false);
                    return;
                }
                this.isOffline.set(true);
                this.isRefreshing.set(false);
                if (this.allItemsSubject.getValue().length === 0) this.loadFromStaticJson();
            },
            error: () => {
                this.isOffline.set(true);
                this.isRefreshing.set(false);
                if (this.allItemsSubject.getValue().length === 0) this.loadFromStaticJson();
            }
        });
    }

    private markSynced() {
        const now = new Date().toISOString();
        this.lastSyncedAt.set(now);
        this.isOffline.set(false);
        localStorage.setItem(this.instrumentsSyncedAtKey, now);
    }

    /**
     * Last resort only: a build-time snapshot shipped with the app, used when the hub is unreachable
     * AND this device has never cached the register. It ages with the bundle, so it is a seed for a
     * brand-new install, never a refresh path.
     */
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
        this.recents.remember(instrument.tagNumber);
        this.loadLogsForInstrument(instrument.tagNumber);
    }

    /** Resolves a tag from the route (QR deep link) against the local mirror. */
    findByTag(tagNumber: string): Instrument | null {
        const tag = (tagNumber ?? '').trim().toUpperCase();
        if (!tag) return null;
        return this.allItemsSubject.getValue()
            .find(i => (i.tagNumber ?? '').trim().toUpperCase() === tag) ?? null;
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

    /**
     * Creates an instrument and reports what happened, so the caller can drop the user straight into
     * the log form for the tag they just added (the whole reason they were creating it).
     */
    submitForm(instrument: Instrument): Observable<InstrumentCreateOutcome> {
        const dto: PwaInstrumentDto = {
            tagNumber: (instrument.tagNumber ?? '').trim().toUpperCase(),
            description: instrument.description,
            vendor: instrument.vendor,
            location: instrument.location,
            type: instrument.type,
            currentStatus: 'Normal Operation',
            mergePolicy: 'none'
        };
        const outcome$ = new Subject<InstrumentCreateOutcome>();
        this.submitInstrumentCreate(dto, false, outcome$);
        return outcome$.asObservable();
    }

    private submitInstrumentCreate(dto: PwaInstrumentDto, mergeRetryUsed: boolean, outcome$: Subject<InstrumentCreateOutcome>) {
        this.globalMessageService.showMessage('Creating instrument...', 'white', 20000);
        this.orchestrator.createInstrument(dto).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (result: SubmissionResult) => {
                if (result.success) {
                    this.globalMessageService.showMessage('Instrument created.', 'green', 3000);
                    this.loadAllInstruments();
                    outcome$.next({ status: mergeRetryUsed ? 'merged' : 'created', tagNumber: dto.tagNumber });
                    outcome$.complete();
                } else if (result.requiresMerge && !mergeRetryUsed) {
                    void this.globalMessageService.confirm(
                        `${result.message || 'A record with this tag already exists.'} Merge your non-empty values into the existing instrument record?`,
                        { confirmLabel: 'Merge', color: 'orange' },
                    ).then(userConfirmed => {
                        if (userConfirmed) {
                            const mergedDto: PwaInstrumentDto = { ...dto, mergePolicy: 'merge' };
                            this.submitInstrumentCreate(mergedDto, true, outcome$);
                        } else {
                            this.globalMessageService.showMessage('Instrument creation canceled due to duplicate tag.', 'orange', 5000);
                            outcome$.next({ status: 'cancelled', tagNumber: dto.tagNumber });
                            outcome$.complete();
                        }
                    });
                } else if (result.requiresEmail) {
                    this.globalMessageService.showMessage(
                        'All creation methods failed. Please submit via email.', 'red', 7000);
                    outcome$.next({ status: 'failed', message: 'All creation methods failed.' });
                    outcome$.complete();
                } else {
                    this.globalMessageService.showMessage(
                        result.message || 'Creation failed.', 'red', 5000);
                    outcome$.next({ status: 'failed', message: result.message });
                    outcome$.complete();
                }
            },
            error: (err) => {
                console.error('Instrument creation failed!', err);
                this.globalMessageService.showMessage(
                    'Failed to create instrument. Please try again.', 'red', 7000);
                outcome$.next({ status: 'failed', message: err?.message });
                outcome$.complete();
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
        this.recents.remember(instrumentLog.instrumentTagNumber);

        // Offline is a normal field condition, not an error: queue it and tell the user it's safe.
        if (!navigator.onLine) {
            void this.queueLog(instrumentLog, 'Offline when submitted');
            return;
        }

        this.globalMessageService.showMessage('Submitting log...', 'white', 20000);
        this.emailFallbackData.set(null);
        this.orchestrator.submitInstrumentLog(instrumentLog).pipe(
            takeUntilDestroyed(this.destroyRef),
        ).subscribe({
            next: (result: SubmissionResult) => {
                if (result.success) {
                    this.finishSubmittedLog(instrumentLog);
                    const messageColor = result.method === 'local' ? 'orange' : 'green';
                    this.globalMessageService.showMessage(
                        result.method === 'local'
                            ? 'Log saved. SharePoint sync pending on the hub.'
                            : `Log submitted via ${result.method}.`,
                        messageColor,
                        4000
                    );
                    this.loadLogsForInstrument(instrumentLog.instrumentTagNumber);
                } else {
                    void this.queueLog(instrumentLog, result.message ?? 'Submission failed');
                }
            },
            error: (err) => {
                console.error('Log submission failed!', err);
                void this.queueLog(instrumentLog, err?.message ?? 'Network error');
            }
        });
    }

    /**
     * Parks a log in the outbox and clears the form's draft — the entry is safe on the device and
     * will be retried on reconnect, so the user is free to move on to the next instrument.
     */
    private async queueLog(instrumentLog: InstrumentLogEntry, reason: string) {
        try {
            await this.outbox.enqueue(instrumentLog, reason);
            this.finishSubmittedLog(instrumentLog);
            this.globalMessageService.showMessage(
                'Saved on this device — it will be sent automatically when you are back online.', 'orange', 5000);
        } catch (error) {
            console.error('Failed to queue instrument log:', error);
            const emailContent = this.orchestrator.generateInstrumentLogEmail(instrumentLog);
            this.emailFallbackData.set({ mailto: emailContent.mailto, body: emailContent.body, entry: instrumentLog });
            this.globalMessageService.showMessage(
                'Could not save the log on this device. Please use the email fallback.', 'red', 10000);
        }
    }

    /** Clears the per-instrument draft and resets the entry so the form starts clean next time. */
    private finishSubmittedLog(instrumentLog: InstrumentLogEntry) {
        this.instrumentLogDraftStorage.clearDraft(instrumentLog.instrumentTagNumber);
        instrumentLog.localUuid = undefined;
        this.logSubmittedSubject.next(instrumentLog.instrumentTagNumber);
    }

    clearEmailFallback() {
        this.emailFallbackData.set(null);
    }

    markSentViaEmail() {
        const entry = this.emailFallbackData()?.entry;
        if (entry) this.instrumentLogDraftStorage.clearDraft(entry.instrumentTagNumber);
        this.emailFallbackData.set(null);
        this.globalMessageService.showMessage('Marked as sent via email.', 'green');
    }
}
