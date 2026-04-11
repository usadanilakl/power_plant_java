import { Injectable, inject, signal, computed } from '@angular/core';
import { Subject, forkJoin, of, switchMap, tap, catchError, EMPTY } from 'rxjs';
import { LotoPointDto } from '../../../../models/loto/loto-point.model';
import { RfLotoPointApiService } from './rf-loto-point-api.service';
import { LotoPointCounterpartService } from './loto-point-counterpart.service';
import { GlobalMessageService } from '../../../../shared/global-message/global-message.service';

export type BulkCreateSource = 'table' | 'engraver' | 'printer';

export interface BulkCreateCard {
  uid: string;
  lotoPoint: LotoPointDto;
  counterpartUid?: string;
  isSelected: boolean;
  status: 'draft' | 'saving' | 'saved' | 'error';
  savedId?: number;
  errorMessage?: string;
}

interface DraftData {
  uid: string;
  lotoPoint: any;
  counterpartUid?: string;
}

const STORAGE_KEY = 'bulk-create-loto-drafts';

@Injectable({ providedIn: 'root' })
export class LotoPointBulkCreateService {
  private apiService = inject(RfLotoPointApiService);
  private counterpartService = inject(LotoPointCounterpartService);
  private messageService = inject(GlobalMessageService);

  // State
  isVisible = signal(false);
  cards = signal<BulkCreateCard[]>([]);
  showBulkEdit = signal(false);
  isSaving = signal(false);
  sourceContext = signal<BulkCreateSource | null>(null);

  // Event: emits saved LotoPointDto[] after save completes
  savedItems$ = new Subject<LotoPointDto[]>();

  // Computed
  selectedCards = computed(() => this.cards().filter(c => c.isSelected));
  draftCards = computed(() => this.cards().filter(c => c.status === 'draft'));
  hasDrafts = computed(() => this.draftCards().length > 0);

  open(source: BulkCreateSource = 'table'): void {
    this.sourceContext.set(source);
    const drafts = this.loadDrafts();
    if (drafts.length > 0) {
      this.cards.set(drafts);
    } else {
      this.cards.set([]);
    }
    this.showBulkEdit.set(false);
    this.isSaving.set(false);
    this.isVisible.set(true);
  }

  close(): void {
    const drafts = this.cards().filter(c => c.status === 'draft');
    if (drafts.length > 0) {
      this.persistDrafts();
    } else {
      this.clearDrafts();
    }
    this.isVisible.set(false);
    this.cards.set([]);
    this.sourceContext.set(null);
    this.showBulkEdit.set(false);
  }

  addCard(): void {
    const card: BulkCreateCard = {
      uid: crypto.randomUUID(),
      lotoPoint: new LotoPointDto({}),
      isSelected: false,
      status: 'draft',
    };
    this.cards.update(cards => [...cards, card]);
    this.persistDrafts();
  }

  removeCard(uid: string): void {
    const card = this.cards().find(c => c.uid === uid);
    if (!card) return;

    // Also remove linked counterpart
    const counterpartUid = card.counterpartUid;
    this.cards.update(cards => cards.filter(c => c.uid !== uid && c.uid !== counterpartUid));

    // Clean up counterpartUid references
    if (counterpartUid) {
      this.cards.update(cards => cards.map(c =>
        c.counterpartUid === uid ? { ...c, counterpartUid: undefined } : c
      ));
    }
    this.persistDrafts();
  }

  updateCard(uid: string, lotoPoint: LotoPointDto): void {
    this.cards.update(cards => cards.map(c =>
      c.uid === uid ? { ...c, lotoPoint } : c
    ));
    this.persistDrafts();
  }

  toggleSelection(uid: string): void {
    this.cards.update(cards => cards.map(c =>
      c.uid === uid ? { ...c, isSelected: !c.isSelected } : c
    ));
  }

  selectAll(): void {
    this.cards.update(cards => cards.map(c =>
      c.status === 'draft' ? { ...c, isSelected: true } : c
    ));
  }

  deselectAll(): void {
    this.cards.update(cards => cards.map(c => ({ ...c, isSelected: false })));
  }

  applyBulkEdit(values: Partial<LotoPointDto>, target: 'all' | 'selected'): void {
    this.cards.update(cards => cards.map(card => {
      if (card.status !== 'draft') return card;
      if (target === 'selected' && !card.isSelected) return card;

      const merged = new LotoPointDto({ ...card.lotoPoint });
      for (const [key, val] of Object.entries(values)) {
        if (val !== null && val !== undefined && val !== '') {
          (merged as any)[key] = val;
        }
      }
      return { ...card, lotoPoint: merged };
    }));
    this.persistDrafts();
  }

  generateCounterpart(uid: string): void {
    const card = this.cards().find(c => c.uid === uid);
    if (!card || card.counterpartUid) return;

    const counterpart = this.counterpartService.generateCounterpart(card.lotoPoint);
    const counterpartCard: BulkCreateCard = {
      uid: crypto.randomUUID(),
      lotoPoint: counterpart,
      counterpartUid: uid,
      isSelected: false,
      status: 'draft',
    };

    this.cards.update(cards => {
      const idx = cards.findIndex(c => c.uid === uid);
      const updated = [...cards];
      // Link source to counterpart
      updated[idx] = { ...updated[idx], counterpartUid: counterpartCard.uid };
      // Insert counterpart right after source
      updated.splice(idx + 1, 0, counterpartCard);
      return updated;
    });
    this.persistDrafts();
  }

  saveCard(uid: string): void {
    const card = this.cards().find(c => c.uid === uid);
    if (!card || card.status !== 'draft') return;

    this.updateCardStatus(uid, 'saving');

    this.apiService.saveLotoPoint(card.lotoPoint).pipe(
      tap(response => {
        if (response.responseData) {
          const saved = LotoPointDto.fromJson(response.responseData);
          this.updateCardStatus(uid, 'saved', saved.id!);
          this.savedItems$.next([saved]);
          this.persistDrafts();
        }
      }),
      catchError(err => {
        this.updateCardStatus(uid, 'error', undefined, err.message || 'Save failed');
        return EMPTY;
      })
    ).subscribe();
  }

  saveAll(): void {
    this.saveCards(this.draftCards());
  }

  saveSelected(): void {
    this.saveCards(this.selectedCards().filter(c => c.status === 'draft'));
  }

  private saveCards(cardsToSave: BulkCreateCard[]): void {
    if (cardsToSave.length === 0) return;
    this.isSaving.set(true);

    // Mark all as saving
    cardsToSave.forEach(c => this.updateCardStatus(c.uid, 'saving'));

    const saves$ = cardsToSave.map(card =>
      this.apiService.saveLotoPoint(card.lotoPoint).pipe(
        tap(response => {
          if (response.responseData) {
            const saved = LotoPointDto.fromJson(response.responseData);
            this.updateCardStatus(card.uid, 'saved', saved.id!);
          }
        }),
        catchError(err => {
          this.updateCardStatus(card.uid, 'error', undefined, err.message || 'Save failed');
          return of(null);
        })
      )
    );

    forkJoin(saves$).pipe(
      switchMap(() => this.linkCounterpartPairs()),
      tap(() => {
        const savedCards = this.cards().filter(c => c.status === 'saved' && c.savedId);
        const savedDtos = savedCards.map(c => {
          const dto = new LotoPointDto({ ...c.lotoPoint });
          dto.id = c.savedId!;
          return dto;
        });
        if (savedDtos.length > 0) {
          this.savedItems$.next(savedDtos);
        }

        const errorCount = this.cards().filter(c => c.status === 'error').length;
        const savedCount = savedCards.length;
        if (errorCount > 0) {
          this.messageService.showError(`${savedCount} saved, ${errorCount} failed`);
        } else {
          this.messageService.showSuccess(`${savedCount} LOTO points created`);
        }
        this.isSaving.set(false);
        this.persistDrafts();
      })
    ).subscribe();
  }

  private linkCounterpartPairs() {
    const allCards = this.cards();
    const linkCalls$ = [];

    for (const card of allCards) {
      if (!card.counterpartUid || !card.savedId) continue;
      const counterpart = allCards.find(c => c.uid === card.counterpartUid);
      if (!counterpart?.savedId) continue;
      // Only link once per pair (from the one that comes first)
      if (allCards.indexOf(card) > allCards.indexOf(counterpart)) continue;

      linkCalls$.push(
        this.apiService.linkCounterparts(card.savedId, counterpart.savedId).pipe(
          catchError(err => {
            console.error('Failed to link counterparts:', err);
            return of(null);
          })
        )
      );
    }

    return linkCalls$.length > 0 ? forkJoin(linkCalls$) : of(null);
  }

  private updateCardStatus(uid: string, status: BulkCreateCard['status'], savedId?: number, errorMessage?: string): void {
    this.cards.update(cards => cards.map(c =>
      c.uid === uid ? { ...c, status, savedId: savedId ?? c.savedId, errorMessage } : c
    ));
  }

  // --- LocalStorage draft persistence ---

  private persistDrafts(): void {
    const drafts: DraftData[] = this.cards()
      .filter(c => c.status === 'draft')
      .map(c => ({
        uid: c.uid,
        lotoPoint: c.lotoPoint.toJson ? c.lotoPoint.toJson() : c.lotoPoint,
        counterpartUid: c.counterpartUid,
      }));
    if (drafts.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  private loadDrafts(): BulkCreateCard[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
      const drafts: DraftData[] = JSON.parse(raw);
      return drafts.map(d => ({
        uid: d.uid,
        lotoPoint: LotoPointDto.fromJson(d.lotoPoint),
        counterpartUid: d.counterpartUid,
        isSelected: false,
        status: 'draft' as const,
      }));
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return [];
    }
  }

  clearDrafts(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  /** Import cards from AI-generated data */
  importCards(cardDataList: Partial<LotoPointDto>[]): void {
    const newCards: BulkCreateCard[] = cardDataList.map(data => ({
      uid: crypto.randomUUID(),
      lotoPoint: new LotoPointDto(data),
      isSelected: false,
      status: 'draft' as const,
    }));
    this.cards.update(cards => [...cards, ...newCards]);
    this.persistDrafts();
  }
}
