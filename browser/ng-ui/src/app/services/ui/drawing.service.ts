
import { Injectable } from '@angular/core';
import { RectangleShape } from '../../models/ui/shape.model';
import { TransformState } from './zoom-pan.service';

export interface DrawingState {
  isDrawing: boolean;
  startPos: { x: number; y: number };
  currentShape: RectangleShape | null;
}

@Injectable({
  providedIn: 'root'
})
export class DrawingService {
  private state: DrawingState = {
    isDrawing: false,
    startPos: { x: 0, y: 0 },
    currentShape: null
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
   * Update temp canvas size to match image
   */
  updateTempCanvasSize(imgRect: DOMRect): void {
    if (!this.tempCanvas) return;
    this.tempCanvas.width = imgRect.width;
    this.tempCanvas.height = imgRect.height;
  }

  /**
   * Convert client coordinates to image coordinates accounting for transform
   */
  private clientToImageCoords(
    clientX: number,
    clientY: number,
    imgRect: DOMRect,
    imageScale: number,
    transformState: TransformState
  ): { x: number; y: number } {
    // Get position relative to the transformed image element
    const relativeX = clientX - imgRect.left;
    const relativeY = clientY - imgRect.top;
    
    // Account for pan offset and scale
    const x = (relativeX - transformState.pointX) / (imageScale * transformState.scale);
    const y = (relativeY - transformState.pointY) / (imageScale * transformState.scale);
    
    return { x, y };
  }

  /**
   * Start drawing a new shape
   */
  startDrawing(
    clientX: number,
    clientY: number,
    imgRect: DOMRect,
    imageScale: number,
    transformState: TransformState
  ): void {
    const { x, y } = this.clientToImageCoords(
      clientX,
      clientY,
      imgRect,
      imageScale,
      transformState
    );
    
    this.state = {
      isDrawing: true,
      startPos: { x, y },
      currentShape: null
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
    imageScale: number,
    transformState: TransformState
  ): void {
    if (!this.state.isDrawing || !this.tempCanvas) return;

    const { x: currentX, y: currentY } = this.clientToImageCoords(
      clientX,
      clientY,
      imgRect,
      imageScale,
      transformState
    );

    // Calculate rectangle dimensions in image coordinates
    const x = Math.min(this.state.startPos.x, currentX);
    const y = Math.min(this.state.startPos.y, currentY);
    const width = Math.abs(currentX - this.state.startPos.x);
    const height = Math.abs(currentY - this.state.startPos.y);

    this.drawPreview(x, y, width, height, imageScale, transformState);
  }

  /**
   * Finish drawing and return the created shape
   */
  finishDrawing(
    clientX: number,
    clientY: number,
    imgRect: DOMRect,
    imageScale: number,
    transformState: TransformState,
    naturalWidth: number,
    naturalHeight: number,
    nextId: number,
    minSize: number = 5
  ): RectangleShape | null {
    if (!this.state.isDrawing) return null;

    const { x: currentX, y: currentY } = this.clientToImageCoords(
      clientX,
      clientY,
      imgRect,
      imageScale,
      transformState
    );

    // Calculate final rectangle dimensions in image coordinates
    const x = Math.min(this.state.startPos.x, currentX);
    const y = Math.min(this.state.startPos.y, currentY);
    const width = Math.abs(currentX - this.state.startPos.x);
    const height = Math.abs(currentY - this.state.startPos.y);

    this.cancelDrawing();

    // Only create shape if it has meaningful size
    if (width < minSize || height < minSize) {
      return null;
    }

    const newShape: RectangleShape = {
      id: nextId,
      type: 'rectangle',
      x,
      y,
      width,
      height,
      color: '#FF0000',
      originalPictureWidth: naturalWidth,
      originalPictureHeight: naturalHeight,
      isSelected: false,
      isBulkSelected: false,
      currentImgWidth: naturalWidth,
      currentImgHeigth: naturalHeight,
      scaleToCurrentImage: 1
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
      currentShape: null
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
    imageScale: number,
    transformState: TransformState
  ): void {
    if (!this.tempCanvas) return;

    const ctx = this.tempCanvas.getContext('2d');
    if (!ctx) return;

    // Clear previous preview
    ctx.clearRect(0, 0, this.tempCanvas.width, this.tempCanvas.height);

    // Convert image coordinates back to canvas coordinates
    const scale = imageScale * transformState.scale;
    const scaledX = x * scale + transformState.pointX;
    const scaledY = y * scale + transformState.pointY;
    const scaledWidth = width * scale;
    const scaledHeight = height * scale;

    // Draw preview rectangle
    ctx.strokeStyle = '#FF0000';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(scaledX, scaledY, scaledWidth, scaledHeight);
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