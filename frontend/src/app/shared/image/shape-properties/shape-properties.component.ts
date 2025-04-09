import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Shape } from '../../../models/shape.model';

@Component({
  selector: 'app-shape-properties',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './shape-properties.component.html',
  styleUrl: './shape-properties.component.css'
})
export class ShapePropertiesComponent {
  @Input() shape: Shape | null = null;
}
