const tableBuilder = {
    data: [],
    columns: [],
    containerId: '',
    lastClickedRow: null,
    dropdowns: {},

    buildTable: function(data, columns, containerId, buttons) {
        this.originalData = data;
        this.data = [...data];
        this.columns = columns;
        this.containerId = containerId;

        const container = document.getElementById(containerId);
        container.innerHTML = '';

        if(buttons){
            buttons.forEach(b => {
                if(!b.text || !b.func) return;
                const btn = this.createTableControlButton(b.text, b.func);
                container.appendChild(btn);
            });
        }

        // Create table
        const table = document.createElement('table');
        table.className = 'sortable-table';
        
        // Create header
        const thead = document.createElement('thead');
        
        // Create global search row
        const globalSearchRow = document.createElement('tr');
        const globalSearchCell = document.createElement('th');
        globalSearchCell.colSpan = columns.length;
        const globalSearch = document.createElement('input');
        globalSearch.placeholder = 'Global Search';
        globalSearch.className = 'global-search';
        globalSearch.addEventListener('input', () => this.filterData());
        globalSearchCell.appendChild(globalSearch);
        globalSearchRow.appendChild(globalSearchCell);
        thead.appendChild(globalSearchRow);

        // Create column headers and search inputs/dropdowns
        const headerRow = document.createElement('tr');
        const searchRow = document.createElement('tr');
        
        columns.forEach((column, index) => {
            // Create header cell
            const th = document.createElement('th');
            th.textContent = column.label || column.name;
            th.addEventListener('click', () => this.sortTable(index));
            headerRow.appendChild(th);

            // Create search input/dropdown cell
            const searchTh = document.createElement('th');
            let searchElement;
            
            if (column.inputType === 'dropdown') {
                searchElement = this.createSearchableDropdown(column);
            } else {
                searchElement = this.createTextInput(column);
            }
            
            searchTh.appendChild(searchElement);
            searchRow.appendChild(searchTh);
        });

        thead.appendChild(headerRow);
        thead.appendChild(searchRow);
        table.appendChild(thead);

        // Create body
        const tbody = document.createElement('tbody');
        table.appendChild(tbody);

        container.appendChild(table);

        // Initialize infinite scroll
        this.initInfiniteScroll();
        table.addEventListener('click', (event) => this.handleRowClick(event));
    },

    handleRowClick: function(event) {
        const row = event.target.closest('tr.row');
        if (row) {
            this.highlightClickedRow(row);
            const rowIndex = Array.from(row.parentNode.children).filter(child => child.classList.contains('row')).indexOf(row);
            const clickedData = this.data[rowIndex];
            
            // Dispatch a custom event with the clicked row data
            const clickEvent = new CustomEvent('rowClick', { detail: clickedData });
            document.dispatchEvent(clickEvent);
        }
    },

    highlightClickedRow: function(clickedRow) {
        if (this.lastClickedRow) {
            this.lastClickedRow.classList.remove('highlighted-row');
        }
        clickedRow.classList.add('highlighted-row');
        this.lastClickedRow = clickedRow;
    },

    initInfiniteScroll: function(chunkSize = 50) {
        let currentIndex = 0;
        const container = document.getElementById(this.containerId);
        const tbody = container.querySelector('tbody');

        const loadMoreData = () => {
            const fragment = document.createDocumentFragment();
            const endIndex = Math.min(currentIndex + chunkSize, this.data.length);

            for (let i = currentIndex; i < endIndex; i++) {
                const row = document.createElement('tr');
                row.classList.add('row');
                this.columns.forEach(column => {
                    const td = document.createElement('td');
                    td.textContent = this.data[i][column.name] || '';
    
                // If the source object has an 'id' property, set it as the row's ID
                if (this.data[i].id !== undefined) {
                    row.id = this.data[i].id;
                }
                    row.appendChild(td);
                });
                fragment.appendChild(row);
            }

            // for (let i = currentIndex; i < endIndex; i++) {
            //     const row = document.createElement('tr');
            //     row.classList.add('row');
            //     this.columns.forEach(column => {
            //         const td = document.createElement('td');
            //         const cellData = this.data[i][column];
                    
            //         if (typeof cellData === 'object' && cellData !== null) {
            //             // If it's an object, stringify it with pretty formatting
            //             td.textContent = JSON.stringify(cellData, null, 2);
            //             td.style.whiteSpace = 'pre-wrap'; // Preserve formatting
            //         } else {
            //             // For simple items, just set the text content
            //             td.textContent = cellData || '';
            //         }
                    
            //         row.appendChild(td);
            //     });
            //     fragment.appendChild(row);
            // }

            tbody.appendChild(fragment);
            currentIndex = endIndex;

            if (currentIndex >= this.data.length) {
                container.removeEventListener('scroll', scrollHandler);
            }
        };

        const scrollHandler = () => {
            if (container.scrollTop + container.clientHeight >= container.scrollHeight - 100) {
                loadMoreData();
            }
        };

        container.addEventListener('scroll', scrollHandler);

        // Initial load
        loadMoreData();
    },

    createTextInput: function(column) {
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = `Search ${column.name}`;
        input.className = 'column-search';
        input.dataset.column = column.name;
        input.addEventListener('input', () => this.filterData());
        return input;
    },



    createSearchableDropdown: function(column) {
        const dropdown = new SearchableDropdown(column, () => this.filterData());
        this.dropdowns[column.name] = dropdown;
        return dropdown.getElement();
    },

    filterData: function() {
        const container = document.getElementById(this.containerId);
        const globalSearch = container.querySelector('.global-search');
        const columnSearches = Array.from(container.querySelectorAll('.column-search'));
        
        const allInputsEmpty = globalSearch.value === '' && 
            columnSearches.every(input => input.value === '') &&
            Object.values(this.dropdowns).every(dropdown => dropdown.getValue() === '');
    
        if (allInputsEmpty) {
            this.data = [...this.originalData];
        } else {
            this.data = this.originalData.filter(item => {
                const globalMatch = globalSearch.value === '' || 
                    this.columns.some(column => 
                        String(item[column.name]).toLowerCase().includes(globalSearch.value.toLowerCase())
                    );
        
                const columnMatch = this.columns.every(column => {
                    if (column.inputType === 'dropdown') {
                        const dropdown = this.dropdowns[column.name];
                        const value = dropdown ? dropdown.getValue() : '';
                        return value === '' || 
                            String(item[column.name]).toLowerCase().includes(value.toLowerCase());
                    } else {
                        const input = columnSearches.find(input => input.dataset.column === column.name);
                        const value = input ? input.value : '';
                        return value === '' || 
                            String(item[column.name]).toLowerCase().includes(value.toLowerCase());
                    }
                });
        
                return globalMatch && columnMatch;
            });
        }
    
        const tbody = container.querySelector('tbody');
        tbody.innerHTML = '';
    
        this.initInfiniteScroll();
    },

    sortTable: function(columnIndex) {
        const container = document.getElementById(this.containerId);
        const table = container.querySelector('table');
        const th = table.querySelector(`th:nth-child(${columnIndex + 1})`);
        
        const isAscending = th.classList.contains('th-sort-asc');

        this.data.sort((a, b) => {
            const aValue = String(a[this.columns[columnIndex].name]);
            const bValue = String(b[this.columns[columnIndex].name]);

            if (isAscending) {
                return bValue.localeCompare(aValue, undefined, {numeric: true, sensitivity: 'base'});
            } else {
                return aValue.localeCompare(bValue, undefined, {numeric: true, sensitivity: 'base'});
            }
        });

        // Clear existing classes and set new one
        table.querySelectorAll('th').forEach(th => th.classList.remove('th-sort-asc', 'th-sort-desc'));
        th.classList.toggle('th-sort-asc', !isAscending);
        th.classList.toggle('th-sort-desc', isAscending);

        // Clear existing rows and reinitialize infinite scroll
        const tbody = table.querySelector('tbody');
        tbody.innerHTML = '';
        this.initInfiniteScroll();
    },

    createTableControlButton(buttonText, buttonFunction){
        const btn = document.createElement('button');
        btn.textContent = buttonText;
        btn.onclick = buttonFunction;
        return btn;
    }
};