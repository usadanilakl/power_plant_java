import { CommonModule } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'app-zoom-controls',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './zoom-controls.component.html',
  styleUrl: './zoom-controls.component.css',
})
export class ZoomControlsComponent {
  scale = input.required<number>();
  zoomIn = output<void>();
  zoomOut = output<void>();
  fitToPanel = output<void>();

  scalePercentage = computed(() => Math.round(this.scale() * 100));
}
