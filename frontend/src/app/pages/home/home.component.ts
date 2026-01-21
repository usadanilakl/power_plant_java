import { Component } from '@angular/core';
import { MainLayoutComponent } from '../../layout/refactored/main-layout.component';
import { RouterMenuComponent } from '../../shared/menu/router-menu/router-menu.component';
import { GroupNavigationCardComponent } from '../../shared/navigation-card/group-navigation-card.component';
import { GROUPED_HOME_NAVIGATION_CARDS, NavigationCardGroup } from '../../models/ui/navigation-card.model';
import { WelcomeDialogComponent } from '../../shared/tour/welcome-dialog.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [MainLayoutComponent, RouterMenuComponent, GroupNavigationCardComponent, WelcomeDialogComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  groupedCards: NavigationCardGroup[] = GROUPED_HOME_NAVIGATION_CARDS;
}
