import { Injectable, signal, effect, Renderer2, RendererFactory2 } from '@angular/core';

type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private renderer: Renderer2;
  theme = signal<Theme>('light');

  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
    this.initializeTheme();

    // Effect to apply theme class to the body when the signal changes
    effect(() => {
      if (this.theme() === 'dark') {
        this.renderer.addClass(document.body, 'dark-theme');
      } else {
        this.renderer.removeClass(document.body, 'dark-theme');
      }
      localStorage.setItem('theme', this.theme());
      this.syncStatusBarColor(this.theme());
    });
  }

  /** --header-background per theme; keep in sync with styles.css. */
  private static readonly HEADER_COLOR: Record<Theme, string> = { light: '#3f51b5', dark: '#2c3e50' };

  /**
   * Point the Android status-bar tint at the *in-app* theme rather than the OS one. index.html ships a
   * prefers-color-scheme pair so the pre-boot paint is right; once the user's own choice is known both are
   * set to it, so whichever the media query matches shows the same (correct) colour.
   */
  private syncStatusBarColor(theme: Theme): void {
    const color = ThemeService.HEADER_COLOR[theme];
    document.querySelectorAll('meta[name="theme-color"]')
      .forEach(meta => meta.setAttribute('content', color));
  }

  private initializeTheme() {
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme) {
      this.theme.set(savedTheme);
    } else if (prefersDark) {
      this.theme.set('dark');
    } else {
      this.theme.set('light');
    }
  }

  toggleTheme() {
    this.theme.update(currentTheme => (currentTheme === 'light' ? 'dark' : 'light'));
  }
}