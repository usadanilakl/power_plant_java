import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { PwaService } from '../../services/pwa.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-install-app-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './install-app-page.component.html',
  styleUrl: './install-app-page.component.css'
})
export class InstallAppPageComponent implements OnInit, OnDestroy {
  private installPrompt: any = null;
  private promptSubscription: Subscription | null = null;
  showInstallButton = false;

  /**
   * iOS has no beforeinstallprompt — Safari never fires it, at any version. Installing there is a
   * manual Share -> Add to Home Screen, so the page has to tell people that instead of showing a
   * button that can never do anything.
   */
  readonly isIos = /iphone|ipad|ipod/i.test(navigator.userAgent)
    // iPadOS 13+ reports itself as a Mac; the touch points give it away.
    || (/macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1);

  /**
   * True once we have waited for beforeinstallprompt and it has not come. Distinguishes "no install
   * available here" from "still deciding", so the page never sits on a dead button.
   */
  showManualInstructions = false;

  constructor(private pwaService: PwaService, private router: Router) {}

  ngOnInit() {
    // Already installed and somehow on this page — there is nothing to install, so get out of the way.
    if (this.pwaService.isStandalone()) {
      this.router.navigateByUrl('/home');
      return;
    }

    this.promptSubscription = this.pwaService.promptEvent$.subscribe(event => {
      if (event) {
        this.installPrompt = event;
        this.showInstallButton = true;
        this.showManualInstructions = false;
      } else {
        this.showInstallButton = false;
      }
    });

    // beforeinstallprompt fires asynchronously and may never fire at all (iOS, already installed,
    // or Chrome's criteria unmet). Give it a moment, then explain rather than showing nothing.
    if (this.isIos) {
      this.showManualInstructions = true;
    } else {
      setTimeout(() => {
        if (!this.showInstallButton) this.showManualInstructions = true;
      }, 1500);
    }
  }

  ngOnDestroy() {
    if (this.promptSubscription) {
      this.promptSubscription.unsubscribe();
    }
  }

  installPwa(): void {
    if (!this.installPrompt) {
      return;
    }
    // Show the install prompt
    this.installPrompt.prompt();
    // Wait for the user to respond to the prompt
    this.installPrompt.userChoice.then((choiceResult: { outcome: string }) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      // The prompt can't be used again, so clear it
      this.installPrompt = null;
      // The service will emit null after installation, hiding the button automatically.
    });
  }

  bypassStandaloneMode(): void {
    this.pwaService.standaloneBypass = true;
    console.log('Standalone mode bypass enabled');
    this.router.navigateByUrl('/');
  }
}