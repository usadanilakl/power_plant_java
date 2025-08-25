import { Component, computed, DestroyRef, effect, inject, input, OnInit, output, signal } from '@angular/core';
import { EquipmentDto } from '../../../models/equipment/equipment.model';
import { RectangleShape, Shape } from '../../../models/shape.model';
import { CurrentEquipmentService } from '../../../services/current-items-services/current-equipment.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LotoPointDto } from '../../../models/loto/loto-point.model';
import { FileDto } from '../../../models/file/file.model';
import { EquipmentService } from '../../../services/equipment.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-equipment-details',
  imports: [],
  standalone: true,
  templateUrl: './equipment-details.component.html',
  styleUrl: './equipment-details.component.css'
})
export class EquipmentDetailsComponent implements OnInit {

  currentEquipmentService = inject(CurrentEquipmentService);
  equipmentService = inject(EquipmentService);
  destroyRef = inject(DestroyRef);

  inputEquipment = input<EquipmentDto | null>(null);
  inputShape = input<Shape | null>(null);
  buttonText = input<string>('Add');

  equipment = signal<EquipmentDto>(new EquipmentDto());
  relatedFiles = signal<FileDto[]>([]);

  lotoPointClickEvent = output<LotoPointDto>();
  fileClickEvent = output<FileDto>();

  constructor() {
    effect(() => {
      const eqId = this.equipment().id;
      if (eqId) {
        this.loadRelatedFiles(eqId);
      } else {
        this.relatedFiles.set([]);
      }
    });
  }

  ngOnInit(): void {
    if(this.inputEquipment()) {
      this.equipment.set(this.inputEquipment()!);
    }else if(this.inputShape()) {
      this.equipment.set(EquipmentDto.createEquipmentFromShape(this.inputShape()! as RectangleShape));
    }else {
      this.currentEquipmentService.getCurrentEquipment().pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe(equipment => {
        if(equipment)this.equipment.set(equipment);
      });
    }
  }

  onLotoPointClick(point: LotoPointDto) {
    this.lotoPointClickEvent.emit(point);
  }

  private loadRelatedFiles(eqId: number): void {
    this.equipmentService.getRelatedFiles(eqId).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(response => {
      const files = response.responseData || [];
      this.relatedFiles.set(files);
    });
  }

  getFileButtonText(file: FileDto): string {
    const fileName = file.name || '';
    const fileNumber = file.fileNumber || '';
    return `View ${fileName} (${fileNumber})`;
  }

  onFileClick(file: FileDto) {
    this.fileClickEvent.emit(file);
  }

}
