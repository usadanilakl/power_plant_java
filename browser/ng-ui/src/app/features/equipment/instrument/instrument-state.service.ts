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
import { InstrumentOutboxService } from "./instrument-outbox.service";
import { InstrumentRecentsService } from "./instrument-recents.service";

/** Outcome of a create attempt, surfaced to the create screen so it can navigate on success. */
export interface InstrumentCreateOutcome {
  status: 'created' | 'merged' | 'queued' | 'cancelled' | 'failed';
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
    private outbox = inject(InstrumentOutboxService);
    private recents = inject(InstrumentRecentsService);
    private readonly instrumentsStateCacheKey = 'instrument-state-version-v1';
    private readonly instrumentsSyncedAtKey = 'instrument-state-synced-at-v1';
    private readonly paRefreshedAtKey = 'instrument-pa-refreshed-at-v1';

    /**
     * Minimum gap between register refreshes that fall through to Power Automate.
     *
     * The hub path is a single H2 read and stays unthrottled. A Power Automate refresh is a metered
     * Power Platform run that walks the whole SharePoint list (~3000 rows) and can cost two runs —
     * the version probe and the list pull — so every app open during a hub outage would otherwise
     * bill a full sweep. The register changes rarely, and the local mirror covers the gap, so a
     * fifteen-minute floor costs the user nothing. An explicit pull-to-refresh bypasses it: that is
     * the user telling us the cached answer isn't good enough.
     */
    private readonly PA_REFRESH_COOLDOWN_MS = 15 * 60 * 1000;
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

        // A flush that landed anything means the hub now holds rows this device only had locally —
        // pull the register back down so those rows carry their server-side identity (sharepointId,
        // audit fields) instead of staying as local copies.
        this.outbox.flushed$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(landed => {
                if (landed.instruments > 0) this.loadAllInstruments();
                const selectedTag = this.getSelectedInstrument()?.tagNumber;
                if (landed.logs > 0 && selectedTag) this.loadLogsForInstrument(selectedTag);
            });
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
    loadAllInstruments(options?: { userInitiated?: boolean }) {
        const allowPa = options?.userInitiated === true || this.paCooldownExpired();
        this.isRefreshing.set(true);
        this.instrumentDbService.getAllInstruments().pipe(
            take(1),
            switchMap(cached => {
                if (cached.length > 0) this.allItemsSubject.next(cached);
                return this.orchestrator.fetchInstrumentsState(allowPa).pipe(
                    take(1),
                    switchMap(stateResult => {
                        const currentVersion = stateResult.state?.version;
                        const cachedVersion = localStorage.getItem(this.instrumentsStateCacheKey) ?? undefined;

                        // Local mirror already matches the hub — skip the full transfer.
                        if (stateResult.success && cached.length > 0 && currentVersion && cachedVersion === currentVersion) {
                            return of({ success: true, method: 'cache' as const, instruments: [], stateVersion: currentVersion, upToDate: true });
                        }

                        return this.orchestrator.fetchInstruments(allowPa).pipe(
                            map(result => ({ ...result, stateVersion: currentVersion, upToDate: false }))
                        );
                    })
                );
            })
        ).subscribe({
            next: (result: any) => {
                // Stamp whenever the PA leg was reached at all — a failed fallback shouldn't be
                // retried on a tighter loop than a successful one.
                if (allowPa && result.method !== 'server' && result.method !== 'cache') {
                    localStorage.setItem(this.paRefreshedAtKey, String(Date.now()));
                }
                if (result.upToDate) {
                    this.markSynced();
                    this.isRefreshing.set(false);
                    return;
                }
                if (result.success) {
                    const instruments = (result.instruments ?? []).map((dto: any) => new Instrument(dto));

                    // Never let an empty answer erase a populated mirror. An empty payload here is
                    // almost always a failure wearing a success mask — a gateway that rejected the
                    // request with HTTP 200, a Power Automate flow missing the getAllInstruments
                    // case, or a hub whose register hasn't loaded yet. Wiping on that leaves a field
                    // tech with an empty search screen and no way back offline, and the version gate
                    // can't undo it (it needs a non-empty cache to engage).
                    if (instruments.length === 0 && this.allItemsSubject.getValue().length > 0) {
                        console.warn('[Instruments] Refresh returned an empty register; keeping the cached list.');
                        this.isOffline.set(true);
                        this.isRefreshing.set(false);
                        return;
                    }

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

    private paCooldownExpired(): boolean {
        const last = Number(localStorage.getItem(this.paRefreshedAtKey) ?? 0);
        if (!last) return true;
        return Date.now() - last > this.PA_REFRESH_COOLDOWN_MS;
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
        const tagNumber = (instrument.tagNumber ?? '').trim().toUpperCase();
        const dto: PwaInstrumentDto = {
            tagNumber,
            description: instrument.description,
            vendor: instrument.vendor,
            location: instrument.location,
            type: instrument.type,
            currentStatus: 'Normal Operation',
            mergePolicy: 'none'
        };
        const outcome$ = new Subject<InstrumentCreateOutcome>();

        // Offline is a normal field condition: queue the instrument, add it to the local register
        // immediately, and let the user carry straight on to logging against it.
        if (!navigator.onLine) {
            void this.queueInstrument(instrument, tagNumber, 'Offline when created', outcome$);
            return outcome$.asObservable();
        }

        this.submitInstrumentCreate(dto, false, outcome$, instrument);
        return outcome$.asObservable();
    }

    /**
     * Parks a new instrument in the outbox and writes it into the local register marked
     * `pendingSync`, so it is searchable and loggable on this device before it exists anywhere else.
     */
    private async queueInstrument(
        instrument: Instrument,
        tagNumber: string,
        reason: string,
        outcome$: Subject<InstrumentCreateOutcome>
    ) {
        try {
            const localUuid = await this.outbox.enqueueInstrument(
                { ...instrument, tagNumber, currentStatus: instrument.currentStatus || 'Normal Operation' } as any,
                reason
            );
            const local = new Instrument({
                ...instrument,
                tagNumber,
                localUuid,
                currentStatus: instrument.currentStatus || 'Normal Operation',
                pendingSync: true
            });
            await new Promise<void>((resolve, reject) =>
                this.instrumentDbService.upsertByTag(local).pipe(take(1)).subscribe({ next: () => resolve(), error: reject }));

            const merged = [...this.allItemsSubject.getValue().filter(i =>
                (i.tagNumber ?? '').trim().toUpperCase() !== tagNumber), local];
            this.allItemsSubject.next(merged);

            this.globalMessageService.showMessage(
                'Saved on this device — the instrument will be sent when you are back online.', 'orange', 5000);
            outcome$.next({ status: 'queued', tagNumber });
            outcome$.complete();
        } catch (error: any) {
            console.error('Failed to queue instrument:', error);
            this.globalMessageService.showMessage(
                'Could not save the instrument on this device. Please try again.', 'red', 7000);
            outcome$.next({ status: 'failed', message: error?.message });
            outcome$.complete();
        }
    }

    private submitInstrumentCreate(
        dto: PwaInstrumentDto,
        mergeRetryUsed: boolean,
        outcome$: Subject<InstrumentCreateOutcome>,
        original: Instrument
    ) {
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
                            this.submitInstrumentCreate(mergedDto, true, outcome$, original);
                        } else {
                            this.globalMessageService.showMessage('Instrument creation canceled due to duplicate tag.', 'orange', 5000);
                            outcome$.next({ status: 'cancelled', tagNumber: dto.tagNumber });
                            outcome$.complete();
                        }
                    });
                } else {
                    // Every live route failed (hub down, Power Automate rejected). Queue rather than
                    // hand the user an email template — the retry is automatic and the instrument is
                    // usable on this device meanwhile.
                    void this.queueInstrument(original, dto.tagNumber, result.message ?? 'Creation failed', outcome$);
                }
            },
            error: (err) => {
                console.error('Instrument creation failed!', err);
                void this.queueInstrument(original, dto.tagNumber, err?.message ?? 'Network error', outcome$);
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
            await this.outbox.enqueueLog(instrumentLog, reason);
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
