import { Component, inject, signal, computed, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import {
  RfUnifiedImageViewerComponent,
  ViewerDataSource,
  ViewerConfig,
} from '../../../shared/image/refactored/rf-unified-image-viewer/rf-unified-image-viewer.component';
import { EquipmentDto } from '../../../models/equipment/equipment.model';
import { RfShape } from '../../../shared/image/refactored/models/fr-shape.model';

interface QrEquipmentResponse {
  responseData: {
    target: any;
    equipmentOnPid: any[];
  };
  message: string;
}

@Component({
  selector: 'app-qr-equipment-viewer',
  standalone: true,
  imports: [CommonModule, RfUnifiedImageViewerComponent],
  templateUrl: './qr-equipment-viewer.component.html',
  styleUrls: ['./qr-equipment-viewer.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class QrEquipmentViewerComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);

  tagNumber = signal<string>('');
  targetEquipment = signal<EquipmentDto | null>(null);
  equipmentList = signal<EquipmentDto[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  /** Equipment detail shown when a shape is clicked */
  selectedEquipment = signal<EquipmentDto | null>(null);

  dataSource = computed<ViewerDataSource>(() => ({
    type: 'equipment-list',
    equipmentList: this.equipmentList(),
  }));

  /** Highlight the scanned equipment by default */
  highlightedIds = computed<number[]>(() => {
    const target = this.targetEquipment();
    return target?.id ? [target.id] : [];
  });

  viewerConfig: ViewerConfig = {
    showCarousel: false,
    showTable: false,
    tablePosition: 'none',
    collapsible: false,
    highlightMode: 'clicked',
    legend: false,
    emptyStateMessage: 'No P&ID found for this equipment.',
  };

  ngOnInit(): void {
    const tag = this.route.snapshot.paramMap.get('tagNumber') ?? '';
    this.tagNumber.set(tag);

    if (!tag) {
      this.error.set('No tag number provided.');
      this.loading.set(false);
      return;
    }

    this.http.get<QrEquipmentResponse>(
      `${environment.apiUrl}/qr/equipment/${encodeURIComponent(tag)}`
    ).subscribe({
      next: (response) => {
        const data = response.responseData;
        if (!data) {
          this.error.set('Equipment not found.');
          this.loading.set(false);
          return;
        }
        this.targetEquipment.set(EquipmentDto.fromJson(data.target));
        this.equipmentList.set(
          data.equipmentOnPid.map((eq: any) => EquipmentDto.fromJson(eq))
        );
        this.loading.set(false);
      },
      error: (err) => {
        if (err.status === 404) {
          this.error.set(`Equipment "${tag}" not found.`);
        } else {
          this.error.set('Failed to load equipment data. Please try again.');
        }
        this.loading.set(false);
      }
    });
  }

  onShapeClicked(shape: RfShape): void {
    // Find the equipment matching this shape's ID
    const equipment = this.equipmentList().find(eq => eq.id === shape.id) ?? null;
    this.selectedEquipment.set(equipment);
  }

  closeDetail(): void {
    this.selectedEquipment.set(null);
  }

  goHome(): void {
    this.router.navigate(['/home']);
  }
}
