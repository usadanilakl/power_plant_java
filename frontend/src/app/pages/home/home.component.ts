import { Component, inject, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MainLayoutComponent } from '../../layout/refactored/main-layout.component';
import { RouterMenuComponent } from '../../shared/menu/router-menu/router-menu.component';
import { GroupNavigationCardComponent } from '../../shared/navigation-card/group-navigation-card.component';
import { GROUPED_HOME_NAVIGATION_CARDS } from '../../models/ui/navigation-card.model';
import { WelcomeDialogComponent } from '../../shared/tour/welcome-dialog.component';
import { AuthService } from '../../services/auth.service';
import { AppConfigService } from '../../services/app-config.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [MainLayoutComponent, RouterMenuComponent, GroupNavigationCardComponent, WelcomeDialogComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  private authService = inject(AuthService);
  private appConfigService = inject(AppConfigService);
  private currentUser = toSignal(this.authService.currentUser$);
  private isTestMode = toSignal(this.appConfigService.testMode$);

  filteredGroupedCards = computed(() => {
    const user = this.currentUser();
    const hasFullAccess = user?.accessLevel === 'FULL';
    const roles = user?.roles ?? [];
    // Plant-role (or admin) users can see Plant-gated groups (e.g. Maximo) without FULL access.
    const hasPlant = roles.includes('ROLE_PLANT') || roles.includes('ROLE_ADMIN');
    const testMode = this.isTestMode();

    // A Plant-gated group (Maximo) is shown iff the user has the Plant role — matching its route guard.
    return GROUPED_HOME_NAVIGATION_CARDS
      .filter(group => group.requiresPlant ? hasPlant : (hasFullAccess || !group.requiresFullAccess))
      .map(group => ({
        ...group,
        items: group.items.filter(item =>
          (group.requiresPlant ? hasPlant : (hasFullAccess || !item.requiresFullAccess)) &&
          (!item.testOnly || testMode)
        )
      }))
      .filter(group => group.items.length > 0);
  });
}
