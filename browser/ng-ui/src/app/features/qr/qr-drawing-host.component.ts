import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, computed, inject, signal } from '@angular/core';
import { LotoDrawingViewerComponent } from '../loto-standard/loto-drawing-viewer.component';
import { LotoPointActionsComponent } from '../loto-standard/loto-point-actions.component';
import { PointDrawing } from '../loto-standard/loto-standard.model';
import { QrApiService } from './qr-api.service';
import { QrConnector } from './qr.model';

/** One step of drawing-to-drawing navigation, so Back can retrace connector hops. */
interface ViewFrame {
  title: string;
  drawings: PointDrawing[];
}

/**
 * Hosts the drawing viewer for anything that can name a set of drawings: a scanned tag, an Equipment
 * Finder row, and whatever comes next.
 *
 * <p>Owns exactly the part both entry points need and neither should re-implement — fetching the
 * off-page references for the drawings on screen, following a tapped connector to another drawing, and
 * keeping a back stack so a hop is undoable. What it deliberately does NOT own is how the caller found
 * the drawings, or where {@link exit} should go: a scan falls back to its match picker, the finder
 * falls back to its results list.</p>
 *
 * <p>Replacing {@link drawings} re-seats the whole thing (new stack, new connectors), which is how a
 * host switches from one item to another without tearing the component down.</p>
 */
@Component({
  selector: 'app-qr-drawing-host',
  standalone: true,
  imports: [LotoDrawingViewerComponent, LotoPointActionsComponent],
  template: `
    @if (frame(); as f) {
      <app-loto-drawing-viewer
        [title]="f.title"
        [drawings]="f.drawings"
        [connectors]="connectorMap()"
        [backLabel]="backLabel()"
        (connectorTap)="openFile($event)"
        (back)="goBack()"
        (close)="exit.emit()"></app-loto-drawing-viewer>

      <!--
        Attachments / comments for the LOTO point the operator scanned (or opened from Finder).
        Rendered as a floating pill over the drawing viewer's fixed-position modal so photos and
        comments are one tap away without hiding the P&ID. Bound to the ORIGINAL pointId even
        after connector hops — the target of a hop is a different drawing, not a different point,
        so the actions the operator wants stay tied to what they scanned.
      -->
      @if (pointId != null) {
        <button type="button" class="qr-actions-pill"
                [class.active]="actionsOpen()"
                (click)="toggleActions()"
                [attr.aria-label]="actionsOpen() ? 'Hide attachments' : 'Show attachments'"
                [attr.aria-expanded]="actionsOpen()">
          @if (actionsOpen()) {
            ✕
            <span class="qr-actions-pill-label">Close</span>
          } @else {
            <!--
              Counts come from PwaQrController.resolveTag (photoCount + commentCount on QrMatchDto).
              We show them up-front so the operator can decide whether to open the panel without a
              tap-then-load round trip. Absent counts render as icon-only.
            -->
            <span class="qr-actions-pill-count-group">
              <span class="qr-actions-pill-count">📸 @if (hasPhotos()) { {{ photoCount ?? 0 }} }</span>
              <span class="qr-actions-pill-count">💬 @if (hasComments()) { {{ commentCount ?? 0 }} }</span>
            </span>
            <span class="qr-actions-pill-label">Photos & Comments</span>
          }
        </button>

        @if (actionsOpen()) {
          <div class="qr-actions-backdrop" (click)="actionsOpen.set(false)"></div>
          <div class="qr-actions-sheet" role="dialog" aria-modal="true">
            <div class="qr-actions-sheet-head">
              <span class="qr-actions-sheet-title">{{ pointLabel || title }}</span>
              <button type="button" class="qr-actions-sheet-x"
                      (click)="actionsOpen.set(false)" aria-label="Close">✕</button>
            </div>
            <div class="qr-actions-sheet-body">
              <app-loto-point-actions [pointId]="pointId!" [pointLabel]="pointLabel ?? null"></app-loto-point-actions>
            </div>
          </div>
        }
      }
    }
  `,
  styles: [`
    /* Sits above the drawing modal (z-index 1000). Bottom-right on phones so the operator's
       thumb can reach it without hiding drawing details in the center. */
    .qr-actions-pill {
      position: fixed;
      right: max(12px, env(safe-area-inset-right));
      bottom: max(72px, calc(env(safe-area-inset-bottom) + 72px));
      z-index: 1001;
      display: flex; align-items: center; gap: 0.4rem;
      padding: 0.55rem 0.9rem;
      background: var(--accent-color); color: #fff;
      border: none; border-radius: 999px;
      font-family: inherit; font-size: 0.9rem; font-weight: 700;
      box-shadow: 0 4px 14px rgba(0,0,0,0.4);
      cursor: pointer;
    }
    .qr-actions-pill.active { background: #444; }
    .qr-actions-pill-label { white-space: nowrap; }
    .qr-actions-pill-count-group {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-weight: 700;
      font-size: 0.85rem;
      line-height: 1;
    }
    .qr-actions-pill-count { white-space: nowrap; }
    @media (max-width: 480px) {
      /* Text label collapses on very narrow screens so the pill doesn't crowd zoom controls —
         the counts stay visible because that's the whole point of showing them up-front. */
      .qr-actions-pill-label { display: none; }
    }

    .qr-actions-backdrop {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.5);
      z-index: 1002;
    }
    .qr-actions-sheet {
      position: fixed;
      left: 50%; transform: translateX(-50%);
      bottom: 0;
      width: min(96vw, 640px);
      max-height: 82vh;
      z-index: 1003;
      display: flex; flex-direction: column;
      background: var(--secondary-background, #1e1e1e);
      border-top-left-radius: 14px; border-top-right-radius: 14px;
      border: 1px solid var(--border-color);
      border-bottom: none;
      box-shadow: 0 -8px 24px rgba(0,0,0,0.5);
      padding-bottom: env(safe-area-inset-bottom);
    }
    .qr-actions-sheet-head {
      display: flex; align-items: center; justify-content: space-between;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--border-color);
    }
    .qr-actions-sheet-title {
      font-weight: 700; color: var(--primary-text); font-size: 0.95rem;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      margin-right: 0.75rem;
    }
    .qr-actions-sheet-x {
      background: none; border: none;
      color: var(--secondary-text, #888);
      font-size: 1.1rem; cursor: pointer; padding: 0.25rem 0.5rem;
    }
    .qr-actions-sheet-body {
      padding: 0.75rem 1rem 1rem;
      overflow-y: auto;
      flex: 1 1 auto;
      -webkit-overflow-scrolling: touch;
    }
  `],
})
export class QrDrawingHostComponent implements OnChanges {
  /** Heading for the first frame — the tag or item the caller opened. */
  @Input({ required: true }) title!: string;
  /** Drawings to open on. An empty array renders nothing; hosts should say so in their own words. */
  @Input({ required: true }) drawings!: PointDrawing[];
  /**
   * LOTO point id the caller opened, when the match resolved to a lotoPoint (not equipment).
   * When set, a "📸 Photos & Comments" pill appears over the drawing viewer that expands the
   * shared per-point actions panel — same UX we use inside the walkdown flow. Null / undefined
   * hides the pill entirely, so an equipment-only match stays a pure drawing viewer.
   */
  @Input() pointId?: number | null;
  /** Label shown in the actions sheet header — usually the point's description or tag. */
  @Input() pointLabel?: string | null;
  /**
   * Attachment count for the point, rendered on the pill as "📸 3" so the operator can decide
   * whether to open the panel without tapping first. Absent / undefined = icon-only.
   */
  @Input() photoCount?: number | null;
  /** Comment count for the point, rendered on the pill as "💬 1". */
  @Input() commentCount?: number | null;
  /** The viewer was closed outright (its ✕), from however deep the connector hops went. */
  @Output() exit = new EventEmitter<void>();

  actionsOpen = signal(false);
  toggleActions(): void { this.actionsOpen.update(v => !v); }

  hasPhotos(): boolean { return this.photoCount != null && this.photoCount > 0; }
  hasComments(): boolean { return this.commentCount != null && this.commentCount > 0; }

  private api = inject(QrApiService);

  frame = signal<ViewFrame | null>(null);
  connectorMap = signal<Record<number, QrConnector[]>>({});
  private stack = signal<ViewFrame[]>([]);

  /** Names the drawing one hop back, which is also what makes the viewer show its back button. */
  backLabel = computed(() => this.stack().at(-1)?.title ?? null);

  ngOnChanges(changes: SimpleChanges): void {
    // Reset the actions sheet whenever the host is reseated onto a different point / match —
    // an open panel from the previous scan must NOT survive into the next one.
    if (changes['pointId'] || changes['drawings'] || changes['title']) {
      this.actionsOpen.set(false);
    }
    if (!changes['drawings'] && !changes['title']) return;
    this.stack.set([]);
    this.connectorMap.set({});
    const drawings = this.drawings ?? [];
    this.frame.set(drawings.length ? { title: this.title, drawings } : null);
    void this.loadConnectors(drawings.map(d => d.fileId));
  }

  /**
   * Follow an off-page reference. The target becomes a browse frame — a single drawing with no
   * highlight, since nothing on it was the thing we came for — and the previous frame is kept.
   */
  async openFile(fileId: number): Promise<void> {
    const info = await this.api.fileInfo(fileId).catch(() => null);
    if (!info) return; // offline and never cached — stay put rather than blanking the drawing
    const current = this.frame();
    if (current) this.stack.update(s => [...s, current]);
    this.frame.set({
      title: info.fileNumber || info.fileName || `Drawing #${fileId}`,
      drawings: [{ pointId: 0, fileId: info.fileId, fileName: info.fileName }],
    });
    this.connectorMap.set({ ...this.connectorMap(), [info.fileId]: info.connectors ?? [] });
  }

  /** Retrace one connector hop. Only reachable while the stack has something in it. */
  goBack(): void {
    const previous = this.stack().at(-1);
    if (!previous) return;
    this.stack.update(s => s.slice(0, -1));
    this.frame.set(previous);
  }

  /**
   * Pull the connectors for the drawings on screen. Fetched per file (and cached by the API service) so
   * an item on three P&IDs costs three small calls instead of one payload carrying drawings nobody
   * opened. Failures are silent: a missing overlay costs navigation, not the drawing itself.
   */
  private async loadConnectors(fileIds: number[]): Promise<void> {
    const unique = [...new Set(fileIds)];
    if (!unique.length) return;
    const results = await Promise.all(unique.map(id => this.api.fileInfo(id).catch(() => null)));
    const map: Record<number, QrConnector[]> = { ...this.connectorMap() };
    for (const info of results) {
      if (info) map[info.fileId] = info.connectors ?? [];
    }
    this.connectorMap.set(map);
  }
}
