import { DestroyRef, inject, Injectable, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { LotoService } from "../loto/loto.service";
import { BehaviorSubject, catchError, debounceTime, EMPTY, filter, map, merge, Observable, of, Subject, tap, throttleTime } from "rxjs";
import { EntityUpdateEvent, SyncUpdateService } from "../sync/sync-update.service";
import { LotoDto } from "../../models/loto/loto.model";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { SpringApiResponse } from "../../models/api/spring-api-response.model";
import { SpringPaginatedResponse } from "../../models/api/spring-pagenated.response.model";
import { LotoPointDto } from "../../models/loto/loto-point.model";
import { FileDto } from "../../models/file/file.model";
import { LotoPointService } from "../loto/loto-point.service";
import { PrintableFormService } from "../forms/printable-form.service";
import { PrintableFormDto } from "../../models/forms/printable-form.model";

@Injectable({
  providedIn: 'root'
})
export class CurrentLotoService{

    /** Sentinel for a LotoSnapshot change we couldn't map to a cached permit: refresh the list +
     *  re-feed the open permit rather than dropping the event. */
    private static readonly UNRESOLVED_LOTO = -1;
    private lotoService = inject(LotoService);
    private lotoPointService = inject(LotoPointService);
    private printableFormService = inject(PrintableFormService);
    private destroyRef = inject(DestroyRef);

    private allLotosSubject = new BehaviorSubject<LotoDto[]>([]);
    allLotos$ = this.allLotosSubject.asObservable();

    private currentLotoSubject = new BehaviorSubject<LotoDto | null>(null);
    currentLoto$ = this.currentLotoSubject.asObservable();
    
    private currentLotoPointSubject = new BehaviorSubject<LotoPointDto | null>(null);
    currentLotoPoint$ = this.currentLotoPointSubject.asObservable();
    
    private currentLotoPointFilesSubject = new BehaviorSubject<FileDto[]>([]);
    currentLotoPointFiles$ = this.currentLotoPointFilesSubject.asObservable();

    private currentLotoFilesSubject = new BehaviorSubject<FileDto[]>([]);
    currentLotoFiles$ = this.currentLotoFilesSubject.asObservable();

    private paperFormSubject = new BehaviorSubject<PrintableFormDto>(new PrintableFormDto());
    paperForm$ = this.paperFormSubject.asObservable();
  
    isPaperViewActive = signal<boolean>(false);
    selectedItem = toSignal(this.currentLotoSubject.asObservable(), { initialValue: new LotoDto() });

    private syncUpdateService = inject(SyncUpdateService);
    /** Coalesces the burst of field-changes one remote transition produces into a single refetch. */
    private lotoChanged$ = new Subject<number>();
    /** Per-id fetch coalescer — one hang/verify emits ~3 events for the same id; we want ONE GET. */
    private pendingResolvedIds = new Set<number>();
    private flushResolvedTimer: any = null;
    /** snapshotId → owning lotoId, rebuilt on every list mutation. Turns resolveLotoIdFromSnapshot
     *  from O(lotos × snapshots-per-loto) per SSE event into O(1). */
    private snapshotToLotoId = new Map<number, number>();

    constructor() {
        // Keep the snapshotId → lotoId lookup in sync with allLotos so SSE events
        // resolve in O(1) instead of walking every cached permit's snapshots list.
        this.allLotos$.pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => this.rebuildSnapshotIndex());

        this.loadLotosFromServer();
        this.loadPaperForm();

        // Live-refresh when a LOTO changes on another machine. These SSE events only fire for changes RECEIVED from
        // sync (never our own writes), so this is exactly the "someone else approved/hung/verified it" case that
        // previously required a manual page refresh.
        //
        // IMPORTANT: the lifecycle transitions (CA-approve-for-hanging, per-point hang/verify, aggregate hung/verified)
        // all write LotoSnapshot, NOT Loto — so watching 'Loto' alone would miss every one of them.
        this.syncUpdateService.getEntityTypeUpdates$('Loto')
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(e => this.lotoChanged$.next(e.entityId));

        this.syncUpdateService.getEntityTypeUpdates$('LotoSnapshot')
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(e => {
                const lotoId = this.resolveLotoIdFromSnapshot(e);
                // null = a lifecycle-only snapshot change (hungBy/caApprovedForHangingBy…, no 'loto' FK)
                // for a permit not yet in the cached list, or whose snapshots[] predates this snapshot.
                // Do NOT drop it — emit a sentinel so the throttled full-refresh channel catches it.
                this.lotoChanged$.next(lotoId ?? CurrentLotoService.UNRESOLVED_LOTO);
            });

        // Resolved-id path — targeted per-loto GET, coalesced by id (a hang/verify emits ~3 events
        // for the same permit; we only want one GET). Cheap: one full-list refetch of 200 fat DTOs
        // per SSE event was the dominant cost of the tab under multi-user activity.
        this.lotoChanged$
            .pipe(
                filter(id => id !== CurrentLotoService.UNRESOLVED_LOTO),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe(lotoId => this.queueResolvedLotoFetch(lotoId));

        // Unresolved snapshot + SSE reconnect share the same shape: we don't know what we missed,
        // so a full list refresh is the only option. Throttle so a reconnect storm (network blip,
        // JWT refresh, sleep/resume) or an unresolved burst collapses to ≤1 refresh per 5s.
        merge(
            this.lotoChanged$.pipe(filter(id => id === CurrentLotoService.UNRESOLVED_LOTO)),
            this.syncUpdateService.reconnected$.pipe(map(() => CurrentLotoService.UNRESOLVED_LOTO)),
        )
            .pipe(
                throttleTime(5000, undefined, { leading: true, trailing: true }),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe(() => this.applyRemoteLotoChange(CurrentLotoService.UNRESOLVED_LOTO));
    }

    /**
     * Queue a resolved-id fetch and flush the batch after 300ms so a hang/verify's ~3 events
     * per permit collapse into one GET. Multiple IDs in the batch each get their own GET —
     * we don't coalesce ACROSS ids (using debounceTime like this used to would drop non-final ids).
     */
    private queueResolvedLotoFetch(id: number): void {
        this.pendingResolvedIds.add(id);
        if (this.flushResolvedTimer) return;
        this.flushResolvedTimer = setTimeout(() => {
            const ids = Array.from(this.pendingResolvedIds);
            this.pendingResolvedIds.clear();
            this.flushResolvedTimer = null;
            for (const lotoId of ids) this.applyResolvedLotoChange(lotoId);
        }, 300);
    }

    /**
     * Fetch ONE loto by id and merge into the cached list — no full-list refetch, no fat-DTO
     * multiplication across 200 rows per event. If the permit is currently open, re-feed the
     * subject so the form re-renders (form no longer wipes user edits thanks to
     * RfReactiveFormComponent's fields-signature guard + dirty-check).
     */
    private applyResolvedLotoChange(lotoId: number): void {
        this.lotoService.getLotoById(String(lotoId)).pipe(
            takeUntilDestroyed(this.destroyRef),
            map(res => this.normalizeLoto(res?.responseData)),
            catchError(err => {
                console.error('[CurrentLotoService] targeted GET failed for loto', lotoId, err);
                return of(null);
            }),
        ).subscribe(loto => {
            if (!loto || !loto.id) return;
            const exists = this.allLotosSubject.value.some(l => l.id === loto.id);
            if (exists) this.updateLotoInList(loto);
            else this.addLotoToList(loto);
            if (this.currentLotoSubject.value?.id === loto.id) {
                this.currentLotoSubject.next(loto);
            }
        });
    }

    /** A LotoSnapshot event carries the SNAPSHOT id — map it back to the permit that owns it. */
    private resolveLotoIdFromSnapshot(e: EntityUpdateEvent): number | null {
        // A brand-new snapshot's change batch carries its parent FK (LotoSnapshot.loto).
        const fk = e.changes?.find(c => c.fieldName === 'loto')?.newValue;
        if (fk) {
            const n = Number(fk);
            if (!Number.isNaN(n)) return n;
        }
        // Existing snapshot: O(1) via the pre-built index instead of walking every cached loto.
        return this.snapshotToLotoId.get(e.entityId) ?? null;
    }

    /** Rebuild snapshotId → lotoId map from the current allLotos list. Cheap (linear once per list write). */
    private rebuildSnapshotIndex(): void {
        const map = new Map<number, number>();
        for (const l of this.allLotosSubject.value) {
            if (!l?.id || !l.snapshots) continue;
            for (const s of l.snapshots) {
                if (s?.id != null) map.set(s.id, l.id);
            }
        }
        this.snapshotToLotoId = map;
    }

    private applyRemoteLotoChange(lotoId: number): void {
        this.loadLotosFromServer();                       // refresh list / left menu / status grouping
        const openId = this.currentLotoSubject.value?.id;
        // Re-feed the open permit when the change is for it, OR when we couldn't map the snapshot
        // (UNRESOLVED) — in that case re-read the open permit anyway so a lifecycle change we couldn't
        // attribute still renders. Harmless if unrelated (re-reads the same data).
        if (openId != null && (lotoId === openId || lotoId === CurrentLotoService.UNRESOLVED_LOTO)) {
            this.setCurrentLotoById(openId);              // re-feed the open permit so the form re-renders
        }
    }

    private normalizeLoto(item: Partial<LotoDto> | null | undefined): LotoDto {
      return item ? LotoDto.fromJson(item) : new LotoDto();
    }

    private normalizeLotos(items: Partial<LotoDto>[] | null | undefined): LotoDto[] {
      return (items ?? []).map(item => this.normalizeLoto(item));
    }

    private normalizePaperForm(item: Partial<PrintableFormDto> | null | undefined): PrintableFormDto {
      return item ? PrintableFormDto.fromJson(item) : new PrintableFormDto();
    }

    reloadLotos() {
        this.loadLotosFromServer();
    }

    private loadLotosFromServer() {
        this.lotoService.getLotos(1, 200).pipe(
            takeUntilDestroyed(this.destroyRef),
            map((response: SpringPaginatedResponse<LotoDto>) => this.normalizeLotos(response?.responseData?.content || [])),
            catchError(err => {
                console.error('[CurrentLotoService] Failed to load LOTOs:', err);
                return of([] as LotoDto[]);
            })
        ).subscribe((lotos: LotoDto[]) => {
            console.log(`[CurrentLotoService] Loaded ${lotos.length} LOTOs:`,
                lotos.map(l => ({ id: l.id, docNum: l.docNum, status: l.permitStatus?.name })));
            this.allLotosSubject.next(lotos);
        });
    }
    private loadPaperForm() {
        this.printableFormService.getPrimaryFormByType('Loto').pipe(
            takeUntilDestroyed(this.destroyRef),
            catchError(err => {
                console.error('Error loading paper form:', err);
                return of(null);
            })
        ).subscribe(response => {
            if (response && response.responseData) {
                this.paperFormSubject.next(this.normalizePaperForm(response.responseData));
                // console.log('Paper form loaded:', response.responseData);
            }
        });
    }

    switchFormView() {
        this.isPaperViewActive.set(!this.isPaperViewActive());
    }

    setCurrentLoto(loto: LotoDto | null) {
      if(loto && loto.id && loto.id!=0){
        this.setCurrentLotoById(loto.id);
      }else{
        this.currentLotoSubject.next(new LotoDto());
      }
    }

    setCurrentLotoById(id: number) {
        this.lotoService.getLotoById(id.toString()).pipe(
        takeUntilDestroyed(this.destroyRef),
        map((response: SpringApiResponse<LotoDto>) => this.normalizeLoto(response.responseData))
      ).subscribe((lotoFromServer: LotoDto) => {
        if(lotoFromServer){
          const lotoDto = this.normalizeLoto(lotoFromServer);
          this.currentLotoSubject.next(lotoDto);
          this.loadCurrentLotoFiles(lotoDto.id);
        }
      });
    }

    addLotoPointToCurrentLoto(pointId: number) {
        // Add the point to the current loto
        if(this.currentLotoSubject.value) {
            // Save the changes to the server
            this.lotoService.addLotoPointToLoto(pointId, this.currentLotoSubject.value.id).pipe(
                takeUntilDestroyed(this.destroyRef)
            ).subscribe((response: SpringApiResponse<LotoDto>) => {
                // Update the current loto
                const receivedLoto = this.normalizeLoto(response.responseData);
                this.updateLotoInList(receivedLoto);
                this.currentLotoSubject.next(receivedLoto);
                this.loadCurrentLotoFiles(receivedLoto.id);
            });
        }
    }

    removeLotoPointFromCurrentLoto(id: number) {
      // Remove the point from the current loto
      if(this.currentLotoSubject.value) {
          // Save the changes to the server
          this.lotoService.removeLotoPointFromLoto(id, this.currentLotoSubject.value.id).pipe(
              takeUntilDestroyed(this.destroyRef)
          ).subscribe((response: SpringApiResponse<LotoDto>) => {
              // Update the current loto
              const receivedLoto = this.normalizeLoto(response.responseData);
              this.updateLotoInList(receivedLoto);
              this.currentLotoSubject.next(receivedLoto);
              this.loadCurrentLotoFiles(receivedLoto.id);
          });
      }
    }

    addLotoToList(loto: LotoDto) {
      const currentLotos = this.allLotosSubject.value;
      this.allLotosSubject.next([...currentLotos, loto]);
    }

    removeLotoFromList(id: number) {
      const currentLotos = this.allLotosSubject.value;
      this.allLotosSubject.next(currentLotos.filter(l => l.id !== id));
    }

    deleteLoto(id: number) {
      this.lotoService.deleteLoto(id.toString()).pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((error) => {
          console.error('Error deleting LOTO:', error);
          return EMPTY;
        })
      ).subscribe(() => {
        this.loadLotosFromServer();
        this.currentLotoSubject.next(null);
      });
    }

    updateLotoInList(loto: LotoDto) {
        const currentLotos = this.allLotosSubject.value;
        const updatedLotos = currentLotos.map(l => l.id === loto.id? loto : l);
        this.allLotosSubject.next(updatedLotos);
    }

    updateLotosInList(lotos: LotoDto[]) {
      const currentLotos = this.allLotosSubject.value;
      const updatedLotos = currentLotos.map(l => {
        const foundLoto = lotos.find(loto => loto.id === l.id);
        return foundLoto ? foundLoto : l;
      });
      this.allLotosSubject.next(updatedLotos);
    }

    processLotoChanges(lotoDto: LotoDto, onSuccess?: () => void, onError?: (err: any) => void) {
      if(!lotoDto) return;
      // Force-include id on the source so new LotoDto(...) doesn't reset it
      // to 0 (which the backend then treats as a CREATE).
      const existingId = this.currentLotoSubject.value?.id;
      const source: any = { ...(lotoDto as any), id: (lotoDto as any).id ?? existingId };
      const wasNew = !source.id;
      const lotoIdDto = new LotoDto(source).toIdModel();
      (lotoIdDto as any).id = source.id ?? (lotoIdDto as any).id;
      console.log('[CurrentLotoService] processLotoChanges — sending:', lotoIdDto);
      this.lotoService.updateLoto(lotoIdDto).pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: (response: SpringApiResponse<LotoDto>) => {
          console.log('[CurrentLotoService] update OK — server returned:', response?.responseData);
          if(!response){
              console.error('Error updating Loto: empty response');
              onError?.(new Error('Empty server response'));
              return;
          }
          const receivedLoto = this.normalizeLoto(response.responseData);
          this.updateLotoInList(receivedLoto);
          // For a brand-new permit, swap the entity so future saves carry the
          // assigned id. For an existing permit, DO NOT reset the subject —
          // doing so re-fetches via setCurrentLoto → setCurrentLotoById → form
          // rebuild, which clobbers anything the user has typed in the
          // meantime (the autosave's "form resets to pre-saved state" bug).
          if (wasNew) {
            this.setCurrentLoto(receivedLoto);
          }
          onSuccess?.();
        },
        error: err => {
          console.error('[CurrentLotoService] update FAILED:', err);
          onError?.(err);
        }
      });
    }


    
    getCurrentLotoFiles(): Observable<FileDto[]>   {
      return this.currentLotoFiles$;
    }
    getCurrentLotoPointFiles(): Observable<FileDto[]>   {
      return this.currentLotoPointFiles$;
    }
    getCurrentLotoPoint(): Observable<LotoPointDto | null>   {
      return this.currentLotoPoint$;
    }
    
    setCurrentLotoPoint(lotoPoint: LotoPointDto | null) {
      this.currentLotoPointSubject.next(lotoPoint);
      if(lotoPoint && lotoPoint.id)this.loadCurrentLotoPoitFiles(lotoPoint.id);
    }
    
    loadCurrentLotoPoitFiles(lotoPointId: number) {
      this.lotoPointService.getRelatedFiles(lotoPointId).pipe(
        takeUntilDestroyed(this.destroyRef),
        map((response: SpringApiResponse<FileDto[]>) => response.responseData),
        tap((files: FileDto[]) => {
          this.currentLotoPointFilesSubject.next([...files]);
        }),
        catchError((error) => {
          console.error('Error fetching LOTO point file links:', error);
          this.currentLotoPointFilesSubject.next([]);
          return of([]);
        })
      ).subscribe()
    }

    loadCurrentLotoFiles(lotoStandardId: number) {
      this.lotoService.getRelatedFiles(lotoStandardId).pipe(
        takeUntilDestroyed(this.destroyRef),
        map((response: SpringApiResponse<FileDto[]>) => response.responseData),
        tap((files: FileDto[]) => {
          this.currentLotoFilesSubject.next([...files]);
        }),
        catchError((error) => {
          console.error('Error fetching LOTO standard file links:', error);
          this.currentLotoFilesSubject.next([]);
          return of([]);
        })
      ).subscribe();
    }

    addFileToCurrentLotoFiles(fileDto: FileDto) {
      const currentFiles = this.currentLotoFilesSubject.getValue();
      const fileExists = currentFiles.some(file => file.id === fileDto.id);
    
      if (!fileExists) {
        // If the file doesn't exist, add it to the array
        this.currentLotoFilesSubject.next([...currentFiles, fileDto]);
      } else {
        // If the file already exists, you might want to update it
        const updatedFiles = currentFiles.map(file => 
          file.id === fileDto.id ? fileDto : file
        );
        this.currentLotoFilesSubject.next(updatedFiles);
      }
    
      // console.log(`File ${fileExists ? 'updated' : 'added'} in current standard files:`, fileDto);
    }

    removeFileFromCurrentLotoFiles(fileId: number) {
      const currentFiles = this.currentLotoFilesSubject.getValue();
      const updatedFiles = currentFiles.filter(file => file.id!== fileId);
      this.currentLotoFilesSubject.next(updatedFiles);
    }
    
    reorderLotoPoints(lotoPoints: LotoPointDto[]) {
      const currentStandardId = this.currentLotoSubject.getValue()?.id;
      if (!currentStandardId) {
        console.error('No current LOTO standard selected');
        return;
      }
      const lotoPointsIds = lotoPoints.map(p => p.id);
      if(!lotoPointsIds.length) {
        console.error('No LOTO points provided');
        return;
      }
      this.lotoService.reorderLotoPoints(currentStandardId,lotoPointsIds).pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((response) => {
          if(response && response.responseData){
            const currentStandards = this.allLotosSubject.getValue();
            const existingStandardIndex = currentStandards.findIndex(s => s.id === currentStandardId);
            if (existingStandardIndex!== -1) {
              // If the standard exists, update it in the array
              const updatedStandards = [...currentStandards];
              updatedStandards[existingStandardIndex] = this.normalizeLoto(response.responseData);
              this.allLotosSubject.next(updatedStandards);
            }

            this.currentLotoSubject.next(this.normalizeLoto(response.responseData));
            this.loadCurrentLotoFiles(currentStandardId);
          }
        }),
        catchError((error) => {
          console.error('Error reordering LOTO points:', error);
          return of(null);
        })
      ).subscribe();
    }

    
    importLotos(file: File) {
      this.lotoService.importLotos(file).pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((error) => {
          console.error('Error importing LOTOs:', error);
          return of(null);
        })
      ).subscribe(response => {
        if (response?.responseData) {
          const current = this.allLotosSubject.value;
          const imported = this.normalizeLotos(response.responseData);
          this.allLotosSubject.next([...imported, ...current]);
        }
      });
    }

    save(form: LotoDto[]) {
      if (!form.length) {
        console.error('No LOTOs provided');
        return;
      }
      this.lotoService.save(form).pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((response) => {
          if(response && response.responseData){
            this.updateLotosInList(this.normalizeLotos(response.responseData));
          }
        }),
        catchError((error) => {
          console.error('Error saving LOTOs:', error);
          return of(null);
        })
      ).subscribe();
    }


}
