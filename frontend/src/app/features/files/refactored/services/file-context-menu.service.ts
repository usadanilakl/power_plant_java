import { inject, Injectable } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { environment } from "../../../../../environments/environment";
import { ContextMenuService } from "../../../../shared/menu/context-menu/context-menu.service";
import { ContextMenuAction } from "../../../../shared/menu/context-menu/context-menu.component";
import { FileDto } from "../../../../models/file/file.model";
import { FileClipboardItem } from "../../../../models/file/file-clipboard.model";
import { GlobalMessageService } from "../../../../shared/global-message/global-message.service";
import { CurrentFileService } from "../../../../services/current-file.service";
import { RfFileStateService } from "./rf-file-state.service";
import { RfFileApiService } from "./rf-file-api.service";
import { CloneToUnitDialogComponent } from "../clone-to-unit-dialog/clone-to-unit-dialog.component";
import { SetCounterpartDialogComponent } from "../set-counterpart-dialog/set-counterpart-dialog.component";
import { ImportFromCounterpartDialogComponent } from "../import-from-counterpart-dialog/import-from-counterpart-dialog.component";
import { CloneFileResultDto } from "../../../../models/file/clone.model";
import { SplitViewRegistryService } from "../../../loto-standard/refactored/loto-builder/services/split-view-registry.service";
import { map } from "rxjs";

@Injectable({
    providedIn: "root"
})
export class FileContextMenuService extends ContextMenuService {
  private stateService = inject(RfFileStateService);
  private apiService = inject(RfFileApiService);
  private dialog = inject(MatDialog);
  private messageService = inject(GlobalMessageService);
  private currentFileService = inject(CurrentFileService);
  private splitRegistry = inject(SplitViewRegistryService);

  customMenuActions: ContextMenuAction[] = [
      {
        id:'open',
        label: 'Open in New Tab (PDF)',
        icon: '📂',
        action: (item) => this.handleOpen(item),
      },
      {
        id: 'divider2',
        label: '',
        divider: true,
        action: () => {},
      },
      {
        id: 'download',
        label: 'Download',
        icon: '⬇️',
        action: (item) => this.handleDownload(item),
      },
      {
        id: 'divider3',
        label: '',
        divider: true,
        action: () => {},
      },
      {
        id: 'loto-points',
        label: 'View LOTO Points',
        icon: '🔒',
        action: (item) => this.handleViewLotoPoints(item),
      },
      {
        id: 'clone-to-unit',
        label: 'Clone to Other Unit',
        icon: '👬',
        action: (item) => this.handleCloneToUnit(item),
      },
      {
        id: 'set-counterpart',
        label: 'Set Counterpart File…',
        icon: '🔗',
        action: (item) => this.handleSetCounterpart(item),
      },
      {
        id: 'open-counterpart',
        label: 'Open Counterpart File',
        icon: '↔️',
        action: (item) => this.handleOpenCounterpart(item),
      },
      {
        id: 'open-in-split',
        label: 'Open in Split View',
        icon: '🪟',
        action: (item) => this.handleOpenInSplit(item),
      },
      {
        id: 'regenerate-jpg',
        label: 'Re-generate JPG',
        icon: '🔄',
        action: (item) => this.handleRegenerateJpg(item),
      },
      {
        id: 'import-from-counterpart',
        label: 'Import Points from Counterpart',
        icon: '📥',
        action: (item) => this.handleImportFromCounterpart(item),
      },
      {
        id: 'unlink-counterpart',
        label: 'Unlink Counterpart',
        icon: '🔓',
        action: (item) => this.handleUnlinkCounterpart(item),
      },
  ]

  override contextMenuActions: ContextMenuAction[] = [
    ...this.contextDefaultMenuActions,
    ...this.customMenuActions,
  ]

  override clipboardFormatter(items: FileDto[]): FileClipboardItem[] {
    return items.map(i => new FileClipboardItem(i));
  }

  override handleViewDetails(item: any): void {
    // Fetch full entity from server instead of using incomplete table data
    if (item?.id) {
      this.apiService.getFileById(item.id + '').pipe(
        map(response => FileDto.fromJson(response.responseData))
      ).subscribe({
        next: (fullDto: FileDto) => {
          this.stateService.setSelectedItem(fullDto);
          this.stateService.openForm();
        },
        error: (error: any) => {
          console.error('Failed to fetch file details:', error);
        }
      });
    } else {
      console.warn('Cannot view details: item has no ID', item);
    }
  }

  /**
   * Override clipboard handler to fetch full DTO before adding to clipboard
   * Table data is incomplete, so we need to fetch from server to get all fields
   */
  override handleClipboard(item: any): void {
    console.log('[FileContextMenu] Clipboard requested for item:', item);

    if (!item?.id) {
      console.warn('[FileContextMenu] Cannot add to clipboard: item has no ID', item);
      return;
    }

    // Fetch full DTO from server using API service
    this.apiService.getFileById(item.id + '').pipe(
      map(response => FileDto.fromJson(response.responseData))
    ).subscribe({
      next: (fullDto: FileDto) => {
        console.log('[FileContextMenu] Full DTO fetched:', fullDto);
        // Now add the complete DTO to clipboard
        super.handleClipboard(fullDto);
      },
      error: (error: any) => {
        console.error('[FileContextMenu] Failed to fetch full DTO:', error);
        // Fallback to table data if fetch fails
        super.handleClipboard(item);
      }
    });
  }

  /**
   * Open the file's PDF in a new browser tab. The stored fileLink usually
   * points at the JPG (rendered in-app), but "Open in New Tab" should give
   * the user the canonical PDF. Falls back to the raw fileLink if no PDF
   * variant exists.
   *
   * Absolute URLs (http(s)://...) pass through unchanged — some sync paths
   * store the hub's full URL there. Prefixing baseApiUrl in that case would
   * produce a broken nested URL like {@code /https://hub/...}.
   */
  private handleOpen(item: FileDto): void {
    if (!item?.fileLink) {
      this.messageService.showWarning('No file link available');
      return;
    }
    const pdfLink = this.buildPdfLink(item);
    const fullUrl = /^https?:\/\//i.test(pdfLink)
      ? pdfLink
      : `${environment.baseApiUrl}/${pdfLink}`;
    window.open(fullUrl, '_blank');
  }

  /**
   * Swap /jpg/.../file.jpg → /pdf/.../file.pdf when a PDF variant exists.
   * Returns absolute URLs unchanged so the caller's protocol check stays valid.
   */
  private buildPdfLink(file: FileDto): string {
    const link = file.fileLink ?? '';
    if (/^https?:\/\//i.test(link)) return link;
    const exts = (file.extensions ?? []).map(e => e.toLowerCase());
    if (!exts.includes('pdf')) return link;
    return link
      .replace(/\/(jpg|jpeg|png)\//i, '/pdf/')
      .replace(/\.(jpg|jpeg|png)$/i, '.pdf');
  }

  private handleDownload(item: FileDto): void {
    if (!item?.id) {
      this.messageService.showWarning('Cannot download: no file id');
      return;
    }
    this.apiService.downloadFile(item.id + '').subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = item.name || `file-${item.id}`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error: any) => {
        console.error('Download failed:', error);
        this.messageService.showError('Download failed: ' + (error?.error?.message ?? error?.message ?? 'unknown error'));
      }
    });
  }

  /**
   * Override of the base-class stub. Calls the soft-delete endpoint, removes
   * the row from the local list, and shows a status message. Confirm prompt
   * is intentional — the table also has multi-select bulk actions; per-row
   * Delete is a one-off click that should ask first.
   */
  override handleDelete(item: any): void {
    if (!item?.id) {
      this.messageService.showWarning('Cannot delete: no file id');
      return;
    }
    const label = item.name || `File #${item.id}`;
    if (!window.confirm(`Move "${label}" to trash?`)) return;
    this.apiService.deleteFile(String(item.id)).subscribe({
      next: () => {
        this.stateService.removeFileById(Number(item.id));
        this.messageService.showSuccess(`Moved "${label}" to trash`);
      },
      error: (err: any) => {
        console.error('Delete failed:', err);
        this.messageService.showError('Delete failed: ' + (err?.error?.message ?? err?.message ?? 'unknown error'));
      },
    });
  }

  /**
   * Open the "Set Counterpart File…" picker — ranked suggestions + filter
   * input. After successful link, offers to immediately import points via
   * the import dialog. Available regardless of existing counterpartId
   * (selecting a new one overwrites the existing pointer).
   */
  private handleSetCounterpart(item: FileDto): void {
    if (!item?.id) {
      this.messageService.showWarning('Cannot set counterpart: no file id');
      return;
    }
    const ref = this.dialog.open(SetCounterpartDialogComponent, {
      data: { file: item },
      // Constrain to viewport so the dialog never causes page-level horizontal
      // scroll on small windows. Content is scrollable internally if needed.
      width: '720px',
      maxWidth: '90vw',
      autoFocus: false,
      restoreFocus: false,
    });
    ref.afterClosed().subscribe((result: { linked: boolean } | undefined) => {
      if (result?.linked && item.id) {
        // Refresh BOTH sides so the new counterpartId is visible immediately on
        // both rows (Open Counterpart / Import options light up).
        this.refreshFileInList(item.id);
      }
    });
  }

  /**
   * Open the "Import Points from Counterpart" confirmation. Refuses if no
   * counterpart is linked — tells the user to use 'Set Counterpart File…' first.
   *
   * Re-fetches the source file fresh from server before deciding, because the
   * context-menu's {@code item} reference can be stale: if the user just set
   * the counterpart via "Set Counterpart File…" and immediately right-clicks
   * again, the table row's cached FileDto still has counterpartId=null.
   * Same fix pattern as handleOpenCounterpart.
   */
  private handleImportFromCounterpart(item: FileDto): void {
    if (!item?.id) return;
    this.apiService.getFileById(String(item.id)).pipe(
      map(r => FileDto.fromJson(r.responseData))
    ).subscribe({
      next: (fresh: FileDto) => {
        this.stateService.updateOrAddFile(fresh);
        if (!fresh.counterpartId) {
          this.messageService.showInfo('No counterpart linked. Use "Set Counterpart File…" first.');
          return;
        }
        const ref = this.dialog.open(ImportFromCounterpartDialogComponent, {
          data: { file: fresh },
          width: '640px',
          maxWidth: '90vw',
          autoFocus: false,
          restoreFocus: false,
        });
        ref.afterClosed().subscribe((_result: any) => {
          if (fresh.id) this.refreshFileInList(fresh.id);
        });
      },
      error: (err: any) => {
        console.error('Failed to refresh source file:', err);
        this.messageService.showError('Failed to load file #' + item.id);
      },
    });
  }

  /**
   * Clear the counterpart pointer on both sides (bidirectional unlink).
   * Confirms first since this also detaches the partner row.
   */
  private handleUnlinkCounterpart(item: FileDto): void {
    if (!item?.id) return;
    if (!item.counterpartId) {
      this.messageService.showInfo('Nothing to unlink — no counterpart is set on this file.');
      return;
    }
    if (!window.confirm('Unlink counterpart file? Both sides will lose the pointer.')) return;
    this.apiService.unlinkCounterpart(item.id).subscribe({
      next: () => {
        const counterpartId = item.counterpartId;
        this.messageService.showSuccess('Counterpart unlinked');
        if (item.id) this.refreshFileInList(item.id);
        if (counterpartId) this.refreshFileInList(counterpartId);
      },
      error: (err: any) => {
        console.error('Unlink failed:', err);
        this.messageService.showError('Unlink failed: ' + (err?.error?.message ?? err?.message ?? 'unknown'));
      },
    });
  }

  /**
   * Navigate to the linked counterpart file (other unit's twin).
   *
   * Re-fetches the SOURCE file first instead of trusting {@code item.counterpartId}
   * directly. Without that re-fetch, a user who just set the counterpart via
   * "Set Counterpart File…" and immediately right-clicks again would see a
   * stale FileDto reference (the table row cached the pre-link copy), get
   * the "No counterpart linked" toast, and conclude the link didn't work.
   * Also keeps the list in sync as a side effect.
   */
  private handleOpenCounterpart(item: FileDto): void {
    if (!item?.id) {
      this.messageService.showWarning('Cannot open counterpart: no file id');
      return;
    }
    this.apiService.getFileById(String(item.id)).pipe(
      map(r => FileDto.fromJson(r.responseData))
    ).subscribe({
      next: (fresh: FileDto) => {
        this.stateService.updateOrAddFile(fresh);
        const cpId = fresh.counterpartId;
        if (!cpId) {
          this.messageService.showInfo('No counterpart linked. Use "Set Counterpart File…" or "Clone to Other Unit" to create one.');
          return;
        }
        this.apiService.getFileById(String(cpId)).pipe(
          map(r => FileDto.fromJson(r.responseData))
        ).subscribe({
          next: (cpFile: FileDto) => {
            // Render the counterpart's image/PDF in the viewer (mirrors what a
            // normal click on a file row does), AND open the edit form so the
            // user can act on it immediately. Without setCurrentFile, the
            // viewer keeps showing the previous file while the form switches.
            this.currentFileService.setCurrentFile(cpFile);
            this.stateService.setSelectedItem(cpFile);
            this.stateService.openForm();
          },
          error: (err: any) => {
            console.error('Failed to load counterpart:', err);
            this.messageService.showError('Counterpart file not found (id=' + cpId + ')');
          },
        });
      },
      error: (err: any) => {
        console.error('Failed to refresh source file:', err);
        this.messageService.showError('Failed to load file #' + item.id);
      },
    });
  }

  /**
   * Force-regenerate the JPG for a FileObject. Recovery for the pre-fix
   * multi-page split bug where every split page's JPG was rendered from
   * the source's last page (usually empty). Backend deletes the current
   * JPG, re-runs conversion, refreshes the perceptual hash, and queues
   * the new bytes for sync.
   *
   * <p>Confirms first — it overwrites file bytes on disk. Only offered as
   * meaningful for rows that have a PDF source; still shows for others in
   * case someone wants to force-recompute (backend will report the missing
   * source). Refetches the row afterwards so the table's fileLink
   * cache-buster reflects the new bytes.
   */
  private handleRegenerateJpg(item: FileDto): void {
    if (!item?.id) {
      this.messageService.showWarning('Cannot regenerate: no file id');
      return;
    }
    const label = item.name || `File #${item.id}`;
    if (!window.confirm(`Re-generate the JPG for "${label}"? Current JPG will be replaced.`)) return;
    this.apiService.regenerateJpg(item.id).subscribe({
      next: () => {
        // Browser may still show cached JPG until a hard-refresh — the URL
        // is unchanged, only the bytes on disk are. Tell the user so they
        // don't mistake a cached preview for the action having failed.
        this.messageService.showSuccess(
          `JPG regenerated for "${label}". Hard-refresh (Ctrl+F5) if the preview looks unchanged.`);
        if (item.id) this.refreshFileInList(item.id);
      },
      error: (err: any) => {
        console.error('regenerate-jpg failed:', err);
        this.messageService.showError('Re-generate failed: '
          + (err?.error?.message ?? err?.message ?? 'unknown error'));
      },
    });
  }

  /**
   * Route the file to the loto-builder right pane (split view) via the
   * registry. Quietly no-ops when the registry has no handler — that
   * happens outside the loto-builder context where the split view doesn't
   * exist. Pre-fetches the full DTO since the table row's data is a slim
   * projection and the right pane wants {@code fileLink} for the image.
   */
  private handleOpenInSplit(item: FileDto): void {
    if (!item?.id) return;
    if (!this.splitRegistry.isAvailable()) {
      this.messageService.showInfo('Split view is only available inside the LOTO Builder.');
      return;
    }
    this.apiService.getFileById(String(item.id)).pipe(
      map(r => FileDto.fromJson(r.responseData))
    ).subscribe({
      next: (fresh) => this.splitRegistry.openIfAvailable(fresh),
      error: (err) => {
        console.error('Open in split: failed to fetch file', err);
        this.messageService.showError('Failed to load file for split view');
      },
    });
  }

  /**
   * Open the multi-phase clone-to-unit dialog. The dialog itself handles the
   * full flow: initial confirmation → backend call → existing-clone warning
   * (if found) → result summary → suggestions review + accept.
   *
   * Table-row items are incomplete DTOs but the backend only needs the ID, so
   * we don't pre-fetch the full entity here.
   *
   * On close: when a clone was actually created, refresh BOTH the new file
   * (so it appears in the list immediately) AND the source file (its
   * counterpartId just changed, so the new "Open Counterpart" action lights up).
   */
  private handleCloneToUnit(item: FileDto): void {
    if (!item?.id) {
      console.warn('[FileContextMenu] Cannot clone: item has no ID', item);
      return;
    }
    const ref = this.dialog.open(CloneToUnitDialogComponent, {
      data: { file: item },
      width: '640px',
      maxWidth: '90vw',
      autoFocus: false,
      restoreFocus: false,
    });
    ref.afterClosed().subscribe((result: CloneFileResultDto | undefined) => {
      if (!result || result.status !== 'created') return;
      // Fetch & insert the new clone first so the user sees it immediately;
      // then refresh the source row (counterpartId just got set).
      if (result.newFileId) this.refreshFileInList(result.newFileId);
      if (result.sourceFileId) this.refreshFileInList(result.sourceFileId);
    });
  }

  /** Fetch a single file by id and upsert it into the loaded-files list. */
  private refreshFileInList(id: number): void {
    this.apiService.getFileById(String(id)).pipe(
      map(r => FileDto.fromJson(r.responseData))
    ).subscribe({
      next: (dto) => this.stateService.updateOrAddFile(dto),
      error: (err) => console.warn('[FileContextMenu] refresh failed for id=' + id, err),
    });
  }

  private handleViewLotoPoints(item: FileDto): void {
    console.log('Viewing LOTO points for:', item);
    // Implement logic to show LOTO points associated with this file
    if (item.id) {
      this.apiService.getRelatedLotoPoints(item.id).subscribe({
        next: (response) => {
          console.log('Related LOTO points:', response.responseData);
          // Show in dialog or navigate to LOTO points view
        },
        error: (error: any) => {
          console.error('Failed to fetch LOTO points:', error);
        }
      });
    }
  }
}
