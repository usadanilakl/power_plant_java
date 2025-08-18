const referenceDataTable = {
    selected: {},
    rowClickHandler: null,

    buildTable: function() {
        const columns = ['tagNumbers', 'fileNumbers', 'description', 'referenceType', 'referenceGroup']//, 'characteristics', 'references'];

        tableBuilder.buildTable(referenceData, columns, 'tableContainer');

        // Remove existing event listener if it exists
        if (this.rowClickHandler) {
            document.removeEventListener('rowClick', this.rowClickHandler);
        }

        // Create new event listener
        this.rowClickHandler = (event) => {
            const clickedItem = event.detail;
            this.selected = clickedItem;
            if (clickedItem) {
                const equipment = clickedItem.tagNumbers ? equipmentService.getEqByTagNumbers(clickedItem.tagNumbers) : null;
                let files = clickedItem.fileNumbers ? fileService.getFilesByNumbersContaining(clickedItem.fileNumbers) : null;
                if (equipment && equipment.length > 0) {
                    const fileIds = [...new Set(equipment.flatMap(eq => eq.files))];
                    const equipmentFiles = fileService.getFilesByIds(fileIds);
                    files = [...new Set([...files, ...equipmentFiles])]; 
                    if (files.length > 0) {
                        this.displayImage(files[0], equipment[0].id);
                    }

                    const carousel = new ImageCarousel('carousel', files, {
                        visibleImages: 3,
                        imageWidth: 200,
                        gap: 10,
                        onImageClick: (file) => {
                            // Custom click handler
                            this.displayImage(file, equipment[0].id);
                        },
                        onImageHover: (file, isHovering) => {
                            // Custom hover handler
                        }
                    });
                }
                referenceDataDisplay.showData([clickedItem]);
            }
        };

        // Add the new event listener
        document.addEventListener('rowClick', this.rowClickHandler);
    },

    displayImage: function(file, eqId) {
        console.log('Displaying image:', file.fileLink);
        const imageZoom = new ImageZoomInteractive('../' + file.fileLink, 'image','jpg',lotoBuildingService,lotoListComponent);
        const shapes = equipmentService.getShapes(file.points);
        shapes.forEach(shape => {
            if (shape.id === eqId) {
                shape.isSelected = true;
            }
            imageZoom.addShape(shape);
        });
    },

    // Add a method to remove the event listener when needed
    removeEventListener: function() {
        if (this.rowClickHandler) {
            document.removeEventListener('rowClick', this.rowClickHandler);
            this.rowClickHandler = null;
        }
    }
};