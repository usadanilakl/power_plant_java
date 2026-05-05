import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MainLayoutComponent } from '../../../layout/refactored/main-layout.component';
import { RouterMenuComponent } from '../../../shared/menu/router-menu/router-menu.component';
import { MaximoApiService } from '../../../services/maximo/maximo-api.service';
import { MaximoWorkOrder } from '../../../models/maximo/maximo.models';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-maximo-work-orders-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MainLayoutComponent, RouterMenuComponent],
  templateUrl: './maximo-work-orders-page.component.html',
  styleUrl: './maximo-work-orders-page.component.css'
})
export class MaximoWorkOrdersPageComponent {
  private api = inject(MaximoApiService);

  assetnum = '';
  pageSize = 50;
  loading = signal(false);
  error = signal<string | null>(null);
  list = signal<MaximoWorkOrder[]>([]);

  async load() {
    if (!this.assetnum) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      this.list.set(await firstValueFrom(this.api.listWorkOrdersForAsset(this.assetnum, this.pageSize)));
    } catch (e: any) {
      this.error.set(e?.error?.message ?? e?.message ?? String(e));
    } finally {
      this.loading.set(false);
    }
  }
}
