
import { Injectable } from '@angular/core';
import { TransformState } from './zoom-pan.service';
import { RfRectangleShape, SVGSymbolShape } from '../models/fr-shape.model';
import { PIDSymbol } from './pid-symbols.service';

export interface DrawingState {
  isDrawing: boolean;
  startPos: { x: number; y: number };
  currentShape: RfRectangleShape | null;
}

export interface SymbolDrawingState {
  isDrawing: boolean;
  startPos: { x: number; y: number };
  symbol: PIDSymbol | null;
  currentWidth: number;
  currentHeight: number;
}

@Injectable({
  providedIn: 'root',
})
export class DrawingService {
  private state: DrawingState = {
    isDrawing: false,
    startPos: { x: 0, y: 0 },
    currentShape: null,
  };

  private symbolState: SymbolDrawingState = {
    isDrawing: false,
    startPos: { x: 0, y: 0 },
    symbol: null,
    currentWidth: 0,
    currentHeight: 0,
  };

  private tempCanvas: HTMLCanvasElement | null = null;

  /**
   * Initialize temporary canvas for drawing preview
   */
  initializeTempCanvas(container: HTMLElement): HTMLCanvasElement {
    this.tempCanvas = document.createElement('canvas');
    this.tempCanvas.style.position = 'absolute';
    this.tempCanvas.style.top = '0';
    this.tempCanvas.style.left = '0';
    this.tempCanvas.style.pointerEvents = 'none';
    container.appendChild(this.tempCanvas);
    return this.tempCanvas;
  }

  /**
   * Update temp canvas size to match the base image size (before transform)
   */
  updateTempCanvasSize(img: HTMLImageElement, baseImageScale: number): void {
    if (!this.tempCanvas) return;
    // Canvas should match the base display size (before zoom transform)
    this.tempCanvas.width = img.naturalWidth * baseImageScale;
    this.tempCanvas.height = img.naturalHeight * baseImageScale;
  }

  /**
   * Convert client coordinates to natural image coordinates
   */
  clientToImageCoords(
    clientX: number,
    clientY: number,
    imgRect: DOMRect,
    baseImageScale: number,
    transformState: TransformState
  ): { x: number; y: number } {
    // imgRect.left and imgRect.top are already the transformed positions
    // So relativeX and relativeY are already in the transformed coordinate space
    const relativeX = clientX - imgRect.left;
    const relativeY = clientY - imgRect.top;

    // The imgRect dimensions are also transformed (scaled)
    // To get back to the pre-transform coordinates, we need to:
    // 1. Scale down by the transform scale to get to base display size
    const baseDisplayX = relativeX / transformState.scale;
    const baseDisplayY = relativeY / transformState.scale;

    // 2. Convert from base display size to natural image coordinates
    const naturalX = baseDisplayX / baseImageScale;
    const naturalY = baseDisplayY / baseImageScale;

    // console.log('Coordinate conversion:', {
    //   client: { x: clientX, y: clientY },
    //   imgRect: { left: imgRect.left, top: imgRect.top, width: imgRect.width, height: imgRect.height },
    //   relative: { x: relativeX, y: relativeY },
    //   baseDisplay: { x: baseDisplayX, y: baseDisplayY },
    //   natural: { x: naturalX, y: naturalY },
    //   baseImageScale,
    //   transformState
    // });

    return { x: naturalX, y: naturalY };
  }

  /**
   * Start drawing a new shape
   */
  startDrawing(
    clientX: number,
    clientY: number,
    imgRect: DOMRect,
    baseImageScale: number,
    transformState: TransformState
  ): void {
    const { x, y } = this.clientToImageCoords(
      clientX,
      clientY,
      imgRect,
      baseImageScale,
      transformState
    );

    this.state = {
      isDrawing: true,
      startPos: { x, y },
      currentShape: null,
    };

    console.log('Started drawing at:', { x, y });
  }

  /**
   * Update drawing preview as mouse moves
   */
  updateDrawing(
    clientX: number,
    clientY: number,
    imgRect: DOMRect,
    baseImageScale: number,
    transformState: TransformState
  ): void {
    if (!this.state.isDrawing || !this.tempCanvas) return;

    const { x: currentX, y: currentY } = this.clientToImageCoords(
      clientX,
      clientY,
      imgRect,
      baseImageScale,
      transformState
    );

    // Calculate rectangle dimensions in natural image coordinates
    const x = Math.min(this.state.startPos.x, currentX);
    const y = Math.min(this.state.startPos.y, currentY);
    const width = Math.abs(currentX - this.state.startPos.x);
    const height = Math.abs(currentY - this.state.startPos.y);

    this.drawPreview(x, y, width, height, baseImageScale, transformState);
  }

  /**
   * Finish drawing and return the created shape
   */
  finishDrawing(
    clientX: number,
    clientY: number,
    imgRect: DOMRect,
    baseImageScale: number,
    transformState: TransformState,
    naturalWidth: number,
    naturalHeight: number,
    nextId: number,
    minSize: number = 5
  ): RfRectangleShape | null {
    if (!this.state.isDrawing) return null;

    const { x: currentX, y: currentY } = this.clientToImageCoords(
      clientX,
      clientY,
      imgRect,
      baseImageScale,
      transformState
    );

    // Calculate final rectangle dimensions in natural image coordinates
    const x = Math.min(this.state.startPos.x, currentX);
    const y = Math.min(this.state.startPos.y, currentY);
    const width = Math.abs(currentX - this.state.startPos.x);
    const height = Math.abs(currentY - this.state.startPos.y);

    this.cancelDrawing();

    // Only create shape if it has meaningful size
    if (width < minSize || height < minSize) {
      return null;
    }

    const newShape: RfRectangleShape = {
      id: nextId,
      fileId: 0,
      type: 'rectangle',
      x,
      y,
      width,
      height,
      color: '#FF0000',
      originalPictureWidth: naturalWidth,
      originalPictureHeight: naturalHeight,
      originalWidth: 200,
      originalHeight: 200,
      isSelected: false,
      isBulkSelected: false,
      currentImgWidth: naturalWidth,
      currentImgHeigth: naturalHeight,
      scaleToCurrentImage: 1,
    };

    console.log('Created new shape:', newShape);
    return newShape;
  }

  /**
   * Cancel current drawing operation
   */
  cancelDrawing(): void {
    this.state = {
      isDrawing: false,
      startPos: { x: 0, y: 0 },
      currentShape: null,
    };

    this.clearPreview();
  }

  /**
   * Draw preview rectangle on temp canvas
   */
  private drawPreview(
    x: number,
    y: number,
    width: number,
    height: number,
    baseImageScale: number,
    transformState: TransformState
  ): void {
    if (!this.tempCanvas) return;

    const ctx = this.tempCanvas.getContext('2d');
    if (!ctx) return;

    // Clear previous preview
    ctx.clearRect(0, 0, this.tempCanvas.width, this.tempCanvas.height);

    // Convert from natural image coordinates to base display coordinates
    // The canvas is in the base display space (before zoom transform)
    const displayX = x * baseImageScale;
    const displayY = y * baseImageScale;
    const displayWidth = width * baseImageScale;
    const displayHeight = height * baseImageScale;

    // Draw preview rectangle in base display coordinates
    ctx.strokeStyle = '#FF0000';
    // Scale line width inversely with zoom to maintain consistent visual thickness
    ctx.lineWidth = 2 / transformState.scale;
    ctx.setLineDash([5 / transformState.scale, 5 / transformState.scale]);
    ctx.strokeRect(displayX, displayY, displayWidth, displayHeight);
  }

  /**
   * Clear preview canvas
   */
  private clearPreview(): void {
    if (!this.tempCanvas) return;
    const ctx = this.tempCanvas.getContext('2d');
    ctx?.clearRect(0, 0, this.tempCanvas.width, this.tempCanvas.height);
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    if (this.tempCanvas?.parentElement) {
      this.tempCanvas.parentElement.removeChild(this.tempCanvas);
    }
    this.tempCanvas = null;
    this.cancelDrawing();
  }

  /**
   * Check if currently drawing
   */
  isDrawing(): boolean {
    return this.state.isDrawing;
  }

  /**
   * Get current drawing state (for debugging)
   */
  getState(): Readonly<DrawingState> {
    return { ...this.state };
  }

  // ========================= Symbol Drawing Methods =========================

  /**
   * Start drawing a symbol with drag-to-size
   */
  startDrawingSymbol(
    clientX: number,
    clientY: number,
    imgRect: DOMRect,
    baseImageScale: number,
    transformState: TransformState,
    symbol: PIDSymbol
  ): void {
    const { x, y } = this.clientToImageCoords(
      clientX,
      clientY,
      imgRect,
      baseImageScale,
      transformState
    );

    this.symbolState = {
      isDrawing: true,
      startPos: { x, y },
      symbol: symbol,
      currentWidth: 0,
      currentHeight: 0,
    };

    console.log('Started drawing symbol at:', { x, y, symbol: symbol.id });
  }

  /**
   * Update symbol drawing preview as mouse moves (maintains aspect ratio)
   */
  updateDrawingSymbol(
    clientX: number,
    clientY: number,
    imgRect: DOMRect,
    baseImageScale: number,
    transformState: TransformState
  ): void {
    if (!this.symbolState.isDrawing || !this.tempCanvas || !this.symbolState.symbol) return;

    const { x: currentX, y: currentY } = this.clientToImageCoords(
      clientX,
      clientY,
      imgRect,
      baseImageScale,
      transformState
    );

    const symbol = this.symbolState.symbol;

    // Calculate the drag distance
    const dragX = Math.abs(currentX - this.symbolState.startPos.x);
    const dragY = Math.abs(currentY - this.symbolState.startPos.y);

    let width: number;
    let height: number;

    if (symbol.allowFreeAspect) {
      // Free-form: width and height follow the cursor independently. SVG
      // is stretched to fit. Used by symbols where the user sizes the box
      // to fit a label area (off-page connector), not to convey geometry.
      width = dragX;
      height = dragY;
    } else {
      // Aspect-locked: use the larger dimension to determine width, then
      // calculate height from the symbol's native aspect ratio.
      const aspectRatio = symbol.originalHeight / symbol.originalWidth;
      if (dragX / aspectRatio > dragY) {
        // Width-dominant drag
        width = dragX;
        height = width * aspectRatio;
      } else {
        // Height-dominant drag
        height = dragY;
        width = height / aspectRatio;
      }
    }

    this.symbolState.currentWidth = width;
    this.symbolState.currentHeight = height;

    // Calculate position (symbol is placed from start position)
    const x = this.symbolState.startPos.x;
    const y = this.symbolState.startPos.y;

    this.drawSymbolPreview(x, y, width, height, baseImageScale, transformState, symbol);
  }

  /**
   * Finish drawing symbol and return the created shape
   */
  finishDrawingSymbol(
    clientX: number,
    clientY: number,
    imgRect: DOMRect,
    baseImageScale: number,
    transformState: TransformState,
    naturalWidth: number,
    naturalHeight: number,
    nextId: number,
    minSize: number = 10
  ): SVGSymbolShape | null {
    if (!this.symbolState.isDrawing || !this.symbolState.symbol) return null;

    const { x: currentX, y: currentY } = this.clientToImageCoords(
      clientX,
      clientY,
      imgRect,
      baseImageScale,
      transformState
    );

    const symbol = this.symbolState.symbol;

    // Calculate final dimensions — same free-aspect / locked-aspect branch
    // as updateDrawingSymbol so the committed shape matches the preview.
    const dragX = Math.abs(currentX - this.symbolState.startPos.x);
    const dragY = Math.abs(currentY - this.symbolState.startPos.y);

    let width: number;
    let height: number;

    if (symbol.allowFreeAspect) {
      width = dragX;
      height = dragY;
    } else {
      const aspectRatio = symbol.originalHeight / symbol.originalWidth;
      if (dragX / aspectRatio > dragY) {
        width = dragX;
        height = width * aspectRatio;
      } else {
        height = dragY;
        width = height / aspectRatio;
      }
    }

    const x = this.symbolState.startPos.x;
    const y = this.symbolState.startPos.y;

    this.cancelDrawingSymbol();

    // Only create shape if it has meaningful size
    if (width < minSize || height < minSize) {
      return null;
    }

    const newSymbol: SVGSymbolShape = {
      id: nextId,
      fileId: 0,
      type: 'svg-symbol',
      symbolId: symbol.id,
      svgPath: symbol.svgPath,
      x,
      y,
      width,
      height,
      color: '#000000',
      rotation: 0,
      originalPictureWidth: naturalWidth,
      originalPictureHeight: naturalHeight,
      originalWidth: symbol.originalWidth,
      originalHeight: symbol.originalHeight,
      isSelected: false,
      isBulkSelected: false,
      currentImgWidth: naturalWidth,
      currentImgHeigth: naturalHeight,
      scaleToCurrentImage: 1,
    };

    console.log('Created new symbol shape:', newSymbol);
    return newSymbol;
  }

  /**
   * Cancel current symbol drawing operation
   */
  cancelDrawingSymbol(): void {
    this.symbolState = {
      isDrawing: false,
      startPos: { x: 0, y: 0 },
      symbol: null,
      currentWidth: 0,
      currentHeight: 0,
    };

    this.clearPreview();
  }

  /**
   * Check if currently drawing a symbol
   */
  isDrawingSymbol(): boolean {
    return this.symbolState.isDrawing;
  }

  /**
   * Draw symbol preview on temp canvas
   */
  private drawSymbolPreview(
    x: number,
    y: number,
    width: number,
    height: number,
    baseImageScale: number,
    transformState: TransformState,
    symbol: PIDSymbol
  ): void {
    if (!this.tempCanvas) return;

    const ctx = this.tempCanvas.getContext('2d');
    if (!ctx) return;

    // Clear previous preview
    ctx.clearRect(0, 0, this.tempCanvas.width, this.tempCanvas.height);

    // Convert from natural image coordinates to base display coordinates
    const displayX = x * baseImageScale;
    const displayY = y * baseImageScale;
    const displayWidth = width * baseImageScale;
    const displayHeight = height * baseImageScale;

    // Draw bounding box
    ctx.strokeStyle = '#0066FF';
    ctx.lineWidth = 2 / transformState.scale;
    ctx.setLineDash([5 / transformState.scale, 5 / transformState.scale]);
    ctx.strokeRect(displayX, displayY, displayWidth, displayHeight);

    // Draw the SVG path preview
    ctx.save();
    ctx.translate(displayX, displayY);

    // Scale the SVG to fit the drawn bounds
    const scaleX = displayWidth / symbol.originalWidth;
    const scaleY = displayHeight / symbol.originalHeight;
    ctx.scale(scaleX, scaleY);

    // Draw the symbol path
    const path = new Path2D(symbol.svgPath);
    ctx.fillStyle = 'rgba(0, 102, 255, 0.3)';
    ctx.fill(path);
    ctx.strokeStyle = '#0066FF';
    ctx.lineWidth = 1 / Math.min(scaleX, scaleY);
    ctx.setLineDash([]);
    ctx.stroke(path);

    ctx.restore();
  }
}


