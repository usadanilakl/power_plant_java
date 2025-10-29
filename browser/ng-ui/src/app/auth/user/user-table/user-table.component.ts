import { Component, computed, DestroyRef, inject, input, OnInit, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TableComponent } from "../../../shared/table/table.component";
import { PopupComponent } from "../../../shared/menus/popup/popup.component";
import { ButtonConfig, ButtonsComponent } from '../../../shared/menus/buttons/buttons.component';
import { UserStateService } from '../user-state.service';
import { User } from '../../../models/auth/user.model';

@Component({
  selector: 'app-user-table',
  standalone: true,
  imports: [TableComponent, PopupComponent, ButtonsComponent],
  templateUrl: './user-table.component.html',
  styleUrl: './user-table.component.css'
})
export class UserTableComponent implements OnInit {

  userStateService = inject(UserStateService);
  destroyRef = inject(DestroyRef);

  itemsInput = input<User[]>();
  itemsFromService = toSignal(this.userStateService.allUsers$, { initialValue: [] });
  items = computed(() => this.itemsInput() ?? this.itemsFromService());
  selectedItem = toSignal(this.userStateService.selectedUser$, { initialValue: new User() });

  actionPopupClosed = output<void>();

  columns = new User().toTableColumns();
  actionButtons: ButtonConfig[] = [];

  isActionMenuOpen = false;

  constructor() { }

  ngOnInit(): void {
    this.actionButtons = [
      { name: 'Delete', action: () => this.deleteSelected(), color: 'warn' }
    ];
  }

  onRowClick({ item }: { item: User, event: MouseEvent }) {
    this.userStateService.selectUser(item);
  }

  onRowRightClick({ item }: { item: User, event: MouseEvent }) {
    this.userStateService.selectUser(item);
    this.isActionMenuOpen = true;
  }
  

  closeActionMenu() {
    this.isActionMenuOpen = false;
    this.actionPopupClosed.emit();
  }

  deleteSelected(): void {
    this.userStateService.deleteSelectedUser();
    this.closeActionMenu();
  }
}