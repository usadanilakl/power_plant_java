import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CurrentValueService } from '../../../services/current-value.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ValueDto } from '../../../models/value.model';

@Component({
  selector: 'app-naming-convention',
  imports: [],
  templateUrl: './naming-convention.component.html',
  styleUrl: './naming-convention.component.css'
})
export class NamingConventionComponent implements OnInit {

  private currentValueService = inject(CurrentValueService);
  private destroyRef = inject(DestroyRef);

  systems = signal<ValueDto[]>([]);
  eqTypes = signal<ValueDto[]>([]);

  ngOnInit(): void {
    this.currentValueService.getValuesByCategory("system").pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(systems => {
      this.systems.set(systems);
    });

    this.currentValueService.getValuesByCategory("eqType").pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(eqTypes => {
      this.eqTypes.set(eqTypes);
    });
  }



}
