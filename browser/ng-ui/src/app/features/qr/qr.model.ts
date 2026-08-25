import { PointDrawing } from '../loto-standard/loto-standard.model';

/**
 * Wire types for the scanned-label flow (`/api/pwa/secured/qr`). A printed LOTO label encodes a hub URL
 * that redirects here, so these shapes are what a phone gets after a camera scan.
 */

/**
 * An off-page reference drawn on a P&ID — tapping it opens the drawing it points at.
 *
 * Position is expressed as FRACTIONS of the drawing (0..1), already normalised by the server, so the
 * viewer can place it in percentages without knowing the image's pixel size. That also means a connector
 * lands correctly even when the served JPG is a different size than the image it was drawn on.
 */
export interface QrConnector {
  id: number;
  targetFileId: number;
  label?: string;
  fx: number;
  fy: number;
  fw: number;
  fh: number;
}

/**
 * One thing the scanned tag resolved to. `type` is 'lotoPoint' unless the tag has no LOTO point at all,
 * in which case the server falls back to equipment — so `id` belongs to whichever space `type` names.
 * `drawings` holds EVERY occurrence (a point on three P&IDs gets three entries), one viewer tab each.
 */
export interface QrMatch {
  type: 'lotoPoint' | 'equipment';
  id: number;
  tagNumber: string;
  description?: string;
  drawings: PointDrawing[];
}

/** Result of resolving a tag. An empty `matches` is a valid answer: the label is not in the system. */
export interface QrTagResult {
  tagNumber: string;
  matches: QrMatch[];
}

/** A drawing plus the connectors drawn on it — served for tag hits and for connector hops alike. */
export interface QrFileInfo {
  fileId: number;
  fileName?: string;
  fileNumber?: string;
  connectors: QrConnector[];
}
