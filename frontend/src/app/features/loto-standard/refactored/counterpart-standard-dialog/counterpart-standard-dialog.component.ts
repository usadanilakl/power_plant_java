import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';
import { RfLotoStandardApiService } from '../services/rf-loto-standard-api.service';
import { RfLotoStandardStateService } from '../services/rf-loto-standard-state.service';
import { GlobalMessageService } from '../../../../shared/global-message/global-message.service';
import { LotoStandardDto } from '../../../../models/loto/loto-standard.model';
import { LotoPointDto } from '../../../../models/loto/loto-point.model';
import {
  CounterpartStandardPreviewDto,
  CounterpartItemDto,
} from '../../../../models/loto/counterpart-standard-preview.model';

@Component({
  selector: 'app-counterpart-standard-dialog',
  standalone: true,
  imports: [],
  templateUrl: './counterpart-standard-dialog.component.html',
  styleUrl: './counterpart-standard-dialog.component.css',
})
export class CounterpartStandardDialogComponent {
  private apiService = inject(RfLotoStandardApiService);
  private stateService = inject(RfLotoStandardStateService);
  private messageService = inject(GlobalMessageService);
  private destroyRef = inject(DestroyRef);

  sourceStandardId = input.required<number>();

  standardCreated = output<LotoStandardDto>();
  dialogClosed = output<void>();

  loading = signal<boolean>(true);
  saving = signal<boolean>(false);
  preview = signal<CounterpartStandardPreviewDto | null>(null);
  workingItems = signal<CounterpartItemDto[]>([]);
  newStandardName = signal<string>('');
  newStandardDescription = signal<string>('');

  private loadPreview = effect(() => {
    const id = this.sourceStandardId();
    if (id) {
      this.loading.set(true);
      this.apiService.generateCounterpartPreview(id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (response) => {
            const data = response.responseData;
            this.preview.set(data);
            this.workingItems.set([...data.items]);
            this.newStandardName.set(
              (data.sourceStandard?.name || 'Standard') + ' - Unit ' + data.targetUnit?.charAt(1)
            );
            this.newStandardDescription.set(
              'Counterpart of ' + (data.sourceStandard?.name || '')
            );
            this.loading.set(false);
          },
          error: (err) => {
            console.error('Failed to generate counterpart preview:', err);
            this.messageService.showError('Failed to generate counterpart preview');
            this.loading.set(false);
          },
        });
    }
  });

  confirmedItems = computed(() =>
    this.workingItems().filter((i) => i.category === 'confirmed')
  );
  suggestedItems = computed(() =>
    this.workingItems().filter((i) => i.category === 'suggested')
  );
  originalItems = computed(() =>
    this.workingItems().filter((i) => i.category === 'original')
  );
  nonCounterpartItems = computed(() =>
    this.workingItems().filter((i) => i.category === 'non-counterpart')
  );
  totalCount = computed(() => this.workingItems().length);

  removeItem(item: CounterpartItemDto): void {
    this.workingItems.update((items) =>
      items.filter((i) => i.sourceIndex !== item.sourceIndex)
    );
  }

  useOriginal(item: CounterpartItemDto): void {
    this.workingItems.update((items) =>
      items.map((i) => {
        if (i.sourceIndex === item.sourceIndex) {
          return {
            ...i,
            counterpartPoint: i.sourcePoint,
            category: 'original' as const,
            hasMultipleMatches: false,
            allMatches: null,
          };
        }
        return i;
      })
    );
  }

  selectMatch(item: CounterpartItemDto, match: LotoPointDto): void {
    this.workingItems.update((items) =>
      items.map((i) => {
        if (i.sourceIndex === item.sourceIndex) {
          return { ...i, counterpartPoint: match };
        }
        return i;
      })
    );
  }

  accept(): void {
    const items = this.workingItems();
    const lotoPointIds = items
      .map((i) => i.counterpartPoint?.id)
      .filter((id): id is number => id != null && id > 0);

    if (lotoPointIds.length === 0) {
      this.messageService.showError('No valid LOTO points to create standard with');
      return;
    }

    const sourceGroups = this.preview()?.sourceStandard?.groups;
    const groupIds = sourceGroups
      ? sourceGroups.map((g: any) => g.id).filter((id: any): id is number => id != null)
      : [];

    const newStandard = new LotoStandardDto({
      name: this.newStandardName(),
      description: this.newStandardDescription(),
      lotoPoints: items
        .map((i) => i.counterpartPoint)
        .filter((p): p is LotoPointDto => p != null && p.id != null),
      groups: sourceGroups || [],
    });

    this.saving.set(true);
    this.apiService.createLotoStandard(newStandard)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap((response) => {
          const created = LotoStandardDto.fromJson(response.responseData);
          // Reorder the points to preserve the user's ordering
          return this.apiService.reorderLotoPoints(created.id!, lotoPointIds).pipe(
            switchMap(() => {
              // Reload the full standard to get the correct state
              return this.apiService.getLotoStandardById(created.id + '');
            }),
          );
        })
      )
      .subscribe({
        next: (response) => {
          const finalStandard = LotoStandardDto.fromJson(response.responseData);
          this.messageService.showSuccess('Counterpart standard created successfully');
          this.standardCreated.emit(finalStandard);
          this.saving.set(false);
        },
        error: (err) => {
          console.error('Failed to save counterpart standard:', err);
          this.messageService.showError('Failed to save counterpart standard');
          this.saving.set(false);
        },
      });
  }

  close(): void {
    this.dialogClosed.emit();
  }

  onNameInput(event: Event): void {
    this.newStandardName.set((event.target as HTMLInputElement).value);
  }

  onDescriptionInput(event: Event): void {
    this.newStandardDescription.set((event.target as HTMLInputElement).value);
  }
}
