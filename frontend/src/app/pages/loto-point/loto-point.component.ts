import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { LotoPointTableComponent } from "../../features/loto-points/loto-point-table/loto-point-table.component";
import { Column } from '../../models/column.model';
import { LotoPointService } from '../../services/loto/loto-point.service';
import { LotoPointDto, LotoPointFormField } from '../../models/loto/loto-point.model';
import { SharedDataService } from '../../services/shared-data.service';
import { BehaviorSubject, catchError, finalize, forkJoin, map, Observable, of, tap } from 'rxjs';
import { Option } from '../../models/option.model';
import { ValueDto } from '../../models/value.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DetailsFormComponent } from '../../shared/details-form/details-form.component';
import { PopupProjectionComponent } from '../../shared/popup-projection/popup-projection.component';
import { LotoPointIdDto } from '../../models/loto/loto-point-id.model';
import { MainLayoutComponent } from "../../layout/main-layout.component";
import { RouterMenuComponent } from "../../shared/menu/router-menu/router-menu.component";

@Component({
  selector: 'app-loto-point',
  imports: [LotoPointTableComponent, PopupProjectionComponent, DetailsFormComponent, MainLayoutComponent, RouterMenuComponent],
  templateUrl: './loto-point.component.html',
  styleUrl: './loto-point.component.css'
})
export class LotoPointComponent implements OnInit  {

  private lotoPointService = inject(LotoPointService);
  private sharedDataService = inject(SharedDataService);
  private destroyRef = inject(DestroyRef);

  private isoPosOptions = new BehaviorSubject<Option[]>([]);
  private normPosOptions = new BehaviorSubject<Option[]>([]);
  lotoPointToEdit: LotoPointDto | null = null;
  fields: LotoPointFormField[] = [];
  isPopupOpen = false;
  isFormReady = false;
  DetailsFormComponent = DetailsFormComponent;

  

  ngOnInit() {
    forkJoin({
      isoPositions: this.loadOptions(this.sharedDataService.loadIsoPositions()),
      normPositions: this.loadOptions(this.sharedDataService.loadNormPositions()),
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
      tap(({ isoPositions, normPositions }) => {
        this.isoPosOptions.next(isoPositions);
        this.normPosOptions.next(normPositions);
      }),
      catchError(error => {
        console.error('Error loading form data:', error);
        return of({ isoPositions: [], normPositions: [] });
      })
    ).subscribe();
  }

  cellDoubleClick(item: LotoPointDto, column: Column) {
    this.lotoPointToEdit = item;
    this.setupEditFields(item, column);
    this.isPopupOpen = true;
  }

  private setupEditFields(lotoPoint: LotoPointDto, column: Column) {
    if (LotoPointDto.isValidKey(column.id)) {
      this.fields = LotoPointDto.toFormFields(
        lotoPoint,
        this.isoPosOptions.value,
        this.normPosOptions.value,
        [column.id]
      );
      this.isFormReady = true;
    } else {
      console.error(`Invalid column id: ${column.id}`);
      // Handle the error case, maybe set a default field or show an error message
    }
  }

  onClosePopup() {
    this.isPopupOpen = false;
    this.lotoPointToEdit = null;
    this.fields = [];
    this.isFormReady = false;
  }

    private loadOptions(source: Observable<ValueDto[]>): Observable<Option[]> {
      return source.pipe(
        map(items => items.map(item => new ValueDto(item).toOption())),
        catchError(error => {
          console.error('Error loading options:', error);
          return of([]);
        })
      );
    }

    onFormSubmit(lotoPoint: LotoPointIdDto) {
      // Perform the required actions to save or update the loto point (e.g., save to the server)
      lotoPoint.id = this.lotoPointToEdit?.id || 0;
      this.lotoPointService.updateLotoPoint(lotoPoint).subscribe(alert => console.log('Loto point updated successfully:', alert))
      this.isPopupOpen = false;
      this.lotoPointToEdit = null;
      this.fields = [];
      this.isFormReady = false;
    }

    onFormDelete() {

    }

}
