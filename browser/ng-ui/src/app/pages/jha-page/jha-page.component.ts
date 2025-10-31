import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MainLayoutComponent } from "../../layouts/main-layout/main-layout.component";
import { RouterMenuComponent } from "../../shared/menus/router-menu/router-menu.component";
import { JhaLeftMenuComponent } from "../../features/jha/jha-left-menu/jha-left-menu.component";
import { RouteDataEncoderService } from '../../services/route-data-encoder.service';
import { IJhaTransfer, JhaTransfer } from '../../models/permits/jha-transfer.model';
import { JhaStateService } from '../../features/jha/jha-state.service';
import { WorkRequestDbService } from '../../features/work-request/work-request-db.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { combineLatest, map, startWith } from 'rxjs';

@Component({
  selector: 'app-jha-page',
  standalone: true,
  imports: [RouterModule, MainLayoutComponent, RouterMenuComponent, JhaLeftMenuComponent],
  templateUrl: './jha-page.component.html',
  styleUrl: './jha-page.component.css'
})
export class JhaPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private routeDataEncoder = inject(RouteDataEncoderService);
  private jhaStateService = inject(JhaStateService);
  private workRequestDbService = inject(WorkRequestDbService);
  private destroyRef = inject(DestroyRef);
  
  jhaTransfers: JhaTransfer[] = [];

  ngOnInit(): void {
    // Combine both sources: query params and IndexedDB
    combineLatest([
      // Get encoded data from query params
      this.route.queryParamMap.pipe(
        map(params => {
          const encodedData = params.get('data');
          if (encodedData) {
            const decodedData = this.routeDataEncoder.decode<IJhaTransfer>(encodedData);
            return decodedData.map(item => new JhaTransfer(item));
          }
          return [];
        }),
        startWith([]) // Start with empty array
      ),
      // Get work requests without JHA from IndexedDB
      this.workRequestDbService.getWorkRequestWithoutJha().pipe(
        map(workRequests => 
          workRequests.map(workRequest => 
            new JhaTransfer({
              requestSharepointId: +workRequest.sharepointId,
              workScope: workRequest.workScope,
              dateOfWork: workRequest.dateOfWork
            })
          )
        ),
        startWith([]) // Start with empty array
      )
    ]).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: ([queryParamTransfers, dbTransfers]) => {
        // Merge both arrays, removing duplicates based on requestSharepointId
        const allTransfers = [...queryParamTransfers, ...dbTransfers];
        
        // Remove duplicates (prefer query param data over DB data)
        const uniqueTransfers = allTransfers.reduce((acc, transfer) => {
          const exists = acc.find(t => t.requestSharepointId === transfer.requestSharepointId);
          if (!exists) {
            acc.push(transfer);
          }
          return acc;
        }, [] as JhaTransfer[]);
        
        this.jhaTransfers = uniqueTransfers;
        
        console.log('Combined JHA transfers:', {
          fromQueryParams: queryParamTransfers.length,
          fromDB: dbTransfers.length,
          total: this.jhaTransfers.length
        });
      },
      error: (error) => {
        console.error('Error fetching JHA transfers:', error);
      }
    });
  }
}
