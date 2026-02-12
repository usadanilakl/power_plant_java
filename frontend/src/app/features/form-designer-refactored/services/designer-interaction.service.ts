import { Injectable, signal } from '@angular/core';
import { FormContainerDto } from '../models/form-container.model';

@Injectable({ providedIn: 'root' })
export class DesignerInteractionService {
  // Zoom
  formScale = signal(1);
  readonly MIN_SCALE = 0.1;
  readonly MAX_SCALE = 3.0;
  readonly ZOOM_INTENSITY = 0.1;

  // Drag
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private initialPositions = new Map<string, { x: number; y: number }>();

  // Resize
  private resizingContainerId: string | null = null;
  private resizeStartX = 0;
  private resizeStartY = 0;
  private initialSizes = new Map<string, { width: number; height: number }>();

  // Marquee selection
  isSelecting = signal(false);
  selectionBox = signal<{ x: number; y: number; width: number; height: number } | null>(null);
  private selectionStart = { x: 0, y: 0 };

  readonly PIXELS_PER_INCH = 96;

  // --- Zoom ---

  zoomIn(): void {
    this.formScale.update(s => Math.min(this.MAX_SCALE, s + this.ZOOM_INTENSITY));
  }

  zoomOut(): void {
    this.formScale.update(s => Math.max(this.MIN_SCALE, s - this.ZOOM_INTENSITY));
  }

  setScale(scale: number): void {
    this.formScale.set(Math.max(this.MIN_SCALE, Math.min(this.MAX_SCALE, scale)));
  }

  resetScale(): void {
    this.formScale.set(1);
  }

  // --- Drag ---

  startDrag(event: MouseEvent, containers: FormContainerDto[]): void {
    this.isDragging = true;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;

    this.initialPositions.clear();
    containers.forEach(c => {
      this.initialPositions.set(c.id + '', { x: c.position!.x, y: c.position!.y });
    });
  }

  getDragDelta(event: MouseEvent): { dx: number; dy: number } {
    return {
      dx: event.clientX - this.dragStartX,
      dy: event.clientY - this.dragStartY,
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

  // --- Resize ---

  startResize(event: MouseEvent, containers: FormContainerDto[], resizingContainerId: string): void {
    this.resizingContainerId = resizingContainerId;
    this.resizeStartX = event.clientX;
    this.resizeStartY = event.clientY;

    this.initialSizes.clear();
    containers.forEach(c => {
      this.initialSizes.set(c.id + '', { width: c.size!.width, height: c.size!.height });
    });
  }

  getResizeDelta(event: MouseEvent): { dx: number; dy: number } {
    return {
      dx: event.clientX - this.resizeStartX,
      dy: event.clientY - this.resizeStartY,
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

  // --- Marquee Selection ---

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

  getContainersInSelectionBox(containers: FormContainerDto[]): FormContainerDto[] {
    const box = this.selectionBox();
    if (!box) return [];

    return containers.filter(c => {
      if (c.locked) return false;

      const rect = {
        x: c.position?.x ?? 0,
        y: c.position?.y ?? 0,
        width: c.size?.width ?? 0,
        height: c.size?.height ?? 0,
      };

      return (
        box.x < rect.x + rect.width &&
        box.x + box.width > rect.x &&
        box.y < rect.y + rect.height &&
        box.y + box.height > rect.y
      );
    });
  }

  // --- Reset ---

  reset(): void {
    this.endDrag();
    this.endResize();
    this.endSelection();
    this.resetScale();
  }
}
