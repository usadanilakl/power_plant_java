import { CommonModule } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'app-form-zoom-controls',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './form-zoom-controls.component.html',
  styleUrl: './form-zoom-controls.component.css'
})
export class FormZoomControlsComponent {
  scale = input.required<number>();
  zoomIn = output<void>();
  zoomOut = output<void>();
  fitToPanel = output<void>();

  scalePercentage = computed(() => Math.round(this.scale() * 100));

}
