import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { JhaStateService } from '../jha-state.service';
import { WorkRequest } from '../../../models/permits/work-request.model';
import { Jha } from '../../../models/permits/jha.model';
import { TableComponent } from '../../../shared/table/table.component';

@Component({
  selector: 'app-jha-left-menu',
  imports: [TableComponent],
  templateUrl: './jha-left-menu.component.html',
  styleUrl: './jha-left-menu.component.css'
})
export class JhaLeftMenuComponent {

  jhaStateService = inject(JhaStateService);

  activeTab = signal<'needs-jha' | 'submitted'>('needs-jha');

  // Needs JHA tab
  wrItems = toSignal(this.jhaStateService.workRequestsForJha$, { initialValue: [] });
  wrColumns = new WorkRequest().toTableColumns({ columns: ['workScope', 'company', 'dateOfWork', 'jhaStatus'] });

  // Submitted JHAs tab
  jhaItems = toSignal(this.jhaStateService.allJhas$, { initialValue: [] });
  jhaColumns = new Jha().getTableColumns();

  private selectedWr = this.jhaStateService.selectedWorkRequestSignal;
  highlightId = computed(() => this.selectedWr()?.sharepointId ?? null);

  onWrRowClick({ item }: { item: WorkRequest, event: MouseEvent }) {
    this.jhaStateService.selectWorkRequestForJha(item);
  }

  onJhaRowClick({ item }: { item: Jha, event: MouseEvent }) {
    this.jhaStateService.selectJha(item);
  }
}
