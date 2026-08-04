import { Component, inject } from '@angular/core';
import { FormRendererComponent } from '../form-renderer/form-renderer.component';
import { PrintService } from '../../../services/ui/print.service';

/**
 * Globally mounted (app.component.html) print surface. `PrintService.printForm()` pushes a form
 * definition + data here, the @media print rules in styles.css hide everything except
 * `app-print-layout`, and the browser/Electron print job captures what is left.
 *
 * Renders through the form-designer-refactored renderer — the same one the designer and the
 * on-screen paper views use, so what you see while authoring is what prints.
 */
@Component({
  selector: 'app-print-layout',
  standalone: true,
  imports: [FormRendererComponent],
  templateUrl: './print-layout.component.html',
  styleUrl: './print-layout.component.css'
})
export class PrintLayoutComponent {
  printService = inject(PrintService);
  printableForm = this.printService.printableForm;
  isPreparing = this.printService.isPreparing;
}
