const tableBuilder = {
    data: [],
    columns: [],
    containerId: '',

    buildTable: function(data, columns, containerId) {
        this.data = data;
        this.columns = columns;
        this.containerId = containerId;

        const container = document.getElementById(containerId);
        container.innerHTML = '';

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

        // Create column headers and search inputs
        const headerRow = document.createElement('tr');
        const searchRow = document.createElement('tr');
        
        columns.forEach((column, index) => {
            // Create header cell
            const th = document.createElement('th');
            th.textContent = column;
            th.addEventListener('click', () => this.sortTable(index));
            headerRow.appendChild(th);

            // Create search input cell
            const searchTh = document.createElement('th');
            const columnSearch = document.createElement('input');
            columnSearch.placeholder = `Search ${column}`;
            columnSearch.dataset.column = column;
            columnSearch.className = 'column-search';
            columnSearch.addEventListener('input', () => this.filterData());
            searchTh.appendChild(columnSearch);
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
                    td.textContent = this.data[i][column] || '';
                    row.appendChild(td);
                });
                fragment.appendChild(row);
            }

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

    filterData: function() {
        const container = document.getElementById(this.containerId);
        const globalSearch = container.querySelector('.global-search');
        const columnSearches = Array.from(container.querySelectorAll('.column-search'));
    
        const filteredData = this.data.filter(item => {
            const globalMatch = globalSearch.value === '' || 
                this.columns.some(column => 
                    String(item[column]).toLowerCase().includes(globalSearch.value.toLowerCase())
                );
    
            const columnMatch = columnSearches.every(input => 
                input.value === '' || 
                String(item[input.dataset.column]).toLowerCase().includes(input.value.toLowerCase())
            );
    
            return globalMatch && columnMatch;
        });
    
        // Clear existing rows
        const tbody = container.querySelector('tbody');
        tbody.innerHTML = '';

        // Update data and reinitialize infinite scroll
        this.data = filteredData;
        this.initInfiniteScroll();
    },

    sortTable: function(columnIndex) {
        const container = document.getElementById(this.containerId);
        const table = container.querySelector('table');
        const th = table.querySelector(`th:nth-child(${columnIndex + 1})`);
        
        const isAscending = th.classList.contains('th-sort-asc');

        this.data.sort((a, b) => {
            const aValue = String(a[this.columns[columnIndex]]);
            const bValue = String(b[this.columns[columnIndex]]);

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
    }
};