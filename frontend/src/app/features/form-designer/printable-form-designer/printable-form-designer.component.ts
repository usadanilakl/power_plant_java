
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


@Component({
  selector: 'app-printable-form-designer',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule,],
  templateUrl: './printable-form-designer.component.html',
  styleUrl: './printable-form-designer.component.css'
})
export class PrintableFormDesignerComponent implements OnInit {
  @ViewChild('centerPanel') centerPanel!: ElementRef;
  private currentPrintableFormService = inject(CurrentPrintableFormService);
  
  availableFields = signal<FormField[]>([]);
  selectedEntity = computed<string>(() => {
    const type = this.currentForm().formType ?? 'SafeWork'
    this.loadEntityFields(type);
    return type;
  });
  containers = toSignal(this.currentPrintableFormService.formContainers$, { initialValue: [] });
  selectedContainers = signal<FormContainerDto[]>([]);


  private resizingFieldIndex: number | null = null;
  private resizeStartX: number = 0;
  private resizeStartY: number = 0;
  

  currentForm = toSignal(this.currentPrintableFormService.form$, { initialValue: new PrintableFormDto() });
  formScale = 1;
  sheetSize = computed(() => {return this.currentForm().size});
  pixelsPerInch = 96; // Standard DPI
  formSize = { width: 8.5 * 96, height: 11 * 96 };


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
        this.availableFields.set(SafeWorkDto.toFormFields(new SafeWorkDto(), []));
        break;
      case 'HotWork':
        this.availableFields.set(HotWorkDto.toFormFields(new HotWorkDto(), []));
        break;
      case 'ConfinedSpace':
        this.availableFields.set(ConfinedSpaceDto.toFormFields(new ConfinedSpaceDto(), []));
        break;
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
    this.selectedContainers.update(containers => {
      if (event.ctrlKey) {
        const index = containers.indexOf(container);
        if (index > -1) {
          return containers.filter(f => f !== container);
        } else {
          return [...containers, container];
        }
      } else {
        return [container];
      }
    });
    console.log('Selected containers:', this.selectedContainers());
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


  /*****************************************************************************
   * Drag and resize functions
   ****************************************************************************/

  onDragEnd(event: CdkDragEnd, index: number) {
    const draggedDistance = event.source.getFreeDragPosition();
    const currentField = this.containers()[index];
    
    const newPosition = {
      x: Math.max(0, (currentField.position?.x || 0) + draggedDistance.x),
      y: Math.max(0, (currentField.position?.y || 0) + draggedDistance.y)
    };
    
    const updatedContainer = new FormContainerDto({ ...currentField, position: newPosition });
    this.currentPrintableFormService.updateContainer(updatedContainer);
  
    // Reset the drag
    event.source.reset();
  }

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
      this.currentPrintableFormService.updateContainer(updatedField);
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




}