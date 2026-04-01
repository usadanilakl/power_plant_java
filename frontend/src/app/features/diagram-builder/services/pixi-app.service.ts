import { Injectable, NgZone, inject, signal } from '@angular/core';
import { Application, Container, Graphics, Sprite, Texture, Text, TextStyle } from 'pixi.js';
import { Viewport } from 'pixi-viewport';

/**
 * Manages the Pixi.js Application, Viewport, and layer containers.
 * Runs entirely outside Angular's NgZone to prevent viewport events
 * (wheel, pointer, resize) from triggering Angular change detection.
 */
@Injectable()
export class PixiAppService {
  private ngZone = inject(NgZone);

  app!: Application;
  viewport!: Viewport;

  // Layer containers (ordered bottom to top)
  gridContainer!: Container;
  connectionContainer!: Container;
  shapeContainer!: Container;
  overlayContainer!: Container;
  tempContainer!: Container;

  readonly isInitialized = signal(false);

  private hostElement: HTMLElement | null = null;
  private resizeObserver: ResizeObserver | null = null;

  async init(host: HTMLElement, worldWidth: number, worldHeight: number): Promise<void> {
    this.hostElement = host;

    // Run Pixi entirely outside Angular's zone — viewport wheel/pointer/resize
    // events must NOT trigger Angular change detection
    await this.ngZone.runOutsideAngular(async () => {
      this.app = new Application();
      await this.app.init({
        background: '#121212',
        resizeTo: host,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      });

      host.appendChild(this.app.canvas as HTMLCanvasElement);

      // Create viewport with pan/zoom
      this.viewport = new Viewport({
        screenWidth: host.clientWidth,
        screenHeight: host.clientHeight,
        worldWidth,
        worldHeight,
        events: this.app.renderer.events,
      });

      this.viewport
        .drag({ mouseButtons: 'middle-right' })
        .pinch()
        .wheel({ smooth: 0 })  // No smooth easing — instant zoom to avoid RAF-triggered change detection
        .clampZoom({ minScale: 0.1, maxScale: 10 });

      this.app.stage.addChild(this.viewport);

      // Use unpatched RAF for Pixi's ticker to avoid Angular zone interference
      const nativeRAF = (window as any).__zone_symbol__requestAnimationFrame || window.requestAnimationFrame.bind(window);
      const nativeCAF = (window as any).__zone_symbol__cancelAnimationFrame || window.cancelAnimationFrame.bind(window);
      if (this.app.ticker) {
        // Replace Pixi's ticker RAF with the unpatched version
        (this.app.ticker as any)._requestIfNeeded = function() {
          if (this._requestId === null) {
            this._lastFrame = performance.now();
            this._requestId = nativeRAF((time: number) => {
              this._requestId = null;
              this.update(time);
            });
          }
        };
      }

      // Create layer containers
      this.gridContainer = new Container();
      this.connectionContainer = new Container();
      this.shapeContainer = new Container();
      this.overlayContainer = new Container();
      this.tempContainer = new Container();

      this.viewport.addChild(this.gridContainer);
      this.viewport.addChild(this.connectionContainer);
      this.viewport.addChild(this.shapeContainer);
      this.viewport.addChild(this.overlayContainer);
      this.viewport.addChild(this.tempContainer);

      // Handle resize (outside zone)
      this.resizeObserver = new ResizeObserver(() => {
        if (!this.hostElement) return;
        this.app.renderer.resize(this.hostElement.clientWidth, this.hostElement.clientHeight);
        this.viewport.resize(this.hostElement.clientWidth, this.hostElement.clientHeight);
      });
      this.resizeObserver.observe(host);
    });

    this.isInitialized.set(true);
  }

  updateWorldSize(width: number, height: number): void {
    if (this.viewport) {
      this.viewport.worldWidth = width;
      this.viewport.worldHeight = height;
    }
  }

  /** Convert client (screen) coordinates to world (diagram) coordinates */
  toWorld(clientX: number, clientY: number): { x: number; y: number } {
    if (!this.viewport || !this.hostElement) return { x: 0, y: 0 };
    const rect = this.hostElement.getBoundingClientRect();
    const screenX = clientX - rect.left;
    const screenY = clientY - rect.top;
    const world = this.viewport.toWorld(screenX, screenY);
    return { x: world.x, y: world.y };
  }

  get scale(): number {
    return this.viewport?.scale?.x ?? 1;
  }

  zoomIn(): void {
    if (!this.viewport) return;
    this.viewport.zoom(-100, true);
  }

  zoomOut(): void {
    if (!this.viewport) return;
    this.viewport.zoom(100, true);
  }

  zoomFit(worldWidth: number, worldHeight: number): void {
    if (!this.viewport || !this.hostElement) return;
    this.viewport.fit(true, worldWidth, worldHeight);
    this.viewport.moveCenter(worldWidth / 2, worldHeight / 2);
  }

  centerOn(x: number, y: number): void {
    if (!this.viewport) return;
    this.viewport.moveCenter(x, y);
  }

  destroy(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;

    if (this.app) {
      this.app.destroy(true, { children: true, texture: true });
    }

    this.hostElement = null;
    this.isInitialized.set(false);
  }
}
