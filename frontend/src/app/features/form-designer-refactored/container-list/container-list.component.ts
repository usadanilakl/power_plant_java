import { Component, computed, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { FormContainerDto } from '../models/form-container.model';
import { FormStateService } from '../services/form-state.service';

@Component({
  selector: 'app-container-list',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  templateUrl: './container-list.component.html',
  styleUrl: './container-list.component.css',
})
export class ContainerListComponent {
  private formState = inject(FormStateService);

  containersInput = input<FormContainerDto[] | null>(null);

  containers = computed<FormContainerDto[]>(() => {
    const source = this.containersInput() ?? this.formState.currentPageContainers();
    return [...source].sort((a, b) => {
      const zA = parseInt(String(a.style?.zIndex ?? 0), 10) || 0;
      const zB = parseInt(String(b.style?.zIndex ?? 0), 10) || 0;
      return zB - zA;
    });
  });

  hoverEvent = output<FormContainerDto | null>();
  rightClickEvent = output<{ container: FormContainerDto; event: MouseEvent }>();

  getContainerName(container: FormContainerDto): string {
    return container.name ?? `Container ${container.id}`;
  }

  onHover(container: FormContainerDto | null): void {
    this.formState.hoverContainer(container);
    this.hoverEvent.emit(container);
  }

  onRightClick(container: FormContainerDto, event: MouseEvent): void {
    this.rightClickEvent.emit({ container, event });
  }

  selectContainer(container: FormContainerDto, event: MouseEvent): void {
    this.formState.selectContainer(container, event);
  }

  isSelected(container: FormContainerDto): boolean {
    return this.formState.isContainerSelected(container);
  }

  drop(event: CdkDragDrop<FormContainerDto[]>): void {
    const reordered = [...this.containers()];
    moveItemInArray(reordered, event.previousIndex, event.currentIndex);
    this.formState.updateZIndexes(reordered);
  }
}
