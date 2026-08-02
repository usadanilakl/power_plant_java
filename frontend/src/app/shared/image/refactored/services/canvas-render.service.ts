import { Injectable } from '@angular/core';
import { FileConnectorShape, RfCircleShape, RfImageShape, RfLineShape, RfRectangleShape, RfShape, RfTextShape, SVGSymbolShape } from '../models/fr-shape.model';

@Injectable({
  providedIn: 'root',
})
export class CanvasRenderService {
  private readonly HANDLE_SIZE = 8;
  private readonly SELECTED_LINE_WIDTH = 3;
  private readonly DEFAULT_LINE_WIDTH = 1;

  // Cache for loaded images to avoid reloading
  private imageCache = new Map<string, HTMLImageElement>();

  drawShapes(
    canvas: HTMLCanvasElement,
    shapes: RfShape[],
    scale: number,
    hoveredShapeId?: number | null,
    currentImageWidth?: number,
    currentImageHeight?: number,
    highlightedShapeIds?: number[]
  ): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Unable to get 2D context from canvas');
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    shapes.forEach((shape) => this.drawShape(ctx, shape, scale, hoveredShapeId, currentImageWidth, currentImageHeight, highlightedShapeIds));
  }

  private drawShape(
    ctx: CanvasRenderingContext2D,
    shape: RfShape,
    scale: number,
    hoveredShapeId?: number | null,
    currentImageWidth?: number,
    currentImageHeight?: number,
    highlightedShapeIds?: number[]
  ): void {
    const isHovered = hoveredShapeId !== null && hoveredShapeId !== undefined && shape.id === hoveredShapeId;
    const isHighlighted = highlightedShapeIds && shape.id !== undefined && highlightedShapeIds.includes(shape.id);

    // Green for highlighted (selected LOTO point equipment), orange for hovered
    ctx.strokeStyle = isHighlighted ? '#4caf50' : isHovered ? '#ff6600' : shape.color;
    ctx.fillStyle = shape.color;
    ctx.lineWidth = shape.isSelected
      ? this.SELECTED_LINE_WIDTH
      : isHovered || isHighlighted
      ? 4  // Thicker line for hover/highlight to make it more noticeable
      : this.DEFAULT_LINE_WIDTH;

    // Draw highlight overlay for hovered or highlighted shapes
    if ((isHovered || isHighlighted) && (shape.type === 'rectangle' || shape.type === 'image' || shape.type === 'svg-symbol')) {
      this.drawHoverHighlight(ctx, shape, scale, currentImageWidth, currentImageHeight, isHighlighted);
    }

    const scaledShape = this.scaleShape(shape, scale, currentImageWidth, currentImageHeight);

    switch (scaledShape.type) {
      case 'rectangle':
        this.drawRectangle(ctx, scaledShape as RfRectangleShape, shape, scale);
        break;
      case 'image':
        this.drawImage(ctx, scaledShape as RfImageShape, shape, scale);
        break;
      case 'circle':
        this.drawCircle(ctx, scaledShape as RfCircleShape, scale);
        break;
      case 'line':
        this.drawLine(ctx, scaledShape as RfLineShape, scale);
        break;
      case 'text':
        this.drawText(ctx, scaledShape as RfTextShape, scale);
        break;
      // FileConnectorShape is structurally identical to SVGSymbolShape for
      // rendering purposes (same x/y/width/height/symbolId/svgPath/rotation)
      // — fall through to the SVG symbol path. Adds connectors to the canvas
      // without duplicating draw logic.
      case 'file-connector':
      case 'svg-symbol':
        this.drawSVGSymbol(ctx, scaledShape as SVGSymbolShape, scale);
        if (scaledShape.type === 'file-connector') {
          // Connector-specific overlay: only when the user has explicitly
          // enabled label rendering for this connector (via the edit dialog).
          // Default is off — the symbol alone is the cue, label adds clutter
          // on dense P&IDs where every shape would compete for space.
          const fc = scaledShape as FileConnectorShape;
          if (fc.showLabel) this.drawConnectorLabel(ctx, fc);
        }
        break;
    }

    // Optional point-index badge on top of the shape — used by the LOTO
    // Standard / LOTO permit viewers to make the mapping from a shape on
    // the P&ID to a numbered row in the point list scan-able at a
    // glance. Drawn after the shape body + highlight overlay so it sits
    // on top of everything. Only applies to bounded shapes (rectangle
    // / image / svg-symbol / file-connector) — text/line/circle skip.
    if (shape.pointIndex != null && (
      scaledShape.type === 'rectangle' ||
      scaledShape.type === 'image' ||
      scaledShape.type === 'svg-symbol' ||
      scaledShape.type === 'file-connector'
    )) {
      this.drawIndexBadge(ctx, scaledShape as (RfRectangleShape | RfImageShape | SVGSymbolShape | FileConnectorShape), String(shape.pointIndex), scale);
    }
  }

  /**
   * Draw a small circular badge with the point index (or short label)
   * anchored to the top-right corner of the shape's bounding box.
   * White fill + dark stroke keeps it legible on any P&ID background;
   * bold text sits on top. Scales with the canvas — same code path
   * serves the live Images tab (zooms with the viewport) and the print
   * rasterizer (drawn at native resolution).
   *
   * @param shape - already-scaled shape (returned by scaleShape)
   * @param label - the badge text (typically "1", "2", …)
   * @param scale - current canvas zoom factor, used to keep the badge
   *   size visually consistent at any zoom level
   */
  private drawIndexBadge(
    ctx: CanvasRenderingContext2D,
    shape: RfRectangleShape | RfImageShape | SVGSymbolShape | FileConnectorShape,
    label: string,
    scale: number
  ): void {
    if (!label) return;
    // Anchor OUTSIDE the top-right corner of the bounding box so the
    // badge doesn't cover on-drawing text (equipment tag numbers on
    // P&IDs typically sit next to the symbol). Rotation-agnostic on
    // purpose — the badge sits at the un-rotated corner even when
    // the shape is rotated, so scanning "which shape is point 4?"
    // stays consistent regardless of symbol orientation.
    const anchorX = shape.x + shape.width;
    const anchorY = shape.y;

    // Radius: viewport-scale default (so badges are legible at any
    // zoom) but capped by ~35% of the shape's smaller dimension so
    // tiny shapes (valves, switches) don't get badges that dominate
    // them. Floor kept at 6px for readability on very small shapes.
    const defaultR = Math.min(18, Math.max(9, 11 * scale));
    const shapeCappedR = Math.max(6, Math.min(shape.width, shape.height) * 0.35);
    const radius = Math.min(defaultR, shapeCappedR);
    const fontSize = Math.max(8, radius * 1.05);

    // Diagonally OUT of the top-right corner: ~15% of the badge past
    // the outline, ~85% overlapping the corner. Never fully inside
    // (would cover the drawing's own text) and never fully floating
    // (would look detached from the shape).
    const cx = anchorX + radius * 0.15;
    const cy = anchorY - radius * 0.15;

    ctx.save();
    // Filled white circle with dark stroke — high contrast against
    // both light and dark P&ID backgrounds.
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#1f2933';
    ctx.lineWidth = Math.max(1, 1.5 * Math.min(scale, 1.5));
    ctx.fill();
    ctx.stroke();

    // Centered bold label.
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#1f2933';
    ctx.fillText(label, cx, cy);
    ctx.restore();
  }

  /**
   * Render the connector's label centered inside the shape's bounding box.
   * Two protections against overflow:
   *  1. Auto-shrink: start at ~40% of shape height, drop the font size until
   *     {@code measureText} fits within the padded width or the floor (6px).
   *  2. Hard clip: install a clip rect at the shape bounds before drawing.
   *     Even if auto-shrink can't get small enough (vanishingly narrow box),
   *     text gets visually truncated at the shape edge instead of bleeding
   *     onto neighboring equipment.
   *
   * <p>Skipped silently when label is empty. Does NOT apply the shape's
   * rotation — keeps text horizontal for readability even on rotated
   * connectors (matches how P&ID labels behave in CAD tools).
   */
  private drawConnectorLabel(ctx: CanvasRenderingContext2D, shape: FileConnectorShape): void {
    const text = (shape.label || '').trim();
    if (!text) return;

    ctx.save();

    // Hard clip to the shape bounds — final safety net so the text can never
    // visually escape the shape rectangle regardless of auto-shrink result.
    ctx.beginPath();
    ctx.rect(shape.x, shape.y, shape.width, shape.height);
    ctx.clip();

    // Auto-fit font size against the inner padded width AND height. Pick
    // the tighter of the two constraints so a wide-but-short shape doesn't
    // get oversized text that clips vertically.
    const hPad = 4;
    const vPad = 2;
    const maxWidth = Math.max(6, shape.width - hPad * 2);
    const maxHeight = Math.max(6, shape.height - vPad * 2);
    let fontSize = Math.min(maxHeight, Math.max(6, Math.min(18, shape.height * 0.4)));
    ctx.font = `bold ${fontSize}px sans-serif`;
    while (ctx.measureText(text).width > maxWidth && fontSize > 6) {
      fontSize -= 1;
      ctx.font = `bold ${fontSize}px sans-serif`;
    }

    const centerX = shape.x + shape.width / 2;
    const centerY = shape.y + shape.height / 2;

    // Halo behind text for legibility on busy P&ID backgrounds — drawn as
    // a slightly thicker stroke in the canvas background color, then the
    // fill on top. Cheap and works on any base image.
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = Math.max(2, fontSize * 0.18);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.strokeText(text, centerX, centerY);
    ctx.fillStyle = shape.color || '#000000';
    ctx.fillText(text, centerX, centerY);
    ctx.restore();
  }

  private drawSVGSymbol(
    ctx: CanvasRenderingContext2D,
    symbol: SVGSymbolShape,
    scale: number
  ): void {
    ctx.save();

    // Translate to the top-left of the scaled bounding box
    ctx.translate(symbol.x, symbol.y);

    // Apply rotation if specified, rotating around the center of the bounding box
    if (symbol.rotation) {
      ctx.translate(symbol.width / 2, symbol.height / 2);
      ctx.rotate((symbol.rotation * Math.PI) / 180);
      ctx.translate(-symbol.width / 2, -symbol.height / 2);
    }

    // The context is already scaled by the main canvas transform.
    // We need to scale the path to fit the symbol's bounding box.
    // symbol.width and symbol.height are already scaled by the canvas zoom.
    // We calculate the ratio needed to fit the original path into this box.
    const scaleX = symbol.width / symbol.originalWidth;
    const scaleY = symbol.height / symbol.originalHeight;

    // Apply this calculated scale to the context
    ctx.scale(scaleX, scaleY);

    // Draw the original, unscaled SVG path. It will be transformed by the context.
    const path = new Path2D(symbol.svgPath);
    ctx.stroke(path);

    ctx.restore();

    // Draw selection handles if selected (after restoring context)
    if (symbol.isSelected) {
      // Create a temporary rectangle shape representing the bounding box for the handles
      const boundingBox = {
        ...symbol,
        type: 'rectangle',
      } as RfRectangleShape;
      this.drawSelectionHandles(ctx, boundingBox);
    }
  }

  private drawRectangle(
    ctx: CanvasRenderingContext2D,
    rect: RfRectangleShape,
    originalShape: RfShape,
    scale: number
  ): void {
    ctx.save();

    // Apply rotation if specified
    if (rect.rotation) {
      // Translate to center, rotate, translate back
      const centerX = rect.x + rect.width / 2;
      const centerY = rect.y + rect.height / 2;
      ctx.translate(centerX, centerY);
      ctx.rotate((rect.rotation * Math.PI) / 180);
      ctx.translate(-centerX, -centerY);
    }

    ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);

    ctx.restore();

    // Draw selection handles outside the rotation transform
    if (originalShape.isBulkSelected) {
      this.drawSelectionHandles(ctx, rect, 'orange');
    }

    if (originalShape.isSelected) {
      this.drawSelectionHandles(ctx, rect);
    }
  }

  // Add new method to draw image shapes
  private drawImage(
    ctx: CanvasRenderingContext2D,
    imageShape: RfImageShape,
    originalShape: RfShape,
    scale: number
  ): void {
    const imageSource = imageShape.imageData || imageShape.imageUrl;

    // Check cache first
    let img = this.imageCache.get(imageSource);

    if (!img) {
      img = new Image();
      img.src = imageSource;
      this.imageCache.set(imageSource, img);
    }

    // Draw image if loaded
    if (img.complete && img.naturalWidth > 0) {
      ctx.save();

      // Apply rotation if specified
      if (imageShape.rotation) {
        const centerX = imageShape.x + imageShape.width / 2;
        const centerY = imageShape.y + imageShape.height / 2;
        ctx.translate(centerX, centerY);
        ctx.rotate((imageShape.rotation * Math.PI) / 180);
        ctx.translate(-centerX, -centerY);
      }

      ctx.drawImage(
        img,
        imageShape.x,
        imageShape.y,
        imageShape.width,
        imageShape.height
      );

      // Draw border around image
      ctx.strokeStyle = imageShape.color;
      ctx.lineWidth = 1;
      ctx.strokeRect(
        imageShape.x,
        imageShape.y,
        imageShape.width,
        imageShape.height
      );

      ctx.restore();

      // Draw selection handles outside rotation transform
      if (originalShape.isBulkSelected) {
        this.drawSelectionHandles(ctx, imageShape, 'orange');
      }

      if (originalShape.isSelected) {
        this.drawSelectionHandles(ctx, imageShape);
      }
    } else {
      // Image not loaded yet, draw placeholder
      this.drawImagePlaceholder(ctx, imageShape);

      // Redraw when image loads
      img.onload = () => {
        ctx.save();

        // Apply rotation if specified
        if (imageShape.rotation) {
          const centerX = imageShape.x + imageShape.width / 2;
          const centerY = imageShape.y + imageShape.height / 2;
          ctx.translate(centerX, centerY);
          ctx.rotate((imageShape.rotation * Math.PI) / 180);
          ctx.translate(-centerX, -centerY);
        }

        ctx.drawImage(
          img!,
          imageShape.x,
          imageShape.y,
          imageShape.width,
          imageShape.height
        );

        // Draw border
        ctx.strokeStyle = imageShape.color;
        ctx.lineWidth = 1;
        ctx.strokeRect(
          imageShape.x,
          imageShape.y,
          imageShape.width,
          imageShape.height
        );

        ctx.restore();

        // Draw selection handles if needed outside rotation transform
        if (originalShape.isBulkSelected) {
          this.drawSelectionHandles(ctx, imageShape, 'orange');
        }

        if (originalShape.isSelected) {
          this.drawSelectionHandles(ctx, imageShape);
        }
      };
    }
  }

  // Helper method to draw placeholder while image loads
  private drawImagePlaceholder(
    ctx: CanvasRenderingContext2D,
    imageShape: RfImageShape
  ): void {
    // Draw gray rectangle as placeholder
    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(
      imageShape.x,
      imageShape.y,
      imageShape.width,
      imageShape.height
    );

    // Draw border
    ctx.strokeStyle = imageShape.color;
    ctx.lineWidth = 1;
    ctx.strokeRect(
      imageShape.x,
      imageShape.y,
      imageShape.width,
      imageShape.height
    );

    // Draw loading text
    ctx.fillStyle = '#666';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      'Loading...',
      imageShape.x + imageShape.width / 2,
      imageShape.y + imageShape.height / 2
    );
  }

  private drawCircle(
    ctx: CanvasRenderingContext2D,
    circle: RfCircleShape,
    scale: number
  ): void {
    ctx.beginPath();
    ctx.arc(circle.x, circle.y, circle.radius, 0, 2 * Math.PI);
    ctx.stroke();
  }

  private drawLine(
    ctx: CanvasRenderingContext2D,
    line: RfLineShape,
    scale: number
  ): void {
    ctx.beginPath();
    ctx.moveTo(line.startX, line.startY);
    ctx.lineTo(line.endX, line.endY);
    ctx.stroke();
  }

  private drawText(
    ctx: CanvasRenderingContext2D,
    text: RfTextShape,
    scale: number
  ): void {
    ctx.font = `${16 * scale}px Arial`;
    ctx.fillText(text.text, text.x, text.y);
  }

  /**
   * Draw a prominent highlight overlay for hovered or highlighted shapes
   * @param isHighlighted - if true, uses green color (for selected items), otherwise orange (for hover)
   */
  private drawHoverHighlight(
    ctx: CanvasRenderingContext2D,
    shape: RfShape,
    scale: number,
    currentImageWidth?: number,
    currentImageHeight?: number,
    isHighlighted: boolean = false
  ): void {
    if (shape.type !== 'rectangle' && shape.type !== 'image' && shape.type !== 'svg-symbol') {
      return;
    }

    const rectShape = shape as RfRectangleShape | RfImageShape | SVGSymbolShape;
    const { scaleX: normX, scaleY: normY } = this.getNormalizationFactor(shape, currentImageWidth, currentImageHeight);
    const x = rectShape.x * normX * scale;
    const y = rectShape.y * normY * scale;
    const width = rectShape.width * normX * scale;
    const height = rectShape.height * normY * scale;

    ctx.save();

    // Apply rotation if specified
    if (rectShape.rotation) {
      const centerX = x + width / 2;
      const centerY = y + height / 2;
      ctx.translate(centerX, centerY);
      ctx.rotate((rectShape.rotation * Math.PI) / 180);
      ctx.translate(-centerX, -centerY);
    }

    // Green for highlighted (selected LOTO points), orange for hover
    const fillColor = isHighlighted ? 'rgba(76, 175, 80, 0.3)' : 'rgba(255, 102, 0, 0.25)';
    const strokeColor = isHighlighted ? '#4caf50' : '#ff6600';

    // Draw semi-transparent fill
    ctx.fillStyle = fillColor;
    ctx.fillRect(x, y, width, height);

    // Draw thicker border with glow effect
    ctx.shadowColor = strokeColor;
    ctx.shadowBlur = 10;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, width, height);

    ctx.restore();
  }

  /**
   * Calculates the normalization factor to convert shape coordinates from their
   * original image dimensions to current image dimensions.
   * This handles cases where shapes were created on images that were later resized.
   */
  private getNormalizationFactor(
    shape: RfShape,
    currentImageWidth?: number,
    currentImageHeight?: number
  ): { scaleX: number; scaleY: number } {
    // If current image dimensions are not provided, no normalization
    if (currentImageWidth === undefined || currentImageWidth === null ||
        currentImageHeight === undefined || currentImageHeight === null) {
      return { scaleX: 1, scaleY: 1 };
    }

    // If shape doesn't have valid original dimensions, no normalization
    if (!shape.originalPictureWidth || shape.originalPictureWidth <= 0 ||
        !shape.originalPictureHeight || shape.originalPictureHeight <= 0) {
      return { scaleX: 1, scaleY: 1 };
    }

    // Calculate ratio between current image size and the image size when shape was created
    const scaleX = currentImageWidth / shape.originalPictureWidth;
    const scaleY = currentImageHeight / shape.originalPictureHeight;

    // Guard against invalid scale values
    if (!isFinite(scaleX) || !isFinite(scaleY) || scaleX <= 0 || scaleY <= 0) {
      return { scaleX: 1, scaleY: 1 };
    }

    return { scaleX, scaleY };
  }

  private scaleShape(
    shape: RfShape,
    scale: number,
    currentImageWidth?: number,
    currentImageHeight?: number
  ): RfShape {
    // First normalize coordinates from shape's original image size to current image size
    const { scaleX: normX, scaleY: normY } = this.getNormalizationFactor(shape, currentImageWidth, currentImageHeight);

    switch (shape.type) {
      case 'rectangle':
        return {
          ...shape,
          x: shape.x * normX * scale,
          y: shape.y * normY * scale,
          width: shape.width * normX * scale,
          height: shape.height * normY * scale,
        };
      case 'image':
        return {
          ...shape,
          x: shape.x * normX * scale,
          y: shape.y * normY * scale,
          width: shape.width * normX * scale,
          height: shape.height * normY * scale,
        };
      case 'circle':
        // For circles, use average of scaleX and scaleY for radius
        const avgNorm = (normX + normY) / 2;
        return {
          ...shape,
          x: shape.x * normX * scale,
          y: shape.y * normY * scale,
          radius: shape.radius * avgNorm * scale,
        };
      case 'line':
        return {
          ...shape,
          startX: shape.startX * normX * scale,
          startY: shape.startY * normY * scale,
          endX: shape.endX * normX * scale,
          endY: shape.endY * normY * scale,
        };
      case 'text':
        return {
          ...shape,
          x: shape.x * normX * scale,
          y: shape.y * normY * scale,
        };
      // file-connector shares svg-symbol's geometry — scale identically.
      case 'file-connector':
      case 'svg-symbol':
        const svgShape = shape as SVGSymbolShape;
        return {
          ...svgShape,
          x: svgShape.x * normX * scale,
          y: svgShape.y * normY * scale,
          width: svgShape.width * normX * scale,
          height: svgShape.height * normY * scale,
        };
      default:
        return shape;
    }
  }

  // private drawSelectionHandles(
  //   ctx: CanvasRenderingContext2D,
  //   shape: Shape,
  //   color: string = 'blue'
  // ): void {
  //   ctx.fillStyle = color;
  //   const corners = this.getShapeCorners(shape);

  //   corners.forEach(([x, y]) => {
  //     ctx.fillRect(
  //       x - this.HANDLE_SIZE / 2,
  //       y - this.HANDLE_SIZE / 2,
  //       this.HANDLE_SIZE,
  //       this.HANDLE_SIZE
  //     );
  //   });
  // }

  private drawSelectionHandles(
    ctx: CanvasRenderingContext2D,
    shape: RfShape,
    color: string = 'blue'
  ): void {
    ctx.save();

    // Apply rotation transform if shape is rotated (only for shapes that support rotation)
    if (
      shape.type === 'rectangle' ||
      shape.type === 'image' ||
      shape.type === 'svg-symbol'
    ) {
      const rotatableShape = shape as RfRectangleShape | RfImageShape | SVGSymbolShape;
      const rotation = rotatableShape.rotation || 0;
      if (rotation !== 0) {
        const centerX = rotatableShape.x + rotatableShape.width / 2;
        const centerY = rotatableShape.y + rotatableShape.height / 2;
        ctx.translate(centerX, centerY);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.translate(-centerX, -centerY);
      }
    }

    ctx.fillStyle = color;
    const corners = this.getShapeCorners(shape);

    // Draw corner handles
    corners.forEach(([x, y]) => {
      ctx.fillRect(
        x - this.HANDLE_SIZE / 2,
        y - this.HANDLE_SIZE / 2,
        this.HANDLE_SIZE,
        this.HANDLE_SIZE
      );
    });

    // Draw edge handles (for 8-point resize)
    if (
      shape.type === 'rectangle' ||
      shape.type === 'image' ||
      shape.type === 'svg-symbol'
    ) {
      const edgeMidpoints = this.getEdgeMidpoints(shape);
      edgeMidpoints.forEach(([x, y]) => {
        ctx.fillRect(
          x - this.HANDLE_SIZE / 2,
          y - this.HANDLE_SIZE / 2,
          this.HANDLE_SIZE,
          this.HANDLE_SIZE
        );
      });
    }

    // Draw rotation handle only for single-selected, rotatable shapes
    if (
      shape.isSelected &&
      !shape.isBulkSelected &&
      (shape.type === 'rectangle' ||
        shape.type === 'image' ||
        shape.type === 'svg-symbol')
    ) {
      const rotatableShape = shape as RfRectangleShape | RfImageShape | SVGSymbolShape;
      const handleOffset = 20; // Offset in pixels, independent of zoom
      const centerX = rotatableShape.x + rotatableShape.width / 2;
      const handleX = centerX;
      const handleY = rotatableShape.y - handleOffset;

      // Draw line to rotation handle
      ctx.beginPath();
      ctx.moveTo(centerX, rotatableShape.y);
      ctx.lineTo(handleX, handleY);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw rotation handle (circle)
      ctx.beginPath();
      ctx.arc(handleX, handleY, this.HANDLE_SIZE / 2, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
    }

    ctx.restore();
  }

  private getShapeCorners(shape: RfShape): [number, number][] {
    switch (shape.type) {
      case 'rectangle':
        const rect = shape as RfRectangleShape;
        return [
          [rect.x, rect.y],
          [rect.x + rect.width, rect.y],
          [rect.x, rect.y + rect.height],
          [rect.x + rect.width, rect.y + rect.height],
        ];
      case 'image':
        const img = shape as RfImageShape;
        return [
          [img.x, img.y],
          [img.x + img.width, img.y],
          [img.x, img.y + img.height],
          [img.x + img.width, img.y + img.height],
        ];
      case 'circle':
        const circle = shape as RfCircleShape;
        return [
          [circle.x - circle.radius, circle.y - circle.radius],
          [circle.x + circle.radius, circle.y - circle.radius],
          [circle.x - circle.radius, circle.y + circle.radius],
          [circle.x + circle.radius, circle.y + circle.radius],
        ];
      case 'line':
        const line = shape as RfLineShape;
        return [
          [line.startX, line.startY],
          [line.endX, line.endY],
        ];
      case 'file-connector':
      case 'svg-symbol':
        const symbol = shape as SVGSymbolShape;
        return [
          [symbol.x, symbol.y],
          [symbol.x + symbol.width, symbol.y],
          [symbol.x, symbol.y + symbol.height],
          [symbol.x + symbol.width, symbol.y + symbol.height],
        ];
      default:
        return [];
    }
  }

  private getEdgeMidpoints(shape: RfShape): [number, number][] {
    switch (shape.type) {
      case 'rectangle':
      case 'image':
      case 'file-connector':
      case 'svg-symbol':
        const s = shape as RfRectangleShape | RfImageShape | SVGSymbolShape;
        const midX = s.x + s.width / 2;
        const midY = s.y + s.height / 2;
        return [
          [midX, s.y], // top
          [s.x + s.width, midY], // right
          [midX, s.y + s.height], // bottom
          [s.x, midY], // left
        ];
      default:
        return [];
    }
  }

  updateCanvasSize(canvas: HTMLCanvasElement, img: HTMLImageElement): void {
    const imgRect = img.getBoundingClientRect();
    canvas.width = imgRect.width;
    canvas.height = imgRect.height;
  }

  calculateScale(img: HTMLImageElement): number {
    const imgRect = img.getBoundingClientRect();
    return imgRect.width / img.naturalWidth;
  }

  calculateBaseScale(img: HTMLImageElement): number {
    const computedStyle = window.getComputedStyle(img);
    const width = parseFloat(computedStyle.width);
    return width / img.naturalWidth;
  }

  // Add cleanup method to clear image cache
  clearImageCache(): void {
    this.imageCache.forEach((img, src) => {
      if (src.startsWith('blob:')) {
        URL.revokeObjectURL(src);
      }
    });
    this.imageCache.clear();
  }
}