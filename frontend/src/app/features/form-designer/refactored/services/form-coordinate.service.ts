import { Injectable } from '@angular/core';
import { FormContainerDto } from '../../../../models/forms/form-container.model';

/**
 * Handles coordinate transformations and calculations for form designer
 * - Scaled coordinates
 * - Boundary constraints
 * - Position and size calculations
 * - Sheet size conversions
 */
@Injectable({
  providedIn: 'root'
})
export class FormCoordinateService {
  private readonly PIXELS_PER_INCH = 96;

  /**
   * Converts inches to pixels
   */
  inchesToPixels(inches: number): number {
    return inches * this.PIXELS_PER_INCH;
  }

  /**
   * Converts pixels to inches
   */
  pixelsToInches(pixels: number): number {
    return pixels / this.PIXELS_PER_INCH;
  }

  /**
   * Gets sheet size in pixels from dimensions in inches
   */
  getSheetSizeInPixels(sheetSize: { width: number; height: number }): { width: number; height: number } {
    return {
      width: this.inchesToPixels(sheetSize.width),
      height: this.inchesToPixels(sheetSize.height)
    };
  }

  /**
   * Converts mouse event coordinates to scaled coordinates relative to an element
   */
  getScaledCoordinates(
    event: MouseEvent,
    element: HTMLElement,
    scale: number
  ): { x: number; y: number } {
    const rect = element.getBoundingClientRect();

    return {
      x: (event.clientX - rect.left) / scale,
      y: (event.clientY - rect.top) / scale
    };
  }

  /**
   * Constrains container position to stay within bounds
   */
  constrainPosition(
    container: FormContainerDto,
    boundsWidth: number,
    boundsHeight: number
  ): { x: number; y: number } {
    const x = Math.max(0, Math.min(container.position!.x, boundsWidth - container.size!.width));
    const y = Math.max(0, Math.min(container.position!.y, boundsHeight - container.size!.height));

    return { x, y };
  }

  /**
   * Constrains container size to minimum values
   */
  constrainSize(
    width: number,
    height: number,
    minWidth: number = 50,
    minHeight: number = 20
  ): { width: number; height: number } {
    return {
      width: Math.max(minWidth, width),
      height: Math.max(minHeight, height)
    };
  }

  /**
   * Calculates new position after drag operation
   */
  calculateDraggedPosition(
    initialPosition: { x: number; y: number },
    dragDelta: { dx: number; dy: number },
    containerSize: { width: number; height: number },
    boundsWidth: number,
    boundsHeight: number
  ): { x: number; y: number } {
    let newX = initialPosition.x + dragDelta.dx;
    let newY = initialPosition.y + dragDelta.dy;

    // Constrain to bounds
    newX = Math.max(0, Math.min(newX, boundsWidth - containerSize.width));
    newY = Math.max(0, Math.min(newY, boundsHeight - containerSize.height));

    return { x: newX, y: newY };
  }

  /**
   * Calculates new size after resize operation
   */
  calculateResizedSize(
    initialSize: { width: number; height: number },
    resizeDelta: { dx: number; dy: number },
    minWidth: number = 50,
    minHeight: number = 20
  ): { width: number; height: number } {
    const newWidth = Math.max(minWidth, initialSize.width + resizeDelta.dx);
    const newHeight = Math.max(minHeight, initialSize.height + resizeDelta.dy);

    return { width: newWidth, height: newHeight };
  }

  /**
   * Calculates scale to fit form within panel
   */
  calculateFitToPanel(
    panelWidth: number,
    panelHeight: number,
    formWidth: number,
    formHeight: number,
    padding: number = 40
  ): number {
    const scaleX = (panelWidth - padding) / formWidth;
    const scaleY = (panelHeight - padding) / formHeight;

    // Don't scale up beyond 100%
    return Math.min(scaleX, scaleY, 1);
  }

  /**
   * Gets form container style object
   */
  getFormContainerStyle(
    formSize: { width: number; height: number },
    scale: number
  ): any {
    return {
      width: `${formSize.width}px`,
      height: `${formSize.height}px`,
      transform: `scale(${scale})`,
      transformOrigin: 'top left'
    };
  }

  /**
   * Gets container positioning style
   */
  getContainerPositionStyle(container: FormContainerDto): any {
    return {
      ...container.style,
      position: 'absolute',
      left: `${container.position?.x ?? 0}px`,
      top: `${container.position?.y ?? 0}px`,
      width: `${container.size?.width ?? 0}px`,
      height: `${container.size?.height ?? 0}px`
    };
  }

  /**
   * Gets content style with proper font size formatting
   */
  getContentStyle(container: FormContainerDto): any {
    if (!container.contentStyle) {
      return {};
    }

    const styles = { ...container.contentStyle };

    // Convert fontSize number to string with px unit
    if (styles.fontSize && typeof styles.fontSize === 'number') {
      styles.fontSize = `${styles.fontSize}px`;
    }

    return styles;
  }

  /**
   * Moves containers by keyboard arrow keys
   */
  moveContainersByKeyboard(
    containers: FormContainerDto[],
    direction: 'up' | 'down' | 'left' | 'right',
    amount: number = 1
  ): FormContainerDto[] {
    const delta = { dx: 0, dy: 0 };

    switch (direction) {
      case 'up':
        delta.dy = -amount;
        break;
      case 'down':
        delta.dy = amount;
        break;
      case 'left':
        delta.dx = -amount;
        break;
      case 'right':
        delta.dx = amount;
        break;
    }

    return containers.map(container => {
      const newPosition = {
        x: (container.position?.x ?? 0) + delta.dx,
        y: (container.position?.y ?? 0) + delta.dy
      };

      return new FormContainerDto({ ...container, position: newPosition });
    });
  }
}
