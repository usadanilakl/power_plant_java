import { Component, computed, inject, input, output } from '@angular/core';
import { CurrentPrintableFormService } from '../../../../services/forms/current-printable-form.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormContainerDto } from '../../../../models/forms/form-container.model';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-form-container-list',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  templateUrl: './form-container-list.component.html',
  styleUrl: './form-container-list.component.css'
})
export class FormContainerListComponent {
  currentPrintableFormService = inject(CurrentPrintableFormService);
  containersFromService = toSignal(this.currentPrintableFormService.formContainers$,{ initialValue: []  });
  containersInput = input<FormContainerDto[] | null>(null);
  // containers = computed<FormContainerDto[]>(() => this.containersInput()?? this.containersFromService());
  
  containers = computed<FormContainerDto[]>(() => {
    const sourceContainers = this.containersInput() ?? this.containersFromService();
    return [...sourceContainers].sort((a, b) => {
      const zIndexA = parseInt(String(a.style?.zIndex ?? 0), 10) || 0;
      const zIndexB = parseInt(String(b.style?.zIndex ?? 0), 10) || 0;
      return zIndexB - zIndexA;
    });
  });


  hoverEvent = output<FormContainerDto | null>();
  rightClickEvent = output<{container:FormContainerDto, event: MouseEvent}>();
  
  getContainerName(container: FormContainerDto){
    return container.name?? `Container ${container.id}`;
  }

  onHover(container: FormContainerDto | null): void {
    this.currentPrintableFormService.hoverContainer(container);
    this.hoverEvent.emit(container);
  }

  onRightClick(container: FormContainerDto, event: MouseEvent): void {
    this.rightClickEvent.emit({ container, event  });
  }

  selectContainer(container: FormContainerDto, event: MouseEvent): void {
    this.currentPrintableFormService.selectContainer(container, event);
  }

  isSelected(container: FormContainerDto): boolean {
    return this.currentPrintableFormService.isContainerSelected(container);
  }

  drop(event: CdkDragDrop<FormContainerDto[]>): void {
    const reorderedContainers = [...this.containers()];
    moveItemInArray(reorderedContainers, event.previousIndex, event.currentIndex);
    
    // Update zIndex based on the new order and notify the service
    this.currentPrintableFormService.updateZIndexes(reorderedContainers);
  }

}
