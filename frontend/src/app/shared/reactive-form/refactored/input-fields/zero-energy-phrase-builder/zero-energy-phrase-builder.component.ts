import { Component, signal, inject, computed, input, ViewChild, AfterViewInit, Injector, effect, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { RfValueService } from '../../../../../features/values/refactored/services/rf-value.service';
import { SearchableSelectInputComponent } from '../searchable-select-input/searchable-select-input.component';
import { ValueDto } from '../../../../../models/value.model';
import { ClipboardService } from '../../../../clipboard/clipboard.service';
import { ZeroEnergyPhraseClipboardItem } from '../../../../../models/loto/zero-energy-phrase-clipboard.model';

export interface PhraseSegment {
  type: 'text' | 'placeholder';
  content: string;
  placeholderIndex?: number;
  substitutedText?: string; // Equipment tag number substituted for placeholder
  hasSubstitution?: boolean; // Whether this placeholder has equipment selected
}

export interface ZeroEnergyPhrase {
  id?: number;
  name: string;
  segments: PhraseSegment[];
  rawText: string;
}

@Component({
  selector: 'app-zero-energy-phrase-builder',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, SearchableSelectInputComponent],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: ZeroEnergyPhraseBuilderComponent,
    multi: true
  }],
  templateUrl: './zero-energy-phrase-builder.component.html',
  styleUrls: ['./zero-energy-phrase-builder.component.css']
})
export class ZeroEnergyPhraseBuilderComponent implements ControlValueAccessor, AfterViewInit {
  private valueService = inject(RfValueService);
  private injector = inject(Injector);
  private clipboardService = inject(ClipboardService);

  @ViewChild('selectInput') selectInput!: SearchableSelectInputComponent;

  // Inputs
  label = input<string>('Zero Energy Phrase');
  categoryAlias = input<string>('zeroEnergyPhrase');
  canManageValues = input<boolean>(true);
  selectedEquipment = input<any[]>([]); // Array of selected equipment/LOTO points for placeholder substitution

  // Output for clipboard item selection - includes full equipment objects for proper form population
  clipboardItemSelected = output<{ phraseId: number; templateEquipment: any[]; templateEquipmentIds: number[] }>();

  // State
  selectedPhraseId = signal<number | null>(null);
  disabled = signal<boolean>(false);

  // Computed options based on categoryAlias with phrase preview
  options = computed(() => {
    const alias = this.categoryAlias();
    if (!alias) return [];

    // Get full value data to access alias field
    const values = this.valueService.getValuesByCategory(alias);

    return values.map(v => {
      let phraseText = '';
      let placeholderCount = 0;

      // Parse phrase data from alias
      try {
        const phraseData: ZeroEnergyPhrase = JSON.parse(v.alias || '{}');
        phraseText = phraseData.rawText || '';
        placeholderCount = phraseData.segments?.filter(s => s.type === 'placeholder').length || 0;
      } catch (e) {
        // If parsing fails, just use empty values
      }

      // Create enhanced label with placeholder count
      const labelSuffix = placeholderCount > 0 ? ` (${placeholderCount} placeholder${placeholderCount === 1 ? '' : 's'})` : '';

      return {
        value: v.id,
        label: v.name + labelSuffix,
        description: phraseText, // Use description field for the phrase preview
        metadata: { phraseText, placeholderCount }
      } as any;
    });
  });

  // Dialog state for Add/Edit phrase
  showPhraseDialog = signal<boolean>(false);
  dialogMode = signal<'add' | 'edit'>('add');
  dialogPhraseName = '';
  dialogPhraseText = signal<string>('');
  cursorPosition = signal<number>(0);
  errorMessage = signal<string>('');

  // Delete confirmation state
  showDeleteConfirm = signal<boolean>(false);
  transferToValueId: number | null = null;
  selectedPhraseName = signal<string>('');
  transferOptions = signal<any[]>([]);

  // Parsed segments from dialog phrase text
  segments = computed(() => {
    return this.parsePhrase(this.dialogPhraseText());
  });

  // Placeholder count
  placeholderCount = computed(() => {
    const segs = this.segments();
    return segs.filter(s => s.type === 'placeholder').length;
  });

  // Selected phrase preview (for displaying under dropdown)
  selectedPhrasePreview = computed(() => {
    const phraseId = this.selectedPhraseId();
    if (!phraseId) return null;

    const alias = this.categoryAlias();
    const values = this.valueService.getValuesByCategory(alias);
    const selectedValue = values.find(v => v.id === phraseId);

    if (!selectedValue) return null;

    try {
      const phraseData: ZeroEnergyPhrase = JSON.parse(selectedValue.alias || '{}');
      return phraseData;
    } catch (e) {
      return null;
    }
  });

  // Count of placeholders in selected phrase
  selectedPhrasePlaceholderCount = computed(() => {
    const preview = this.selectedPhrasePreview();
    if (!preview || !preview.segments) return 0;
    return preview.segments.filter(s => s.type === 'placeholder').length;
  });

  // Preview with equipment substituted into placeholders
  previewWithEquipment = computed(() => {
    const preview = this.selectedPhrasePreview();
    if (!preview || !preview.segments) return null;

    const equipment = this.selectedEquipment();

    // Map segments, replacing placeholders with equipment info
    const substitutedSegments = preview.segments.map(segment => {
      if (segment.type === 'placeholder' && segment.placeholderIndex !== undefined) {
        const equipmentItem = equipment[segment.placeholderIndex];
        if (equipmentItem) {
          // Extract loto point tag number from equipment's lotoPoints array
          let tagNumber = `Equipment ${segment.placeholderIndex + 1}`;

          // First, try to get from lotoPoints array (equipment contains loto points)
          if (equipmentItem.lotoPoints && Array.isArray(equipmentItem.lotoPoints) && equipmentItem.lotoPoints.length > 0) {
            tagNumber = equipmentItem.lotoPoints[0].tagNumber || tagNumber;
          }
          // Fallback: if this is a loto point object directly
          else if (equipmentItem.tagNumber) {
            tagNumber = equipmentItem.tagNumber;
          }
          // Another fallback for older data
          else if (equipmentItem.tag) {
            tagNumber = equipmentItem.tag;
          }

          return {
            ...segment,
            substitutedText: tagNumber,
            hasSubstitution: true
          };
        }
      }
      return {
        ...segment,
        hasSubstitution: false
      };
    });

    return {
      ...preview,
      segments: substitutedSegments
    };
  });

  // ControlValueAccessor
  private onChange = (value: any) => {};
  private onTouched = () => {};
  private pendingValue: any = undefined;
  private hasPendingValue = false;

  ngAfterViewInit(): void {
    // Connect the child component's CVA to our CVA
    if (this.selectInput) {
      this.selectInput.registerOnChange((val: any) => {
        console.log('ZeroEnergyPhraseBuilder received new value:', val);
        const id = val?.id ?? val;
        this.selectedPhraseId.set(id);
        this.onChange({id:id});
      });
      this.selectInput.registerOnTouched(() => {
        this.onTouched();
      });

      // Apply pending value if writeValue was called before ngAfterViewInit
      if (this.hasPendingValue) {
        this.selectInput.writeValue(this.pendingValue);
        this.hasPendingValue = false;
        this.pendingValue = undefined;
      }

      // Re-apply value when options load to ensure display updates
      effect(() => {
        const opts = this.options();
        const val = this.selectedPhraseId();
        if (opts.length > 0 && val !== null && val !== undefined && this.selectInput) {
          setTimeout(() => {
            if (this.selectInput) {
              this.selectInput.writeValue(val);
            }
          }, 0);
        }
      }, { injector: this.injector });
    }
  }

  /**
   * Parse the phrase text into segments
   * Syntax: [tag1], [tag2], etc.
   */
  private parsePhrase(text: string): PhraseSegment[] {
    if (!text) return [];

    const segments: PhraseSegment[] = [];
    const regex = /\[([^\]]+)\]/g;
    let lastIndex = 0;
    let match;
    let placeholderIndex = 0;

    while ((match = regex.exec(text)) !== null) {
      // Add text before placeholder
      if (match.index > lastIndex) {
        segments.push({
          type: 'text',
          content: text.substring(lastIndex, match.index)
        });
      }

      // Add placeholder
      segments.push({
        type: 'placeholder',
        content: match[1],
        placeholderIndex: placeholderIndex++
      });

      lastIndex = regex.lastIndex;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      segments.push({
        type: 'text',
        content: text.substring(lastIndex)
      });
    }

    return segments;
  }

  // ==================== ControlValueAccessor Methods ====================

  writeValue(value: any): void {
    this.selectedPhraseId.set(value);
    if (this.selectInput) {
      this.selectInput.writeValue(value);
    } else {
      this.pendingValue = value;
      this.hasPendingValue = true;
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
    if (this.selectInput) {
      this.selectInput.setDisabledState(isDisabled);
    }
  }

  // ==================== Searchable Select Event Handlers ====================

  onAddNew(): void {
    this.dialogMode.set('add');
    this.dialogPhraseName = '';
    this.dialogPhraseText.set('');
    this.cursorPosition.set(0);
    this.errorMessage.set('');
    this.showPhraseDialog.set(true);
  }

  onEdit(): void {
    const currentValue = this.selectedPhraseId();
    if (!currentValue) {
      this.errorMessage.set('Please select a phrase to edit');
      return;
    }

    // Get full value data from cache to access the alias field
    const alias = this.categoryAlias();
    const values = this.valueService.getValuesByCategory(alias);
    const selectedValue = values.find(v => v.id === currentValue);

    if (!selectedValue) return;

    this.dialogMode.set('edit');
    this.dialogPhraseName = selectedValue.name;

    // Parse the phrase data from alias field
    try {
      const phraseData: ZeroEnergyPhrase = JSON.parse(selectedValue.alias || '{}');
      this.dialogPhraseText.set(phraseData.rawText || '');
    } catch (e) {
      console.error('Error parsing phrase data:', e);
      this.dialogPhraseText.set('');
    }

    this.cursorPosition.set(0);
    this.errorMessage.set('');
    this.showPhraseDialog.set(true);
  }

  // ==================== Phrase Dialog Methods ====================

  closePhraseDialog(): void {
    this.showPhraseDialog.set(false);
    this.dialogPhraseName = '';
    this.dialogPhraseText.set('');
    this.errorMessage.set('');
  }

  savePhrase(): void {
    if (!this.dialogPhraseName.trim()) {
      this.errorMessage.set('Phrase name is required');
      return;
    }

    if (!this.dialogPhraseText().trim()) {
      this.errorMessage.set('Phrase text is required');
      return;
    }

    const alias = this.categoryAlias();
    const isAddMode = this.dialogMode() === 'add';

    // Create phrase data with segments
    const phraseData: ZeroEnergyPhrase = {
      name: this.dialogPhraseName,
      rawText: this.dialogPhraseText(),
      segments: this.segments()
    };

    // Store as JSON string in the value alias field
    const phraseAlias = JSON.stringify(phraseData);

    if (isAddMode) {
      // Create new phrase value
      this.valueService.createValue(alias, this.dialogPhraseName, phraseAlias)
        .subscribe({
          next: (newValue) => {
            this.closePhraseDialog();
            // Refresh options
            this.valueService.refreshCategory(alias);
            // Auto-select the newly created phrase
            this.selectedPhraseId.set(newValue.id);
            this.onChange(newValue.id);
          },
          error: (error) => {
            this.errorMessage.set(error.error?.message || 'Error creating phrase');
          }
        });
    } else {
      // Update existing phrase
      const valueId = this.selectedPhraseId();
      if (!valueId) return;

      this.valueService.updateValue(valueId, this.dialogPhraseName, phraseAlias)
        .subscribe({
          next: () => {
            this.closePhraseDialog();
            // Refresh options
            this.valueService.refreshCategory(alias);
          },
          error: (error) => {
            this.errorMessage.set(error.error?.message || 'Error updating phrase');
          }
        });
    }
  }

  insertPlaceholder(): void {
    const currentText = this.dialogPhraseText();
    const cursor = this.cursorPosition();
    const placeholderNum = this.placeholderCount() + 1;
    const placeholder = `[tag${placeholderNum}]`;

    const newText = currentText.substring(0, cursor) + placeholder + currentText.substring(cursor);
    this.dialogPhraseText.set(newText);
    this.cursorPosition.set(cursor + placeholder.length);
  }

  updateCursorPosition(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.cursorPosition.set(target.selectionStart || 0);
  }

  onPhraseTextChange(newText: string): void {
    this.dialogPhraseText.set(newText);
  }

  // ==================== Delete Dialog ====================

  openDeleteDialog(): void {
    const currentValue = this.selectedPhraseId();
    if (!currentValue) return;

    const selectedOption = this.options().find((opt: any) => opt.value === currentValue);
    if (!selectedOption) return;

    this.selectedPhraseName.set(selectedOption.label);

    // Get transfer options (all options except current)
    const transfers = this.options().filter((opt: any) => opt.value !== currentValue);
    this.transferOptions.set(transfers);
    this.transferToValueId = null;
    this.errorMessage.set('');
    this.showDeleteConfirm.set(true);
  }

  closeDeleteDialog(): void {
    this.showDeleteConfirm.set(false);
    this.transferToValueId = null;
    this.errorMessage.set('');
  }

  confirmDelete(): void {
    const valueId = this.selectedPhraseId();
    if (!valueId) return;

    const alias = this.categoryAlias();

    this.valueService.deleteValue(valueId, alias, this.transferToValueId || undefined)
      .subscribe({
        next: () => {
          this.closeDeleteDialog();
          // Clear selection
          this.selectedPhraseId.set(null);
          this.onChange(null);
          // Refresh options
          this.valueService.refreshCategory(alias);
        },
        error: (error) => {
          this.errorMessage.set(error.error?.message || 'Error deleting phrase');
        }
      });
  }

  // ==================== Clipboard Methods ====================

  isClipboardCollapsed = signal<boolean>(true);
  private capturedInitialPhrase = signal<ZeroEnergyPhraseClipboardItem | null>(null);

  // Capture initial phrase when component has valid data
  private captureInitialEffect = effect(() => {
    const phraseId = this.selectedPhraseId();
    const equipment = this.selectedEquipment();

    if (phraseId && !this.capturedInitialPhrase()) {
      const clipboardItem = new ZeroEnergyPhraseClipboardItem({
        zeroEnergyTemplate: { id: phraseId } as any,
        templateEquipment: equipment,
        templateEquipmentIds: equipment.map((e: any) => e.id).filter((id: number) => id)
      });
      this.capturedInitialPhrase.set(clipboardItem);
    }
  }, { allowSignalWrites: true });

  clipboardItems = computed(() => {
    const section = this.clipboardService.getSectionByType('ZeroEnergyPhrase');
    return section?.items ?? [];
  });

  displayClipboardItems = computed(() => {
    const items = this.clipboardItems();
    const initial = this.capturedInitialPhrase();

    if (initial && initial.zeroEnergyTemplate?.id) {
      return [initial, ...items];
    }
    return items;
  });

  toggleClipboardCollapse(): void {
    this.isClipboardCollapsed.update(value => !value);
  }

  hasValidClipboardData(): boolean {
    const phraseId = this.selectedPhraseId();
    return !!phraseId;
  }

  getClipboardItemSummary = (item: ZeroEnergyPhraseClipboardItem): string => {
    const templateName = item.zeroEnergyTemplate?.name || `Template #${item.zeroEnergyTemplate?.id}`;
    const equipCount = item.templateEquipment?.length || item.templateEquipmentIds?.length || 0;
    return `${templateName} (${equipCount} equipment)`;
  };

  addToClipboard(): void {
    const phraseId = this.selectedPhraseId();
    if (!phraseId) {
      console.warn('No phrase selected to add to clipboard');
      return;
    }

    // Get phrase name from options
    const selectedOption = this.options().find((opt: any) => opt.value === phraseId);
    const phraseName = selectedOption?.label || `Template #${phraseId}`;
    const equipment = this.selectedEquipment();

    const clipboardItem = new ZeroEnergyPhraseClipboardItem({
      zeroEnergyTemplate: { id: phraseId, name: phraseName } as any,
      templateEquipment: equipment,
      templateEquipmentIds: equipment.map((e: any) => e.id).filter((id: number) => id)
    });

    this.clipboardService.addItem(clipboardItem);
    console.log('Added zero energy phrase to clipboard:', clipboardItem);
  }

  onClipboardItemClick(item: ZeroEnergyPhraseClipboardItem): void {
    if (item && item.zeroEnergyTemplate?.id) {
      console.log('Loading zero energy phrase from clipboard:', item);

      // Update the selected phrase
      this.selectedPhraseId.set(item.zeroEnergyTemplate.id);
      this.onChange({ id: item.zeroEnergyTemplate.id });

      // Update the child select component
      if (this.selectInput) {
        this.selectInput.writeValue(item.zeroEnergyTemplate.id);
      }

      // Emit event so parent can update equipment selection - includes full equipment objects
      this.clipboardItemSelected.emit({
        phraseId: item.zeroEnergyTemplate.id,
        templateEquipment: item.templateEquipment || [],
        templateEquipmentIds: item.templateEquipmentIds || []
      });
    }
  }

  getClipboardItemLabel(item: ZeroEnergyPhraseClipboardItem, index: number): string {
    if (index === 0 && this.capturedInitialPhrase() === item) {
      return `[Initial] ${this.getClipboardItemSummary(item)}`;
    }
    return this.getClipboardItemSummary(item);
  }
}