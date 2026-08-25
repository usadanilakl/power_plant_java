import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MainLayoutComponent } from '../../layouts/main-layout/main-layout.component';
import { LotoDrawingViewerComponent } from '../loto-standard/loto-drawing-viewer.component';
import { PointDrawing } from '../loto-standard/loto-standard.model';
import { QrApiService, QrForbiddenError } from './qr-api.service';
import { QrConnector, QrMatch } from './qr.model';

/** One step of drawing-to-drawing navigation, so Back can retrace connector hops. */
interface ViewFrame {
  title: string;
  drawings: PointDrawing[];
}

/**
 * Landing page for a scanned LOTO/equipment label.
 *
 * <p>The label encodes a hub URL ({@code /qr/{tag}}); the hub redirects here, the route guard sends a
 * signed-out phone through login with a returnUrl, and this page turns the tag into the P&amp;ID with the
 * point circled on it. That replaces the old flow, which asked for a second sign-in against the hub —
 * an authority used for nothing else.</p>
 *
 * <p>The page owns navigation and the drawing viewer owns rendering: tapping an off-page reference emits
 * a target file id, and this component resolves it, pushes a frame, and swaps the viewer's descriptors.
 * The back stack means a connector hop is undoable without leaving the scan.</p>
 */
@Component({
  selector: 'app-qr-tag-page',
  standalone: true,
  imports: [MainLayoutComponent, LotoDrawingViewerComponent],
  template: `
    <app-main-layout [header]="'Tag ' + tag()">
      <ng-container main-content>
        <div class="qr-container">
          @if (loading()) {
            <p class="qr-msg">Looking up {{ tag() }}…</p>
          } @else if (error()) {
            <div class="qr-card">
              <p class="qr-msg qr-err">{{ error() }}</p>
              <button class="qr-btn" (click)="retry()">Try again</button>
              <button class="qr-btn qr-btn-plain" (click)="goHome()">Home</button>
            </div>
          } @else if (!matches().length) {
            <div class="qr-card">
              <p class="qr-msg">Nothing in the system matches <b>{{ tag() }}</b>.</p>
              <p class="qr-sub">If this label is new, the tag may not be built yet.</p>
              <button class="qr-btn qr-btn-plain" (click)="goHome()">Home</button>
            </div>
          } @else if (!frame()) {
            <!-- More than one thing carries this tag: let the operator say which. -->
            <p class="qr-sub">{{ matches().length }} matches for {{ tag() }}</p>
            <div class="qr-list">
              @for (m of matches(); track m.type + m.id) {
                <button class="qr-item" (click)="openMatch(m)">
                  <span class="qr-item-head">
                    <span class="qr-tag">{{ m.tagNumber }}</span>
                    <span class="qr-badge">{{ m.type === 'lotoPoint' ? 'LOTO point' : 'Equipment' }}</span>
                  </span>
                  @if (m.description) { <span class="qr-desc">{{ m.description }}</span> }
                  <span class="qr-count">{{ drawingCount(m) }}</span>
                </button>
              }
            </div>
          } @else if (!frame()!.drawings.length) {
            <div class="qr-card">
              <p class="qr-msg">No drawing is linked to <b>{{ tag() }}</b> yet.</p>
              @if (activeMatch()?.description) { <p class="qr-sub">{{ activeMatch()!.description }}</p> }
              <button class="qr-btn qr-btn-plain" (click)="closeViewer()">Back</button>
            </div>
          }
        </div>
      </ng-container>
    </app-main-layout>

    @if (frame() && frame()!.drawings.length) {
      <app-loto-drawing-viewer
        [title]="frame()!.title"
        [drawings]="frame()!.drawings"
        [connectors]="connectorMap()"
        [backLabel]="backLabel()"
        (connectorTap)="openFile($event)"
        (back)="goBack()"
        (close)="closeViewer()"></app-loto-drawing-viewer>
    }
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; }
    .qr-container { padding: 1rem; max-width: 720px; margin: 0 auto; width: 100%; box-sizing: border-box; }
    .qr-msg { color: var(--primary-text); text-align: center; margin: 0.6rem 0; }
    .qr-sub { color: var(--secondary-text, #888); text-align: center; font-size: 0.85rem; margin: 0.3rem 0 0.9rem; }
    .qr-err { color: #e74c3c; }
    .qr-card { background: var(--card-bg, #2a2a2a); border: 1px solid var(--border-color); border-radius: 12px; padding: 1.2rem; display: flex; flex-direction: column; gap: 0.6rem; align-items: center; }
    .qr-btn { background: var(--accent-color); color: #fff; border: none; border-radius: 8px; padding: 0.6rem 1.2rem; font-weight: 700; font-family: inherit; font-size: 0.95rem; cursor: pointer; }
    .qr-btn-plain { background: transparent; border: 1px solid var(--border-color); color: var(--secondary-text, #888); }
    .qr-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .qr-item { display: flex; flex-direction: column; gap: 0.25rem; text-align: left; background: var(--card-bg, #2a2a2a); border: 1px solid var(--border-color); border-radius: 10px; padding: 0.8rem 0.9rem; font-family: inherit; cursor: pointer; }
    .qr-item-head { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
    .qr-tag { font-weight: 700; color: var(--primary-text); }
    .qr-badge { font-size: 0.7rem; font-weight: 700; color: #fff; background: var(--accent-color); border-radius: 999px; padding: 0.15rem 0.55rem; }
    .qr-desc { color: var(--secondary-text, #888); font-size: 0.85rem; }
    .qr-count { color: var(--secondary-text, #888); font-size: 0.75rem; }
  `]
})
export class QrTagPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(QrApiService);

  tag = signal('');
  loading = signal(true);
  error = signal<string | null>(null);
  matches = signal<QrMatch[]>([]);
  activeMatch = signal<QrMatch | null>(null);
  /** What the viewer is showing now; null means the page (picker / message) is in front. */
  frame = signal<ViewFrame | null>(null);
  connectorMap = signal<Record<number, QrConnector[]>>({});

  /** Frames left behind by connector hops, so Back retraces them before leaving the scan. */
  private stack = signal<ViewFrame[]>([]);

  /** Names the drawing one hop back, which is also what makes the viewer show its back button. */
  backLabel = computed(() => this.stack().at(-1)?.title ?? null);

  async ngOnInit(): Promise<void> {
    this.tag.set(this.route.snapshot.paramMap.get('tag') ?? '');
    await this.resolve();
  }

  private async resolve(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const result = await this.api.resolveTag(this.tag());
      if (!result) {
        this.error.set('Could not reach the server, and this tag has not been opened on this phone before.');
        this.loading.set(false);
        return;
      }
      this.matches.set(result.matches ?? []);
      this.loading.set(false);
      // The overwhelmingly common case is a single match — skip a picker that has one choice on it.
      if (this.matches().length === 1) await this.openMatch(this.matches()[0]);
    } catch (e) {
      this.error.set(e instanceof QrForbiddenError
        ? 'This account does not have plant access, so drawings are not available. Ask an admin if you need it.'
        : 'Lookup failed. Please try again.');
      this.loading.set(false);
    }
  }

  retry(): void { void this.resolve(); }

  /** Commit to one match: show its drawings and fetch the connectors drawn on each of them. */
  async openMatch(m: QrMatch): Promise<void> {
    this.activeMatch.set(m);
    this.stack.set([]);
    this.frame.set({ title: m.tagNumber, drawings: m.drawings ?? [] });
    await this.loadConnectors((m.drawings ?? []).map(d => d.fileId));
  }

  /**
   * Follow an off-page reference. The target becomes a browse frame — a single drawing with no highlight
   * (nothing on it was scanned) — and the previous frame is kept so Back returns to the scanned point.
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
   * Leave the viewer outright (the ✕), however deep the connector hops went — back to the picker when
   * the tag was ambiguous, otherwise out to Home. Retracing one hop is {@link goBack}.
   */
  closeViewer(): void {
    this.stack.set([]);
    if (this.matches().length > 1) { this.frame.set(null); this.activeMatch.set(null); return; }
    this.goHome();
  }

  goHome(): void { void this.router.navigate(['/home']); }

  drawingCount(m: QrMatch): string {
    const n = m.drawings?.length ?? 0;
    return n === 1 ? '1 drawing' : `${n} drawings`;
  }

  /**
   * Pull the connectors for the drawings on screen. Fetched per file (and cached by the API service) so
   * a tag on three P&IDs gets three small calls instead of one payload carrying drawings nobody opened.
   * Failures are silent: a missing overlay costs navigation, not the drawing itself.
   */
  private async loadConnectors(fileIds: number[]): Promise<void> {
    const unique = [...new Set(fileIds)];
    const results = await Promise.all(unique.map(id => this.api.fileInfo(id).catch(() => null)));
    const map: Record<number, QrConnector[]> = { ...this.connectorMap() };
    for (const info of results) {
      if (info) map[info.fileId] = info.connectors ?? [];
    }
    this.connectorMap.set(map);
  }
}
