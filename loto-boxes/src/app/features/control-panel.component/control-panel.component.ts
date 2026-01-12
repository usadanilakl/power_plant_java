import { Component, inject } from '@angular/core';
import { LotoBoxService } from '../../services/loto-box.service';
import { SpellingService } from '../../services/spelling.service';
import { NetworkModeService } from '../../services/network-mode.service';

@Component({
  selector: 'app-control-panel',
  imports: [],
  templateUrl: './control-panel.component.html',
  styleUrl: './control-panel.component.css',
})
export class ControlPanelComponent {
  private lotoBoxService = inject(LotoBoxService);
  private spellService = inject(SpellingService);
  private networkModeService = inject(NetworkModeService);

  get isReadOnly(): boolean {
    return this.lotoBoxService.isReadOnly();
  }

  get canControl(): boolean {
    return this.lotoBoxService.canControl();
  }

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
  loadFromEsp() {
    this.lotoBoxService.loadFromEsp();
  }

  getStatusCount(status: string): number {
    return this.lotoBoxService.boxes().filter(b =>
      b.status === status
    ).length;
  }
  spell() {
    this.spellService.spellString("AB");
  }
checkMate() {
  this.spellService.checkMate();
}
}

