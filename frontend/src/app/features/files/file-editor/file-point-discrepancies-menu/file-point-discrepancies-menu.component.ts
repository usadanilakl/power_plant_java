import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { CurrentFileService } from '../../../../services/current-file.service';
import { EquipmentService } from '../../../../services/equipment.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EquipmentDto } from '../../../../models/equipment/equipment.model';
import { switchMap, forkJoin } from 'rxjs';
import { SpringApiResponse } from '../../../../models/api/spring-api-response.model';

@Component({
  selector: 'app-file-point-discrepancies-menu',
  standalone: true,
  imports: [],
  templateUrl: './file-point-discrepancies-menu.component.html',
  styleUrl: './file-point-discrepancies-menu.component.css'
})
export class FilePointDiscrepanciesMenuComponent implements OnInit {
  private currentFileService = inject(CurrentFileService);
  private equipmentService = inject(EquipmentService);
  private destroyRef = inject(DestroyRef);

  private currentItems = signal<EquipmentDto[]>([]);
  private otherUnitItems = signal<EquipmentDto[]>([]);

  ngOnInit() {
    this.currentFileService.getElements().pipe(
      takeUntilDestroyed(this.destroyRef),
      switchMap((items: EquipmentDto[]) => {
        this.currentItems.set(items || []);
        
        // Create an array of observables for fetching other unit items
        const otherUnitObservables = items.map(item => 
          this.equipmentService.getEquipmentForAnotherUnit(item.tagNumber)
        );
        
        // Use forkJoin to wait for all requests to complete
        return forkJoin(otherUnitObservables);
      })
    ).subscribe({
      next: (responses: SpringApiResponse<EquipmentDto>[]) => {
        const otherUnitEquipment = responses
          .filter(response => response.responseData !== null)
          .map(response => response.responseData);
        this.otherUnitItems.set(otherUnitEquipment);
      },
      error: (error) => {
        console.error('Error fetching other unit items:', error);
      }
    });
  }


}