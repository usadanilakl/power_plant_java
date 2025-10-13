import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { PwaService } from '../../services/pwa.service';

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

  constructor(private pwaService: PwaService) {}

  ngOnInit() {
    this.promptSubscription = this.pwaService.promptEvent$.subscribe(event => {
      if (event) {
        this.installPrompt = event;
        this.showInstallButton = true;
      } else {
        this.showInstallButton = false;
      }
    });
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
}