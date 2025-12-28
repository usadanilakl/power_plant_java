
import { Injectable } from '@angular/core';
import { TransformState } from './zoom-pan.service';
import { RfRectangleShape } from '../models/fr-shape.model';

export interface DrawingState {
  isDrawing: boolean;
  startPos: { x: number; y: number };
  currentShape: RfRectangleShape | null;
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
}


