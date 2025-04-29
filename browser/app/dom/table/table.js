const tableBuilder = {
    buildTable: function(data, columns, containerId) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';

        // Create search inputs
        const searchDiv = document.createElement('div');
        searchDiv.className = 'table-search';
        const globalSearch = document.createElement('input');
        globalSearch.placeholder = 'Global Search';
        globalSearch.addEventListener('input', () => this.filterData(data, columns, containerId));
        searchDiv.appendChild(globalSearch);

        columns.forEach(column => {
            const columnSearch = document.createElement('input');
            columnSearch.placeholder = `Search ${column}`;
            columnSearch.dataset.column = column;
            columnSearch.addEventListener('input', () => this.filterData(data, columns, containerId));
            searchDiv.appendChild(columnSearch);
        });

        container.appendChild(searchDiv);

        // Create table
        const table = document.createElement('table');
        table.className = 'sortable-table';
        
        // Create header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        columns.forEach(column => {
            const th = document.createElement('th');
            th.textContent = column;
            th.addEventListener('click', () => this.sortTable(table, columns.indexOf(column)));
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        // Create body
        const tbody = document.createElement('tbody');
        this.populateTable(tbody, data, columns);
        table.appendChild(tbody);

        container.appendChild(table);
    },

    populateTable: function(tbody, data, columns) {
        tbody.innerHTML = '';
        data.forEach(item => {
            const row = document.createElement('tr');
            columns.forEach(column => {
                const td = document.createElement('td');
                td.textContent = item[column] || '';
                row.appendChild(td);
            });
            tbody.appendChild(row);
        });
    },

    filterData: function(data, columns, containerId) {
        const container = document.getElementById(containerId);
        const globalSearch = container.querySelector('.table-search input:first-child');
        const columnSearches = Array.from(container.querySelectorAll('.table-search input:not(:first-child)'));

        const filteredData = data.filter(item => {
            const globalMatch = globalSearch.value === '' || 
                columns.some(column => 
                    String(item[column]).toLowerCase().includes(globalSearch.value.toLowerCase())
                );

            const columnMatch = columnSearches.every(input => 
                input.value === '' || 
                String(item[input.dataset.column]).toLowerCase().includes(input.value.toLowerCase())
            );

            return globalMatch && columnMatch;
        });

        this.populateTable(container.querySelector('tbody'), filteredData, columns);
    },

    sortTable: function(table, columnIndex) {
        const tbody = table.querySelector('tbody');
        const rows = Array.from(tbody.querySelectorAll('tr'));
        const th = table.querySelector(`th:nth-child(${columnIndex + 1})`);
        
        const isAscending = th.classList.contains('th-sort-asc');

        rows.sort((a, b) => {
            const aValue = a.querySelector(`td:nth-child(${columnIndex + 1})`).textContent;
            const bValue = b.querySelector(`td:nth-child(${columnIndex + 1})`).textContent;

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

        // Re-append sorted rows
        tbody.innerHTML = '';
        rows.forEach(row => tbody.appendChild(row));
    }
};