
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


@Component({
  selector: 'app-printable-form-designer',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, FormContainerPropertiesComponent, FormContainerListComponent],
  templateUrl: './printable-form-designer.component.html',
  styleUrl: './printable-form-designer.component.css'
})
export class PrintableFormDesignerComponent implements OnInit {
  @ViewChild('centerPanel') centerPanel!: ElementRef;
  @ViewChild('formContent') formContentElement!: ElementRef<HTMLDivElement>;
  private currentPrintableFormService = inject(CurrentPrintableFormService);
  

  currentForm = toSignal(this.currentPrintableFormService.form$, { initialValue: new PrintableFormDto() });
  formScale = 1;
  sheetSize = computed(() => {return this.currentForm().size ?? {width:8.5,height:11}});
  pixelsPerInch = 96; // Standard DPI
  formSize = { width: 8.5 * 96, height: 11 * 96 };
  
  availableFields = computed<FormField[]>(() => {
      const type = this.currentForm().formType ?? 'SafeWork';
      return this.loadEntityFields(type);
  });
  // containers = computed<FormContainerDto[]>(() => this.currentForm().formContainers?? []);
  containers = toSignal(this.currentPrintableFormService.formContainers$, { initialValue: [] });
  // selectedContainers = signal<FormContainerDto[]>([]);


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
    this.adjustFormScale();
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
      default:
        return [];
    }
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
      border: '2px solid black',
      // zIndex: 1000,
      padding: '5px',
      boxSizing: 'border-box',
      // display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      justifyContent: 'center',
      overflow: 'hidden',
      display: 'block !important',
      visibility: 'visible !important',
      opacity: '1 !important',
    };
  }

  isContainerSelected(container: FormContainerDto): boolean {
    return this.currentPrintableFormService.isContainerSelected(container);
  }

  updateContainer(container: FormContainerDto) {
    this.currentPrintableFormService.updateContainer(container);
  }

  deleteContainer(id: number = 0) {
    const contId = !id || id === 0? this.currentPrintableFormService.selectedContainers()[0].id : id;
    this.currentPrintableFormService.deleteContainer(id);
  }


  /*****************************************************************************
   * Drag and resize functions
   ****************************************************************************/

  // onDragEnd(event: CdkDragEnd, index: number) {
  //   const draggedDistance = event.source.getFreeDragPosition();
  //   const currentField = this.containers()[index];
    
  //   const newPosition = {
  //     x: Math.max(0, (currentField.position?.x || 0) + draggedDistance.x),
  //     y: Math.max(0, (currentField.position?.y || 0) + draggedDistance.y)
  //   };
    
  //   const updatedContainer = new FormContainerDto({ ...currentField, position: newPosition });
  //   this.currentPrintableFormService.updateContainer(updatedContainer);
  
  //   // Reset the drag
  //   event.source.reset();
  // }




  onDragStart(event: MouseEvent, container: FormContainerDto) {
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
      document.addEventListener('mousemove', this.resize);
      document.addEventListener('mouseup', this.stopResize);
    }
  }
  
  private resize = (event: MouseEvent) => {
    if (isPlatformBrowser(this.platformId) && this.resizingFieldIndex !== null) {
      const field = this.containers()[this.resizingFieldIndex];
      const dx = event.clientX - this.resizeStartX;
      const dy = event.clientY - this.resizeStartY;
      const newWidth = Math.max(50, field.size!.width + dx);
      const newHeight = Math.max(20, field.size!.height + dy);
      const updatedField = new FormContainerDto({ 
        ...field, 
        size: { width: newWidth, height: newHeight } 
      });
      this.currentPrintableFormService.updateContainersState([updatedField]);
      this.resizeStartX = event.clientX;
      this.resizeStartY = event.clientY;
    }
  }
  
  private stopResize = () => {
    if (isPlatformBrowser(this.platformId)) {
      this.resizingFieldIndex = null;
      document.removeEventListener('mousemove', this.resize);
      document.removeEventListener('mouseup', this.stopResize);
    }
  }

  ngOnDestroy() {
    if (isPlatformBrowser(this.platformId)) {
      this.stopResize();
    }
  }

  /*****************************************************************************
   * Mouse Selection functions
   ****************************************************************************/
  onFormSheetMouseDown(event: MouseEvent) {
    // Only start selection if clicking on the sheet itself, not a child element like a container
    if (event.target !== this.formContentElement.nativeElement) {
      console.log('Mouse down on a child element, ignoring');
      return;
    }
    if(this.isDragging) return;
    event.preventDefault();

    this.isSelecting.set(true);
    this.selectionStart = { x: event.offsetX, y: event.offsetY };
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

    const rect = this.formContentElement.nativeElement.getBoundingClientRect();
    const currentX = event.clientX - rect.left;
    const currentY = event.clientY - rect.top;

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

    this.currentPrintableFormService.selectedContainers.set(selected);
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



}