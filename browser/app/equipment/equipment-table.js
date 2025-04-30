const equipmentTable = {
    selectedEquipment: {},
    buildEquipmentTable: function() {
        const columns = ['tagNumber', 'description', 'location', 'system', 'eqType', 'vendor'];

        tableBuilder.buildTable(equipment, columns, 'tableContainer');

        // Add event listener for custom rowClick event
        document.addEventListener('rowClick', (event) => {
            const clickedEquipment = event.detail;
            this.selectedEquipment= clickedEquipment;
            if (clickedEquipment) {
                const files = fileService.getFilesByEquipmentId(clickedEquipment.id);
                if(files.length > 0) {this.displayImage(files[0], clickedEquipment.id);}

                const carousel = new ImageCarousel('carousel', files, {
                    visibleImages: 3,
                    imageWidth: 200,
                    gap: 10,
                    onImageClick: (file) => {
                        // Custom click handler
                        this.displayImage(file,clickedEquipment.id);
                    },
                    onImageHover: (file, isHovering) => {
                        // Custom hover handler
                    }
                });
            }
        });
    },
    displayImage: function(file, eqId) {
        const imageZoom = new ImageZoomInteractive('../' + file.fileLink, 'image');
        const shapes = equipmentService.getShapes(file.points);
        shapes.forEach(shape =>{
            if(shape.id === eqId){
                shape.isSelected = true;
            }
            imageZoom.addShape(shape);
        });

    }
};