import { inject, Injectable } from '@angular/core';
import { FileConnectorShape, RfShape } from '../../../../shared/image/refactored/models/fr-shape.model';
import { PIDSymbolsService, OFF_PAGE_CONNECTOR_SYMBOL_ID } from '../../../../shared/image/refactored/services/pid-symbols.service';
import { FileConnectorDto } from '../../../../models/file/file-connector.model';
import { ConnectorNavigationService } from './connector-navigation.service';

/**
 * Maps {@link FileConnectorDto} server payloads to {@link FileConnectorShape}
 * canvas shapes — the connector equivalent of EquipmentMapperService.
 *
 * <p>Coordinate / picture-size parsing mirrors EquipmentMapperService so a
 * FileConnector and an Equipment drawn with the same dimensions render at
 * the same position. Duplicated rather than shared because the parsing
 * helpers may diverge between the two domains in the future (e.g. connectors
 * might gain rotation-axis semantics equipment doesn't need); keeping them
 * separate avoids accidental coupling.
 */
@Injectable({ providedIn: 'root' })
export class FileConnectorMapperService {
  private pidSymbolsService = inject(PIDSymbolsService);
  private navigationService = inject(ConnectorNavigationService);

  /**
   * Map an array of connectors to canvas shapes, filtering out unparseable rows.
   * Marks {@code isSelected=true} on the shape whose id matches the navigation
   * service's pending highlight (set by the click handler before navigating).
   *
   * <p>Reads the signal (creates a reactive dependency so the parent
   * {@code computed} re-runs when a new highlight is armed). Does NOT clear
   * the signal here — Angular forbids signal WRITES inside {@code computed}
   * and the previous version's clear-on-match leaked into a runtime error
   * that made the canvas non-interactive. The signal auto-clears via a
   * timeout scheduled by the click handler that armed it.
   */
  mapAllToRfShapes(connectors: FileConnectorDto[]): RfShape[] {
    const shapes = connectors
      .map(c => this.mapToRfShape(c))
      .filter((s): s is FileConnectorShape => s !== null);
    const pendingId = this.navigationService.pendingHighlightConnectorId();
    if (pendingId != null) {
      for (const s of shapes) {
        if (s.id === pendingId) s.isSelected = true;
      }
    }
    return shapes;
  }

  mapToRfShape(connector: FileConnectorDto): FileConnectorShape | null {
    if (!connector.coordinates || !connector.originalPictureSize) return null;

    const coords = this.parseCoordinates(connector.coordinates);
    const picSize = this.parsePictureSize(connector.originalPictureSize);
    if (!coords || !picSize) return null;
    // Number.isFinite accepts 0 (a connector at the canvas origin is valid) but
    // rejects NaN/Infinity/undefined. Was previously `!coords.startX` which
    // dropped any shape touching x=0 or y=0.
    if (!Number.isFinite(picSize.width) || !Number.isFinite(picSize.height)) return null;
    if (picSize.width <= 0 || picSize.height <= 0) return null;
    if (!Number.isFinite(coords.startX) || !Number.isFinite(coords.startY) ||
        !Number.isFinite(coords.endX) || !Number.isFinite(coords.endY)) return null;

    const x = Math.min(coords.startX, coords.endX);
    const y = Math.min(coords.startY, coords.endY);
    const width = coords.width;
    const height = coords.height;
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return null;

    // Resolve symbol viewbox if the connector was saved with a specific symbol.
    // Falls back to the off-page-connector symbol — that's the canonical
    // visual for a FileConnector even if symbolId wasn't persisted.
    const symbolId = connector.symbolId || OFF_PAGE_CONNECTOR_SYMBOL_ID;
    const pidSymbol = this.pidSymbolsService.getSymbolById(symbolId);
    const svgPath = connector.svgPath || pidSymbol?.svgPath || '';

    const label = connector.label && connector.label.trim()
      ? connector.label
      : (connector.targetFileNumber || connector.targetFileName || `Connector #${connector.id}`);

    const rotation = connector.rotation ?? (coords.rotation ?? 0);

    const shape: FileConnectorShape = {
      id: connector.id,
      fileId: connector.sourceFileId ?? 0,
      type: 'file-connector',
      // Distinctive accent color — connectors should stand out from equipment.
      color: '#1565c0',
      originalPictureWidth: picSize.width,
      originalPictureHeight: picSize.height,
      originalWidth: pidSymbol?.originalWidth || width,
      originalHeight: pidSymbol?.originalHeight || height,
      isSelected: false,
      isBulkSelected: false,
      currentImgWidth: picSize.width,
      currentImgHeigth: picSize.height,
      scaleToCurrentImage: 1,
      x, y, width, height, rotation,
      symbolId,
      svgPath,
      targetFileId: connector.targetFileId ?? 0,
      label,
      counterpartConnectorId: connector.counterpartConnectorId,
      // Coerce nullable backend Boolean to a primitive for the renderer —
      // null/undefined means "legacy or never opted in" → don't draw label.
      showLabel: connector.showLabel === true,
    };
    return shape;
  }

  // ---- Parsing helpers (mirror EquipmentMapperService — see class javadoc) ----

  private parseCoordinates(s: string): { startX: number; startY: number; endX: number; endY: number; width: number; height: number; rotation?: number } | null {
    try {
      const cleaned = s.replace(/\\/g, '').replace(/^"(.*)"$/, '$1').replace(/[{}]/g, '').trim();
      let obj: any = {};
      try {
        const jsonStr = cleaned.startsWith('{') ? cleaned : `{${cleaned}}`;
        obj = JSON.parse(jsonStr);
      } catch {
        for (const part of cleaned.split(',')) {
          const [k, v] = part.split(':');
          if (k && v) {
            const key = k.trim().toLowerCase();
            const val = parseFloat(v.trim());
            if (!isNaN(val)) obj[key] = val;
          }
        }
      }
      const norm: any = {};
      for (const k in obj) norm[k.toLowerCase()] = obj[k];
      const startX = Number(norm.startx);
      const startY = Number(norm.starty);
      const endX = Number(norm.endx);
      const endY = Number(norm.endy);
      const width = Number(norm.width ?? Math.abs(endX - startX));
      const height = Number(norm.height ?? Math.abs(endY - startY));
      const rotation = norm.rotation !== undefined ? Number(norm.rotation) : undefined;
      return { startX, startY, endX, endY, width, height, rotation };
    } catch {
      return null;
    }
  }

  private parsePictureSize(s: string): { width: number; height: number } | null {
    try {
      const obj: any = {};
      for (const part of s.split(',')) {
        const [k, v] = part.split(':');
        if (k && v) {
          const key = k.trim().toLowerCase();
          const val = parseFloat(v.trim());
          if (!isNaN(val)) obj[key] = val;
        }
      }
      return { width: Number(obj.width), height: Number(obj.height) };
    } catch {
      return null;
    }
  }
}
