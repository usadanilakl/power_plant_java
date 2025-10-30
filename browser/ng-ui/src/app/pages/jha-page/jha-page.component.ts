import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MainLayoutComponent } from "../../layouts/main-layout/main-layout.component";
import { RouterMenuComponent } from "../../shared/menus/router-menu/router-menu.component";
import { JhaLeftMenuComponent } from "../../features/jha/jha-left-menu/jha-left-menu.component";
import { RouteDataEncoderService } from '../../services/route-data-encoder.service';
import { IJhaTransfer, JhaTransfer } from '../../models/permits/jha-transfer.model';

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
  
  jhaTransfers: JhaTransfer[] = [];

  ngOnInit(): void {
    // Get the encoded data from route params
    this.route.paramMap.subscribe(params => {
      const encodedData = params.get('data');
      
      if (encodedData) {
        // Decode the data
        const decodedData = this.routeDataEncoder.decode<IJhaTransfer>(encodedData);
        
        // Convert to JhaTransfer instances
        this.jhaTransfers = decodedData.map(item => new JhaTransfer(item));
        
        console.log('Received JHA transfers:', this.jhaTransfers);
      }
    });
  }
}
