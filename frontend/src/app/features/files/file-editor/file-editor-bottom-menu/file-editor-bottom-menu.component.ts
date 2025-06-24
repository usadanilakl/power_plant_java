import { Component, OnInit, signal, OnDestroy, output } from '@angular/core';
import { AsyncPipe, NgIf, NgFor, CommonModule } from '@angular/common';
import { EquipmentDto } from '../../../../models/equipment/equipment.model';
import { LotoPointDto } from '../../../../models/loto/loto-point.model';
import { CurrentEquipmentService } from '../../../../services/current-items-services/current-equipment.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-file-editor-bottom-menu',
  templateUrl: './file-editor-bottom-menu.component.html',
  styleUrls: ['./file-editor-bottom-menu.component.css'],
  standalone: true,
  imports: [CommonModule, AsyncPipe, NgIf, NgFor]
})
export class FileEditorBottomMenuComponent implements OnInit, OnDestroy {

  currentEquipment = signal<EquipmentDto | null>(null);
  currentLotoPoints = signal<LotoPointDto[]>([]);
  relatedEquipment = signal<EquipmentDto[]>([]);
  relatedLotoPoints = signal<LotoPointDto[]>([]);

  openMenu = output<boolean>();
  private isMenuOpen = false;

  private subscriptions: Subscription = new Subscription();

  constructor(private currentEquipmentService: CurrentEquipmentService) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.currentEquipmentService.getCurrentEquipment().subscribe(
        equipment => this.currentEquipment.set(equipment)
      )
    );

    this.subscriptions.add(
      this.currentEquipmentService.getlotoPoints().subscribe(
        lotoPoints => this.currentLotoPoints.set(lotoPoints)
      )
    );

    this.subscriptions.add(
      this.currentEquipmentService.getRelatedEquipment().subscribe(
        equipment => this.relatedEquipment.set(equipment)
      )
    );

    this.subscriptions.add(
      this.currentEquipmentService.getRelatedLotoPoints().subscribe(
        lotoPoints => this.relatedLotoPoints.set(lotoPoints)
      )
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  onMenuOpen(): void {
    this.isMenuOpen =!this.isMenuOpen;
    this.openMenu.emit(this.isMenuOpen);
  }
}