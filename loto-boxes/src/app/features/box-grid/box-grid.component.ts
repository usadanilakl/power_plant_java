import { Component, DestroyRef, inject, signal } from '@angular/core';
import { LotoBoxService } from '../../services/loto-box.service';
import { LotoBox, LotoBoxStatus } from '../../models/loto-box.model';
import { BoxTile } from "../box-tile/box-tile.component";
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-box-grid',
  imports: [BoxTile],
  templateUrl: './box-grid.component.html',
  styleUrl: './box-grid.component.css',
})
export class BoxGridComponent {
  activeDropdown = signal<number | null>(null);

  destroRef = inject(DestroyRef);

  constructor(public lotoBoxService: LotoBoxService) {}

  toggleDropdown(box: LotoBox): void {
    const current = this.activeDropdown();
    this.activeDropdown.set(current === box.number ? null : box.number);
  }

  updateBoxStatus(box: LotoBox, status: LotoBoxStatus): void {
    this.lotoBoxService.updateBoxStatus(box.number, status).pipe(takeUntilDestroyed(this.destroRef)).subscribe();
    this.activeDropdown.set(null);
  }

}
