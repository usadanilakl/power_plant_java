import { Injectable } from '@angular/core';
import { FormContainerDto } from '../models/form-container.model';

@Injectable({ providedIn: 'root' })
export class CoordinateService {
  private readonly PIXELS_PER_INCH = 96;

  inchesToPixels(inches: number): number {
    return inches * this.PIXELS_PER_INCH;
  }

  pixelsToInches(pixels: number): number {
    return pixels / this.PIXELS_PER_INCH;
  }

  getSheetSizeInPixels(sheetSize: { width: number; height: number }): { width: number; height: number } {
    return {
      width: this.inchesToPixels(sheetSize.width),
      height: this.inchesToPixels(sheetSize.height),
    };
  }

  getScaledCoordinates(
    event: MouseEvent,
    element: HTMLElement,
    scale: number,
  ): { x: number; y: number } {
    const rect = element.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) / scale,
      y: (event.clientY - rect.top) / scale,
    };
  }

  constrainPosition(
    container: FormContainerDto,
    boundsWidth: number,
    boundsHeight: number,
  ): { x: number; y: number } {
    return {
      x: Math.max(0, Math.min(container.position!.x, boundsWidth - container.size!.width)),
      y: Math.max(0, Math.min(container.position!.y, boundsHeight - container.size!.height)),
    };
  }

  constrainSize(
    width: number,
    height: number,
    minWidth: number = 50,
    minHeight: number = 20,
  ): { width: number; height: number } {
    return {
      width: Math.max(minWidth, width),
      height: Math.max(minHeight, height),
    };
  }

  calculateDraggedPosition(
    initialPosition: { x: number; y: number },
    dragDelta: { dx: number; dy: number },
    containerSize: { width: number; height: number },
    boundsWidth: number,
    boundsHeight: number,
  ): { x: number; y: number } {
    return {
      x: Math.max(0, Math.min(initialPosition.x + dragDelta.dx, boundsWidth - containerSize.width)),
      y: Math.max(0, Math.min(initialPosition.y + dragDelta.dy, boundsHeight - containerSize.height)),
    };
  }

  calculateResizedSize(
    initialSize: { width: number; height: number },
    resizeDelta: { dx: number; dy: number },
    minWidth: number = 50,
    minHeight: number = 20,
  ): { width: number; height: number } {
    return {
      width: Math.max(minWidth, initialSize.width + resizeDelta.dx),
      height: Math.max(minHeight, initialSize.height + resizeDelta.dy),
    };
  }

  calculateFitToPanel(
    panelWidth: number,
    panelHeight: number,
    formWidth: number,
    formHeight: number,
    padding: number = 40,
  ): number {
    const scaleX = (panelWidth - padding) / formWidth;
    const scaleY = (panelHeight - padding) / formHeight;
    return Math.min(scaleX, scaleY, 1);
  }

  getFormContainerStyle(
    formSize: { width: number; height: number },
    scale: number,
  ): any {
    return {
      width: `${formSize.width}px`,
      height: `${formSize.height}px`,
      transform: `scale(${scale})`,
      transformOrigin: 'top left',
    };
  }

  getContainerPositionStyle(container: FormContainerDto): any {
    return {
      ...container.style,
      position: 'absolute',
      left: `${container.position?.x ?? 0}px`,
      top: `${container.position?.y ?? 0}px`,
      width: `${container.size?.width ?? 0}px`,
      height: `${container.size?.height ?? 0}px`,
    };
  }

  getContentStyle(container: FormContainerDto): any {
    if (!container.contentStyle) return {};

    const styles = { ...container.contentStyle };
    if (styles.fontSize && typeof styles.fontSize === 'number') {
      styles.fontSize = `${styles.fontSize}px`;
    }
    return styles;
  }

  moveContainersByKeyboard(
    containers: FormContainerDto[],
    direction: 'up' | 'down' | 'left' | 'right',
    amount: number = 1,
  ): FormContainerDto[] {
    const delta = { dx: 0, dy: 0 };

    switch (direction) {
      case 'up': delta.dy = -amount; break;
      case 'down': delta.dy = amount; break;
      case 'left': delta.dx = -amount; break;
      case 'right': delta.dx = amount; break;
    }

    return containers.map(c => new FormContainerDto({
      ...c,
      position: {
        x: (c.position?.x ?? 0) + delta.dx,
        y: (c.position?.y ?? 0) + delta.dy,
      },
    }));
  }
}
