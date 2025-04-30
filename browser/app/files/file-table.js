const fileTable = {
    selectedFile: {},
    buildFileTable: function() {
        const columns = ['name', 'fileNumber', 'fileType', 'system', 'relatedSystems', 'vendor'];

        tableBuilder.buildTable(files, columns, 'tableContainer');

        // Add event listener for custom rowClick event
        document.addEventListener('rowClick', (event) => {
            const clickedFile = event.detail;
            this.selectedFile = clickedFile;
            if (clickedFile.fileLink) {
                const imageZoom = new ImageZoomInteractive('../' + clickedFile.fileLink, 'image');
                const shapes = equipmentService.getShapes(this.selectedFile.points);
                shapes.forEach(shape => imageZoom.addShape(shape));
            }
        });
    }
};

fileTable.buildFileTable();