import { Injectable } from '@angular/core';
import { RfCircleShape, RfImageShape, RfLineShape, RfRectangleShape, RfShape, RfTextShape, SVGSymbolShape } from '../models/fr-shape.model';

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
    hoveredShapeId?: number | null
  ): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Unable to get 2D context from canvas');
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    shapes.forEach((shape) => this.drawShape(ctx, shape, scale, hoveredShapeId));
  }

  private drawShape(
    ctx: CanvasRenderingContext2D,
    shape: RfShape,
    scale: number,
    hoveredShapeId?: number | null
  ): void {
    const isHovered = hoveredShapeId !== null && hoveredShapeId !== undefined && shape.id === hoveredShapeId;

    ctx.strokeStyle = isHovered ? '#ff6600' : shape.color; // Bright orange for hover
    ctx.fillStyle = shape.color;
    ctx.lineWidth = shape.isSelected
      ? this.SELECTED_LINE_WIDTH
      : isHovered
      ? 4  // Thicker line for hover to make it more noticeable
      : this.DEFAULT_LINE_WIDTH;

    // Draw highlight overlay for hovered shapes
    if (isHovered && (shape.type === 'rectangle' || shape.type === 'image' || shape.type === 'svg-symbol')) {
      this.drawHoverHighlight(ctx, shape, scale);
    }

    const scaledShape = this.scaleShape(shape, scale);

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
      case 'svg-symbol':
        this.drawSVGSymbol(ctx, scaledShape as SVGSymbolShape, scale);
        break;
    }
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
   * Draw a prominent highlight overlay for hovered shapes
   */
  private drawHoverHighlight(
    ctx: CanvasRenderingContext2D,
    shape: RfShape,
    scale: number
  ): void {
    if (shape.type !== 'rectangle' && shape.type !== 'image' && shape.type !== 'svg-symbol') {
      return;
    }

    const rectShape = shape as RfRectangleShape | RfImageShape | SVGSymbolShape;
    const x = rectShape.x * scale;
    const y = rectShape.y * scale;
    const width = rectShape.width * scale;
    const height = rectShape.height * scale;

    ctx.save();

    // Apply rotation if specified
    if (rectShape.rotation) {
      const centerX = x + width / 2;
      const centerY = y + height / 2;
      ctx.translate(centerX, centerY);
      ctx.rotate((rectShape.rotation * Math.PI) / 180);
      ctx.translate(-centerX, -centerY);
    }

    // Draw semi-transparent orange fill
    ctx.fillStyle = 'rgba(255, 102, 0, 0.25)';
    ctx.fillRect(x, y, width, height);

    // Draw thicker orange border with glow effect
    ctx.shadowColor = '#ff6600';
    ctx.shadowBlur = 10;
    ctx.strokeStyle = '#ff6600';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, width, height);

    ctx.restore();
  }

  private scaleShape(shape: RfShape, scale: number): RfShape {
    switch (shape.type) {
      case 'rectangle':
        return {
          ...shape,
          x: shape.x * scale,
          y: shape.y * scale,
          width: shape.width * scale,
          height: shape.height * scale,
        };
      case 'image':
        return {
          ...shape,
          x: shape.x * scale,
          y: shape.y * scale,
          width: shape.width * scale,
          height: shape.height * scale,
        };
      case 'circle':
        return {
          ...shape,
          x: shape.x * scale,
          y: shape.y * scale,
          radius: shape.radius * scale,
        };
      case 'line':
        return {
          ...shape,
          startX: shape.startX * scale,
          startY: shape.startY * scale,
          endX: shape.endX * scale,
          endY: shape.endY * scale,
        };
      case 'text':
        return {
          ...shape,
          x: shape.x * scale,
          y: shape.y * scale,
        };
      case 'svg-symbol': // Add this case
        const svgShape = shape as SVGSymbolShape;
        return {
          ...svgShape,
          x: svgShape.x * scale,
          y: svgShape.y * scale,
          width: svgShape.width * scale,
          height: svgShape.height * scale,
        };
      // case 'svg-symbol':
      //   return {
      //     ...shape,
      //     x: shape.x * scale,
      //     y: shape.y * scale,
      //     width: shape.width * scale,
      //     height: shape.height * scale,
      //   };
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