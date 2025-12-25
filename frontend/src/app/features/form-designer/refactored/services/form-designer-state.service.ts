import { Injectable, signal } from '@angular/core';
import { FormContainerDto } from '../../../../models/forms/form-container.model';

/**
 * Manages the state for form designer interactions including:
 * - Drag and drop operations
 * - Resize operations
 * - Marquee/lasso selection
 * - Zoom and scaling
 */
@Injectable({
  providedIn: 'root'
})
export class FormDesignerStateService {
  // Zoom state
  formScale = signal(1);
  readonly MIN_SCALE = 0.1;
  readonly MAX_SCALE = 3.0;
  readonly ZOOM_INTENSITY = 0.1;

  // Drag state
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private initialPositions = new Map<string, { x: number; y: number }>();

  // Resize state
  private resizingContainerId: string | null = null;
  private resizeStartX = 0;
  private resizeStartY = 0;
  private initialSizes = new Map<string, { width: number; height: number }>();

  // Marquee selection state
  isSelecting = signal(false);
  selectionBox = signal<{ x: number, y: number, width: number, height: number } | null>(null);
  private selectionStart = { x: 0, y: 0 };

  // DPI for pixel calculations
  readonly PIXELS_PER_INCH = 96;

  /**
   * Zoom operations
   */
  zoomIn(): void {
    this.formScale.update(scale => Math.min(this.MAX_SCALE, scale + this.ZOOM_INTENSITY));
  }

  zoomOut(): void {
    this.formScale.update(scale => Math.max(this.MIN_SCALE, scale - this.ZOOM_INTENSITY));
  }

  setScale(scale: number): void {
    this.formScale.set(Math.max(this.MIN_SCALE, Math.min(this.MAX_SCALE, scale)));
  }

  resetScale(): void {
    this.formScale.set(1);
  }

  /**
   * Drag operations
   */
  startDrag(event: MouseEvent, containers: FormContainerDto[]): void {
    this.isDragging = true;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;

    this.initialPositions.clear();
    containers.forEach(container => {
      this.initialPositions.set(
        container.id + '',
        { x: container.position!.x, y: container.position!.y }
      );
    });
  }

  getDragDelta(event: MouseEvent): { dx: number; dy: number } {
    return {
      dx: event.clientX - this.dragStartX,
      dy: event.clientY - this.dragStartY
    };
  }

  getInitialPosition(containerId: string): { x: number; y: number } | undefined {
    return this.initialPositions.get(containerId);
  }

  endDrag(): void {
    this.isDragging = false;
    this.initialPositions.clear();
  }

  isDraggingActive(): boolean {
    return this.isDragging;
  }

  /**
   * Resize operations
   */
  startResize(event: MouseEvent, containers: FormContainerDto[], resizingContainerId: string): void {
    this.resizingContainerId = resizingContainerId;
    this.resizeStartX = event.clientX;
    this.resizeStartY = event.clientY;

    this.initialSizes.clear();
    containers.forEach(container => {
      this.initialSizes.set(
        container.id + '',
        { width: container.size!.width, height: container.size!.height }
      );
    });
  }

  getResizeDelta(event: MouseEvent): { dx: number; dy: number } {
    return {
      dx: event.clientX - this.resizeStartX,
      dy: event.clientY - this.resizeStartY
    };
  }

  getInitialSize(containerId: string): { width: number; height: number } | undefined {
    return this.initialSizes.get(containerId);
  }

  endResize(): void {
    this.resizingContainerId = null;
    this.initialSizes.clear();
  }

  isResizing(): boolean {
    return this.resizingContainerId !== null;
  }

  getResizingContainerId(): string | null {
    return this.resizingContainerId;
  }

  /**
   * Marquee selection operations
   */
  startSelection(startPoint: { x: number; y: number }): void {
    this.isSelecting.set(true);
    this.selectionStart = startPoint;
    this.selectionBox.set({ ...startPoint, width: 0, height: 0 });
  }

  updateSelection(currentPoint: { x: number; y: number }): void {
    if (!this.isSelecting()) return;

    const x = Math.min(this.selectionStart.x, currentPoint.x);
    const y = Math.min(this.selectionStart.y, currentPoint.y);
    const width = Math.abs(currentPoint.x - this.selectionStart.x);
    const height = Math.abs(currentPoint.y - this.selectionStart.y);

    this.selectionBox.set({ x, y, width, height });
  }

  endSelection(): void {
    this.isSelecting.set(false);
    this.selectionBox.set(null);
  }

  /**
   * Calculate containers intersecting with selection box
   */
  getContainersInSelectionBox(containers: FormContainerDto[]): FormContainerDto[] {
    const selectionBox = this.selectionBox();
    if (!selectionBox) return [];

    return containers.filter(container => {
      if (container.locked) return false;

      const containerRect = {
        x: container.position?.x ?? 0,
        y: container.position?.y ?? 0,
        width: container.size?.width ?? 0,
        height: container.size?.height ?? 0
      };

      // Check for intersection
      return (
        selectionBox.x < containerRect.x + containerRect.width &&
        selectionBox.x + selectionBox.width > containerRect.x &&
        selectionBox.y < containerRect.y + containerRect.height &&
        selectionBox.y + selectionBox.height > containerRect.y
      );
    });
  }

  /**
   * Reset all state
   */
  reset(): void {
    this.endDrag();
    this.endResize();
    this.endSelection();
    this.resetScale();
  }
}
