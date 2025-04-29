class ThemeSwitcher {
    constructor() {
        this.themeKey = 'app-theme';
        this.darkThemeClass = 'dark-theme';
        this.initTheme();
    }

    initTheme() {
        const savedTheme = localStorage.getItem(this.themeKey);
        if (savedTheme === 'dark') {
            this.setDarkTheme();
        } else {
            this.setLightTheme();
        }
    }

    toggleTheme() {
        if (document.body.classList.contains(this.darkThemeClass)) {
            this.setLightTheme();
        } else {
            this.setDarkTheme();
        }
    }

    setDarkTheme() {
        document.body.classList.add(this.darkThemeClass);
        localStorage.setItem(this.themeKey, 'dark');
    }

    setLightTheme() {
        document.body.classList.remove(this.darkThemeClass);
        localStorage.setItem(this.themeKey, 'light');
    }
}

// Initialize the theme switcher
const themeSwitcher = new ThemeSwitcher();

document.getElementById('themeToggle').addEventListener('click', () => {
    themeSwitcher.toggleTheme();
});