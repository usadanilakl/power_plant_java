const fileTable = {
    selectedFile :{},
    buildFileTable: function(files) {
        // Define the columns we want to display
        const columns = ['id', 'name', 'fileType', 'system', 'relatedSystems', 'fileNumber', 'vendor'];

        // Preprocess the data to handle arrays and ensure all fields are strings
        const processedFiles = files.map(file => ({
            ...file,
            relatedSystems: Array.isArray(file.relatedSystems) 
                ? file.relatedSystems.join(', ') 
                : file.relatedSystems,
            points: file.points ? file.points.join(', ') : ''
        }));

        // Build the table using the tableBuilder
        tableBuilder.buildTable(processedFiles, columns, 'tableContainer');

        // Add event listener for row clicks to open the file
        const table = document.querySelector('#tableContainer table');
        table.addEventListener('click', (event) => {
            const row = event.target.closest('tr.row');
            if (row) {
                const rowIndex = Array.from(row.parentNode.children).filter(child => child.classList.contains('row')).indexOf(row);
                const fileLink = processedFiles[rowIndex].fileLink;
                this.selectedFile = processedFiles[rowIndex];
                if (fileLink) {
                    const imageZoom = new ImageZoomInteractive('../'+fileLink, 'image');
                    const shapes = equipmentService.getShapes(this.selectedFile.points);
                    shapes.forEach(shape => imageZoom.addShape(shape));
                    // imageZoom.addShape({ type: 'rectangle', x: 100, y: 100, width: 50, height: 50, color: 'red' });
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