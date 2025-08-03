const lotoPointTable = {
    selectedLotoPoints: {},
    buildTable: function() {
        const columns = ['tagNumber', 'description', 'specificLocation', 'isolatedPosition', 'normalPosition'];

        tableBuilder.buildTable(lotoPoints, columns, 'tableContainer');

        // Add event listener for custom rowClick event
        document.addEventListener('rowClick', (event) => {
            const clickedItem= event.detail;
            this.selectedLotoPoints= clickedItem;
            if (clickedItem) {
                const equipment = lotoPointService.getAssociatedEquipment([clickedItem.id]);
                const fileIds = [...new Set(equipment.flatMap(eq => eq.files))];
                const files = fileService.getFilesByIds(fileIds);
                if(files.length > 0) {this.displayImage(files[0], equipment[0].id);}

                const carousel = new ImageCarousel('carousel', files, {
                    visibleImages: 3,
                    imageWidth: 200,
                    gap: 10,
                    onImageClick: (file) => {
                        // Custom click handler
                        this.displayImage(file,equipment[0].id);
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