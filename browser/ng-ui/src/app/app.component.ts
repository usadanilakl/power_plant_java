import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/theme.service';
import { GlobalMessageComponent } from "./shared/global-message/global-message.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, GlobalMessageComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  private themeService = inject(ThemeService);
  // private activatedRoute = inject(ActivatedRoute)
  title = 'Jackson Generation Permits';
}
