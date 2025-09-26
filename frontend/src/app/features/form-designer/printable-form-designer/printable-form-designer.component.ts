
import { Component, computed, ElementRef, HostListener, Inject, inject, OnInit, PLATFORM_ID, signal, ViewChild } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormBuilderService } from '../../../services/ui/form-builder.service';
import { FormField } from '../../../models/ui/form-field.model';
import { SafeWorkDto } from '../../../models/permits/safe-work.model';
import { HotWorkDto } from '../../../models/permits/hot-work.model';
import { ConfinedSpaceDto } from '../../../models/permits/confined-space.model';
import { toSignal } from '@angular/core/rxjs-interop';
import { CdkDragEnd, DragDropModule } from '@angular/cdk/drag-drop';
import { FormContainerDto } from '../../../models/forms/form-container.model';
import { CurrentPrintableFormService } from '../../../services/forms/current-printable-form.service';
import { PrintableFormDto } from '../../../models/forms/printable-form.model';
import { FormContainerPropertiesComponent } from "../form-container/form-container-properties/form-container-properties.component";
import { FormContainerListComponent } from "../form-container/form-container-list/form-container-list.component";
import { Subject } from 'rxjs';
import { PopupProjectionComponent } from "../../../shared/popup-projection/popup-projection.component";
import { FloatingMenuComponent, MenuPosition } from "../../../shared/menu/floating-menu/floating-menu.component";
import { ContainerContentPipe } from '../../../pipes/container-content.pipe';
import { RadioCheckboxesComponent } from "../inputs/radio-checkboxes/radio-checkboxes.component";
import { InvisibleInputFieldComponent } from "../inputs/invisible-input-field/invisible-input-field.component";
import { InvisibleSearchableSelectComponent } from "../inputs/invisible-searchable-select/invisible-searchable-select.component";
import { ChekcboxXComponent } from '../inputs/chekcbox-x/chekcbox-x.component';
import { InvisibleSearchableMultiSelectComponent } from "../inputs/invisible-searchable-multi-select/invisible-searchable-multi-select.component";
import { FormZoomControlsComponent } from "../form-zoom-controls/form-zoom-controls.component";
import { PageNavigatorComponent } from "../page-navigator/page-navigator.component";
import { LotoDto } from '../../../models/loto/loto.model';


@Component({
  selector: 'app-printable-form-designer',
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
    PageNavigatorComponent
],
  templateUrl: './printable-form-designer.component.html',
  styleUrl: './printable-form-designer.component.css'
})
export class PrintableFormDesignerComponent implements OnInit {
  @ViewChild('centerPanel') centerPanel!: ElementRef;
  @ViewChild('formContent') formContentElement!: ElementRef<HTMLDivElement>;
  currentPrintableFormService = inject(CurrentPrintableFormService);
  menuPosition = MenuPosition;
  

  currentForm = toSignal(this.currentPrintableFormService.form$, { initialValue: new PrintableFormDto() });
  formScale = 1;
  sheetSize = computed(() => {return this.currentForm().size ?? {width:8.5,height:11}});
  pixelsPerInch = 96; // Standard DPI
  formSize = { width: 8.5 * this.pixelsPerInch, height: 11 * this.pixelsPerInch };
  
  availableFields = computed<any>(() => {
      const type = this.currentForm().formType ?? 'SafeWork';
      // return this.loadEntityFields(type);
      return this.loadEntityDto(type);
  });
  // containers = computed<FormContainerDto[]>(() => this.currentForm().formContainers?? []);
  // containers = toSignal(this.currentPrintableFormService.formContainers$, { initialValue: [] });
  containers = this.currentPrintableFormService.currentPageContainers;
  isPropertiesPopupOpen = signal(false);


  private resizingFieldIndex: number | null = null;
  private resizeStartX: number = 0;
  private resizeStartY: number = 0;

  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private initialPositions = new Map<string, { x: number; y: number }>();

  // Marquee selection state
  isSelecting = signal(false);
  selectionBox = signal<{ x: number, y: number, width: number, height: number } | null>(null);
  private selectionStart = { x: 0, y: 0 };
  private destroy$ = new Subject<void>();
  private initialSizes: Map<string, { width: number; height: number }> = new Map();


  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit() {
  }

  ngAfterViewInit() {
    this.adjustFormScale();
  }


  /*****************************************************************************
   * Form functions
   ****************************************************************************/

  @HostListener('window:resize')
  onWindowResize() {
    this.fitToPanel();
  }

  @HostListener('wheel', ['$event'])
  onMouseWheel(event: WheelEvent) {
    if (event.ctrlKey) {
      event.preventDefault();
      const zoomIntensity = 0.02;
      const direction = event.deltaY > 0 ? -1 : 1;
      const scaleAmount = 1 + direction * zoomIntensity;
      this.formScale *= scaleAmount;
    }
  }

  zoomIn() {
    this.formScale += 0.1;
  }

  zoomOut() {
    this.formScale = Math.max(0.1, this.formScale - 0.1);
  }

  fitToPanel() {
    if (this.centerPanel) {
      const containerWidth = this.centerPanel.nativeElement.offsetWidth;
      const containerHeight = this.centerPanel.nativeElement.offsetHeight;
      const scaleX = (containerWidth - 40) / this.formSize.width; // 40px for padding
      const scaleY = (containerHeight - 40) / this.formSize.height;
      this.formScale = Math.min(scaleX, scaleY, 1); // Don't scale up beyond 100%
    }
  }

  updateSheetSize(width: number, height: number) {
    const newForm = new PrintableFormDto({...this.currentForm(), size: { width, height } });
    this.currentPrintableFormService.updateForm(newForm);
    this.formSize = { width: width * this.pixelsPerInch, height: height * this.pixelsPerInch };
    this.adjustFormScale();
    // You might want to adjust field positions here if necessary
  }

  getSheetSizeInPixels() {
    return {
      width: this.sheetSize().width * this.pixelsPerInch,
      height: this.sheetSize().height * this.pixelsPerInch
    };
  }

  getFormContainerStyle() {
    return {
      width: `${this.formSize.width}px`,
      height: `${this.formSize.height}px`,
      transform: `scale(${this.formScale})`,
      transformOrigin: 'top left',
    };
  }

  adjustFormScale() {
    if (this.centerPanel) {
      const containerWidth = this.centerPanel.nativeElement.offsetWidth;
      const containerHeight = this.centerPanel.nativeElement.offsetHeight;
      const scaleX = (containerWidth - 40) / this.formSize.width; // 40px for padding
      const scaleY = (containerHeight - 40) / this.formSize.height;
      this.formScale = Math.min(scaleX, scaleY, 1); // Don't scale up beyond 100%
    }
  }


  /*****************************************************************************
   * Field functions
   ****************************************************************************/

  loadEntityFields(type: string) {
    switch (type) {
      case 'SafeWork':
        return SafeWorkDto.toFormFields(new SafeWorkDto(), []);
        break;
      case 'HotWork':
        return HotWorkDto.toFormFields(new HotWorkDto(), []);
        break;
      case 'ConfinedSpace':
        return ConfinedSpaceDto.toFormFields(new ConfinedSpaceDto(), []);
        break;
      case 'Loto':
        return LotoDto.toFormFields(new LotoDto(), []);
        break;
      case 'WorkRequest':
      default:
        return [];
    }
  }

  loadEntityDto(type: string) {
    switch (type) {
      case 'SafeWork':
        return new SafeWorkDto();
      case 'HotWork':
        return new HotWorkDto();
      case 'ConfinedSpace':
        return new ConfinedSpaceDto();
      case 'Loto':
        return new LotoDto();
      default:
        return null;
    }
  }
  getLabel(container: FormContainerDto) {
    if(container.contentType==='formField'){
      const field = container.content as FormField
      return field.label?? `Field ${container.id}`;
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
   * Shape functions
   ****************************************************************************/

  addContainer(){
    const newContainer = new FormContainerDto();
    this.currentPrintableFormService.createNewContainer(newContainer);
  }

  selectContainer(container: FormContainerDto, event: MouseEvent) {
    this.currentPrintableFormService.selectContainer(container, event);
  }

  addTextToContainer(container: FormContainerDto, text: string) {
    const newContainer = new FormContainerDto({
      ...container,
      content: text,
    });
    this.currentPrintableFormService.updateContainer(newContainer);
  }
  
  getWrapperStyles(field: FormContainerDto): any {
    return {
      width: `${field.size?.width}px`,
      height: `${field.size?.height}px`,
      ...field.style,
      backgroundColor: '#f9f9f9',
      border: '1px solid #ccc',
      padding: '5px',
      boxSizing: 'border-box',
    };
  }

  getContainerStyles(field: FormContainerDto): any {
    return {
      ...field.style,
      position: 'absolute',
      left: `${field.position?.x}px`,
      top: `${field.position?.y}px`,
      width: `${field.size?.width}px`,
      height: `${field.size?.height}px`,
    };
  }

  getContentStyles(container: FormContainerDto): any {
    if (!container.contentStyle) {
      return {};
    }
    const styles = { ...container.contentStyle };
    if (styles.fontSize && typeof styles.fontSize === 'number') {
      styles.fontSize = `${styles.fontSize}px`;
    }
    return styles;
  }

  isContainerSelected(container: FormContainerDto): boolean {
    return this.currentPrintableFormService.isContainerSelected(container);
  }

  updateContainer(container: FormContainerDto) {
    this.currentPrintableFormService.updateContainer(container);
  }

  deleteContainer(id: number = 0) {
    const contId = !id || id === 0? this.currentPrintableFormService.selectedContainers()[0].id : id;
    this.currentPrintableFormService.deleteContainer(contId);
  }

  veiwPropertiesOfContainer(container: FormContainerDto | null, event: MouseEvent){
      this.currentPrintableFormService.propertiesOfContainer.set(container);
      if(container)this.currentPrintableFormService.selectContainer(container, event);
      // if(container)this.currentPrintableFormService.selectedContainers.set([container])
      event.preventDefault();
      this.isPropertiesPopupOpen.set(true);
  }

  closePropertiesPopup(){
    this.isPropertiesPopupOpen.set(false);
    this.currentPrintableFormService.propertiesOfContainer.set(null);
  }

    /*****************************************************************************
   * Keyboard interactions
   ****************************************************************************/

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    const selectedContainers = this.currentPrintableFormService.selectedContainers();
    if (selectedContainers.length === 0) {
      return;
    }

    const moveAmount = event.shiftKey ? 10 : 1; // Move by 10px with Shift key, 1px otherwise
    let dx = 0;
    let dy = 0;

    switch (event.key) {
      case 'ArrowUp':
        dy = -moveAmount;
        break;
      case 'ArrowDown':
        dy = moveAmount;
        break;
      case 'ArrowLeft':
        dx = -moveAmount;
        break;
      case 'ArrowRight':
        dx = moveAmount;
        break;
      default:
        return; // Exit if it's not an arrow key
    }

    event.preventDefault(); // Prevent default browser action (like scrolling)

    const updatedContainers = selectedContainers.map(container => {
      const newPosition = {
        x: (container.position?.x ?? 0) + dx,
        y: (container.position?.y ?? 0) + dy
      };
      return new FormContainerDto({ ...container, position: newPosition });
    });

    this.currentPrintableFormService.updateContainers(updatedContainers);
  }


  /*****************************************************************************
   * Drag and resize functions
   ****************************************************************************/

  onDragStart(event: MouseEvent, container: FormContainerDto) {
    if (container.locked) {
      return; // Do not start drag if container is locked
    }
    event.preventDefault();
    event.stopPropagation();

    // this.selectContainer(container, event);

    this.isDragging = true;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;

    this.initialPositions.clear();
    for (const c of this.currentPrintableFormService.selectedContainers()) {
      this.initialPositions.set(c.id+''!, { x: c.position!.x, y: c.position!.y });
    }

    document.addEventListener('mousemove', this.onDragMove);
    document.addEventListener('mouseup', this.onDragEnd);
  }

  private onDragMove = (event: MouseEvent) => {
    if (!this.isDragging) return;
    event.preventDefault();

    const dx = event.clientX - this.dragStartX;
    const dy = event.clientY - this.dragStartY;

    const formSheet = this.formContentElement.nativeElement;
    const sheetWidth = formSheet.clientWidth;
    const sheetHeight = formSheet.clientHeight;

    const updatedContainers = this.currentPrintableFormService.selectedContainers().map(container => {
      const initialPos = this.initialPositions.get(container.id+''!);
      if (!initialPos) return container;

      let newX = initialPos.x + dx;
      let newY = initialPos.y + dy;

      // Constrain to container bounds
      newX = Math.max(0, Math.min(newX, sheetWidth - container.size!.width));
      newY = Math.max(0, Math.min(newY, sheetHeight - container.size!.height));

      const newPosition = {
        x: newX,
        y: newY
      };
      return new FormContainerDto({ ...container, position: newPosition });
    });
    
    // Update local state for smooth UI feedback
    this.currentPrintableFormService.updateContainersState(updatedContainers);
  };

  private onDragEnd = (event: MouseEvent) => {
    if (!this.isDragging) return;
    this.isDragging = false;
    
    const dx = event.clientX - this.dragStartX;
    const dy = event.clientY - this.dragStartY;

    const formSheet = this.formContentElement.nativeElement;
    const sheetWidth = formSheet.clientWidth;
    const sheetHeight = formSheet.clientHeight;

    const finalContainers = this.currentPrintableFormService.selectedContainers().map(container => {
      const initialPos = this.initialPositions.get(container.id+'');
      if (!initialPos) return container;
      
      let newX = initialPos.x + dx;
      let newY = initialPos.y + dy;

      // Constrain to container bounds
      newX = Math.max(0, Math.min(newX, sheetWidth - container.size!.width));
      newY = Math.max(0, Math.min(newY, sheetHeight - container.size!.height));

      const newPosition = {
        x: newX,
        y: newY
      };
      return new FormContainerDto({ ...container, position: newPosition });
    });

    if (finalContainers.length > 0) {
      this.currentPrintableFormService.updateContainers(finalContainers);
    }

    document.removeEventListener('mousemove', this.onDragMove);
    document.removeEventListener('mouseup', this.onDragEnd);
  };


  onResize(event: any, index: number) {
    const updatedContainer = new FormContainerDto({ ...this.containers()[index], size: event.size });
    this.currentPrintableFormService.updateContainer(updatedContainer);
  }

  startResize(event: MouseEvent, index: number, corner: string) {
    if (isPlatformBrowser(this.platformId)) {
      event.preventDefault();
      event.stopPropagation();
      this.resizingFieldIndex = index;
      this.resizeStartX = event.clientX;
      this.resizeStartY = event.clientY;

      this.initialSizes.clear();
      const selectedContainers = this.currentPrintableFormService.selectedContainers();
      if (selectedContainers.length > 1) {
        for (const c of selectedContainers) {
          this.initialSizes.set(c.id + '', { width: c.size!.width, height: c.size!.height });
        }
      } else {
        const container = this.containers()[index];
        this.initialSizes.set(container.id + '', { width: container.size!.width, height: container.size!.height });
      }

      document.addEventListener('mousemove', this.resize);
      document.addEventListener('mouseup', this.stopResize);
    }
  }
  
  private resize = (event: MouseEvent) => {
    if (isPlatformBrowser(this.platformId) && this.resizingFieldIndex !== null) {
      const dx = event.clientX - this.resizeStartX;
      const dy = event.clientY - this.resizeStartY;
  
      const selectedContainers = this.currentPrintableFormService.selectedContainers();
      const containersToResize = selectedContainers.length > 1 ? selectedContainers : [this.containers()[this.resizingFieldIndex]];
  
      const updatedContainers = containersToResize.map(container => {
        const initialSize = this.initialSizes.get(container.id + '');
        if (!initialSize) return container;
  
        const newWidth = Math.max(50, initialSize.width + dx);
        const newHeight = Math.max(20, initialSize.height + dy);
  
        return new FormContainerDto({
          ...container,
          size: { width: newWidth, height: newHeight }
        });
      });
  
      this.currentPrintableFormService.updateContainersState(updatedContainers);
    }
  }
  
  private stopResize = (event?: MouseEvent) => {
    if (isPlatformBrowser(this.platformId)) {
      if (this.resizingFieldIndex !== null && event) {
        const dx = event.clientX - this.resizeStartX;
        const dy = event.clientY - this.resizeStartY;
    
        const selectedContainers = this.currentPrintableFormService.selectedContainers();
        const containersToResize = selectedContainers.length > 1 ? selectedContainers : [this.containers()[this.resizingFieldIndex]];
    
        const finalContainers = containersToResize.map(container => {
          const initialSize = this.initialSizes.get(container.id + '');
          if (!initialSize) return container;
    
          const newWidth = Math.max(50, initialSize.width + dx);
          const newHeight = Math.max(20, initialSize.height + dy);
    
          return new FormContainerDto({
            ...container,
            size: { width: newWidth, height: newHeight }
          });
        });
    
        if (finalContainers.length > 0) {
          this.currentPrintableFormService.updateContainers(finalContainers);
        }
      }

      this.resizingFieldIndex = null;
      this.initialSizes.clear();
      document.removeEventListener('mousemove', this.resize);
      document.removeEventListener('mouseup', this.stopResize);
    }
  }

  ngOnDestroy() {
    if (isPlatformBrowser(this.platformId)) {
      this.stopResize();
      document.removeEventListener('mousemove', this.onDocumentMouseMove);
      document.removeEventListener('mouseup', this.onDocumentMouseUp);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  /*****************************************************************************
   * Mouse Selection functions
   ****************************************************************************/
  onFormSheetMouseDown(event: MouseEvent) {
    const target = event.target as HTMLElement;

    if (event.target !== this.formContentElement.nativeElement && !target.classList.contains('locked')) {
      console.log('Mouse down on a child element, ignoring');
      return;
    }

    if(this.isDragging) return;
    event.preventDefault();

    this.isSelecting.set(true);
    this.selectionStart = this.getScaledCoordinates(event);
    this.selectionBox.set({ ...this.selectionStart, width: 0, height: 0 });

    console.log('Mouse down on form sheet');
    console.log('Selection box:', this.selectionBox());
    console.log('Selection start:', this.selectionStart);

    if (!event.ctrlKey) {
      this.currentPrintableFormService.selectedContainers.set([]);
    }

    document.addEventListener('mousemove', this.onDocumentMouseMove);
    document.addEventListener('mouseup', this.onDocumentMouseUp);
  }

  private onDocumentMouseMove = (event: MouseEvent) => {
    if (!this.isSelecting()) return;

    const { x: currentX, y: currentY } = this.getScaledCoordinates(event);

    const x = Math.min(this.selectionStart.x, currentX);
    const y = Math.min(this.selectionStart.y, currentY);
    const width = Math.abs(currentX - this.selectionStart.x);
    const height = Math.abs(currentY - this.selectionStart.y);

    this.selectionBox.set({ x, y, width, height });
    this.updateSelectionFromBox();
  };

  private onDocumentMouseUp = () => {
    this.isSelecting.set(false);
    this.selectionBox.set(null);
    document.removeEventListener('mousemove', this.onDocumentMouseMove);
    document.removeEventListener('mouseup', this.onDocumentMouseUp);

    console.log('Mouse up on form sheet');
    console.log('Selected containers:', this.currentPrintableFormService.selectedContainers());
    console.log('Selection box:', this.selectionBox());
    console.log('Selection start:', this.selectionStart);
  };

  private updateSelectionFromBox() {
    const selectionBox = this.selectionBox();
    if (!selectionBox) return;

    const selected = this.containers().filter(container => {
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

    this.currentPrintableFormService.selectedContainers.set(selected.filter(c => !c.locked));
  }

  private getScaledCoordinates(event: MouseEvent): { x: number, y: number } {
    const rect = this.formContentElement.nativeElement.getBoundingClientRect();
    const scale = this.formScale;
    
    const x = (event.clientX - rect.left) / scale;
    const y = (event.clientY - rect.top) / scale;

    return { x, y };
  }

    /*****************************************************************************
   * Grouping functions
   ****************************************************************************/

  groupSelection() {
    const selected = this.currentPrintableFormService.selectedContainers();
    if (selected.length < 2) return;

    const groupId = `group-${Date.now()}`; // Simple unique ID
    const updatedContainers = selected.map(container => {
      return new FormContainerDto({ ...container, groupId: groupId });
    });

    this.currentPrintableFormService.updateContainers(updatedContainers);
  }

  ungroupSelection() {
    const selected = this.currentPrintableFormService.selectedContainers();
    if (selected.length === 0 || !selected[0].groupId) return;

    const groupId = selected[0].groupId;
    const allContainers = this.containers();
    const containersInGroup = allContainers.filter(c => c.groupId === groupId);

    const updatedContainers = containersInGroup.map(container => {
      return new FormContainerDto({ ...container, groupId: null });
    });

    this.currentPrintableFormService.updateContainers(updatedContainers);
    // After ungrouping, the original selection might still be valid
    this.currentPrintableFormService.selectedContainers.set(updatedContainers);
  }

  isGroupSelected(): boolean {
    const selected = this.currentPrintableFormService.selectedContainers();
    return selected.length > 0 && !!selected[0].groupId;
  }


  /*****************************************************************************
   * Alignment functions
   ****************************************************************************/

    alignContainers(alignment: 'left' | 'right' | 'top' | 'bottom' | 'h-center' | 'v-center') {
      const selectedContainers = this.currentPrintableFormService.selectedContainers();
      if (selectedContainers.length < 2) return;

      const referenceContainer = selectedContainers[0];
      const updatedContainers = selectedContainers.map(container => {
        if (container.id === referenceContainer.id) {
          return container; // No change to the reference container itself
        }

        const newPosition = { ...container.position! };
        switch (alignment) {
          case 'left':
            newPosition.x = referenceContainer.position!.x;
            break;
          case 'right':
            newPosition.x = referenceContainer.position!.x + referenceContainer.size!.width - container.size!.width;
            break;
          case 'top':
            newPosition.y = referenceContainer.position!.y;
            break;
          case 'bottom':
            newPosition.y = referenceContainer.position!.y + referenceContainer.size!.height - container.size!.height;
            break;
          case 'h-center':
            newPosition.x = referenceContainer.position!.x + (referenceContainer.size!.width / 2) - (container.size!.width / 2);
            break;
          case 'v-center':
            newPosition.y = referenceContainer.position!.y + (referenceContainer.size!.height / 2) - (container.size!.height / 2);
            break;
        }
        return new FormContainerDto({ ...container, position: newPosition });
      });

      this.currentPrintableFormService.updateContainers(updatedContainers);
    }

    matchSize(dimension: 'width' | 'height' | 'both') {
      const selectedContainers = this.currentPrintableFormService.selectedContainers();
      if (selectedContainers.length < 2) return;

      const referenceContainer = selectedContainers[0];
      const referenceSize = referenceContainer.size!;

      const updatedContainers = selectedContainers.map(container => {
        if (container.id === referenceContainer.id) {
          return container; // No change to the reference container itself
        }

        const newSize = { ...container.size! };
        if (dimension === 'width' || dimension === 'both') {
          newSize.width = referenceSize.width;
        }
        if (dimension === 'height' || dimension === 'both') {
          newSize.height = referenceSize.height;
        }

        return new FormContainerDto({ ...container, size: newSize });
      });

      this.currentPrintableFormService.updateContainers(updatedContainers);
    }

    distributeContainers(direction: 'horizontal' | 'vertical') {
      const selectedContainers = this.currentPrintableFormService.selectedContainers();
      if (selectedContainers.length < 3) return;

      const sortedContainers = [...selectedContainers].sort((a, b) =>
        direction === 'horizontal' ? a.position!.x - b.position!.x : a.position!.y - b.position!.y
      );

      const firstContainer = sortedContainers[0];
      const lastContainer = sortedContainers[sortedContainers.length - 1];
      const middleContainers = sortedContainers.slice(1, -1);

      const startEdge = direction === 'horizontal' ? firstContainer.position!.x + firstContainer.size!.width : firstContainer.position!.y + firstContainer.size!.height;
      const endEdge = direction === 'horizontal' ? lastContainer.position!.x : lastContainer.position!.y;

      const totalSpaceToDistribute = endEdge - startEdge;
      const totalMiddleContainersSize = middleContainers.reduce((sum, container) =>
        sum + (direction === 'horizontal' ? container.size!.width : container.size!.height), 0
      );

      const spacing = (totalSpaceToDistribute - totalMiddleContainersSize) / (middleContainers.length + 1);

      const updatedContainers: FormContainerDto[] = [];
      let currentPosition = startEdge + spacing;

      for (const container of middleContainers) {
        const newPosition = { ...container.position! };
        if (direction === 'horizontal') {
          newPosition.x = currentPosition;
          currentPosition += container.size!.width + spacing;
        } else {
          newPosition.y = currentPosition;
          currentPosition += container.size!.height + spacing;
        }
        updatedContainers.push(new FormContainerDto({ ...container, position: newPosition }));
      }

      this.currentPrintableFormService.updateContainers(updatedContainers);
    }

    arrangeSequentially(direction: 'horizontal' | 'vertical', gap: number = -2) {
      const selectedContainers = this.currentPrintableFormService.selectedContainers();
      if (selectedContainers.length < 2) return;

      // Sort containers to establish a clear order for arrangement.
      const sortedContainers = [...selectedContainers].sort((a, b) =>
        direction === 'horizontal'
          ? (a.position?.x ?? 0) - (b.position?.x ?? 0)
          : (a.position?.y ?? 0) - (b.position?.y ?? 0)
      );

      const updatedContainers: FormContainerDto[] = [];
      // The first container is the reference and doesn't move.
      // We will position subsequent containers relative to the previously positioned one.
      let previousContainer = sortedContainers[0];

      // Iterate from the second container onwards.
      for (let i = 1; i < sortedContainers.length; i++) {
        const currentContainer = sortedContainers[i];
        const newPosition = { ...(currentContainer.position!) };

        if (direction === 'horizontal') {
          // Position current container to the right of the previous one, plus the gap.
          newPosition.x = (previousContainer.position!.x + previousContainer.size!.width) + gap;
        } else { // 'vertical'
          // Position current container below the previous one, plus the gap.
          newPosition.y = (previousContainer.position!.y + previousContainer.size!.height) + gap;
        }

        const updatedContainer = new FormContainerDto({ ...currentContainer, position: newPosition });
        updatedContainers.push(updatedContainer);

        // The newly positioned container becomes the reference for the next one in the loop.
        previousContainer = updatedContainer;
      }

      this.currentPrintableFormService.updateContainers(updatedContainers);
    }

    swapContainers() {
      const selectedContainers = this.currentPrintableFormService.selectedContainers();
      if (selectedContainers.length !== 2) return;

      const [containerA, containerB] = selectedContainers;

      const updatedContainerA = new FormContainerDto({
        ...containerA,
        position: containerB.position
      });

      const updatedContainerB = new FormContainerDto({
        ...containerB,
        position: containerA.position
      });

      this.currentPrintableFormService.updateContainers([updatedContainerA, updatedContainerB]);
    }




}