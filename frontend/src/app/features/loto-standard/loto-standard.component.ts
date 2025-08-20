import { Component, computed, DestroyRef, inject, OnInit, Signal, signal } from '@angular/core';
import { LotoStandardFormComponent } from "./loto-standard-form/loto-standard-form.component";
import { CurrentLotoStandardService } from '../../services/current-items-services/current-loto-standard.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LotoPointDto } from '../../models/loto/loto-point.model';
import { FileDto } from '../../models/file/file.model';
import { LotoPointService } from '../../services/loto/loto-point.service';
import { ImageZoomInteractiveComponent } from "../../shared/image/image-zoom-interactive/image-zoom-interactive.component";
import { PdfDisplayIframeComponent } from "../../shared/pdf-dislplay-iframe/pdf-dislplay-iframe.component";
import { Observable } from 'rxjs';
import { EquipmentDto } from '../../models/equipment/equipment.model';

@Component({
  selector: 'app-loto-standard',
  imports: [LotoStandardFormComponent, ImageZoomInteractiveComponent, PdfDisplayIframeComponent],
  templateUrl: './loto-standard.component.html',
  styleUrl: './loto-standard.component.css'
})
export class LotoStandardComponent implements OnInit  {

  currentLotoStandardService = inject(CurrentLotoStandardService);
  lotoPointService = inject(LotoPointService);
  destroyRef = inject(DestroyRef);

  currentLotoPoint = signal<LotoPointDto | Signal<LotoPointDto> | null>(null);
  _currentLotoPoint = computed<LotoPointDto | null>(() => {
    const value = this.currentLotoPoint();
    if (!value) return null;
    if (value instanceof LotoPointDto) return value;
    if (typeof value === 'function') return value(); // This handles the Signal<LotoPointDto> case
    return null; // Add this as a fallback
  });

  currentFileLinks = signal<string[]>([]);
  elements = new Observable<EquipmentDto[]>();

  constructor() { }

  ngOnInit(): void {
    this.currentLotoStandardService.getCurrentLotoPoint().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(lotoPoint => {
      this.currentLotoPoint.set(lotoPoint);
    });

    this.currentLotoStandardService.getCurrentFileLinks().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(files => {
      this.currentFileLinks.set(files);
    });
  }



}
