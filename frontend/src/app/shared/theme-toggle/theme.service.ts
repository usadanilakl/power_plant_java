import { Injectable, signal, effect, Renderer2, RendererFactory2, inject } from '@angular/core';

type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private renderer: Renderer2;
  theme = signal<Theme>('light');

  rendererFactory = inject (RendererFactory2);

  constructor() {
    this.renderer = this.rendererFactory.createRenderer(null, null);
    this.initializeTheme();

    // Effect to apply theme class to the body when the signal changes
    effect(() => {
      if (this.theme() === 'dark') {
        this.renderer.addClass(document.body, 'dark-theme');
      } else {
        this.renderer.removeClass(document.body, 'dark-theme');
      }
      localStorage.setItem('theme', this.theme());
    });
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