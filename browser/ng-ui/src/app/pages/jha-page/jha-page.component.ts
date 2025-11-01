import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MainLayoutComponent } from "../../layouts/main-layout/main-layout.component";
import { RouterMenuComponent } from "../../shared/menus/router-menu/router-menu.component";
import { JhaLeftMenuComponent } from "../../features/jha/jha-left-menu/jha-left-menu.component";
import { JhaTransfer } from '../../models/permits/jha-transfer.model';
import { JhaStateService } from '../../features/jha/jha-state.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map, Observable } from 'rxjs';

@Component({
  selector: 'app-jha-page',
  standalone: true,
  imports: [RouterModule, MainLayoutComponent, RouterMenuComponent, JhaLeftMenuComponent],
  templateUrl: './jha-page.component.html',
  styleUrl: './jha-page.component.css'
})
export class JhaPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private jhaStateService = inject(JhaStateService);
  private destroyRef = inject(DestroyRef);
  
  jhaTransfers$: Observable<JhaTransfer[]> = this.jhaStateService.jhaTransfers$;

  ngOnInit(): void {
    this.route.queryParamMap.pipe(
      takeUntilDestroyed(this.destroyRef),
      map(params => params.get('data'))
    ).subscribe(encodedData => {
      this.jhaStateService.updateTransfersFromQueryParams(encodedData);
    });
  }
}
