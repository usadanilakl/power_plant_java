import { Component, inject, input, signal } from '@angular/core';
import { QrCodeService } from '../qr-code/qr-code.service';

/**
 * Copy / show-QR / share controls for a page.
 *
 * Written as a shared component rather than inline on Orientation because "point someone at this
 * screen" is not specific to orientation — a permit, a field list or a round can want the same
 * three affordances.
 *
 * Each control degrades on its own. Copy falls back to a legacy selection copy where the async
 * clipboard is unavailable (it needs a secure context, so plain-http LAN access has no clipboard),
 * and Share hides itself entirely when the OS has no share sheet rather than presenting a button
 * that does nothing — which on a desktop browser is most of the time.
 */
@Component({
  selector: 'app-share-link',
  standalone: true,
  template: `
    <section class="share">
      <h2 class="share-title">{{ heading() }}</h2>

      <div class="share-actions">
        <button type="button" class="share-btn" (click)="copy()">
          {{ copied() ? '✓ Copied' : '🔗 Copy link' }}
        </button>
        <button type="button" class="share-btn" (click)="toggleQr()" [attr.aria-expanded]="showQr()">
          {{ showQr() ? '▲ Hide QR' : '▦ Show QR' }}
        </button>
        @if (canShare()) {
          <button type="button" class="share-btn" (click)="share()">📤 Share</button>
        }
      </div>

      <!-- Announced rather than only shown, so the confirmation isn't purely visual. -->
      <p class="share-status" role="status" aria-live="polite">{{ status() }}</p>

      @if (showQr()) {
        <div class="share-qr">
          @if (qrDataUrl()) {
            <img [src]="qrDataUrl()" [alt]="'QR code for ' + url()" class="share-qr-img">
          }
          <p class="share-url">{{ url() }}</p>
        </div>
      }
    </section>
  `,
  styles: [`
    .share {
      width: 100%;
      max-width: 520px;
      margin-top: 1.75rem;
      padding-top: 1.25rem;
      border-top: 1px solid var(--border-color);
      text-align: center;
    }

    .share-title {
      margin: 0 0 0.75rem;
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--primary-text);
    }

    .share-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      justify-content: center;
    }

    .share-btn {
      flex: 1 1 auto;
      min-width: 8.5rem;
      padding: 0.7rem 0.9rem;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      background: transparent;
      color: var(--primary-text);
      font-family: inherit;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
    }

    .share-status {
      min-height: 1.1rem;
      margin: 0.5rem 0 0;
      font-size: 0.8rem;
      color: var(--secondary-text, #888);
    }

    .share-qr {
      margin-top: 0.75rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.6rem;
    }

    /* White plate: a QR on a dark theme background will not scan. */
    .share-qr-img {
      width: 220px;
      height: 220px;
      background: #fff;
      padding: 0.5rem;
      border-radius: 8px;
    }

    .share-url {
      margin: 0;
      font-size: 0.75rem;
      color: var(--secondary-text, #888);
      word-break: break-all;
      max-width: 100%;
    }
  `]
})
export class ShareLinkComponent {
  private qrCode = inject(QrCodeService);

  /** Absolute URL to share. */
  url = input.required<string>();
  heading = input('Share this page');
  /** Title offered to the OS share sheet. */
  shareTitle = input('Site Orientation');

  readonly showQr = signal(false);
  readonly qrDataUrl = signal('');
  readonly copied = signal(false);
  readonly status = signal('');

  /** Hidden rather than inert where the OS has no share sheet — desktop browsers, mostly. */
  canShare(): boolean {
    return typeof navigator !== 'undefined' && !!navigator.share;
  }

  async copy(): Promise<void> {
    const ok = await this.writeToClipboard(this.url());
    this.copied.set(ok);
    this.status.set(ok ? 'Link copied to the clipboard.' : 'Could not copy — the link is shown below the QR.');
    if (!ok) this.showQr.set(true);
    setTimeout(() => this.copied.set(false), 2500);
  }

  async toggleQr(): Promise<void> {
    this.showQr.update(v => !v);
    if (this.showQr() && !this.qrDataUrl()) {
      try {
        this.qrDataUrl.set(await this.qrCode.toDataUrl(this.url(), { width: 440 }));
      } catch {
        this.status.set('Could not generate the QR code.');
      }
    }
  }

  /**
   * Share the QR as an image where the platform supports files, so the recipient gets something
   * printable; otherwise share the URL itself.
   */
  async share(): Promise<void> {
    try {
      const file = await this.qrFile();
      if (file && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: this.shareTitle(), text: this.url() });
        return;
      }
      await navigator.share({ title: this.shareTitle(), url: this.url() });
    } catch (err: any) {
      // A user dismissing the share sheet rejects with AbortError — not a failure worth reporting.
      if (err?.name !== 'AbortError') this.status.set('Sharing is unavailable — copy the link instead.');
    }
  }

  private async qrFile(): Promise<File | null> {
    try {
      const dataUrl = this.qrDataUrl() || await this.qrCode.toDataUrl(this.url(), { width: 440 });
      this.qrDataUrl.set(dataUrl);
      const blob = await (await fetch(dataUrl)).blob();
      return new File([blob], 'orientation-qr.png', { type: 'image/png' });
    } catch {
      return null;
    }
  }

  private async writeToClipboard(text: string): Promise<boolean> {
    // The async clipboard needs a secure context; plain-http LAN access has none.
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch { /* fall through to the legacy path */ }
    }
    try {
      const field = document.createElement('textarea');
      field.value = text;
      field.setAttribute('readonly', '');
      field.style.position = 'fixed';
      field.style.opacity = '0';
      document.body.appendChild(field);
      field.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(field);
      return ok;
    } catch {
      return false;
    }
  }
}
