import { Injectable } from '@angular/core';

export interface TransformState {
  scale: number;
  pointX: number;
  pointY: number;
}

@Injectable({
  providedIn: 'root'
})
export class ZoomPanService {
  private readonly MIN_SCALE = 0.1;
  private readonly MAX_SCALE = 10;
  private readonly ZOOM_FACTOR_IN = 1.2;
  private readonly ZOOM_FACTOR_OUT = 0.8;

  calculateZoom(
    event: WheelEvent,
    currentState: TransformState,
    containerRect: DOMRect,
    imageRect: DOMRect
  ): TransformState {
    const mouseX = event.clientX - containerRect.left;
    const mouseY = event.clientY - containerRect.top;

    const delta = event.deltaY > 0 ? this.ZOOM_FACTOR_OUT : this.ZOOM_FACTOR_IN;
    const newScale = Math.min(Math.max(this.MIN_SCALE, currentState.scale * delta), this.MAX_SCALE);

    const newPosition = this.calculatePosition(
      mouseX,
      mouseY,
      currentState,
      newScale,
      imageRect
    );

    return {
      scale: newScale,
      pointX: newPosition.left,
      pointY: newPosition.top
    };
  }

  private calculatePosition(
    mouseX: number,
    mouseY: number,
    currentState: TransformState,
    newScale: number,
    imageRect: DOMRect
  ): { left: number; top: number } {
    const relativeX = (mouseX - currentState.pointX) / imageRect.width;
    const relativeY = (mouseY - currentState.pointY) / imageRect.height;

    const newWidth = imageRect.width * newScale / currentState.scale;
    const newHeight = imageRect.height * newScale / currentState.scale;

    const newLeft = mouseX - relativeX * newWidth;
    const newTop = mouseY - relativeY * newHeight;

    return { left: newLeft, top: newTop };
  }

  calculatePan(
    startPos: { x: number; y: number },
    currentPos: { x: number; y: number },
    initialTransform: TransformState
  ): { pointX: number; pointY: number } {
    return {
      pointX: initialTransform.pointX + (currentPos.x - startPos.x),
      pointY: initialTransform.pointY + (currentPos.y - startPos.y)
    };
  }

  applyTransform(
    element: HTMLElement,
    state: TransformState,
    transition: string = '0s'
  ): void {
    element.style.setProperty('--transition-duration', transition);
    element.style.transform = `translate(${state.pointX}px, ${state.pointY}px) scale(${state.scale})`;
  }
}