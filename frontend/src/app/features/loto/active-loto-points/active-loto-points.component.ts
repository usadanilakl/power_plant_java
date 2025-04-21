import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LotoService } from '../../../services/loto/loto.service';
import { LotoPointTableComponent } from '../../loto-points/loto-point-table/loto-point-table.component';
import { LotoPointDto } from '../../../models/loto/loto-point.model';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-active-loto-points',
  standalone: true,
  imports: [CommonModule, LotoPointTableComponent],
  templateUrl: './active-loto-points.component.html',
  styleUrls: ['./active-loto-points.component.css']
})
export class ActiveLotoPointsComponent implements OnInit {
  activeLotoPoints$ = new BehaviorSubject<LotoPointDto[]>([]);

  constructor(private lotoService: LotoService) {}

  ngOnInit() {
    this.loadActiveLotoPoints();
  }

  loadActiveLotoPoints() {
    this.lotoService.getActiveLotoPoints().subscribe(
      (response) => {
        if (response.responseData) {
          const activeLotoPoints = response.responseData.map(LotoPointDto.fromJson);
          this.activeLotoPoints$.next(activeLotoPoints);
        }
      },
      (error) => {
        console.error('Error fetching active LOTO points:', error);
      }
    );
  }
}
