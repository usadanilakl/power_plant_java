import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { CurrentLotoService } from '../../../../services/current-items-services/current-loto.service';
import { LotoPointService } from '../../../../services/loto/loto-point.service';
import { LotoPointDto } from '../../../../models/loto/loto-point.model';
import { map } from 'rxjs';

@Component({
  selector: 'app-loto-points-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './loto-points-panel.component.html',
  styleUrl: './loto-points-panel.component.css',
})
export class LotoPointsPanelComponent {
  private currentLotoService = inject(CurrentLotoService);
  private lotoPointService = inject(LotoPointService);
  private destroyRef = inject(DestroyRef);

  currentLoto = toSignal(this.currentLotoService.currentLoto$, { initialValue: null });
  lotoPoints = computed(() => this.currentLoto()?.lotoPoints ?? []);

  isSearchOpen = signal(false);
  searchTerm = signal('');
  allPoints = signal<LotoPointDto[]>([]);
  filteredPoints = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.allPoints();
    return this.allPoints().filter(p =>
      (p.tagNumber?.toLowerCase().includes(term)) ||
      (p.description?.toLowerCase().includes(term)) ||
      (p.specificLocation?.toLowerCase().includes(term))
    );
  });

  openSearch(): void {
    this.isSearchOpen.set(true);
    this.searchTerm.set('');
    this.lotoPointService.getLotoPoints(1, 5000).pipe(
      takeUntilDestroyed(this.destroyRef),
      map(response => response.responseData?.content ?? [])
    ).subscribe(points => {
      this.allPoints.set(points.map(p => new LotoPointDto(p)));
    });
  }

  closeSearch(): void {
    this.isSearchOpen.set(false);
  }

  addPoint(point: LotoPointDto): void {
    this.currentLotoService.addLotoPointToCurrentLoto(point.id);
    this.closeSearch();
  }

  removePoint(pointId: number): void {
    this.currentLotoService.removeLotoPointFromCurrentLoto(pointId);
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
  }
}
