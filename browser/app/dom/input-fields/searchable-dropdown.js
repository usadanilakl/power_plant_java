
class SearchableDropdown {
    constructor(column, onFilterChange) {
        this.column = column;
        this.onFilterChange = onFilterChange;
        this.container = this.createContainer();
        this.input = this.createInput();
        this.dropdown = this.createDropdown();
        this.setupEventListeners();
    }

    createContainer() {
        const container = document.createElement('div');
        container.className = 'dropdown-container';
        return container;
    }

    createInput() {
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = `Search ${this.column.name}`;
        input.className = 'dropdown-input';
        input.dataset.column = this.column.name;
        return input;
    }

    createDropdown() {
        const dropdown = document.createElement('ul');
        dropdown.className = 'dropdown-list';
        this.column.options.forEach(value => {
            const li = document.createElement('li');
            li.textContent = value;
            li.addEventListener('click', () => this.selectOption(value));
            dropdown.appendChild(li);
        });
        return dropdown;
    }

    setupEventListeners() {
        this.input.addEventListener('focus', () => this.showDropdown());
        this.input.addEventListener('input', () => this.filterOptions());
        document.addEventListener('click', (e) => {
            if (!this.container.contains(e.target) && e.target !== this.dropdown) {
                this.hideDropdown();
            }
        });
    }

    selectOption(value) {
        this.input.value = value;
        this.onFilterChange();
        this.hideDropdown();
    }

    filterOptions() {
        const filter = this.input.value.toLowerCase();
        Array.from(this.dropdown.children).forEach(li => {
            li.style.display = li.textContent.toLowerCase().includes(filter) ? '' : 'none';
        });
        this.showDropdown();
        this.onFilterChange();
    }

    showDropdown() {
        const rect = this.input.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        this.dropdown.style.position = 'fixed';
        this.dropdown.style.left = rect.left + 'px';
        this.dropdown.style.top = (rect.bottom + scrollTop) + 'px';
        this.dropdown.style.width = rect.width + 'px';
        this.dropdown.style.display = 'block';

        this.container.classList.add('open');
        document.body.appendChild(this.dropdown);
    }

    hideDropdown() {
        this.dropdown.style.display = 'none';
        this.container.classList.remove('open');
        if (this.dropdown.parentNode === document.body) {
            document.body.removeChild(this.dropdown);
        }
    }

    getElement() {
        this.container.appendChild(this.input);
        return this.container;
    }

    getValue() {
        return this.input.value;
    }
}