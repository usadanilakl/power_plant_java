import { Component, inject, signal } from '@angular/core';
import { RouterMenuComponent } from "../../shared/menu/router-menu/router-menu.component";
import { MainLayoutComponent } from "../../layout/refactored/main-layout.component";
import { ActivatedRoute, NavigationEnd, Router, RouterModule } from '@angular/router';
import { LeftMenuOutletComponent } from "../../shared/left-menu-outlet/left-menu-outlet.component";
import { filter } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-permit-builder-page',
  standalone: true,
  imports: [RouterMenuComponent, MainLayoutComponent, RouterModule, LeftMenuOutletComponent],
  templateUrl: './permit-builder-page.component.html',
  styleUrl: './permit-builder-page.component.css'
})
export class PermitBuilderPageComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  isPopupMode = signal(false);

  // Track whether the current child route defines a leftMenu component
  hasLeftMenu = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      startWith(null),
      map(() => {
        let child = this.route.firstChild;
        while (child?.firstChild) child = child.firstChild;
        return !!child?.snapshot?.data?.['leftMenu'];
      })
    ),
    { initialValue: true }
  );

  constructor() {
    const mode = this.route.snapshot.queryParamMap.get('mode');
    this.isPopupMode.set(mode === 'popup');
  }
}
