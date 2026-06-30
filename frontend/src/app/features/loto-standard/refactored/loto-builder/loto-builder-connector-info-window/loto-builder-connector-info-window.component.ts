import { Component, DestroyRef, computed, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { FileConnectorDto } from '../../../../../models/file/file-connector.model';
import { FileDto } from '../../../../../models/file/file.model';
import { RfFileApiService } from '../../../../files/refactored/services/rf-file-api.service';
import { RfFileConnectorApiService } from '../../../../files/refactored/services/rf-file-connector-api.service';
import { environment } from '../../../../../../environments/environment';

/**
 * Info window for a selected file-connector shape. Shows the target file's
 * label/number/name and three actions: Navigate (jump to target file),
 * Edit (open the connector edit dialog), and an on-demand Preview that
 * lazy-fetches the target FileDto and renders an inline thumbnail. The
 * preview is collapsed by default so a click-to-info doesn't waste a fetch
 * — only opens when the user explicitly asks.
 *
 * <p>Sibling to {@link LotoBuilderInfoWindowComponent} (which serves LOTO
 * points) — connectors carry different fields and different actions, so a
 * separate component keeps both clean. Positioned at the top-LEFT of the
 * viewer pane to avoid colliding with the LotoPoint info window (top-right).
 */
@Component({
  selector: 'app-loto-builder-connector-info-window',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loto-builder-connector-info-window.component.html',
  styleUrl: './loto-builder-connector-info-window.component.css',
})
export class LotoBuilderConnectorInfoWindowComponent {
  /** Selected connector — when null the window is hidden. */
  connector = input<FileConnectorDto | null>(null);

  navigate = output<FileConnectorDto>();
  edit = output<FileConnectorDto>();
  /** Emitted after a successful Link counterpart — parent should refresh
   *  the affected connector so the info window shows it as paired. */
  linked = output<{ connectorId: number; counterpartId: number }>();
  /** Open the connector's target file in the right pane (split view, in
   *  connector-target mode). Parent handles the mode switch + file load. */
  showInSplit = output<FileConnectorDto>();
  closed = output<void>();

  private fileApi = inject(RfFileApiService);
  private connectorApi = inject(RfFileConnectorApiService);
  private destroyRef = inject(DestroyRef);

  /** Preview state — lazy-loaded only when the user expands it. */
  previewExpanded = signal<boolean>(false);
  previewFile = signal<FileDto | null>(null);
  previewLoading = signal<boolean>(false);
  previewError = signal<string | null>(null);

  /** Track the connector currently associated with the preview so we drop
   *  the cached file when the user switches connectors. Otherwise the user
   *  expands preview for connector A → switches to connector B → the cached
   *  thumbnail still shows A's image while the new fetch resolves. */
  private previewedConnectorId: number | null = null;

  /** Unpaired reciprocals on the target file — populated when the user
   *  opens an unpaired connector. Empty = no candidate (Link button hidden);
   *  1 = single-click link; N = link to first match (could become a picker). */
  candidateCounterparts = signal<FileConnectorDto[]>([]);
  linking = signal(false);
  linkError = signal<string | null>(null);

  constructor() {
    // Fetch candidates whenever the visible connector changes AND it's
    // currently unpaired. Cleared on every switch so the previous
    // connector's candidates don't bleed into the new view.
    effect(() => {
      const c = this.connector();
      this.candidateCounterparts.set([]);
      this.linkError.set(null);
      if (!c || c.counterpartConnectorId != null) return;
      this.connectorApi.counterpartCandidates(c.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (resp) => {
            // Guard against late response after user switches connectors.
            if (this.connector()?.id !== c.id) return;
            this.candidateCounterparts.set(resp.responseData ?? []);
          },
          error: (err) => console.warn('[ConnectorInfoWindow] candidates fetch failed', err),
        });
    });
  }

  isVisible = computed(() => this.connector() !== null);

  displayLabel = computed(() => {
    const c = this.connector();
    if (!c) return '';
    return c.displayLabel();
  });

  targetFileNumber = computed(() => this.connector()?.targetFileNumber ?? null);
  targetFileName = computed(() => this.connector()?.targetFileName ?? null);
  hasCounterpart = computed(() => this.connector()?.counterpartConnectorId != null);
  pairKey = computed(() => this.connector()?.pairKey ?? null);
  /** Hint that pops up when this side is unpaired AND there are reciprocals
   *  but they're all hidden by the keyed-match filter. Tells the user
   *  "set the same pair key on the matching side to make them link". */
  noMatchHint = computed(() => {
    const c = this.connector();
    if (!c || this.hasCounterpart()) return null;
    if (this.candidateCounterparts().length > 0) return null;
    if (!c.pairKey) return null;
    return `No reciprocal connector on the target file has pair key "${c.pairKey}". Open the matching connector and set the same key.`;
  });
  /** Show Link button when this connector is unpaired AND at least one
   *  unpaired reciprocal exists on the target file. */
  canLink = computed(() => !this.hasCounterpart() && this.candidateCounterparts().length > 0);
  /** Preview <img> src — mirrors InteractiveImageComponent.pngUrl: prefix
   *  the API base URL and rewrite .pdf → .jpg so the server's PDF→image
   *  pipeline serves a renderable thumbnail. Without this the raw fileLink
   *  is a backend-relative path that the browser tries to load against
   *  the current page origin and the image breaks. */
  previewSrc = computed<string | null>(() => {
    const link = this.previewFile()?.fileLink;
    if (!link) return null;
    return `${environment.baseApiUrl}/${link.replaceAll('pdf', 'jpg')}`;
  });

  togglePreview(): void {
    const c = this.connector();
    if (!c?.targetFileId) return;
    const willExpand = !this.previewExpanded();
    this.previewExpanded.set(willExpand);
    if (!willExpand) return;
    // If we already have the right file cached, skip the fetch.
    if (this.previewedConnectorId === c.id && this.previewFile()) return;
    this.previewedConnectorId = c.id;
    this.previewFile.set(null);
    this.previewError.set(null);
    this.previewLoading.set(true);
    this.fileApi.getFileById(String(c.targetFileId))
      .pipe(map(r => FileDto.fromJson(r.responseData)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (file) => {
          // If the user already switched connectors before this resolved,
          // discard the response so we don't overwrite the new preview state.
          if (this.previewedConnectorId !== c.id) return;
          this.previewFile.set(file);
          this.previewLoading.set(false);
        },
        error: (err) => {
          if (this.previewedConnectorId !== c.id) return;
          console.error('[ConnectorInfoWindow] preview fetch failed', err);
          this.previewError.set('Failed to load preview');
          this.previewLoading.set(false);
        },
      });
  }

  onNavigate(): void {
    const c = this.connector();
    if (c) this.navigate.emit(c);
  }

  onShowInSplit(): void {
    const c = this.connector();
    if (c?.targetFileId) this.showInSplit.emit(c);
  }

  onEdit(): void {
    const c = this.connector();
    if (c) this.edit.emit(c);
  }

  /**
   * One-click link to the (unique) reciprocal. When N > 1 we still link to
   * the first candidate — disambiguation picker is a future enhancement;
   * in practice 99% of cases are 1:1 (one connector each direction).
   */
  onLink(): void {
    const c = this.connector();
    const candidates = this.candidateCounterparts();
    if (!c || candidates.length === 0 || this.linking()) return;
    const peer = candidates[0];
    this.linking.set(true);
    this.linkError.set(null);
    this.connectorApi.linkCounterpart(c.id, peer.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.linking.set(false);
          this.candidateCounterparts.set([]);
          this.linked.emit({ connectorId: c.id, counterpartId: peer.id });
        },
        error: (err) => {
          this.linking.set(false);
          this.linkError.set(err?.error?.message ?? err?.message ?? 'Failed to link');
        },
      });
  }

  close(): void {
    this.previewExpanded.set(false);
    this.closed.emit();
  }
}
