import { Component, computed, inject, input, output } from '@angular/core';
import { CurrentPrintableFormService } from '../../../../services/forms/current-printable-form.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormContainerDto } from '../../../../models/forms/form-container.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-form-container-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './form-container-list.component.html',
  styleUrl: './form-container-list.component.css'
})
export class FormContainerListComponent {
  private currentPrintableFormService = inject(CurrentPrintableFormService);
  containersFromService = toSignal(this.currentPrintableFormService.formContainers$,{ initialValue: []  });
  containersInput = input<FormContainerDto[] | null>(null);
  containers = computed<FormContainerDto[]>(() => this.containersInput()?? this.containersFromService());

  hoverEvent = output<FormContainerDto | null>();
  
  getContainerName(container: FormContainerDto){
    return container.name?? `Container ${container.id}`;
  }

  onHover(container: FormContainerDto | null): void {
    this.hoverEvent.emit(container);
  }

  selectContainer(container: FormContainerDto, event: MouseEvent): void {
    this.currentPrintableFormService.selectContainer(container, event);
  }

  isSelected(container: FormContainerDto): boolean {
    return this.currentPrintableFormService.isContainerSelected(container);
  }
}
