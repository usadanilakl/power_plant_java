import { Component } from '@angular/core';
import { LotoBoxService } from '../../services/loto-box.service';

@Component({
  selector: 'app-control-panel',
  imports: [],
  templateUrl: './control-panel.component.html',
  styleUrl: './control-panel.component.css',
})
export class ControlPanelComponent {
  constructor(private lotoBoxService: LotoBoxService) {}

  syncAll(): void {
    this.lotoBoxService.syncAllToControllers().subscribe();
  }

  clearAll(): void {
    if (confirm('Clear all boxes?')) {
      this.lotoBoxService.clearAllBoxes().subscribe();
    }
  }

  refresh(): void {
    this.lotoBoxService.loadBoxes();
  }

  getStatusCount(status: string): number {
    return this.lotoBoxService.boxes().filter(b =>
      b.status === status
    ).length;
  }
}

