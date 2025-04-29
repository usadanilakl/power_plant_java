const fileTable = {
    selectedFile :{},
    buildFileTable: function(files) {
        // Define the columns we want to display
        const columns = [ 'name', 'fileNumber', 'fileType', 'system', 'relatedSystems', 'vendor'];

        // Build the table using the tableBuilder
        tableBuilder.buildTable(files, columns, 'tableContainer');

        // Add event listener for row clicks to open the file
        const table = document.querySelector('#tableContainer table');
        table.addEventListener('click', (event) => {
            const row = event.target.closest('tr.row');
            if (row) {
                const rowIndex = Array.from(row.parentNode.children).filter(child => child.classList.contains('row')).indexOf(row);
                const fileLink = files[rowIndex].fileLink;
                this.selectedFile = files[rowIndex];
                if (fileLink) {
                    const imageZoom = new ImageZoomInteractive('../'+fileLink, 'image');
                    const shapes = equipmentService.getShapes(this.selectedFile.points);
                    shapes.forEach(shape => imageZoom.addShape(shape));
                }
            }
        });

        // Style the table
        // this.styleFileTable();
    },

    styleFileTable: function() {
        const style = document.createElement('style');
        style.textContent = `
            #tableContainer table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
            }
            #tableContainer th, #tableContainer td {
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
            }
            #tableContainer th {
                background-color: #f2f2f2;
                cursor: pointer;
            }
            #tableContainer tr:nth-child(even) {
                background-color: #f9f9f9;
            }
            #tableContainer tr:hover {
                background-color: #f5f5f5;
                cursor: pointer;
            }
            #tableContainer .table-search {
                margin-bottom: 20px;
            }
            #tableContainer .table-search input {
                margin-right: 10px;
                padding: 5px;
            }
            #tableContainer .th-sort-asc::after {
                content: " ▲";
            }
            #tableContainer .th-sort-desc::after {
                content: " ▼";
            }
        `;
        document.head.appendChild(style);
    }
};

fileTable.buildFileTable(files);