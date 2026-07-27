import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MainLayoutComponent } from '../../../layout/refactored/main-layout.component';
import { RouterMenuComponent } from '../../../shared/menu/router-menu/router-menu.component';
import {
  ChatAuditApiService, ChatAuditConversation, ChatAuditMessage, ChatAuditAck,
} from '../../../services/chat-audit-api.service';

/**
 * Admin-only audit + search over the hub-local Plant Chat mirror. Also hosts CRUD for the
 * conversation list (create / rename / archive) — the only place these are managed on the hub
 * (Electron and PWA chat panels don't expose conversation editing to users).
 *
 * Data is read from H2 (the mirror populated by PlantChatAuditPollingService). Writes flow through
 * the hub's {@code SupabaseAdminClient} — service-role bypasses RLS — and are picked up by the
 * next audit poll (30 s). See {@code project/features/users/communication/plant-chat.md}.
 */
@Component({
  selector: 'app-chat-audit',
  standalone: true,
  imports: [CommonModule, FormsModule, MainLayoutComponent, RouterMenuComponent],
  templateUrl: './chat-audit.component.html',
  styleUrl: './chat-audit.component.css',
})
export class ChatAuditComponent implements OnInit {
  private api = inject(ChatAuditApiService);

  conversations = signal<ChatAuditConversation[]>([]);
  includeArchived = signal(false);

  // Search filters
  filterConversationId = signal<string>('');
  filterSenderUuid = signal<string>('');
  filterFrom = signal<string>('');
  filterTo = signal<string>('');
  filterQ = signal<string>('');
  currentPage = signal(1);
  pageSize = 50;

  messages = signal<ChatAuditMessage[]>([]);
  totalHits = signal(0);
  lastPage = signal(0);
  loading = signal(false);
  searchError = signal<string | null>(null);

  // Modal state
  showCreateModal = signal(false);
  newConvName = '';
  newConvDescription = '';
  newConvEntityType = '';
  newConvEntityId?: number;
  createError = signal<string | null>(null);

  showAckModal = signal(false);
  ackMessage = signal<ChatAuditMessage | null>(null);
  ackList = signal<ChatAuditAck[]>([]);
  ackLoading = signal(false);

  ngOnInit(): void {
    this.reloadConversations();
    this.runSearch();
  }

  activeConversations = computed(() => this.conversations().filter(c => !c.archivedAt));

  reloadConversations(): void {
    this.api.listConversations(this.includeArchived()).subscribe({
      next: r => this.conversations.set(r.responseData ?? []),
      error: err => console.error('[ChatAudit] listConversations failed:', err),
    });
  }

  toggleIncludeArchived(): void {
    this.includeArchived.update(v => !v);
    this.reloadConversations();
  }

  runSearch(page = 1): void {
    this.loading.set(true);
    this.searchError.set(null);
    this.currentPage.set(page);
    this.api.search({
      conversationId: this.filterConversationId() || undefined,
      senderUuid: this.filterSenderUuid() || undefined,
      from: this.filterFrom() ? this.toIsoStart(this.filterFrom()) : undefined,
      to: this.filterTo() ? this.toIsoEnd(this.filterTo()) : undefined,
      q: this.filterQ() || undefined,
      page,
      pageSize: this.pageSize,
    }).subscribe({
      next: r => {
        // Response is SpringPaginatedResponse<T> — responseData holds the Spring Page shape.
        const data = r.responseData;
        this.messages.set(data?.content ?? []);
        this.totalHits.set(data?.totalElements ?? 0);
        this.lastPage.set(data?.totalPages ?? 0);
        this.loading.set(false);
      },
      error: err => {
        this.searchError.set(err?.error?.message ?? 'Search failed');
        this.loading.set(false);
      },
    });
  }

  clearFilters(): void {
    this.filterConversationId.set('');
    this.filterSenderUuid.set('');
    this.filterFrom.set('');
    this.filterTo.set('');
    this.filterQ.set('');
    this.runSearch(1);
  }

  goPrevPage(): void {
    if (this.currentPage() > 1) this.runSearch(this.currentPage() - 1);
  }

  goNextPage(): void {
    if (this.currentPage() < this.lastPage()) this.runSearch(this.currentPage() + 1);
  }

  openCreateModal(): void {
    this.newConvName = '';
    this.newConvDescription = '';
    this.newConvEntityType = '';
    this.newConvEntityId = undefined;
    this.createError.set(null);
    this.showCreateModal.set(true);
  }

  submitCreate(): void {
    if (!this.newConvName.trim()) {
      this.createError.set('Name is required');
      return;
    }
    this.createError.set(null);
    this.api.createConversation(
      this.newConvName.trim(),
      this.newConvDescription.trim() || undefined,
      false,
      this.newConvEntityType.trim() || undefined,
      this.newConvEntityId,
    ).subscribe({
      next: () => {
        this.showCreateModal.set(false);
        // Backend synchronously refreshed the audit mirror before returning, so this reload
        // sees the just-created conversation.
        this.reloadConversations();
      },
      error: err => this.createError.set(err?.error?.message ?? 'Create failed'),
    });
  }

  archive(conv: ChatAuditConversation): void {
    if (!confirm(`Archive "${conv.name}"? Members will no longer see it in their chat list.`)) return;
    this.api.archiveConversation(conv.supabaseId).subscribe({
      next: () => this.reloadConversations(),
      error: err => alert('Archive failed: ' + (err?.error?.message ?? err.message)),
    });
  }

  unarchive(conv: ChatAuditConversation): void {
    this.api.unarchiveConversation(conv.supabaseId).subscribe({
      next: () => this.reloadConversations(),
      error: err => alert('Unarchive failed: ' + (err?.error?.message ?? err.message)),
    });
  }

  viewAcks(msg: ChatAuditMessage): void {
    this.ackMessage.set(msg);
    this.showAckModal.set(true);
    this.ackList.set([]);
    this.ackLoading.set(true);
    this.api.acks(msg.supabaseId).subscribe({
      next: r => {
        this.ackList.set(r.responseData ?? []);
        this.ackLoading.set(false);
      },
      error: () => {
        this.ackLoading.set(false);
      },
    });
  }

  closeAckModal(): void {
    this.showAckModal.set(false);
    this.ackMessage.set(null);
  }

  conversationName(supabaseId: string): string {
    const c = this.conversations().find(x => x.supabaseId === supabaseId);
    return c?.name ?? supabaseId.substring(0, 8);
  }

  private toIsoStart(dateOnly: string): string {
    return `${dateOnly}T00:00:00`;
  }
  private toIsoEnd(dateOnly: string): string {
    return `${dateOnly}T23:59:59`;
  }
}
