import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { PrintLayoutComponent } from "./features/form-designer/printable-form/print-layout/print-layout.component";
import { GlobalMessageComponent } from "./shared/global-message/global-message.component";
import { GlobalContextMenuComponent } from "./shared/menu/context-menu/global-context-menu/global-context-menu.component";
import { QrScannerComponent } from "./shared/qr-code/qr-scanner/qr-scanner.component";
import { BradyPrinterManagerComponent } from "./shared/brady-printer-manager/brady-printer-manager.component";
import { EngraverManagerComponent } from "./shared/engraver-manager/engraver-manager.component";
import { WizardDialogComponent, WizardStackService, WizardFlowType } from "./shared/guide/guide-form";
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    PrintLayoutComponent,
    GlobalMessageComponent,
    GlobalContextMenuComponent,
    QrScannerComponent,
    BradyPrinterManagerComponent,
    EngraverManagerComponent,
    WizardDialogComponent,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatMenuModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  wizardService = inject(WizardStackService);

  constructor(public route: ActivatedRoute) {}
  title = 'Jackson';

  startGuide(action: WizardFlowType): void {
    this.wizardService.startOrResume(action);
  }
}
