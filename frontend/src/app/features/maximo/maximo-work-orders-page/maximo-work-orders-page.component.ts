import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MainLayoutComponent } from '../../../layout/refactored/main-layout.component';
import { RouterMenuComponent } from '../../../shared/menu/router-menu/router-menu.component';
import { MaximoApiService } from '../../../services/maximo/maximo-api.service';
import { MaximoWorkOrder, MaximoWorkOrderCriteria } from '../../../models/maximo/maximo.models';
import { firstValueFrom } from 'rxjs';

const emptyCriteria = (): MaximoWorkOrderCriteria => ({
  status: '',
  worktype: '',
  assetnum: '',
  location: '',
  priority: '',
  leadCraft: '',
  schedstartFrom: '',
  schedfinishTo: '',
  descriptionContains: '',
  siteid: ''
});

@Component({
  selector: 'app-maximo-work-orders-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MainLayoutComponent, RouterMenuComponent],
  templateUrl: './maximo-work-orders-page.component.html',
  styleUrl: './maximo-work-orders-page.component.css'
})
export class MaximoWorkOrdersPageComponent {
  private api = inject(MaximoApiService);

  criteria: MaximoWorkOrderCriteria = emptyCriteria();
  pageSize = 50;

  loading = signal(false);
  error = signal<string | null>(null);
  list = signal<MaximoWorkOrder[]>([]);
  loaded = signal(false);

  readonly statusOptions = ['', 'WAPPR', 'APPR', 'INPRG', 'COMP', 'CLOSE', 'CAN'];
  readonly worktypeOptions = ['', 'CM', 'PM', 'EM', 'INSP'];

  activeFilterCount = computed(() => {
    const c = this.criteria;
    return [c.status, c.worktype, c.assetnum, c.location, c.priority, c.leadCraft,
      c.schedstartFrom, c.schedfinishTo, c.descriptionContains, c.siteid]
      .filter(v => v && v.trim() !== '').length;
  });

  hasAnyCriteria(): boolean {
    return this.activeFilterCount() > 0;
  }

  async apply() {
    if (!this.hasAnyCriteria()) {
      this.error.set('Set at least one filter before loading.');
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    try {
      this.list.set(await firstValueFrom(this.api.listWorkOrdersByCriteria(this.criteria, this.pageSize)));
      this.loaded.set(true);
    } catch (e: any) {
      this.error.set(e?.error?.message ?? e?.message ?? String(e));
    } finally {
      this.loading.set(false);
    }
  }

  clear() {
    this.criteria = emptyCriteria();
    this.list.set([]);
    this.loaded.set(false);
    this.error.set(null);
  }
}
