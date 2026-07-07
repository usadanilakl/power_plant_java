import { CommonModule } from "@angular/common";
import { Component, computed, DestroyRef, inject, input, output, Signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { LotoPointSimpleTableComponent } from "../../loto-points/loto-point-simple-table/loto-point-simple-table.component";
import { RedTagService } from "../../../services/loto/red-tag.service";
import { LotoService } from "../../../services/loto/loto.service";
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
  lotoService = inject(LotoService);
  router = inject(Router);
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

  flipToPermit() {
    const standardId = this.lotoStandard()().id;
    if (!standardId) {
      alert('Save the LOTO standard before flipping to a permit.');
      return;
    }
    this.lotoService.createFromStandard(standardId).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (response) => {
        const newPermitId = response?.responseData?.id;
        if (newPermitId) {
          this.router.navigate(['/loto/loto'], { queryParams: { lotoId: newPermitId } });
        } else {
          alert('LOTO permit was not created — backend returned no id.');
        }
      },
      error: (err) => {
        console.error('Error creating LOTO permit from standard', err);
        alert(`Error flipping LOTO standard to permit: ${err?.error?.message ?? err?.message ?? 'Unknown'}`);
      }
    });
  }
}
