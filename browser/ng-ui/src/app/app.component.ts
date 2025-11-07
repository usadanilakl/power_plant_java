import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/theme.service';
import { GlobalMessageComponent } from "./shared/global-message/global-message.component";
import { ViewportService } from './services/viewport.service';
import { QrScannerComponent } from "./shared/qr-scanner/qr-scanner.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, GlobalMessageComponent, QrScannerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  private themeService = inject(ThemeService);
  // private activatedRoute = inject(ActivatedRoute)
  title = 'Jackson Generation Permits';
  private viewportService = inject(ViewportService);

  ngOnInit() {
    // Service is automatically initialized via injection
    console.log('Device type:', this.viewportService.getDeviceType());
    console.log('Is standalone:', this.viewportService.isStandalone());
  }
}
