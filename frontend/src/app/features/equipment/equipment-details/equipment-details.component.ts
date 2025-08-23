import { Component, DestroyRef, inject, input, OnInit, output, signal } from '@angular/core';
import { EquipmentDto } from '../../../models/equipment/equipment.model';
import { RectangleShape, Shape } from '../../../models/shape.model';
import { CurrentEquipmentService } from '../../../services/current-items-services/current-equipment.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LotoPointDto } from '../../../models/loto/loto-point.model';

@Component({
  selector: 'app-equipment-details',
  imports: [],
  standalone: true,
  templateUrl: './equipment-details.component.html',
  styleUrl: './equipment-details.component.css'
})
export class EquipmentDetailsComponent implements OnInit {

  currentEquipmentService = inject(CurrentEquipmentService);
  destroyRef = inject(DestroyRef);

  inputEquipment = input<EquipmentDto | null>(null);
  inputShape = input<Shape | null>(null);
  buttonText = input<string>('Add');

  equipment = signal<EquipmentDto>(new EquipmentDto());

  lotoPointClickEvent = output<LotoPointDto>();

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

}
