import { Component } from '@angular/core';
import { MainLayoutComponent } from '../../layout/refactored/main-layout.component';
import { RouterMenuComponent } from '../../shared/menu/router-menu/router-menu.component';
import { NavigationCardComponent } from '../../shared/navigation-card/navigation-card.component';
import { HOME_NAVIGATION_CARDS, NavigationCard } from '../../models/ui/navigation-card.model';
import { WelcomeDialogComponent } from '../../shared/tour/welcome-dialog.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [MainLayoutComponent, RouterMenuComponent, NavigationCardComponent, WelcomeDialogComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  navigationCards: NavigationCard[] = HOME_NAVIGATION_CARDS;
}
