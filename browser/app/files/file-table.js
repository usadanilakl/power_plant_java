// const fileTable = {
//     selectedFile: {},
//     buildFileTable: function() {
//         const columns = ['name', 'fileNumber', 'fileType', 'system', 'relatedSystems', 'vendor'];

//         tableBuilder.buildTable(files, columns, 'tableContainer');

//         // Add event listener for custom rowClick event
//         document.addEventListener('rowClick', (event) => {
//             const clickedFile = event.detail;
//             this.selectedFile = clickedFile;
//             if (clickedFile.fileLink) {
//                 const imageZoom = new ImageZoomInteractive('../' + clickedFile.fileLink, 'image');
//                 const shapes = equipmentService.getShapes(this.selectedFile.points);
//                 shapes.forEach(shape => imageZoom.addShape(shape));
//             }
//         });
//     }
// };

// fileTable.buildFileTable();


const fileTable = {
    selectedFile: {},
    rowClickHandler: null,

    buildFileTable: function() {
        const columns = ['name', 'fileNumber', 'fileType', 'system', 'relatedSystems', 'vendor'];

        tableBuilder.buildTable(files, columns, 'tableContainer');

        // Remove existing event listener if it exists
        if (this.rowClickHandler) {
            document.removeEventListener('rowClick', this.rowClickHandler);
        }

        // Create new event listener
        this.rowClickHandler = (event) => {
            const clickedFile = event.detail;
            this.selectedFile = clickedFile;
            if (clickedFile && clickedFile.fileLink) {
                const imageZoom = new ImageZoomInteractive('../' + clickedFile.fileLink, 'image');
                const shapes = equipmentService.getShapes(this.selectedFile.points);
                shapes.forEach(shape => imageZoom.addShape(shape));
            }
        };

        // Add the new event listener
        document.addEventListener('rowClick', this.rowClickHandler);
    },

    // Add a method to remove the event listener when needed
    removeEventListener: function() {
        if (this.rowClickHandler) {
            document.removeEventListener('rowClick', this.rowClickHandler);
            this.rowClickHandler = null;
        }
    }
};

// Initialize the table
fileTable.buildFileTable();

// Example of how to remove the event listener when needed:
// fileTable.removeEventListener();