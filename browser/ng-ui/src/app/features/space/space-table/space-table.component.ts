import { Component, computed, DestroyRef, inject, input, OnInit, output } from '@angular/core';
import { SpaceStateService } from '../space-state.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { Space } from '../../../models/permits/space.model';
import { TableComponent } from "../../../shared/table/table.component";
import { PopupComponent } from "../../../shared/menus/popup/popup.component";
import { ButtonConfig, ButtonsComponent } from '../../../shared/menus/buttons/buttons.component';
import { SpaceFormComponent } from "../space-form/space-form.component";

@Component({
  selector: 'app-space-table',
  standalone: true,
  imports: [TableComponent, PopupComponent, ButtonsComponent, SpaceFormComponent],
  templateUrl: './space-table.component.html',
  styleUrl: './space-table.component.css'
})
export class SpaceTableComponent implements OnInit {

  spaceStateService = inject(SpaceStateService);
  destroyRef = inject(DestroyRef);

  itemsInput = input<Space[]>();
  buttonsInput = input<ButtonConfig[]>();
  itemsFromService = toSignal(this.spaceStateService.allSpaces$, { initialValue: [] });
  items = computed(() => this.itemsInput() ?? this.itemsFromService());
  selectedItem = toSignal(this.spaceStateService.selectedSpace$, { initialValue: new Space() });

  private readonly defaultButtons: ButtonConfig[] = [
    { name: 'Create New', action: () => this.openNewSpaceFormPopup(), color: 'primary' },
    { name: 'Refresh Table', action: () => this.spaceStateService.synchronize(), color: 'primary' },
  ];

  tableButtons = computed(() => this.buttonsInput() ?? this.defaultButtons);

  actionPopupClosed = output<void>();
  newSpacePopupClosed = output<void>();

  columns = new Space().toTableColumns();
  actionButtons: ButtonConfig[] = [];

  isActionMenuOpen = false;
  isNewSpacePopupOpen = false;

  constructor() { }

  ngOnInit(): void {
    // Populate items and columns as needed
    this.actionButtons = [
      { name: 'Resubmit', action: () => this.resubmitSelected(), color: 'primary' },
      { name: 'Revoke', action: () => this.Revoke(), color: 'accent' },
      { name: 'Delete', action: () => this.deleteSelected(), color: 'warn' }
    ];
  }

  onRowClick({ item }: { item: Space, event: MouseEvent }) {
    this.spaceStateService.selectSpace(item);
    this.isActionMenuOpen = true;
  }

  closeActionMenu() {
    this.isActionMenuOpen = false;
    this.actionPopupClosed.emit();
  }

  closeNewSpacePopup(){
    this.isNewSpacePopupOpen = false;
    this.newSpacePopupClosed.emit();

  }

  resubmitSelected(): void {
    this.spaceStateService.resubmitSelected();
    this.closeActionMenu();
  }

  Revoke(): void {
    this.spaceStateService.revokeSelected();
    this.closeActionMenu();
  }

  deleteSelected(): void {
    console.log('Deleting:', this.selectedItem());
    this.closeActionMenu();
  }

  onCreateNewSpace(space: Space) {
    this.spaceStateService.createNewSpace(space);
    this.closeNewSpacePopup();
  }

  openNewSpaceFormPopup() {
    this.spaceStateService.selectSpace(new Space());
    this.isNewSpacePopupOpen = true;
  }
}