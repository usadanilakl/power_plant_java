import {
  Component,
  inject,
  input,
  output,
  signal,
  OnInit,
  OnDestroy,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  DraggableWindowService,
  WindowPosition,
  WindowSize
} from '../../features/loto-standard/refactored/loto-builder/services/draggable-window.service';

export type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

@Component({
  selector: 'app-rf-floating-window',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rf-floating-window.component.html',
  styleUrl: './rf-floating-window.component.css',
})
export class RfFloatingWindowComponent implements OnInit, OnDestroy {
  private windowService = inject(DraggableWindowService);

  // Required inputs
  windowId = input.required<string>();

  // Optional configuration inputs
  initialPosition = input<WindowPosition>({ x: 100, y: 100 });
  initialSize = input<WindowSize>({ width: 400, height: 300 });
  minSize = input<WindowSize>({ width: 200, height: 150 });
  maxSize = input<WindowSize | null>(null);
  resizable = input<boolean>(true);
  showHeader = input<boolean>(true);
  headerClass = input<string>('');

  // Outputs
  closed = output<void>();
  positionChanged = output<WindowPosition>();
  sizeChanged = output<WindowSize>();

  // Internal state
  isDragging = signal<boolean>(false);
  isResizing = signal<boolean>(false);
  currentZIndex = signal<number>(10000);
  position = signal<WindowPosition>({ x: 100, y: 100 });
  size = signal<WindowSize>({ width: 400, height: 300 });

  private dragStartPos = { x: 0, y: 0 };
  private windowStartPos: WindowPosition = { x: 0, y: 0 };
  private windowStartSize: WindowSize = { width: 0, height: 0 };
  private currentResizeDirection: ResizeDirection | null = null;

  // Computed styles
  windowStyle = computed(() => {
    const pos = this.position();
    const sz = this.size();
    return {
      transform: `translate(${pos.x}px, ${pos.y}px)`,
      width: `${sz.width}px`,
      height: `${sz.height}px`,
      zIndex: this.currentZIndex()
    };
  });

  ngOnInit(): void {
    const windowState = this.windowService.registerWindow(
      this.windowId(),
      this.initialPosition(),
      this.initialSize()
    );
    this.currentZIndex.set(windowState.zIndex);
    this.position.set(windowState.position);
    this.size.set(windowState.size);
  }

  ngOnDestroy(): void {
    this.cleanupListeners();
    this.windowService.unregisterWindow(this.windowId());
  }

  /**
   * Bring window to front when clicked
   */
  onWindowClick(): void {
    const newZIndex = this.windowService.bringToFront(this.windowId());
    this.currentZIndex.set(newZIndex);
  }

  /**
   * Start dragging the window
   */
  onDragStart(event: MouseEvent): void {
    // Only start drag on left mouse button
    if (event.button !== 0) return;

    // Don't drag if clicking on buttons or interactive elements
    const target = event.target as HTMLElement;
    if (target.closest('button, input, select, textarea, a')) {
      return;
    }

    event.preventDefault();
    this.isDragging.set(true);
    this.onWindowClick();

    this.dragStartPos = { x: event.clientX, y: event.clientY };
    this.windowStartPos = { ...this.position() };

    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
  }

  /**
   * Start resizing the window
   */
  onResizeStart(event: MouseEvent, direction: ResizeDirection): void {
    if (event.button !== 0) return;
    if (!this.resizable()) return;

    event.preventDefault();
    event.stopPropagation();

    this.isResizing.set(true);
    this.currentResizeDirection = direction;
    this.onWindowClick();

    this.dragStartPos = { x: event.clientX, y: event.clientY };
    this.windowStartPos = { ...this.position() };
    this.windowStartSize = { ...this.size() };

    document.addEventListener('mousemove', this.onResizeMove);
    document.addEventListener('mouseup', this.onResizeEnd);
  }

  /**
   * Handle mouse move during drag
   */
  private onMouseMove = (event: MouseEvent): void => {
    if (!this.isDragging()) return;

    const deltaX = event.clientX - this.dragStartPos.x;
    const deltaY = event.clientY - this.dragStartPos.y;

    const newPosition = {
      x: this.windowStartPos.x + deltaX,
      y: this.windowStartPos.y + deltaY,
    };

    this.position.set(newPosition);
  };

  /**
   * Handle mouse up to end drag
   */
  private onMouseUp = (): void => {
    if (this.isDragging()) {
      this.windowService.updatePosition(this.windowId(), this.position());
      this.positionChanged.emit(this.position());
    }
    this.isDragging.set(false);
    this.cleanupDragListeners();
  };

  /**
   * Handle mouse move during resize
   */
  private onResizeMove = (event: MouseEvent): void => {
    if (!this.isResizing() || !this.currentResizeDirection) return;

    const deltaX = event.clientX - this.dragStartPos.x;
    const deltaY = event.clientY - this.dragStartPos.y;
    const dir = this.currentResizeDirection;

    let newWidth = this.windowStartSize.width;
    let newHeight = this.windowStartSize.height;
    let newX = this.windowStartPos.x;
    let newY = this.windowStartPos.y;

    const minW = this.minSize().width;
    const minH = this.minSize().height;
    const maxW = this.maxSize()?.width ?? Infinity;
    const maxH = this.maxSize()?.height ?? Infinity;

    // Handle horizontal resize
    if (dir.includes('e')) {
      newWidth = Math.min(maxW, Math.max(minW, this.windowStartSize.width + deltaX));
    }
    if (dir.includes('w')) {
      const proposedWidth = this.windowStartSize.width - deltaX;
      newWidth = Math.min(maxW, Math.max(minW, proposedWidth));
      // Adjust position when resizing from left
      newX = this.windowStartPos.x + (this.windowStartSize.width - newWidth);
    }

    // Handle vertical resize
    if (dir.includes('s')) {
      newHeight = Math.min(maxH, Math.max(minH, this.windowStartSize.height + deltaY));
    }
    if (dir.includes('n')) {
      const proposedHeight = this.windowStartSize.height - deltaY;
      newHeight = Math.min(maxH, Math.max(minH, proposedHeight));
      // Adjust position when resizing from top
      newY = this.windowStartPos.y + (this.windowStartSize.height - newHeight);
    }

    this.size.set({ width: newWidth, height: newHeight });
    this.position.set({ x: newX, y: newY });
  };

  /**
   * Handle mouse up to end resize
   */
  private onResizeEnd = (): void => {
    if (this.isResizing()) {
      this.windowService.updatePositionAndSize(
        this.windowId(),
        this.position(),
        this.size()
      );
      this.sizeChanged.emit(this.size());
      this.positionChanged.emit(this.position());
    }
    this.isResizing.set(false);
    this.currentResizeDirection = null;
    this.cleanupResizeListeners();
  };

  /**
   * Cleanup drag event listeners
   */
  private cleanupDragListeners(): void {
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
  }

  /**
   * Cleanup resize event listeners
   */
  private cleanupResizeListeners(): void {
    document.removeEventListener('mousemove', this.onResizeMove);
    document.removeEventListener('mouseup', this.onResizeEnd);
  }

  /**
   * Cleanup all listeners
   */
  private cleanupListeners(): void {
    this.cleanupDragListeners();
    this.cleanupResizeListeners();
  }
}
