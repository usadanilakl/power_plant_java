import { Component, inject, DestroyRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { LotoConflictStateService } from '../services/loto-conflict-state.service';
import { LotoConflictApiService } from '../services/loto-conflict-api.service';
import { RfLotoPointApiService } from '../../loto-points/refactored/services/rf-loto-point-api.service';
import { LotoPointDto } from '../../../models/loto/loto-point.model';

interface PointEntry {
  index: number;
  point: LotoPointDto;
  label: string;
}

interface ComparisonField {
  label: string;
  key: string;
  values: string[]; // one per point
  hasDifference: boolean;
}

@Component({
  selector: 'app-loto-conflict-merge',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatRadioModule,
    MatTooltipModule,
    FormsModule,
  ],
  templateUrl: './loto-conflict-merge.component.html',
  styleUrl: './loto-conflict-merge.component.css',
})
export class LotoConflictMergeComponent implements OnInit {
  protected state = inject(LotoConflictStateService);
  private conflictApi = inject(LotoConflictApiService);
  private lotoPointApi = inject(RfLotoPointApiService);
  private destroyRef = inject(DestroyRef);

  points: PointEntry[] = [];
  keepIndex = 0;
  comparisonFields: ComparisonField[] = [];
  isMerging = false;
  isLoading = true;
  errorMessage: string | null = null;

  ngOnInit(): void {
    const group = this.state.selectedDuplicateGroup();
    if (!group || group.points.length < 2) {
      this.isLoading = false;
      this.errorMessage = 'No duplicate group selected or group has fewer than 2 points.';
      return;
    }

    // Fetch full data for all points in the group
    const requests = group.points.map((p) =>
      this.lotoPointApi.getLotoPointById(String(p.id))
    );

    forkJoin(requests)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (responses) => {
          this.points = responses.map((res, i) => ({
            index: i,
            point: res.responseData ?? (group.points[i] as LotoPointDto),
            label: String.fromCharCode(65 + i), // A, B, C, ...
          }));
          this.isLoading = false;
          this.buildComparison();
        },
        error: () => {
          // Fallback to group data
          this.points = group.points.map((p, i) => ({
            index: i,
            point: p as LotoPointDto,
            label: String.fromCharCode(65 + i),
          }));
          this.isLoading = false;
          this.buildComparison();
        },
      });
  }

  private buildComparison(): void {
    if (this.points.length < 2) return;

    const fieldDefs: { label: string; key: string }[] = [
      { label: 'Tag Number', key: 'tagNumber' },
      { label: 'Description', key: 'description' },
      { label: 'Location', key: 'specificLocation' },
      { label: 'Unit', key: 'unit' },
      { label: 'General Location', key: 'generalLocation' },
      { label: 'Equipment Type', key: 'eqType' },
      { label: 'Iso Position', key: 'isoPos' },
      { label: 'Normal Position', key: 'normPos' },
      { label: 'Zero Energy', key: 'zeroEnergyMethod' },
      { label: 'Characteristics', key: 'characteristicsJson' },
      { label: 'Equipment Count', key: 'equipmentCount' },
    ];

    this.comparisonFields = fieldDefs.map((f) => {
      const values = this.points.map((pe) => this.getFieldValue(pe.point, f.key));
      const unique = new Set(values);
      return {
        label: f.label,
        key: f.key,
        values,
        hasDifference: unique.size > 1,
      };
    });
  }

  private getFieldValue(point: LotoPointDto, key: string): string {
    switch (key) {
      case 'isoPos':
        return point.isoPos?.name || '(none)';
      case 'normPos':
        return point.normPos?.name || '(none)';
      case 'eqType':
        return point.eqType?.name || '(none)';
      case 'location':
        return point.location?.name || '(none)';
      case 'equipmentCount':
        return String(point.equipmentIdList?.length || point.equipmentList?.length || 0);
      case 'characteristicsJson':
        return point.characteristicsJson ? 'Yes' : '(none)';
      default:
        return (point as any)[key] || '(none)';
    }
  }

  merge(): void {
    if (this.points.length < 2) return;

    const keepId = this.points[this.keepIndex].point.id!;
    const removeIds = this.points
      .filter((_, i) => i !== this.keepIndex)
      .map((pe) => pe.point.id!);

    const group = this.state.selectedDuplicateGroup();

    this.isMerging = true;
    this.conflictApi
      .mergeDuplicates({ keepId, removeIds })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.isMerging = false;
          if (res.responseData) {
            this.state.closeMergeDialog();
            if (group) {
              this.state.removeDuplicateGroup(
                group.normalizedTag,
                group.points.length
              );
            }
          }
        },
        error: (err) => {
          this.isMerging = false;
          console.error('Merge failed:', err);
        },
      });
  }

  cancel(): void {
    this.state.closeMergeDialog();
  }

  /** Grid column template for N points + field label + diff icon */
  get gridColumns(): string {
    const pointCols = this.points.map(() => '1fr').join(' ');
    return `140px ${pointCols} 28px`;
  }
}
