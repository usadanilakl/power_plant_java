import { Component, input, output } from '@angular/core';
import { LotoStandardDto } from '../../../models/loto/loto-standard.model';
import { LotoPointDto } from '../../../models/loto/loto-point.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-loto-standard-form',
  templateUrl: './loto-standard-form.component.html',
  styleUrls: ['./loto-standard-form.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class LotoStandardFormComponent {
  lotoStandard = input<LotoStandardDto>(new LotoStandardDto());
  updateNameEvent = output<LotoStandardDto>();
  updateDescriptionEvent = output<LotoStandardDto>();
  removePointEvent = output<LotoPointDto>();

  showNameSubmitButton = false;
  showDescriptionSubmitButton = false;

  onNameChange() {
    this.showNameSubmitButton = true;
  }

  onDescriptionChange() {
    this.showDescriptionSubmitButton = true;
  }

  onNameSubmit() {
    const updatedStandard = new LotoStandardDto({id: this.lotoStandard().id, name: this.lotoStandard().name??"" });
    this.updateNameEvent.emit(updatedStandard);
    this.showNameSubmitButton = false;
  }

  onDescriptionSubmit() {
    const updatedStandard = new LotoStandardDto({id: this.lotoStandard().id, description: this.lotoStandard().description??"" });
    this.updateDescriptionEvent.emit(updatedStandard);
    this.showDescriptionSubmitButton = false;
  }

  removePoint(point: LotoPointDto) {
    this.removePointEvent.emit(point);
  }
}