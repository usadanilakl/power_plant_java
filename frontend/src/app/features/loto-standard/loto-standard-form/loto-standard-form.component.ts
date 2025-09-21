import { CommonModule } from "@angular/common";
import { Component, computed, DestroyRef, inject, input, output, Signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { LotoPointSimpleTableComponent } from "../../loto-points/loto-point-simple-table/loto-point-simple-table.component";
import { RedTagService } from "../../../services/loto/red-tag.service";
import { LotoStandardDto } from "../../../models/loto/loto-standard.model";
import { LotoPointDto } from "../../../models/loto/loto-point.model";
import { BehaviorSubject } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";


@Component({
  selector: 'app-loto-standard-form',
  templateUrl: './loto-standard-form.component.html',
  styleUrls: ['./loto-standard-form.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, LotoPointSimpleTableComponent]
})
export class LotoStandardFormComponent {

  redTagService = inject(RedTagService);
  destroyRef = inject(DestroyRef);

  lotoStandard = input.required<Signal<LotoStandardDto>>();
  updateNameEvent = output<LotoStandardDto>();
  updateDescriptionEvent = output<LotoStandardDto>();
  removePointEvent = output<LotoPointDto>();
  showPointEvent = output<LotoPointDto>();
  reorderedItemsEvent = output<LotoPointDto[]>();

  showNameSubmitButton = false;
  showDescriptionSubmitButton = false;
  
  private lotoPointsSubject = new BehaviorSubject<LotoPointDto[]>([]);
  
  lotoPoints = computed(() => {
    const points = this.lotoStandard()().lotoPoints ?? [];
    this.lotoPointsSubject.next(points);
    return this.lotoPointsSubject.asObservable();
  });

  onNameChange() {
    this.showNameSubmitButton = true;
  }

  onDescriptionChange() {
    this.showDescriptionSubmitButton = true;
  }

  onNameSubmit() {
    const updatedStandard = new LotoStandardDto({id: this.lotoStandard()().id, name: this.lotoStandard()().name??"" });
    this.updateNameEvent.emit(updatedStandard);
    this.showNameSubmitButton = false;
  }

  onDescriptionSubmit() {
    const updatedStandard = new LotoStandardDto({id: this.lotoStandard()().id, description: this.lotoStandard()().description??"" });
    this.updateDescriptionEvent.emit(updatedStandard);
    this.showDescriptionSubmitButton = false;
  }

  removePoint(point: LotoPointDto) {
    this.removePointEvent.emit(point);
  }

  submitReorderdItems(lotoPoints: LotoPointDto[]){
    this.reorderedItemsEvent.emit(lotoPoints);
  }

  showPoint(point: LotoPointDto){
    this.showPointEvent.emit(point);
  }

  
  buildLotoInRedTag() {
    this.redTagService.simpleBuild(this.lotoPointsSubject.value).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(
      (response) => {
        console.log('Build in Red Tag completed', response);
        if(response.responseData !== 'success'){
          alert(`Build in Red Tag completed with status: ${response.responseData}`);
        } else {
          alert('Build in Red Tag completed successfully');
        }
      },
      (error) => {
        console.error('Error building in Red Tag', error);
        alert(`Error building in Red Tag: ${error.message}`);
      }
    );
  }
}
