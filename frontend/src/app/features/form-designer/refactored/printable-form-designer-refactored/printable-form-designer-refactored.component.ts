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
  ViewChild
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { Subject } from 'rxjs';

// Models
import { FormContainerDto } from '../../../../models/forms/form-container.model';
import { PrintableFormDto } from '../../../../models/forms/printable-form.model';
import { FormField } from '../../../../models/ui/form-field.model';

// Services
import { CurrentPrintableFormService } from '../../../../services/forms/current-printable-form.service';
import { FormDesignerStateService } from '../services/form-designer-state.service';
import { FormContainerOperationsService } from '../services/form-container-operations.service';
import { FormCoordinateService } from '../services/form-coordinate.service';
import { FormEntityLoaderService } from '../services/form-entity-loader.service';

// Components
import { FormContainerPropertiesComponent } from '../../form-container/form-container-properties/form-container-properties.component';
import { FormContainerListComponent } from '../../form-container/form-container-list/form-container-list.component';
import { FloatingMenuComponent, MenuPosition } from '../../../../shared/menu/floating-menu/floating-menu.component';
import { FormZoomControlsComponent } from '../../form-zoom-controls/form-zoom-controls.component';
import { PageNavigatorComponent } from '../../page-navigator/page-navigator.component';

// Pipes
import { ContainerContentPipe } from '../../../../pipes/container-content.pipe';

// Input Components
import { RadioCheckboxesComponent } from '../../inputs/radio-checkboxes/radio-checkboxes.component';
import { InvisibleInputFieldComponent } from '../../inputs/invisible-input-field/invisible-input-field.component';
import { InvisibleSearchableSelectComponent } from '../../inputs/invisible-searchable-select/invisible-searchable-select.component';
import { ChekcboxXComponent } from '../../inputs/chekcbox-x/chekcbox-x.component';
import { InvisibleSearchableMultiSelectComponent } from '../../inputs/invisible-searchable-multi-select/invisible-searchable-multi-select.component';
import { NestedFormInputComponent } from '../../inputs/nested-form-input/nested-form-input.component';

@Component({
  selector: 'app-printable-form-designer-refactored',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DragDropModule,
    FormContainerPropertiesComponent,
    FormContainerListComponent,
    FloatingMenuComponent,
    ContainerContentPipe,
    RadioCheckboxesComponent,
    InvisibleInputFieldComponent,
    InvisibleSearchableSelectComponent,
    ChekcboxXComponent,
    InvisibleSearchableMultiSelectComponent,
    FormZoomControlsComponent,
    PageNavigatorComponent,
    NestedFormInputComponent
  ],
  templateUrl: './printable-form-designer-refactored.component.html',
  styleUrl: './printable-form-designer-refactored.component.css'
})
export class PrintableFormDesignerRefactoredComponent implements OnInit, OnDestroy {
  @ViewChild('centerPanel') centerPanel!: ElementRef;
  @ViewChild('formContent') formContentElement!: ElementRef<HTMLDivElement>;

  // Services
  currentFormService = inject(CurrentPrintableFormService);
  stateService = inject(FormDesignerStateService);
  operationsService = inject(FormContainerOperationsService);
  coordinateService = inject(FormCoordinateService);
  entityLoaderService = inject(FormEntityLoaderService);

  // Enums for template
  menuPosition = MenuPosition;

  // State
  currentForm = toSignal(this.currentFormService.form$, { initialValue: new PrintableFormDto() });
  containers = this.currentFormService.currentPageContainers;
  isPropertiesPopupOpen = signal(false);

  // Writable state for two-way binding
  sheetWidth = signal(8.5);
  sheetHeight = signal(11);

  // Computed properties
  sheetSize = computed(() => ({ width: this.sheetWidth(), height: this.sheetHeight() }));
  formSize = computed(() => this.coordinateService.getSheetSizeInPixels(this.sheetSize()));
  formScale = this.stateService.formScale;

  availableFields = computed<any>(() => {
    const type = this.currentForm().formType ?? 'SafeWork';
    return this.entityLoaderService.loadEntityDto(type);
  });

  // Cleanup
  private destroy$ = new Subject<void>();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit(): void {
    // Load entity fields for current form type
    const formType = this.currentForm().formType ?? 'SafeWork';
    const { entity, fields } = this.entityLoaderService.loadEntityWithFields(formType);
    this.currentFormService.currentEntity = entity;
    this.currentFormService.currentEntityFields = fields;

    // Initialize sheet size from current form
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

  /*****************************************************************************
   * Form Operations
   ****************************************************************************/

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

    const containerWidth = this.centerPanel.nativeElement.offsetWidth;
    const containerHeight = this.centerPanel.nativeElement.offsetHeight;
    const scale = this.coordinateService.calculateFitToPanel(
      containerWidth,
      containerHeight,
      this.formSize().width,
      this.formSize().height
    );
    this.stateService.setScale(scale);
  }

  updateSheetSize(width: number, height: number): void {
    const newForm = new PrintableFormDto({ ...this.currentForm(), size: { width, height } });
    this.currentFormService.updateForm(newForm);
    this.fitToPanel();
  }

  getFormContainerStyle(): any {
    return this.coordinateService.getFormContainerStyle(this.formSize(), this.formScale());
  }

  /*****************************************************************************
   * Container Operations
   ****************************************************************************/

  addContainer(): void {
    const newContainer = new FormContainerDto();
    this.currentFormService.createNewContainer(newContainer);
  }

  selectContainer(container: FormContainerDto, event: MouseEvent): void {
    this.currentFormService.selectContainer(container, event);
  }

  updateContainer(container: FormContainerDto): void {
    this.currentFormService.updateContainer(container);
  }

  deleteContainer(id: number = 0): void {
    const contId = !id || id === 0
      ? this.currentFormService.selectedContainers()[0].id
      : id;
    this.currentFormService.deleteContainer(contId);
  }

  isContainerSelected(container: FormContainerDto): boolean {
    return this.currentFormService.isContainerSelected(container);
  }

  getContainerStyles(container: FormContainerDto): any {
    return this.coordinateService.getContainerPositionStyle(container);
  }

  getContentStyles(container: FormContainerDto): any {
    return this.coordinateService.getContentStyle(container);
  }

  getLabel(container: FormContainerDto): string {
    if (container.contentType === 'formField') {
      const field = container.content as FormField;
      return field.label ?? `Field ${container.id}`;
    }
    return `Container ${container.id}`;
  }

  getFormFieldType(container: FormContainerDto): string | undefined {
    if (container.contentType === 'formField' && container.content) {
      return (container.content as FormField).type;
    }
    return undefined;
  }

  /*****************************************************************************
   * Properties Popup
   ****************************************************************************/

  viewPropertiesOfContainer(container: FormContainerDto | null, event: MouseEvent): void {
    this.currentFormService.propertiesOfContainer.set(container);
    if (container) this.currentFormService.selectContainer(container, event);
    event.preventDefault();
    this.isPropertiesPopupOpen.set(true);
  }

  closePropertiesPopup(): void {
    this.isPropertiesPopupOpen.set(false);
    this.currentFormService.propertiesOfContainer.set(null);
  }

  /*****************************************************************************
   * Keyboard Interactions
   ****************************************************************************/

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    const selectedContainers = this.currentFormService.selectedContainers();
    if (selectedContainers.length === 0) return;

    const moveAmount = event.shiftKey ? 10 : 1;
    let direction: 'up' | 'down' | 'left' | 'right' | null = null;

    switch (event.key) {
      case 'ArrowUp':
        direction = 'up';
        break;
      case 'ArrowDown':
        direction = 'down';
        break;
      case 'ArrowLeft':
        direction = 'left';
        break;
      case 'ArrowRight':
        direction = 'right';
        break;
      default:
        return;
    }

    event.preventDefault();

    const updatedContainers = this.coordinateService.moveContainersByKeyboard(
      selectedContainers,
      direction,
      moveAmount
    );

    this.currentFormService.updateContainers(updatedContainers);
  }

  /*****************************************************************************
   * Drag Operations
   ****************************************************************************/

  onDragStart(event: MouseEvent, container: FormContainerDto): void {
    if (container.locked) return;

    event.preventDefault();
    event.stopPropagation();

    const selectedContainers = this.currentFormService.selectedContainers();
    this.stateService.startDrag(event, selectedContainers);

    document.addEventListener('mousemove', this.onDragMove);
    document.addEventListener('mouseup', this.onDragEnd);
  }

  private onDragMove = (event: MouseEvent) => {
    if (!this.stateService.isDraggingActive()) return;

    event.preventDefault();

    const delta = this.stateService.getDragDelta(event);
    const formSheet = this.formContentElement.nativeElement;
    const sheetWidth = formSheet.clientWidth;
    const sheetHeight = formSheet.clientHeight;

    const updatedContainers = this.currentFormService.selectedContainers().map(container => {
      const initialPos = this.stateService.getInitialPosition(container.id + '');
      if (!initialPos) return container;

      const newPosition = this.coordinateService.calculateDraggedPosition(
        initialPos,
        delta,
        container.size!,
        sheetWidth,
        sheetHeight
      );

      return new FormContainerDto({ ...container, position: newPosition });
    });

    this.currentFormService.updateContainersState(updatedContainers);
  };

  private onDragEnd = (event: MouseEvent) => {
    if (!this.stateService.isDraggingActive()) return;

    const delta = this.stateService.getDragDelta(event);
    const formSheet = this.formContentElement.nativeElement;
    const sheetWidth = formSheet.clientWidth;
    const sheetHeight = formSheet.clientHeight;

    const finalContainers = this.currentFormService.selectedContainers().map(container => {
      const initialPos = this.stateService.getInitialPosition(container.id + '');
      if (!initialPos) return container;

      const newPosition = this.coordinateService.calculateDraggedPosition(
        initialPos,
        delta,
        container.size!,
        sheetWidth,
        sheetHeight
      );

      return new FormContainerDto({ ...container, position: newPosition });
    });

    if (finalContainers.length > 0) {
      this.currentFormService.updateContainers(finalContainers);
    }

    this.stateService.endDrag();
    document.removeEventListener('mousemove', this.onDragMove);
    document.removeEventListener('mouseup', this.onDragEnd);
  };

  /*****************************************************************************
   * Resize Operations
   ****************************************************************************/

  startResize(event: MouseEvent, index: number): void {
    if (!isPlatformBrowser(this.platformId)) return;

    event.preventDefault();
    event.stopPropagation();

    const selectedContainers = this.currentFormService.selectedContainers();
    const containersToResize = selectedContainers.length > 1
      ? selectedContainers
      : [this.containers()[index]];

    this.stateService.startResize(event, containersToResize, this.containers()[index].id + '');

    document.addEventListener('mousemove', this.onResize);
    document.addEventListener('mouseup', this.stopResize);
  }

  private onResize = (event: MouseEvent) => {
    if (!isPlatformBrowser(this.platformId) || !this.stateService.isResizing()) return;

    const delta = this.stateService.getResizeDelta(event);
    const selectedContainers = this.currentFormService.selectedContainers();

    const updatedContainers = selectedContainers.map(container => {
      const initialSize = this.stateService.getInitialSize(container.id + '');
      if (!initialSize) return container;

      const newSize = this.coordinateService.calculateResizedSize(initialSize, delta);

      return new FormContainerDto({ ...container, size: newSize });
    });

    this.currentFormService.updateContainersState(updatedContainers);
  };

  private stopResize = (event?: MouseEvent) => {
    if (!isPlatformBrowser(this.platformId) || !this.stateService.isResizing()) return;

    if (event) {
      const delta = this.stateService.getResizeDelta(event);
      const selectedContainers = this.currentFormService.selectedContainers();

      const finalContainers = selectedContainers.map(container => {
        const initialSize = this.stateService.getInitialSize(container.id + '');
        if (!initialSize) return container;

        const newSize = this.coordinateService.calculateResizedSize(initialSize, delta);

        return new FormContainerDto({ ...container, size: newSize });
      });

      if (finalContainers.length > 0) {
        this.currentFormService.updateContainers(finalContainers);
      }
    }

    this.stateService.endResize();
    document.removeEventListener('mousemove', this.onResize);
    document.removeEventListener('mouseup', this.stopResize);
  };

  /*****************************************************************************
   * Marquee Selection
   ****************************************************************************/

  onFormSheetMouseDown(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    if (event.target !== this.formContentElement.nativeElement && !target.classList.contains('locked')) {
      return;
    }

    if (this.stateService.isDraggingActive()) return;

    event.preventDefault();

    const startPoint = this.coordinateService.getScaledCoordinates(
      event,
      this.formContentElement.nativeElement,
      this.formScale()
    );

    this.stateService.startSelection(startPoint);

    if (!event.ctrlKey) {
      this.currentFormService.selectedContainers.set([]);
    }

    document.addEventListener('mousemove', this.onDocumentMouseMove);
    document.addEventListener('mouseup', this.onDocumentMouseUp);
  }

  private onDocumentMouseMove = (event: MouseEvent) => {
    if (!this.stateService.isSelecting()) return;

    const currentPoint = this.coordinateService.getScaledCoordinates(
      event,
      this.formContentElement.nativeElement,
      this.formScale()
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
    this.currentFormService.selectedContainers.set(selected);
  }

  /*****************************************************************************
   * Grouping Operations
   ****************************************************************************/

  groupSelection(): void {
    const selected = this.currentFormService.selectedContainers();
    const grouped = this.operationsService.groupContainers(selected);
    this.currentFormService.updateContainers(grouped);
  }

  ungroupSelection(): void {
    const selected = this.currentFormService.selectedContainers();
    const ungrouped = this.operationsService.ungroupContainers(selected, this.containers());
    this.currentFormService.updateContainers(ungrouped);
    this.currentFormService.selectedContainers.set(ungrouped);
  }

  isGroupSelected(): boolean {
    return this.operationsService.isGrouped(this.currentFormService.selectedContainers());
  }

  /*****************************************************************************
   * Alignment Operations
   ****************************************************************************/

  alignContainers(alignment: 'left' | 'right' | 'top' | 'bottom' | 'h-center' | 'v-center'): void {
    const selected = this.currentFormService.selectedContainers();
    const aligned = this.operationsService.alignContainers(selected, alignment);
    this.currentFormService.updateContainers(aligned);
  }

  matchSize(dimension: 'width' | 'height' | 'both'): void {
    const selected = this.currentFormService.selectedContainers();
    const matched = this.operationsService.matchSize(selected, dimension);
    this.currentFormService.updateContainers(matched);
  }

  distributeContainers(direction: 'horizontal' | 'vertical'): void {
    const selected = this.currentFormService.selectedContainers();
    const distributed = this.operationsService.distributeContainers(selected, direction);
    this.currentFormService.updateContainers(distributed);
  }

  arrangeSequentially(direction: 'horizontal' | 'vertical', gap: number = -2): void {
    const selected = this.currentFormService.selectedContainers();
    const arranged = this.operationsService.arrangeSequentially(selected, direction, gap);
    this.currentFormService.updateContainers(arranged);
  }

  swapContainers(): void {
    const selected = this.currentFormService.selectedContainers();
    const swapped = this.operationsService.swapContainers(selected);
    this.currentFormService.updateContainers(swapped);
  }

  /*****************************************************************************
   * Cleanup
   ****************************************************************************/

  private cleanup(): void {
    this.stopResize();
    document.removeEventListener('mousemove', this.onDocumentMouseMove);
    document.removeEventListener('mouseup', this.onDocumentMouseUp);
    document.removeEventListener('mousemove', this.onDragMove);
    document.removeEventListener('mouseup', this.onDragEnd);
  }
}
