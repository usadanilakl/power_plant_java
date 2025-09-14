import { Component, Inject, inject, OnDestroy, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { FormField } from '../../models/ui/form-field.model';
import { FormBuilderService } from '../../services/ui/form-builder.service';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { CdkDragEnd, DragDropModule } from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { FieldPropertiesComponent } from "./field-properties/field-properties.component";
import { SafeWorkDto } from '../../models/permits/safe-work.model';
import { HotWorkDto } from '../../models/permits/hot-work.model';
import { ConfinedSpaceDto } from '../../models/permits/confined-space.model';
import { LotoDto } from '../../models/loto/loto.model';

@Component({
  selector: 'app-form-designer',
  standalone: true,
  imports: [CommonModule, DragDropModule, FormsModule, FieldPropertiesComponent],
  templateUrl: './form-designer.component.html',
  styleUrl: './form-designer.component.css'
})
export class FormDesignerComponent implements OnInit, OnDestroy {
  private formBuilderService = inject(FormBuilderService)
  formFields = toSignal(this.formBuilderService.formFields$,{ initialValue:[]});
  formSize: { width: number; height: number } = { width: 8.5, height: 11 };
  selectedFields = signal<FormField[]>([]);
  availableFields = signal<FormField[]>([]);
  selectedEntity: string = 'SafeWorkDto';


  private resizingFieldIndex: number | null = null;
  private resizeStartX: number = 0;
  private resizeStartY: number = 0;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit() {

  }

  loadEntityFields() {
    switch (this.selectedEntity) {
      case 'SafeWorkDto':
        this.availableFields.set(SafeWorkDto.toFormFields(new SafeWorkDto(), []));
        break;
      case 'HotWorkDto':
        this.availableFields.set(HotWorkDto.toFormFields(new HotWorkDto(), []));
        break;
      case 'ConfinedSpaceDto':
        this.availableFields.set(ConfinedSpaceDto.toFormFields(new ConfinedSpaceDto(), []));
        break;
      case 'LotoDto':
        // this.availableFields.set(LotoDto.toFormFields(new LotoDto(), []));
        break;
    }
  }

  addFieldToDesign(field: FormField) {
    const newField: FormField = {
      ...field,
      position: { x: 20, y: 20 },
      size: { width: 200, height: 40 }, // Increased size for better visibility
      style: {
        backgroundColor: '#f9f9f9',
        border: '1px solid #ccc',
        padding: '5px',
      },
    };
    this.formBuilderService.addField(newField);
    console.log('Added field', this.formFields());
  }

  
  addField(field: Partial<FormField>) {
    const newField: FormField = {
      name: field.name || `field_${Date.now()}`, // Generate a unique name if not provided
      label: field.label || 'New Field',
      type: field.type || 'text',
      position: field.position || { x: 0, y: 0 },
      size: field.size || { width: 100, height: 30 },
      validators: field.validators || [],
      options: field.options || [],
      initialValue: field.initialValue,
      currentValue: field.currentValue,
      question: field.question
    };
    this.formBuilderService.addField(newField);
  }

  // Implement methods for drag-and-drop, resizing, and positioning
  onDragEnd(event: CdkDragEnd, index: number) {
    const draggedDistance = event.source.getFreeDragPosition();
    const currentField = this.formFields()[index];
    
    const newPosition = {
      x: Math.max(0, (currentField.position?.x || 0) + draggedDistance.x),
      y: Math.max(0, (currentField.position?.y || 0) + draggedDistance.y)
    };
  
    console.log('Drag ended', { index, newPosition, draggedDistance });
    
    const updatedField = { ...currentField, position: newPosition };
    this.formBuilderService.updateField(index, updatedField);
  
    // Reset the drag
    event.source.reset();
  }

  onResize(event: any, index: number) {
    const updatedField = { ...this.formFields()[index], size: event.size };
    this.formBuilderService.updateField(index, updatedField);
  }

  saveDesign() {
    this.formBuilderService.saveFormDesign('MyFormDesign');
  }

  updateFormSize() {
    // This method will be called when the user changes the form size
    // You might want to adjust field positions here if necessary
  }

  // Helper method to convert inches to pixels (assuming 96 DPI)
  inchesToPixels(inches: number): number {
    return inches * 96;
  }

  selectField(field: FormField, event: MouseEvent) {
    this.selectedFields.update(fields => {
      if (event.ctrlKey) {
        const index = fields.indexOf(field);
        if (index > -1) {
          return fields.filter(f => f !== field);
        } else {
          return [...fields, field];
        }
      } else {
        return [field];
      }
    });
  }

  alignFields(alignment: 'left' | 'right' | 'top' | 'bottom') {
    if (this.selectedFields().length < 2) return;

    const referenceField = this.selectedFields()[0];
    this.selectedFields().slice(1).forEach(field => {
      const updatedField = { ...field };
      switch (alignment) {
        case 'left':
          updatedField.position = { ...updatedField.position!, x: referenceField.position!.x };
          break;
        case 'right':
          updatedField.position = { 
            ...updatedField.position!, 
            x: referenceField.position!.x + referenceField.size!.width - updatedField.size!.width 
          };
          break;
        case 'top':
          updatedField.position = { ...updatedField.position!, y: referenceField.position!.y };
          break;
        case 'bottom':
          updatedField.position = { 
            ...updatedField.position!, 
            y: referenceField.position!.y + referenceField.size!.height - updatedField.size!.height 
          };
          break;
      }
      this.formBuilderService.updateField(this.formFields().indexOf(field), updatedField);
    });
  }

  distributeFields(direction: 'horizontal' | 'vertical') {
    if (this.selectedFields().length < 3) return;

    let sortedFields = [...this.selectedFields()].sort((a, b) => 
      direction === 'horizontal' ? a.position!.x - b.position!.x : a.position!.y - b.position!.y
    );

    let start = direction === 'horizontal' ? sortedFields[0].position!.x : sortedFields[0].position!.y;
    let end = direction === 'horizontal' 
      ? sortedFields[sortedFields.length - 1].position!.x + sortedFields[sortedFields.length - 1].size!.width
      : sortedFields[sortedFields.length - 1].position!.y + sortedFields[sortedFields.length - 1].size!.height;

    let totalSpace = end - start;
    let totalFieldSize = sortedFields.reduce((sum, field) => 
      sum + (direction === 'horizontal' ? field.size!.width : field.size!.height), 0
    );
    let spacing = (totalSpace - totalFieldSize) / (sortedFields.length - 1);

    let currentPosition = start;
    for (let i = 0; i < sortedFields.length; i++) {
      let field = sortedFields[i];
      if (direction === 'horizontal') {
        field.position!.x = currentPosition;
        currentPosition += field.size!.width + spacing;
      } else {
        field.position!.y = currentPosition;
        currentPosition += field.size!.height + spacing;
      }
      this.formBuilderService.updateField(this.formFields().indexOf(field), field);
    }
  }

  matchSize(dimension: 'width' | 'height') {
    if (this.selectedFields().length < 2) return;

    console.log('Matching size', dimension);
    console.log('Selected fields', this.selectedFields());
    let referenceField = this.selectedFields()[0];
    for (let i = 1; i < this.selectedFields().length; i++) {
      let field = this.selectedFields()[i];
      if (dimension === 'width') {
        field.size!.width = referenceField.size!.width;
      } else {
        field.size!.height = referenceField.size!.height;
      }
      this.formBuilderService.updateField(this.formFields().indexOf(field), field);
    }
    console.log('Updated fields', this.formFields());
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
      const field = this.formFields()[this.resizingFieldIndex];
      const dx = event.clientX - this.resizeStartX;
      const dy = event.clientY - this.resizeStartY;
      const newWidth = Math.max(50, field.size!.width + dx);
      const newHeight = Math.max(20, field.size!.height + dy);
      const updatedField = { 
        ...field, 
        size: { width: newWidth, height: newHeight } 
      };
      this.formBuilderService.updateField(this.resizingFieldIndex, updatedField);
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







  updateFieldStyle(field: FormField, property: keyof NonNullable<FormField['style']>, value: any) {
    const updatedField = { ...field };
    if (!updatedField.style) updatedField.style = {};
    updatedField.style[property] = value;
    this.updateField(updatedField);
  }

  updateFieldLayout(field: FormField, property: keyof NonNullable<FormField['layout']>, value: any) {
    const updatedField = { ...field };
    if (!updatedField.layout) updatedField.layout = {};
    updatedField.layout[property] = value;
    this.updateField(updatedField);
  }

  toggleFieldLine(field: FormField, side: 'top' | 'right' | 'bottom' | 'left') {
    const updatedField = { ...field };
    if (!updatedField.lines) updatedField.lines = {};
    updatedField.lines[side] = !updatedField.lines[side];
    this.updateField(updatedField);
  }

  private updateField(updatedField: FormField) {
    const index = this.formFields().findIndex(f => f.name === updatedField.name);
    if (index !== -1) {
      this.formBuilderService.updateField(index, updatedField);
    }
  
    // Update the selected fields
    this.selectedFields.update(fields => 
      fields.map(f => f.name === updatedField.name ? updatedField : f)
    );

    // Also update the field in availableFields if it exists there
    const availableIndex = this.availableFields().findIndex(f => f.name === updatedField.name);
    if (availableIndex !== -1) {
      this.availableFields()[availableIndex] = updatedField;
    }
  }

  getFieldStyles(field: FormField): any {
    return {
      ...field.style,
      ...field.layout,
      position: 'absolute',
      left: `${field.position?.x}px`,
      top: `${field.position?.y}px`,
      width: `${field.size?.width}px`,
      height: `${field.size?.height}px`,
      backgroundColor: 'rgba(255, 0, 0, 0.2)', // Semi-transparent red
      border: '2px solid black',
      zIndex: 10000,
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

  getContainerStyles(field: FormField): any {
    return {
      position: 'absolute',
      left: `${field.position?.x || 0}px`,
      top: `${field.position?.y || 0}px`,
      width: `${field.size?.width}px`,
      height: `${field.size?.height}px`,
    };
  }
  
  getWrapperStyles(field: FormField): any {
    return {
      width: `${field.size?.width}px`,
      height: `${field.size?.height}px`,
      ...field.style,
      ...field.layout,
      // Remove positioning from here as it's now on the container
      backgroundColor: '#f9f9f9',
      border: '1px solid #ccc',
      padding: '5px',
      boxSizing: 'border-box',
    };
  }


}
