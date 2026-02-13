import { Component, inject } from '@angular/core';
import { FormRendererComponent } from '../../form-renderer/form-renderer.component';
import { PrintService } from '../../../../services/ui/print.service';

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