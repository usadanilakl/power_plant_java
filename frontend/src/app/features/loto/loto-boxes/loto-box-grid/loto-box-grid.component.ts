import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LotoBoxDto } from '../../../../models/loto/loto-box.model';
import { LockDto } from '../../../../models/loto/lock.model';
import { LotoBoxStateService, LotoBoxStatus } from './loto-box-state.service';
import { LotoBoxService } from './loto-box.service';
import { LockService } from '../../../../services/loto/lock.service';
import { CommentsDialogService } from '../../../../shared/comments-dialog/comments-dialog.service';
import { CommentService } from '../../../../services/comment.service';

@Component({
  selector: 'app-loto-box-grid',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './loto-box-grid.component.html',
  styleUrl: './loto-box-grid.component.css'
})
export class LotoBoxGridComponent implements OnInit {
  private stateService = inject(LotoBoxStateService);
  private boxService = inject(LotoBoxService);
  private lockService = inject(LockService);
  private commentsDialog = inject(CommentsDialogService);
  private commentService = inject(CommentService);
  private destroyRef = inject(DestroyRef);

  // Fixed grid layout: 12 columns x 6 rows = 72 boxes
  readonly GRID_COLUMNS = 12;
  readonly GRID_ROWS = 6;
  readonly TOTAL_BOXES = 72;
  readonly LOCK_PREVIEW_LIMIT = 5;

  allBoxes = signal<LotoBoxDto[]>([]);
  isLoading = this.stateService.isLoading;
  statusMessage = this.stateService.statusMessage;
  activeDropdown = signal<number | null>(null);

  editMode = signal(false);
  showInactive = signal(false);
  selectedBox = signal<LotoBoxDto | null>(null);

  // boxId -> comment count
  commentCounts = signal<Record<number, number>>({});

  // Edit-dialog form state
  editDraft = signal<{
    id: number | null;
    number: number;
    description: string;
    setSize: number;
    portable: boolean;
    active: boolean;
  } | null>(null);

  // Lock-add form state inside the edit dialog
  newLockStartNumber = signal<number>(0);
  newLockCount = signal<number>(1);
  newLockIsSingle = signal<boolean>(false);
  newLockType = signal<string>('LOCK');

  statuses: LotoBoxStatus[] = ['building', 'test', 'active', 'closed'];

  // Fixed-slot boxes (1-72, non-portable, applying inactive filter)
  fixedSlots = computed(() => {
    const fixed = this.allBoxes().filter(b => !b.portable);
    const slots: LotoBoxDto[] = [];
    for (let i = 1; i <= this.TOTAL_BOXES; i++) {
      const existing = fixed.find(b => b.number === i);
      if (existing) {
        if (!existing.active && !this.showInactive()) {
          slots.push(this.placeholder(i));
        } else {
          slots.push(existing);
        }
      } else {
        slots.push(this.placeholder(i));
      }
    }
    return slots;
  });

  portableBoxes = computed(() =>
    this.allBoxes()
      .filter(b => b.portable && (b.active || this.showInactive()))
      .sort((a, b) => a.number - b.number)
  );

  ngOnInit() {
    this.loadBoxes();

    this.stateService.allBoxes$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(boxes => {
        this.allBoxes.set(boxes);
        this.refreshCommentCounts(boxes);
      });

    // Refresh affected box's count when comments change
    this.commentsDialog.commentChanged$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(event => {
        if (!event) {
          this.refreshCommentCounts(this.allBoxes());
        } else if (event.entityType === 'LotoBox' && event.entityId) {
          this.refreshCommentCountFor(event.entityId);
        }
      });

    if (typeof window !== 'undefined') {
      window.addEventListener('click', (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        if (!target.closest('.box') && !target.closest('.box-modal')) {
          this.activeDropdown.set(null);
        }
      });
    }
  }

  private refreshCommentCounts(boxes: LotoBoxDto[]) {
    boxes.filter(b => !!b.id).forEach(b => this.refreshCommentCountFor(b.id!));
  }

  private refreshCommentCountFor(boxId: number) {
    this.commentService.getCommentsForEntity('LotoBox', boxId).subscribe({
      next: (response) => {
        const list = response.responseData ?? [];
        this.commentCounts.update(prev => ({ ...prev, [boxId]: list.length }));
      }
    });
  }

  commentCount(boxId: number): number {
    return this.commentCounts()[boxId] ?? 0;
  }

  private placeholder(n: number): LotoBoxDto {
    return new LotoBoxDto({ number: n, r: 0, g: 0, b: 32, brightness: 255 });
  }

  loadBoxes() {
    this.stateService.loadBoxesFromLedStatus();
  }

  // --- View-mode interactions ---

  onBoxClick(box: LotoBoxDto, event: Event) {
    event.stopPropagation();
    if (this.editMode()) {
      this.openEditDialog(box);
    } else {
      this.toggleDropdown(box.number);
    }
  }

  toggleDropdown(boxNumber: number) {
    this.activeDropdown.set(this.activeDropdown() === boxNumber ? null : boxNumber);
  }

  setBoxStatus(box: LotoBoxDto, status: LotoBoxStatus, event: Event) {
    event.stopPropagation();
    this.stateService.setBoxStatus(box, status, true, true);
    this.activeDropdown.set(null);
  }

  toggleManualOverride(box: LotoBoxDto, event: Event) {
    event.stopPropagation();
    this.stateService.toggleManualOverride(box);
  }

  updateAllBoxes() {
    this.stateService.updateAllBoxes();
  }

  getBoxColor(box: LotoBoxDto): string {
    if (!box.active) return 'rgba(0, 0, 0, 0.3)';
    if (box.r !== undefined && box.g !== undefined && box.b !== undefined) {
      return `rgb(${box.r}, ${box.g}, ${box.b})`;
    }
    return 'rgb(0, 0, 0)';
  }

  getStatusLabel(status: LotoBoxStatus): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  isManualOverride(box: LotoBoxDto): boolean {
    return box.manualOverride ?? false;
  }

  // Lock summary string for a cell.
  // Set boxes show "Set: N". Single-lock home boxes show first N lock numbers + "+X" overflow.
  getLockSummary(box: LotoBoxDto): string {
    if (!box.id) return '';
    if (box.setSize && box.setSize > 0) return `Set: ${box.setSize}`;
    const singles = (box.homeLocks ?? []).filter(l => l.isSingleLock);
    if (singles.length === 0) return '';
    const visible = singles.slice(0, this.LOCK_PREVIEW_LIMIT).map(l => `#${l.number}`).join(', ');
    const overflow = singles.length - this.LOCK_PREVIEW_LIMIT;
    return overflow > 0 ? `${visible} +${overflow}` : visible;
  }

  // --- Side panel ---

  openSidePanel(box: LotoBoxDto, event: Event) {
    event.stopPropagation();
    if (!box.id) return;
    this.selectedBox.set(box);
    this.activeDropdown.set(null);
  }

  closeSidePanel() {
    this.selectedBox.set(null);
  }

  openComments(entityType: string, entityId: number, event: Event) {
    event.stopPropagation();
    this.commentsDialog.open(entityType, entityId);
  }

  // --- Edit mode ---

  toggleEditMode() {
    this.editMode.set(!this.editMode());
    this.activeDropdown.set(null);
  }

  toggleShowInactive() {
    this.showInactive.set(!this.showInactive());
  }

  addBox(portable: boolean = false) {
    const next = this.nextAvailableNumber(portable);
    if (next < 0) {
      alert('Fixed grid (1–72) is full. Reactivate an inactive box, or add a portable box instead.');
      return;
    }
    this.createBoxAtNumber(next, portable);
  }

  private createBoxAtNumber(number: number, portable: boolean) {
    const draft = new LotoBoxDto({ number, portable, active: true, setSize: 0 });
    this.boxService.createLotoBox(draft).subscribe({
      next: (response) => {
        const created = LotoBoxDto.fromJson(response.responseData);
        this.allBoxes.set([...this.allBoxes(), created]);
        this.statusMessage.set(`Box ${created.number} created`);
        this.openEditDialog(created);
      },
      error: (err) => {
        const msg = err?.error?.message ?? err.message;
        // Number-collision recovery: server has a row our cache didn't. Refetch + retry once.
        if (typeof msg === 'string' && msg.includes('already exists')) {
          this.boxService.getAllBoxes().subscribe(resp => {
            const fresh = (resp.responseData ?? []).map((b: any) => LotoBoxDto.fromJson(b));
            this.allBoxes.set(fresh);
            const retry = this.nextAvailableNumber(portable);
            if (retry < 0 || retry === number) {
              this.statusMessage.set(`Could not reserve a free number: ${msg}`);
              return;
            }
            this.createBoxAtNumber(retry, portable);
          });
          return;
        }
        console.error(err);
        this.statusMessage.set(`Error creating box: ${msg}`);
      }
    });
  }

  private nextAvailableNumber(portable: boolean): number {
    const all = this.allBoxes();
    if (portable) {
      const portableNums = all.filter(b => b.portable).map(b => b.number);
      const allNums = all.map(b => b.number);
      const start = portableNums.length === 0 ? 101 : Math.max(...portableNums) + 1;
      // Skip forward past any number already used by any box (fixed or portable)
      let candidate = start;
      while (allNums.includes(candidate)) candidate++;
      return candidate;
    }
    // Fixed: fill first gap in 1-72; signal full if none.
    const fixedNums = all.filter(b => !b.portable).map(b => b.number);
    for (let i = 1; i <= this.TOTAL_BOXES; i++) {
      if (!fixedNums.includes(i)) return i;
    }
    return -1;
  }

  // --- Edit dialog ---

  openEditDialog(box: LotoBoxDto) {
    if (!box.id) return;
    this.editDraft.set({
      id: box.id,
      number: box.number,
      description: box.description ?? '',
      setSize: box.setSize ?? 0,
      portable: box.portable ?? false,
      active: box.active ?? true,
    });
    // Default new-lock starting number to (highest existing) + 1, or 1
    const homeLocks = (box.homeLocks ?? []).map(l => l.number);
    this.newLockStartNumber.set(homeLocks.length === 0 ? (box.number * 10) : Math.max(...homeLocks) + 1);
    this.newLockCount.set(1);
    this.newLockIsSingle.set(false);
    this.newLockType.set('LOCK');
    this.selectedBox.set(box);
  }

  closeEditDialog() {
    this.editDraft.set(null);
    this.selectedBox.set(null);
  }

  saveEditDialog() {
    const draft = this.editDraft();
    if (!draft || draft.id == null) return;
    this.boxService.updateLotoBox(draft.id.toString(), new LotoBoxDto({
      id: draft.id,
      number: draft.number,
      description: draft.description,
      setSize: draft.setSize,
      portable: draft.portable,
      active: draft.active,
    })).subscribe({
      next: (response) => {
        const updated = LotoBoxDto.fromJson(response.responseData);
        this.upsertBox(updated);
        this.selectedBox.set(updated);
        this.statusMessage.set(`Box ${updated.number} updated`);
      },
      error: (err) => {
        console.error(err);
        this.statusMessage.set(`Error updating box: ${err?.error?.message ?? err.message}`);
      }
    });
  }

  deactivateBox() {
    const draft = this.editDraft();
    if (!draft || draft.id == null) return;
    if (!confirm(`Deactivate box ${draft.number}? It will be hidden from the grid.`)) return;
    this.boxService.deactivateBox(draft.id).subscribe({
      next: () => {
        this.statusMessage.set(`Box ${draft.number} deactivated`);
        this.loadBoxes();
        this.closeEditDialog();
      },
      error: (err) => {
        console.error(err);
        this.statusMessage.set(`Error deactivating box: ${err?.error?.message ?? err.message}`);
      }
    });
  }

  bulkAddLocks() {
    const draft = this.editDraft();
    if (!draft || draft.id == null) return;
    const start = this.newLockStartNumber();
    const count = this.newLockCount();
    const single = this.newLockIsSingle();
    if (count <= 0) return;
    this.boxService.bulkAddLocks(draft.id, start, count, single, this.newLockType()).subscribe({
      next: (response) => {
        const updated = LotoBoxDto.fromJson(response.responseData);
        this.upsertBox(updated);
        this.openEditDialog(updated);
        this.statusMessage.set(`${count} lock(s) added to box ${updated.number}`);
      },
      error: (err) => {
        console.error(err);
        this.statusMessage.set(`Error adding locks: ${err?.error?.message ?? err.message}`);
      }
    });
  }

  deleteLock(lock: LockDto, event: Event) {
    event.stopPropagation();
    if (!lock.id) return;
    if (!confirm(`Delete lock #${lock.number}?`)) return;
    this.lockService.deleteLock(lock.id.toString()).subscribe({
      next: () => {
        const draft = this.editDraft();
        if (draft && draft.id != null) {
          this.boxService.getLotoBoxById(draft.id.toString()).subscribe(r => {
            const updated = LotoBoxDto.fromJson(r.responseData);
            this.upsertBox(updated);
            this.openEditDialog(updated);
          });
        }
        this.statusMessage.set(`Lock #${lock.number} deleted`);
      },
      error: (err) => {
        console.error(err);
        this.statusMessage.set(`Error deleting lock: ${err?.error?.message ?? err.message}`);
      }
    });
  }

  toggleLockSingle(lock: LockDto, event: Event) {
    event.stopPropagation();
    if (!lock.id) return;
    const updated = new LockDto({ ...lock, isSingleLock: !lock.isSingleLock });
    this.lockService.updateLock(lock.id.toString(), updated).subscribe({
      next: () => {
        const draft = this.editDraft();
        if (draft && draft.id != null) {
          this.boxService.getLotoBoxById(draft.id.toString()).subscribe(r => {
            const fresh = LotoBoxDto.fromJson(r.responseData);
            this.upsertBox(fresh);
            this.openEditDialog(fresh);
          });
        }
      },
      error: (err) => {
        console.error(err);
        this.statusMessage.set(`Error updating lock: ${err?.error?.message ?? err.message}`);
      }
    });
  }

  private upsertBox(box: LotoBoxDto) {
    const all = this.allBoxes();
    const idx = all.findIndex(b => b.id === box.id);
    if (idx >= 0) {
      const next = [...all];
      next[idx] = box;
      this.allBoxes.set(next);
    } else {
      this.allBoxes.set([...all, box]);
    }
  }

  isPlaceholder(box: LotoBoxDto): boolean {
    return !box.id;
  }

  // Template helpers for editDraft updates
  updateDraftNumber(value: number) {
    const d = this.editDraft();
    if (d) this.editDraft.set({ ...d, number: Number(value) });
  }
  updateDraftDescription(value: string) {
    const d = this.editDraft();
    if (d) this.editDraft.set({ ...d, description: value });
  }
  updateDraftSetSize(value: number) {
    const d = this.editDraft();
    if (d) this.editDraft.set({ ...d, setSize: Number(value) });
  }
  updateDraftPortable(value: boolean) {
    const d = this.editDraft();
    if (d) this.editDraft.set({ ...d, portable: value });
  }
  updateDraftActive(value: boolean) {
    const d = this.editDraft();
    if (d) this.editDraft.set({ ...d, active: value });
  }
}
