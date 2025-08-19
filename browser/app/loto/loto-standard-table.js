const lotoStandardTable = {
    selected: {},
    rowClickHandler: null,

    buildTable: async function() {
        
        const columns = [
            { name: 'name', inputType: 'text' },
            { name: 'description', inputType: 'text' }
        ];

        const standards = await lotoStandardService.getAllLotoStandards();

        tableBuilder.buildTable(standards, columns, 'tableContainer');

        // Remove existing event listener if it exists
        if (this.rowClickHandler) {
            document.removeEventListener('rowClick', this.rowClickHandler);
        }

        // Create new event listener
        this.rowClickHandler = (event) => {
            const standard = event.detail;
            this.selected = standard;
            if (standard && standard.lotoPoints) {
                const lotoPoints = lotoPointService.getLotoPoints(standard.lotoPoints);
                const equipmentIds = lotoPoints.flatMap(lp=>lp.equipmentList);
                const equipmentList = equipmentService.getEquipment(equipmentIds);
                const fileIds = equipmentList.flatMap(eq=>eq.mainFile);
                const files = fileService.getFilesByIds(fileIds);

                this.displayImage(files[0], equipmentIds);

                const carousel = new ImageCarousel('carousel', files, {
                    visibleImages: 3,
                    imageWidth: 200,
                    gap: 10,
                    onImageClick: (file) => {
                        // Custom click handler
                        this.displayImage(file, equipmentIds);
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