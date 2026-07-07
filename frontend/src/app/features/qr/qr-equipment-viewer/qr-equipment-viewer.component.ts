import { Component, inject, signal, computed, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import {
  RfUnifiedImageViewerComponent,
  ViewerDataSource,
  ViewerConfig,
} from '../../../shared/image/refactored/rf-unified-image-viewer/rf-unified-image-viewer.component';
import { EquipmentDto } from '../../../models/equipment/equipment.model';
import { LotoPointDto } from '../../../models/loto/loto-point.model';
import { RfShape } from '../../../shared/image/refactored/models/fr-shape.model';

/**
 * QR match returned by the backend resolver. One tag can match multiple
 * LotoPoints and/or Equipment rows — the frontend shows a picker whenever
 * more than one match comes back.
 *
 * Fields:
 *  - `type`: which side of the schema the match came from.
 *  - `target`: full DTO for the matched entity (LotoPointDto or EquipmentDto).
 *  - `equipmentOnPid`: every Equipment on the same P&ID as the target's
 *    drawing, so shape overlays render correctly. Empty when there is no
 *    drawing (see `incompleteReason`).
 *  - `targetEquipmentId`: id of the Equipment to highlight on the drawing.
 *    For a LotoPoint match, that's the first associated Equipment with a
 *    mainFile; for an Equipment match, it's the equipment itself.
 *  - `hasDrawing` / `incompleteReason`: distinguish "full drawing view",
 *    "LotoPoint with no equipment", and "LotoPoint/Equipment with no
 *    mainFile" so we can render an informative detail-only view instead
 *    of a broken empty canvas.
 */
interface QrMatch {
  type: 'lotoPoint' | 'equipment';
  id: number;
  tagNumber: string;
  description: string;
  target: any;
  equipmentOnPid: any[];
  targetEquipmentId: number | null;
  hasDrawing: boolean;
  incompleteReason: 'no-equipment' | 'no-drawing' | null;
}

interface QrLookupResponse {
  responseData: {
    matches: QrMatch[];
    lotoPointCount: number;
    equipmentCount: number;
  };
  message: string;
}

@Component({
  selector: 'app-qr-equipment-viewer',
  standalone: true,
  imports: [CommonModule, RfUnifiedImageViewerComponent],
  templateUrl: './qr-equipment-viewer.component.html',
  styleUrls: ['./qr-equipment-viewer.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class QrEquipmentViewerComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);

  tagNumber = signal<string>('');
  loading = signal(true);
  error = signal<string | null>(null);

  /**
   * All matches returned by the backend, in the order they should appear in
   * the picker: LotoPoints first (primary intent of the QR system), then
   * Equipment. When length is 1 the picker is skipped and the single match
   * becomes the active one automatically.
   */
  matches = signal<QrMatch[]>([]);

  /**
   * The match the user is currently viewing. Set to the sole match on
   * single-hit lookups; set by the user via {@link selectMatch} on
   * multi-hit lookups. Null while the picker is visible.
   */
  activeMatch = signal<QrMatch | null>(null);

  /**
   * Detail panel opened when the user clicks a shape on the drawing.
   * Independent from `activeMatch` — the active match is the SCANNED thing;
   * this signal is whichever equipment shape the user tapped on the P&ID.
   */
  selectedEquipment = signal<EquipmentDto | null>(null);

  /**
   * Only render the picker when there are multiple hits AND the user hasn't
   * picked one yet. Once a match is active, the picker collapses out of view.
   */
  showPicker = computed(() => this.matches().length > 1 && !this.activeMatch());

  /** Convenience view of the active match's equipment-on-P&ID list. */
  private activeEquipmentList = computed<EquipmentDto[]>(() => {
    const m = this.activeMatch();
    if (!m || !Array.isArray(m.equipmentOnPid)) return [];
    return m.equipmentOnPid.map((eq: any) => EquipmentDto.fromJson(eq));
  });

  /**
   * Data source for the shared image viewer. Only wired when the active
   * match has a drawing — otherwise the viewer is hidden and we render a
   * "no drawing available" details-only card instead.
   */
  dataSource = computed<ViewerDataSource>(() => ({
    type: 'equipment-list',
    equipmentList: this.activeEquipmentList(),
  }));

  /**
   * IDs to highlight on the drawing. For an Equipment match this is the
   * Equipment id itself; for a LotoPoint match it's the id of the first
   * associated Equipment with a mainFile (chosen server-side). One id in
   * the list, empty when the active match has no drawing to highlight on.
   */
  highlightedIds = computed<number[]>(() => {
    const m = this.activeMatch();
    return m?.targetEquipmentId ? [m.targetEquipmentId] : [];
  });

  /**
   * Prefer the JPG rendering of the target P&ID when available; fall back
   * to the raw fileLink (PDF) when only a PDF exists. See the previous
   * commit's comment for the full reasoning — {@code forceRasterImage=true}
   * both rewrites .pdf→.jpg AND enables the canvas viewer that draws
   * shapes on top of the raster. When there's no JPG derivative or no
   * drawing at all, we leave it off so the viewer falls back cleanly.
   *
   * The P&ID file that carries the extensions info lives on the highlighted
   * Equipment (LotoPoint doesn't own the file). Pulling it out of the
   * equipmentOnPid list keeps this type-agnostic.
   */
  preferJpgRaster = computed<boolean>(() => {
    const m = this.activeMatch();
    if (!m || !m.hasDrawing) return false;
    const highlightEquipment = this.activeEquipmentList().find(eq => eq.id === m.targetEquipmentId);
    const exts = highlightEquipment?.mainFileObject?.extensions;
    return Array.isArray(exts) && exts.some(e => e?.toLowerCase() === 'jpg');
  });

  viewerConfig: ViewerConfig = {
    showCarousel: false,
    showTable: false,
    tablePosition: 'none',
    collapsible: false,
    highlightMode: 'clicked',
    legend: false,
    emptyStateMessage: 'No P&ID found for this equipment.',
  };

  /** Display helper: capitalized "LOTO Point" / "Equipment" for the picker. */
  matchTypeLabel(m: QrMatch): string {
    return m.type === 'lotoPoint' ? 'LOTO Point' : 'Equipment';
  }

  /** Display helper: user-facing message for a match that can't render its drawing. */
  incompleteMessage(m: QrMatch): string | null {
    if (m.incompleteReason === 'no-equipment') {
      return 'This LOTO point has no associated equipment — no drawing to display.';
    }
    if (m.incompleteReason === 'no-drawing') {
      return m.type === 'lotoPoint'
        ? 'This LOTO point has equipment but none of it has an assigned drawing.'
        : 'This equipment has no assigned drawing.';
    }
    return null;
  }

  /** Cast helper for the template — the target's shape depends on match.type. */
  asLotoPoint(target: any): LotoPointDto | null {
    return target ? (target as LotoPointDto) : null;
  }
  asEquipment(target: any): EquipmentDto | null {
    return target ? (target as EquipmentDto) : null;
  }

  ngOnInit(): void {
    const tag = this.route.snapshot.paramMap.get('tagNumber') ?? '';
    this.tagNumber.set(tag);

    if (!tag) {
      this.error.set('No tag number provided.');
      this.loading.set(false);
      return;
    }

    // Path segment /qr/equipment/... is a legacy artifact — see the backend
    // controller comment. The endpoint now returns typed multi-match results.
    this.http.get<QrLookupResponse>(
      `${environment.apiUrl}/qr/equipment/${encodeURIComponent(tag)}`
    ).subscribe({
      next: (response) => {
        const data = response.responseData;
        if (!data || !Array.isArray(data.matches) || data.matches.length === 0) {
          this.error.set(`Nothing found for "${tag}".`);
          this.loading.set(false);
          return;
        }
        this.matches.set(data.matches);
        // Single-hit → auto-select. Multi-hit → show picker.
        if (data.matches.length === 1) {
          this.activeMatch.set(data.matches[0]);
        }
        this.loading.set(false);
      },
      error: (err) => {
        if (err.status === 404) {
          this.error.set(`Nothing found for "${tag}".`);
        } else {
          this.error.set('Failed to load. Please try again.');
        }
        this.loading.set(false);
      }
    });
  }

  /** Picker click — commit to a match and open its detail/drawing view. */
  selectMatch(match: QrMatch): void {
    this.activeMatch.set(match);
    this.selectedEquipment.set(null);
  }

  /** Back-to-picker affordance visible whenever multiple matches exist. */
  backToPicker(): void {
    this.activeMatch.set(null);
    this.selectedEquipment.set(null);
  }

  onShapeClicked(shape: RfShape): void {
    const equipment = this.activeEquipmentList().find(eq => eq.id === shape.id) ?? null;
    this.selectedEquipment.set(equipment);
  }

  closeDetail(): void {
    this.selectedEquipment.set(null);
  }

  goHome(): void {
    this.router.navigate(['/home']);
  }
}
