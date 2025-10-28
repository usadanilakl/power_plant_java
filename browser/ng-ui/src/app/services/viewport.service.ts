import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ViewportService {
  
  constructor() {
    this.enforceResponsiveView();
  }

  /**
   * Enforces responsive/mobile view by detecting and resetting desktop mode
   */
  private enforceResponsiveView(): void {
    // Check if viewport is set to desktop width
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    
    if (viewportMeta) {
      // Ensure viewport is always set for mobile
      viewportMeta.setAttribute('content', 
        'width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes'
      );
    }

    // Listen for viewport changes
    window.addEventListener('resize', () => {
      this.checkViewportScale();
    });

    // Initial check
    this.checkViewportScale();
  }

  /**
   * Checks if the viewport scale has been changed (desktop mode requested)
   */
  private checkViewportScale(): void {
    const viewportWidth = window.innerWidth;
    const screenWidth = window.screen.width;
    
    // If viewport width is significantly larger than screen width,
    // user might have requested desktop site
    if (viewportWidth > screenWidth * 1.5) {
      console.warn('Desktop mode detected, enforcing mobile view');
      this.resetViewport();
    }
  }

  /**
   * Resets viewport to mobile-friendly settings
   */
  private resetViewport(): void {
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (viewportMeta) {
      viewportMeta.setAttribute('content', 
        'width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes'
      );
      
      // Force a reflow
      window.dispatchEvent(new Event('resize'));
    }
  }

  /**
   * Checks if the app is running in standalone mode (installed PWA)
   */
  isStandalone(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  }

  /**
   * Gets the actual device type
   */
  getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const width = window.innerWidth;
    
    if (width < 768) {
      return 'mobile';
    } else if (width < 1024) {
      return 'tablet';
    } else {
      return 'desktop';
    }
  }
}