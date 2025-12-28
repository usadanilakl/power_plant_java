
import { Injectable, signal, computed } from '@angular/core';
import { EquipmentDto } from '../../../../models/equipment/equipment.model';
import { FileDto } from '../../../../models/file/file.model';
import { LotoPointDto } from '../../../../models/loto/loto-point.model';

@Injectable()
export class RfEquipmentEditorStateService {
  // Loading and error state
  private _isLoading = signal<boolean>(true);
  private _error = signal<string | null>(null);
  
  // File and equipment data (independent from CurrentFileService)
  private _currentFile = signal<FileDto | null>(null);
  private _allEquipment = signal<EquipmentDto[]>([]);
  private _selectedEquipment = signal<EquipmentDto | null>(null);
  
  // UI state
  private _highlightedEquipmentId = signal<number | null>(null);
  private _isLotoPointTableOpen = signal<boolean>(false);
  private _isLotoPointFormOpen = signal<boolean>(false);
  private _selectedLotoPoint = signal<LotoPointDto | null>(null);

  // Public readonly signals
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly currentFile = this._currentFile.asReadonly();
  readonly allEquipment = this._allEquipment.asReadonly();
  readonly selectedEquipment = this._selectedEquipment.asReadonly();
  readonly highlightedEquipmentId = this._highlightedEquipmentId.asReadonly();
  readonly isLotoPointTableOpen = this._isLotoPointTableOpen.asReadonly();
  readonly isLotoPointFormOpen = this._isLotoPointFormOpen.asReadonly();
  readonly selectedLotoPoint = this._selectedLotoPoint.asReadonly();

  // Computed values
  readonly fileLink = computed(() => {
    const file = this._currentFile();
    return file?.fileLink || '';
  });

  readonly allLotoPoints = computed(() => {
    const equipment = this._allEquipment();
    const lotoPoints: LotoPointDto[] = [];
    
    equipment.forEach(eq => {
      if (eq.lotoPoints && eq.lotoPoints.length > 0) {
        lotoPoints.push(...eq.lotoPoints);
      }
    });
    
    return lotoPoints;
  });

  // State setters
  setLoading(loading: boolean): void {
    this._isLoading.set(loading);
  }

  setError(error: string | null): void {
    this._error.set(error);
  }

  setCurrentFile(file: FileDto | null): void {
    this._currentFile.set(file);
  }

  setAllEquipment(equipment: EquipmentDto[]): void {
    this._allEquipment.set(equipment);
  }

  setSelectedEquipment(equipment: EquipmentDto | null): void {
    this._selectedEquipment.set(equipment);
  }

  setHighlightedEquipmentId(id: number | null): void {
    this._highlightedEquipmentId.set(id);
  }

  openLotoPointTable(): void {
    this._isLotoPointTableOpen.set(true);
  }

  closeLotoPointTable(): void {
    this._isLotoPointTableOpen.set(false);
  }

  openLotoPointForm(lotoPoint: LotoPointDto): void {
    this._selectedLotoPoint.set(lotoPoint);
    this._isLotoPointFormOpen.set(true);
  }

  closeLotoPointForm(): void {
    this._isLotoPointFormOpen.set(false);
    this._selectedLotoPoint.set(null);
  }

  // Update equipment in the local list
  updateEquipmentInList(updatedEquipment: EquipmentDto): void {
    const equipment = this._allEquipment();
    const updatedList = equipment.map(eq => 
      eq.id === updatedEquipment.id ? updatedEquipment : eq
    );
    this._allEquipment.set(updatedList);

    // Update selected equipment if it's the one being updated
    if (this._selectedEquipment()?.id === updatedEquipment.id) {
      this._selectedEquipment.set(updatedEquipment);
    }
  }

  // Update a loto point in the equipment list
  updateLotoPointInEquipment(updatedLotoPoint: LotoPointDto): void {
    const equipment = this._allEquipment();
    const updatedList = equipment.map(eq => {
      if (eq.lotoPoints?.some(lp => lp.id === updatedLotoPoint.id)) {
        return new EquipmentDto({
          ...eq,
          lotoPoints: eq.lotoPoints.map(lp => 
            lp.id === updatedLotoPoint.id ? updatedLotoPoint : lp
          )
        });
      }
      return eq;
    });
    this._allEquipment.set(updatedList);

    // Update selected equipment if needed
    const selectedEq = this._selectedEquipment();
    if (selectedEq?.lotoPoints?.some(lp => lp.id === updatedLotoPoint.id)) {
      const updated = new EquipmentDto({
        ...selectedEq,
        lotoPoints: selectedEq.lotoPoints.map(lp => 
          lp.id === updatedLotoPoint.id ? updatedLotoPoint : lp
        )
      });
      this._selectedEquipment.set(updated);
    }
  }

  // Remove a loto point from equipment
  removeLotoPointFromEquipment(lotoPointId: number): void {
    const equipment = this._allEquipment();
    const updatedList = equipment.map(eq => {
      if (eq.lotoPoints?.some(lp => lp.id === lotoPointId)) {
        return new EquipmentDto({
          ...eq,
          lotoPoints: eq.lotoPoints.filter(lp => lp.id !== lotoPointId)
        });
      }
      return eq;
    });
    this._allEquipment.set(updatedList);

    // Update selected equipment if needed
    const selectedEq = this._selectedEquipment();
    if (selectedEq?.lotoPoints?.some(lp => lp.id === lotoPointId)) {
      const updated = new EquipmentDto({
        ...selectedEq,
        lotoPoints: selectedEq.lotoPoints.filter(lp => lp.id !== lotoPointId)
      });
      this._selectedEquipment.set(updated);
    }
  }

  // Reset all state
  reset(): void {
    this._isLoading.set(true);
    this._error.set(null);
    this._currentFile.set(null);
    this._allEquipment.set([]);
    this._selectedEquipment.set(null);
    this._highlightedEquipmentId.set(null);
    this._isLotoPointTableOpen.set(false);
    this._isLotoPointFormOpen.set(false);
    this._selectedLotoPoint.set(null);
  }
}
