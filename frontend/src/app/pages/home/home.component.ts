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
    const hasFullAccess = this.currentUser()?.accessLevel === 'FULL';
    const testMode = this.isTestMode();

    return GROUPED_HOME_NAVIGATION_CARDS
      .filter(group => hasFullAccess || !group.requiresFullAccess)
      .map(group => ({
        ...group,
        items: group.items.filter(item =>
          (hasFullAccess || !item.requiresFullAccess) &&
          (!item.testOnly || testMode)
        )
      }))
      .filter(group => group.items.length > 0);
  });
}
