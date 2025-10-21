const equipmentTable = {
    selectedEquipment: {},
    rowClickHandler: null,

    buildEquipmentTable: function() {
        // const columns = ['tagNumber', 'description', 'location', 'system', 'eqType', 'vendor'];
        const eqTypes = equipmentService.getUniqueEquipmentTypes();
        const vendors = equipmentService.getUniqueVendors();
        const locations = equipmentService.getUniqueLocations();
        const columns = [
            { name: 'tagNumber', inputType: 'text' },
            { name: 'description', inputType: 'text' },
            { name: 'location', inputType: 'dropdown', options: locations },
            { name: 'system', inputType: 'text' },
            { name: 'eqType', inputType: 'dropdown', options: eqTypes },
            { name: 'vendor', inputType: 'dropdown', options: vendors },
            { name: 'fileName', inputType: 'text' },
            { name: 'fileNumber', inputType: 'text' },
        ];

        tableBuilder.buildTable(equipment, columns, 'tableContainer');

        // Remove existing event listener if it exists
        if (this.rowClickHandler) {
            document.removeEventListener('rowClick', this.rowClickHandler);
        }

        // Create new event listener
        this.rowClickHandler = (event) => {
            const clickedEquipment = event.detail.data;
            this.selectedEquipment = clickedEquipment;
            if (clickedEquipment && clickedEquipment.relatedEquipment) {
                const eqIds = [...new Set([...clickedEquipment.relatedEquipment, clickedEquipment.id])];
                const files = fileService.getFilesByEquipmentIds(eqIds);
                const mainFile = fileService.getFileById([clickedEquipment.mainFile]);

                if (mainFile) {
                    this.displayImage(mainFile, [clickedEquipment.id]);
                }

                const carousel = new ImageCarousel('carousel', files, {
                    visibleImages: 3,
                    imageWidth: 200,
                    gap: 10,
                    onImageClick: (file) => {
                        // Custom click handler
                        this.displayImage(file, eqIds);
                    },
                    onImageHover: (file, isHovering) => {
                        // Custom hover handler
                    }
                });
            }
        };

        // Add the new event listener
        document.addEventListener('rowClick', this.rowClickHandler);
    },

    displayImage: function(file, eqIds) {
        const imageZoom = new ImageZoomInteractive('../' + file.fileLink, 'image','jpg',lotoBuildingService,lotoListComponent);
        const shapes = equipmentService.getShapes(file.points);
        shapes.forEach(shape => {
            if (eqIds && eqIds.includes(shape.id)) {
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