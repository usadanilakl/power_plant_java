import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, computed, inject, signal } from '@angular/core';
import { LotoDrawingViewerComponent } from '../loto-standard/loto-drawing-viewer.component';
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
  imports: [LotoDrawingViewerComponent],
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
    }
  `
})
export class QrDrawingHostComponent implements OnChanges {
  /** Heading for the first frame — the tag or item the caller opened. */
  @Input({ required: true }) title!: string;
  /** Drawings to open on. An empty array renders nothing; hosts should say so in their own words. */
  @Input({ required: true }) drawings!: PointDrawing[];
  /** The viewer was closed outright (its ✕), from however deep the connector hops went. */
  @Output() exit = new EventEmitter<void>();

  private api = inject(QrApiService);

  frame = signal<ViewFrame | null>(null);
  connectorMap = signal<Record<number, QrConnector[]>>({});
  private stack = signal<ViewFrame[]>([]);

  /** Names the drawing one hop back, which is also what makes the viewer show its back button. */
  backLabel = computed(() => this.stack().at(-1)?.title ?? null);

  ngOnChanges(changes: SimpleChanges): void {
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
