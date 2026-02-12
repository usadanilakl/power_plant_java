import {
  Component,
  computed,
  ElementRef,
  HostListener,
  Inject,
  inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  signal,
  ViewChild,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { Subject } from 'rxjs';

import { FormContainerDto } from '../models/form-container.model';
import { PrintableFormDto } from '../models/printable-form.model';

import { FormStateService } from '../services/form-state.service';
import { DesignerInteractionService } from '../services/designer-interaction.service';
import { ContainerOperationsService } from '../services/container-operations.service';
import { CoordinateService } from '../services/coordinate.service';
import { EntityLoaderService } from '../services/entity-loader.service';

import { ContainerRendererComponent } from '../container-renderer/container-renderer.component';
import { ContainerListComponent } from '../container-list/container-list.component';
import { ContainerPropertiesComponent } from '../container-properties/container-properties.component';
import { FloatingMenuComponent, MenuPosition } from '../../../shared/menu/floating-menu/floating-menu.component';
import { ZoomControlsComponent } from '../zoom-controls/zoom-controls.component';
import { PageNavigatorComponent } from '../page-navigator/page-navigator.component';
@Component({
  selector: 'app-form-designer-canvas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ContainerRendererComponent,
    ContainerListComponent,
    ContainerPropertiesComponent,
    FloatingMenuComponent,
    ZoomControlsComponent,
    PageNavigatorComponent,
  ],
  templateUrl: './form-designer-canvas.component.html',
  styleUrl: './form-designer-canvas.component.css',
})
export class FormDesignerCanvasComponent implements OnInit, OnDestroy {
  @ViewChild('centerPanel') centerPanel!: ElementRef;
  @ViewChild('formContent') formContentElement!: ElementRef<HTMLDivElement>;

  formState = inject(FormStateService);
  stateService = inject(DesignerInteractionService);
  private operationsService = inject(ContainerOperationsService);
  private coordinateService = inject(CoordinateService);
  private entityLoaderService = inject(EntityLoaderService);

  menuPosition = MenuPosition;

  currentForm = toSignal(this.formState.form$, { initialValue: new PrintableFormDto() });
  containers = this.formState.currentPageContainers;
  isPropertiesPopupOpen = signal(false);

  sheetWidth = signal(8.5);
  sheetHeight = signal(11);

  sheetSize = computed(() => ({ width: this.sheetWidth(), height: this.sheetHeight() }));
  formSize = computed(() => this.coordinateService.getSheetSizeInPixels(this.sheetSize()));
  formScale = this.stateService.formScale;

  availableFields = computed<any>(() => {
    const type = this.currentForm().formType ?? 'SafeWork';
    return this.entityLoaderService.loadEntityDto(type);
  });

  private destroy$ = new Subject<void>();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit(): void {
    const formType = this.currentForm().formType ?? 'SafeWork';
    const { entity, fields } = this.entityLoaderService.loadEntityWithFields(formType);
    this.formState.currentEntity = entity;
    this.formState.currentEntityFields = fields;

    const size = this.currentForm().size ?? { width: 8.5, height: 11 };
    this.sheetWidth.set(size.width);
    this.sheetHeight.set(size.height);
  }

  ngAfterViewInit(): void {
    this.fitToPanel();
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.cleanup();
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ==================== Form Operations ====================

  @HostListener('window:resize')
  onWindowResize(): void {
    this.fitToPanel();
  }

  @HostListener('wheel', ['$event'])
  onMouseWheel(event: WheelEvent): void {
    if (event.ctrlKey) {
      event.preventDefault();
      const direction = event.deltaY > 0 ? -1 : 1;
      const scaleAmount = 1 + direction * 0.02;
      this.stateService.setScale(this.formScale() * scaleAmount);
    }
  }

  zoomIn(): void {
    this.stateService.zoomIn();
  }

  zoomOut(): void {
    this.stateService.zoomOut();
  }

  fitToPanel(): void {
    if (!this.centerPanel) return;
    const el = this.centerPanel.nativeElement;
    const scale = this.coordinateService.calculateFitToPanel(
      el.offsetWidth, el.offsetHeight,
      this.formSize().width, this.formSize().height,
    );
    this.stateService.setScale(scale);
  }

  updateSheetSize(width: number, height: number): void {
    const newForm = new PrintableFormDto({ ...this.currentForm(), size: { width, height } });
    this.formState.updateForm(newForm);
    this.fitToPanel();
  }

  getFormContainerStyle(): any {
    return this.coordinateService.getFormContainerStyle(this.formSize(), this.formScale());
  }

  // ==================== Container Operations ====================

  addContainer(): void {
    this.formState.createNewContainer(new FormContainerDto());
  }

  selectContainer(container: FormContainerDto, event: MouseEvent): void {
    this.formState.selectContainer(container, event);
  }

  updateContainer(container: FormContainerDto): void {
    this.formState.updateContainer(container);
  }

  deleteContainer(id: number = 0): void {
    const contId = !id || id === 0
      ? this.formState.selectedContainers()[0]?.id
      : id;
    if (contId) this.formState.deleteContainer(contId);
  }

  isContainerSelected(container: FormContainerDto): boolean {
    return this.formState.isContainerSelected(container);
  }

  getContainerStyles(container: FormContainerDto): any {
    return this.coordinateService.getContainerPositionStyle(container);
  }

  // ==================== Properties Popup ====================

  viewPropertiesOfContainer(container: FormContainerDto | null, event: MouseEvent): void {
    this.formState.propertiesOfContainer.set(container);
    if (container) this.formState.selectContainer(container, event);
    event.preventDefault();
    this.isPropertiesPopupOpen.set(true);
  }

  closePropertiesPopup(): void {
    this.isPropertiesPopupOpen.set(false);
    this.formState.propertiesOfContainer.set(null);
  }

  // ==================== Keyboard ====================

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    const selected = this.formState.selectedContainers();
    if (selected.length === 0) return;

    const moveAmount = event.shiftKey ? 10 : 1;
    let direction: 'up' | 'down' | 'left' | 'right' | null = null;

    switch (event.key) {
      case 'ArrowUp': direction = 'up'; break;
      case 'ArrowDown': direction = 'down'; break;
      case 'ArrowLeft': direction = 'left'; break;
      case 'ArrowRight': direction = 'right'; break;
      default: return;
    }

    event.preventDefault();
    const updated = this.coordinateService.moveContainersByKeyboard(selected, direction, moveAmount);
    this.formState.updateContainers(updated);
  }

  // ==================== Drag ====================

  onDragStart(event: MouseEvent, container: FormContainerDto): void {
    if (container.locked) return;
    event.preventDefault();
    event.stopPropagation();

    const selected = this.formState.selectedContainers();
    this.stateService.startDrag(event, selected);

    document.addEventListener('mousemove', this.onDragMove);
    document.addEventListener('mouseup', this.onDragEnd);
  }

  private onDragMove = (event: MouseEvent) => {
    if (!this.stateService.isDraggingActive()) return;
    event.preventDefault();

    const delta = this.stateService.getDragDelta(event);
    const sheet = this.formContentElement.nativeElement;

    const updated = this.formState.selectedContainers().map(c => {
      const initialPos = this.stateService.getInitialPosition(c.id + '');
      if (!initialPos) return c;
      const newPos = this.coordinateService.calculateDraggedPosition(
        initialPos, delta, c.size!, sheet.clientWidth, sheet.clientHeight,
      );
      return new FormContainerDto({ ...c, position: newPos });
    });

    this.formState.updateContainersState(updated);
  };

  private onDragEnd = (event: MouseEvent) => {
    if (!this.stateService.isDraggingActive()) return;

    const delta = this.stateService.getDragDelta(event);
    const sheet = this.formContentElement.nativeElement;

    const final = this.formState.selectedContainers().map(c => {
      const initialPos = this.stateService.getInitialPosition(c.id + '');
      if (!initialPos) return c;
      const newPos = this.coordinateService.calculateDraggedPosition(
        initialPos, delta, c.size!, sheet.clientWidth, sheet.clientHeight,
      );
      return new FormContainerDto({ ...c, position: newPos });
    });

    if (final.length > 0) this.formState.updateContainers(final);

    this.stateService.endDrag();
    document.removeEventListener('mousemove', this.onDragMove);
    document.removeEventListener('mouseup', this.onDragEnd);
  };

  // ==================== Resize ====================

  startResize(event: MouseEvent, index: number): void {
    if (!isPlatformBrowser(this.platformId)) return;
    event.preventDefault();
    event.stopPropagation();

    const selected = this.formState.selectedContainers();
    const containersToResize = selected.length > 1
      ? selected
      : [this.containers()[index]];

    this.stateService.startResize(event, containersToResize, this.containers()[index].id + '');

    document.addEventListener('mousemove', this.onResize);
    document.addEventListener('mouseup', this.stopResize);
  }

  private onResize = (event: MouseEvent) => {
    if (!isPlatformBrowser(this.platformId) || !this.stateService.isResizing()) return;

    const delta = this.stateService.getResizeDelta(event);
    const selected = this.formState.selectedContainers();

    const updated = selected.map(c => {
      const initial = this.stateService.getInitialSize(c.id + '');
      if (!initial) return c;
      const newSize = this.coordinateService.calculateResizedSize(initial, delta);
      return new FormContainerDto({ ...c, size: newSize });
    });

    this.formState.updateContainersState(updated);
  };

  private stopResize = (event?: MouseEvent) => {
    if (!isPlatformBrowser(this.platformId) || !this.stateService.isResizing()) return;

    if (event) {
      const delta = this.stateService.getResizeDelta(event);
      const selected = this.formState.selectedContainers();

      const final = selected.map(c => {
        const initial = this.stateService.getInitialSize(c.id + '');
        if (!initial) return c;
        const newSize = this.coordinateService.calculateResizedSize(initial, delta);
        return new FormContainerDto({ ...c, size: newSize });
      });

      if (final.length > 0) this.formState.updateContainers(final);
    }

    this.stateService.endResize();
    document.removeEventListener('mousemove', this.onResize);
    document.removeEventListener('mouseup', this.stopResize);
  };

  // ==================== Marquee Selection ====================

  onFormSheetMouseDown(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (event.target !== this.formContentElement.nativeElement && !target.classList.contains('locked')) {
      return;
    }
    if (this.stateService.isDraggingActive()) return;

    event.preventDefault();

    const startPoint = this.coordinateService.getScaledCoordinates(
      event, this.formContentElement.nativeElement, this.formScale(),
    );

    this.stateService.startSelection(startPoint);

    if (!event.ctrlKey) {
      this.formState.selectedContainers.set([]);
    }

    document.addEventListener('mousemove', this.onDocumentMouseMove);
    document.addEventListener('mouseup', this.onDocumentMouseUp);
  }

  private onDocumentMouseMove = (event: MouseEvent) => {
    if (!this.stateService.isSelecting()) return;
    const currentPoint = this.coordinateService.getScaledCoordinates(
      event, this.formContentElement.nativeElement, this.formScale(),
    );
    this.stateService.updateSelection(currentPoint);
    this.updateSelectionFromBox();
  };

  private onDocumentMouseUp = () => {
    this.stateService.endSelection();
    document.removeEventListener('mousemove', this.onDocumentMouseMove);
    document.removeEventListener('mouseup', this.onDocumentMouseUp);
  };

  private updateSelectionFromBox(): void {
    const selected = this.stateService.getContainersInSelectionBox(this.containers());
    this.formState.selectedContainers.set(selected);
  }

  // ==================== Grouping ====================

  groupSelection(): void {
    const selected = this.formState.selectedContainers();
    const grouped = this.operationsService.groupContainers(selected);
    this.formState.updateContainers(grouped);
  }

  ungroupSelection(): void {
    const selected = this.formState.selectedContainers();
    const ungrouped = this.operationsService.ungroupContainers(selected, this.containers());
    this.formState.updateContainers(ungrouped);
    this.formState.selectedContainers.set(ungrouped);
  }

  isGroupSelected(): boolean {
    return this.operationsService.isGrouped(this.formState.selectedContainers());
  }

  // ==================== Alignment ====================

  alignContainers(alignment: 'left' | 'right' | 'top' | 'bottom' | 'h-center' | 'v-center'): void {
    const selected = this.formState.selectedContainers();
    const aligned = this.operationsService.alignContainers(selected, alignment);
    this.formState.updateContainers(aligned);
  }

  matchSize(dimension: 'width' | 'height' | 'both'): void {
    const selected = this.formState.selectedContainers();
    const matched = this.operationsService.matchSize(selected, dimension);
    this.formState.updateContainers(matched);
  }

  distributeContainers(direction: 'horizontal' | 'vertical'): void {
    const selected = this.formState.selectedContainers();
    const distributed = this.operationsService.distributeContainers(selected, direction);
    this.formState.updateContainers(distributed);
  }

  arrangeSequentially(direction: 'horizontal' | 'vertical', gap: number = -2): void {
    const selected = this.formState.selectedContainers();
    const arranged = this.operationsService.arrangeSequentially(selected, direction, gap);
    this.formState.updateContainers(arranged);
  }

  swapContainers(): void {
    const selected = this.formState.selectedContainers();
    const swapped = this.operationsService.swapContainers(selected);
    this.formState.updateContainers(swapped);
  }

  // ==================== Cleanup ====================

  private cleanup(): void {
    this.stopResize();
    document.removeEventListener('mousemove', this.onDocumentMouseMove);
    document.removeEventListener('mouseup', this.onDocumentMouseUp);
    document.removeEventListener('mousemove', this.onDragMove);
    document.removeEventListener('mouseup', this.onDragEnd);
  }
}
