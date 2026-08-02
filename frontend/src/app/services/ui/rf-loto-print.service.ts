import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { LotoPointDto } from '../../models/loto/loto-point.model';
import { FileDto } from '../../models/file/file.model';
import { EquipmentModel } from '../../models/equipment/equipment.model';

/**
 * Input shape for {@link RfLotoPrintService.print} — duck-typed so
 * both {@code LotoStandardDto} and {@code LotoDto} (LOTO permit) fit
 * without an explicit type union. Only reads name/description for the
 * page header + iterates lotoPoints in order for shape indexing.
 */
export interface RfLotoPrintable {
  name?: string | null;
  description?: string | null;
  lotoPoints?: LotoPointDto[] | null;
}

/**
 * Client-side "Print P&IDs" service — emits a self-contained HTML
 * document that renders each unique P&ID referenced by a LOTO Standard
 * (or LOTO permit) as an `<img>` with an SVG overlay of the equipment
 * shapes used in the procedure, each tagged with its 1-based ordinal
 * from the point-list order.
 * <p>
 * <b>Why SVG overlay instead of a canvas snapshot?</b> The earlier
 * canvas approach (offscreen canvas + drawImage + toDataURL('image/jpeg'))
 * failed silently on production P&IDs — Chrome canvas-memory limits
 * caused drawImage to silently no-op on large images, leaving a
 * transparent canvas that JPEG-encodes as SOLID BLACK. The SVG-overlay
 * approach uses the browser's native `<img>` load path (identical to
 * what the on-screen Images tab uses, which works reliably) and layers
 * inline SVG shapes on top — no canvas, no memory ceiling, no
 * black-page failure mode, sharper printout, and it degrades
 * gracefully if a single P&ID's image URL is broken.
 * <p>
 * All shapes render as their axis-aligned bounding rectangles for
 * simplicity — the goal is "which equipment on this drawing is part
 * of the procedure + what's its point number", not a pixel-perfect
 * reproduction of every SVG-symbol glyph. If future callers need full
 * symbol rendering in print, a per-symbol `<path>` translator can
 * plug into {@link #shapeSvg}.
 */
@Injectable({ providedIn: 'root' })
export class RfLotoPrintService {

  /**
   * Rasterize every P&ID referenced by the source's LOTO points with
   * highlighted + indexed shapes, then open a new tab and print.
   * <p>
   * Silently returns if the source has no points or no images. On
   * image-load failure the corresponding page's overlay still renders
   * (viewBox is known from the equipment coordinates) — the printout
   * shows shape rectangles even if the P&ID image is missing.
   */
  async print(source: RfLotoPrintable): Promise<void> {
    const points = source.lotoPoints ?? [];
    if (points.length === 0) {
      alert('No LOTO points on this standard — nothing to print.');
      return;
    }

    // Dedup files by id, preserving first-encountered order — matches
    // the ordering the on-screen carousel uses so the printout scans
    // in the same sequence the operator saw on the Images tab.
    const files = this.collectUniqueFiles(points);
    if (files.length === 0) {
      alert('None of the LOTO points on this standard have an attached P&ID.');
      return;
    }

    const pages = files.map(file => this.buildPage(file, points));
    const title = source.name || source.description || 'LOTO Standard';
    const html = this.composePrintHtml(title, points.length, pages);
    this.openPrintWindow(html);
  }

  /** Iterate lotoPoints[*].equipmentList[*].mainFileObject and dedup
   *  by id. Skips points with no equipment or no attached file. */
  private collectUniqueFiles(points: LotoPointDto[]): FileDto[] {
    const seen = new Set<number>();
    const files: FileDto[] = [];
    for (const point of points) {
      const equipmentList = point.equipmentList ?? [];
      for (const equipment of equipmentList) {
        const file = (equipment as any).mainFileObject as FileDto | null | undefined;
        if (!file?.id) continue;
        if (seen.has(file.id)) continue;
        seen.add(file.id);
        files.push(file);
      }
    }
    return files;
  }

  /**
   * Build one printable page: page header + image + SVG overlay with
   * shape rectangles + numbered badges. Reads the natural P&ID
   * dimensions from any shape's stored {@code originalPictureSize}
   * (all shapes on a given file were mapped from the same source
   * dimensions) so the SVG viewBox lines up with the image pixel
   * grid regardless of how the browser scales the image for print.
   */
  private buildPage(file: FileDto, points: LotoPointDto[]): PagePayload {
    const url = environment.baseApiUrl + '/' + (file.fileLink ?? '').replaceAll('pdf', 'jpg');
    const overlaid = this.collectShapesForFile(file.id!, points);
    return { file, url, overlaid };
  }

  /**
   * Pull every equipment shape that belongs to this file id, tagged
   * with its 1-based ordinal from the source's LOTO-point order.
   * Skips equipment lacking coordinates or picture-size metadata.
   * Same filter the on-screen viewer applies (see
   * {@code RfUnifiedImageViewerComponent.currentShapes}).
   */
  private collectShapesForFile(fileId: number, points: LotoPointDto[]): OverlaidShape[] {
    const shapes: OverlaidShape[] = [];
    points.forEach((point, i) => {
      const equipmentList = point.equipmentList ?? [];
      for (const eq of equipmentList) {
        if ((eq as any).mainFileObject?.id !== fileId) continue;
        if (!eq.coordinates || !eq.originalPictureSize) continue;
        const box = parseBoundingBox(eq.coordinates);
        const size = parsePictureSize(eq.originalPictureSize);
        if (!box || !size) continue;
        shapes.push({
          x: box.x, y: box.y, width: box.width, height: box.height,
          rotation: box.rotation ?? (eq as any).rotation ?? 0,
          pictureWidth: size.width, pictureHeight: size.height,
          pointIndex: i + 1,
        });
      }
    });
    return shapes;
  }

  /**
   * Compose the full self-contained print HTML. Cover page + one
   * landscape letter page per P&ID; each page's SVG overlay uses
   * viewBox = the P&ID's natural size so shape coordinates map 1:1
   * to image pixels no matter what CSS-scale the browser prints at.
   * Auto-invokes window.print() once every &lt;img&gt; has loaded
   * (or errored), so the print dialog only appears when the operator
   * would actually see something meaningful.
   */
  private composePrintHtml(title: string, pointCount: number, pages: PagePayload[]): string {
    const printed = new Date().toLocaleDateString();
    const pagesHtml = pages.map((page, i) => {
      const fileName = esc(page.file.name || page.file.fileLink || `File ${page.file.id}`);
      const header = `<div class="page-header"><span class="p-title">${esc(title)}</span><span class="p-file">${fileName}</span><span class="p-num">Page ${i + 1} of ${pages.length}</span></div>`;

      // Overlay viewBox comes from the first shape's stored picture
      // dimensions (all shapes on the same file share the same
      // originalPictureSize). Falls back to 1000×750 if a page has no
      // shapes — the operator still sees the image and the page frame.
      const first = page.overlaid[0];
      const vbW = first?.pictureWidth ?? 1000;
      const vbH = first?.pictureHeight ?? 750;
      const overlayShapes = page.overlaid.map(s => this.shapeSvg(s)).join('');
      const imgSrc = esc(page.url);

      return `<section class="page">
        ${header}
        <div class="pid-wrap">
          <img class="pid" src="${imgSrc}" alt="${fileName}"
               onerror="this.classList.add('missing')" />
          <svg class="overlay" viewBox="0 0 ${vbW} ${vbH}" preserveAspectRatio="xMidYMid meet">${overlayShapes}</svg>
          <div class="fallback-msg">Could not load ${fileName}</div>
        </div>
      </section>`;
    }).join('');

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(title)} — P&IDs</title>
<style>
  @page { size: letter landscape; margin: 0.3in; }
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #000; margin: 0; }
  .cover { padding: 1in 0.5in 0.5in; text-align: center; page-break-after: always; }
  .cover h1 { font-size: 28px; margin: 0 0 8px; }
  .cover .subtitle { font-size: 14px; color: #555; }
  .cover .meta { margin-top: 1in; font-size: 12px; color: #666; }
  .cover .legend { margin-top: 0.5in; display: inline-block; text-align: left; font-size: 12px; color: #444; }
  .cover .legend .item { display: flex; align-items: center; gap: 8px; margin: 4px 0; }
  .cover .legend .sw { width: 14px; height: 14px; border: 2px solid #0000ff; background: rgba(0,0,255,0.08); }
  .cover .legend .bd { width: 16px; height: 16px; border-radius: 50%; background: #fff; border: 1.5px solid #1f2933;
                       color: #1f2933; font-weight: 700; font-size: 10px; display: flex; align-items: center; justify-content: center; }
  .page { page-break-after: always; }
  .page:last-child { page-break-after: auto; }
  .page-header { display: flex; justify-content: space-between; align-items: baseline; gap: 12px;
                 border-bottom: 1px solid #999; padding-bottom: 4px; margin-bottom: 6px; font-size: 11px; color: #333; }
  .p-title { font-weight: bold; }
  .p-file { flex: 1 1 auto; text-align: center; color: #666; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .p-num { color: #666; }
  /* Wrap positions the image + SVG overlay in the same box; overlay
     sits on top with pointer-events:none. object-fit: contain keeps
     the P&ID aspect ratio; viewBox on the SVG matches so shapes stay
     aligned regardless of page/print scale. */
  .pid-wrap { position: relative; width: 100%; height: calc(100vh - 40px); }
  img.pid { display: block; width: 100%; height: 100%; object-fit: contain; }
  img.pid.missing { visibility: hidden; }
  img.pid.missing + svg.overlay { display: none; }
  img.pid.missing ~ .fallback-msg { display: block; }
  svg.overlay { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
  .fallback-msg { display: none; position: absolute; inset: 0; align-items: center; justify-content: center;
                  color: #b00; font-style: italic; font-size: 14px; }
  img.pid.missing ~ .fallback-msg { display: flex; }
</style></head><body>
  <div class="cover">
    <h1>${esc(title)}</h1>
    <div class="subtitle">P&amp;ID Drawings</div>
    <div class="meta">${pages.length} drawing${pages.length === 1 ? '' : 's'} · ${pointCount} LOTO point${pointCount === 1 ? '' : 's'} · printed ${printed}</div>
    <div class="legend">
      <div class="item"><span class="sw"></span><span>Equipment used in this procedure</span></div>
      <div class="item"><span class="bd">1</span><span>Number matches the LOTO point row in order</span></div>
    </div>
  </div>
  ${pagesHtml}
  <script>
    // Wait for every <img> to finish (load OR error) before printing —
    // otherwise the browser fires print() before P&IDs render and the
    // first sheet comes out blank. 5-second cap keeps a hung load from
    // blocking print indefinitely.
    (function(){
      var imgs = Array.prototype.slice.call(document.querySelectorAll('img.pid'));
      var remaining = imgs.length;
      var done = false;
      function finish(){ if (done) return; done = true; setTimeout(function(){ window.print(); }, 100); }
      if (remaining === 0) { finish(); return; }
      imgs.forEach(function(img){
        if (img.complete) { if (--remaining === 0) finish(); return; }
        img.addEventListener('load', function(){ if (--remaining === 0) finish(); });
        img.addEventListener('error', function(){ if (--remaining === 0) finish(); });
      });
      setTimeout(finish, 5000);
    })();
  </script>
</body></html>`;
  }

  /**
   * Render one equipment shape as SVG — an axis-aligned outline
   * rectangle in the highlight color plus a numbered circular badge
   * anchored OUTSIDE the top-right corner. Uses the shape's stored
   * picture-size as the viewBox coordinate space, so `x/y/width/height`
   * plot directly. Rotation is applied via `transform` around the
   * shape's own center (matches the canvas renderer's behaviour).
   * <p>
   * Badge placement: center is offset diagonally OUT of the shape's
   * top-right corner (past the outline, not inside). Two reasons:
   * <ul>
   *   <li>Small equipment shapes have tag numbers rendered nearby on
   *       the P&ID (usually below or beside the symbol) — an inside
   *       badge would cover them. Outside placement leaves the
   *       drawing's own text readable.</li>
   *   <li>For visually tiny shapes (typical valves, switches) the
   *       badge is capped so it never exceeds ~70% of the shape's
   *       smaller dimension. The picture-relative default still
   *       applies to normal-sized shapes so all badges on one
   *       drawing look consistent.</li>
   * </ul>
   */
  private shapeSvg(s: OverlaidShape): string {
    const stroke = '#0000ff';
    const strokeWidth = Math.max(2, Math.round(Math.min(s.pictureWidth, s.pictureHeight) * 0.0015));
    const cx = s.x + s.width / 2;
    const cy = s.y + s.height / 2;
    const rotAttr = s.rotation ? ` transform="rotate(${s.rotation} ${cx} ${cy})"` : '';
    const rect = `<rect x="${s.x}" y="${s.y}" width="${s.width}" height="${s.height}" fill="none" stroke="${stroke}" stroke-width="${strokeWidth}"${rotAttr} />`;

    // Badge radius: default from picture size for consistency across
    // shapes on one drawing, but capped so a badge never exceeds ~35%
    // of the shape's smaller dimension. Floor at 4×strokeWidth so it
    // stays legible even on tiny shapes.
    const defaultR = Math.max(strokeWidth * 6, Math.min(s.pictureWidth, s.pictureHeight) * 0.010);
    const shapeCappedR = Math.max(strokeWidth * 4, Math.min(s.width, s.height) * 0.35);
    const badgeR = Math.min(defaultR, shapeCappedR);

    // Center the badge diagonally OUTSIDE the top-right corner —
    // roughly 60% of the badge sits past the shape's outline, 40%
    // overlaps the shape corner. Never fully inside (would cover
    // on-drawing text) and never fully outside (would look detached).
    const badgeCx = s.x + s.width + badgeR * 0.15;
    const badgeCy = s.y - badgeR * 0.15;
    const badgeStroke = Math.max(1, Math.round(badgeR * 0.14));
    const fontSize = Math.round(badgeR * 1.4);
    const badge = `<g><circle cx="${badgeCx}" cy="${badgeCy}" r="${badgeR}" fill="#ffffff" stroke="#1f2933" stroke-width="${badgeStroke}" /><text x="${badgeCx}" y="${badgeCy}" text-anchor="middle" dominant-baseline="central" font-family="Arial,Helvetica,sans-serif" font-weight="700" font-size="${fontSize}" fill="#1f2933">${s.pointIndex}</text></g>`;

    return rect + badge;
  }

  private openPrintWindow(html: string): void {
    const w = window.open('', '_blank');
    if (!w) {
      alert('Could not open the print window. Please allow pop-ups for this site.');
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
  }
}

/** Per-page payload assembled by {@link RfLotoPrintService#buildPage}. */
interface PagePayload {
  file: FileDto;
  url: string;
  overlaid: OverlaidShape[];
}

/** Denormalised shape ready for SVG emission. */
interface OverlaidShape {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  pictureWidth: number;
  pictureHeight: number;
  pointIndex: number;
}

function esc(s: string | null | undefined): string {
  return (s || '').replace(/[&<>"']/g, ch => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] as string
  ));
}

/**
 * Parse the coordinates string ({@code {startX,startY,endX,endY,...}}
 * or key:value form) into the axis-aligned bounding box + rotation.
 * Lifted from EquipmentMapperService's private parser so we don't
 * take a dependency on the whole shape mapper — this service only
 * needs {@code x/y/width/height}, none of the RfShape polymorphism.
 */
function parseBoundingBox(coordinatesStr: string): { x: number; y: number; width: number; height: number; rotation?: number } | null {
  try {
    if (!coordinatesStr) return null;
    const cleaned = coordinatesStr.replace(/\\/g, '').replace(/^"(.*)"$/, '$1').replace(/[{}]/g, '').trim();
    let obj: any = {};
    try {
      const jsonStr = cleaned.startsWith('{') ? cleaned : `{${cleaned}}`;
      obj = JSON.parse(jsonStr);
    } catch {
      cleaned.split(',').forEach(part => {
        const [key, value] = part.split(':');
        if (key && value) {
          const k = key.trim().toLowerCase();
          const v = parseFloat(value.trim());
          if (!isNaN(v)) obj[k] = v;
        }
      });
    }
    const normalized: any = {};
    for (const k in obj) normalized[k.toLowerCase()] = obj[k];
    const startX = Number(normalized.startx);
    const startY = Number(normalized.starty);
    const endX = Number(normalized.endx);
    const endY = Number(normalized.endy);
    if ([startX, startY, endX, endY].some(v => isNaN(v))) return null;
    return {
      x: Math.min(startX, endX),
      y: Math.min(startY, endY),
      width: Math.abs(endX - startX),
      height: Math.abs(endY - startY),
      rotation: normalized.rotation !== undefined ? Number(normalized.rotation) : undefined,
    };
  } catch {
    return null;
  }
}

function parsePictureSize(pictureSizeStr: string): { width: number; height: number } | null {
  try {
    if (!pictureSizeStr) return null;
    const cleaned = pictureSizeStr.replace(/[{}]/g, '').trim();
    const m = cleaned.match(/width:(\d+(?:\.\d+)?),\s*height:(\d+(?:\.\d+)?)/i);
    if (m) {
      const width = Number(m[1]);
      const height = Number(m[2]);
      if (width > 0 && height > 0) return { width, height };
    }
    const parts = cleaned.split(',');
    const size: any = {};
    parts.forEach(p => {
      const [k, v] = p.split(':');
      if (k && v) {
        const n = parseFloat(v.trim());
        if (!isNaN(n)) size[k.trim().toLowerCase()] = n;
      }
    });
    if (size.width > 0 && size.height > 0) return { width: size.width, height: size.height };
    return null;
  } catch {
    return null;
  }
}
