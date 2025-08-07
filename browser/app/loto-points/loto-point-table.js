// const lotoPointTable = {
//     selectedLotoPoints: {},
//     buildTable: function() {
//         const columns = ['tagNumber', 'description', 'specificLocation', 'isolatedPosition', 'normalPosition'];

//         tableBuilder.buildTable(lotoPoints, columns, 'tableContainer');

//         // Add event listener for custom rowClick event
//         document.addEventListener('rowClick', (event) => {
//             const clickedItem= event.detail;
//             this.selectedLotoPoints= clickedItem;
//             if (clickedItem) {
//                 const equipment = lotoPointService.getAssociatedEquipment([clickedItem.id]);
//                 const fileIds = [...new Set(equipment.flatMap(eq => eq.files))];
//                 const files = fileService.getFilesByIds(fileIds);
//                 if(files.length > 0) {this.displayImage(files[0], equipment[0].id);}

//                 const carousel = new ImageCarousel('carousel', files, {
//                     visibleImages: 3,
//                     imageWidth: 200,
//                     gap: 10,
//                     onImageClick: (file) => {
//                         // Custom click handler
//                         this.displayImage(file,equipment[0].id);
//                     },
//                     onImageHover: (file, isHovering) => {
//                         // Custom hover handler
//                     }
//                 });
//             }
//         });
//     },
//     displayImage: function(file, eqId) {
//         const imageZoom = new ImageZoomInteractive('../' + file.fileLink, 'image');
//         const shapes = equipmentService.getShapes(file.points);
//         shapes.forEach(shape =>{
//             if(shape.id === eqId){
//                 shape.isSelected = true;
//             }
//             imageZoom.addShape(shape);
//         });

//     }
// };


const lotoPointTable = {
    selectedLotoPoints: {},
    rowClickHandler: null,

    buildTable: function() {
        const columns = ['tagNumber', 'description', 'specificLocation', 'isolatedPosition', 'normalPosition'];

        tableBuilder.buildTable(lotoPoints, columns, 'tableContainer');

        // Remove existing event listener if it exists
        if (this.rowClickHandler) {
            document.removeEventListener('rowClick', this.rowClickHandler);
        }

        // Create new event listener
        this.rowClickHandler = (event) => {
            const clickedItem = event.detail;
            this.selectedLotoPoints = clickedItem;
            if (clickedItem) {
                const equipment = lotoPointService.getAssociatedEquipment([clickedItem.id]);
                if (equipment && equipment.length > 0) {
                    const fileIds = [...new Set(equipment.flatMap(eq => eq.files))];
                    const files = fileService.getFilesByIds(fileIds);
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
            }
        };

        // Add the new event listener
        document.addEventListener('rowClick', this.rowClickHandler);
    },

    displayImage: function(file, eqId) {
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