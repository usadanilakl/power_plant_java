// const equipmentTable = {
//     selectedEquipment: {},
//     buildEquipmentTable: function() {
//         const columns = ['tagNumber', 'description', 'location', 'system', 'eqType', 'vendor'];

//         tableBuilder.buildTable(equipment, columns, 'tableContainer');

//         // Add event listener for custom rowClick event
//         document.addEventListener('rowClick', (event) => {
//             const clickedEquipment = event.detail;
//             this.selectedEquipment= clickedEquipment;
//             if (clickedEquipment) {
//                 const eqIds = [...new Set([...clickedEquipment.relatedEquipment, clickedEquipment.id])];
//                 const files = fileService.getFilesByEquipmentIds(eqIds);
//                 const mainFile = fileService.getFileById([clickedEquipment.mainFile]);

//                 if(mainFile) {this.displayImage(mainFile, [clickedEquipment.id]);}

//                 const carousel = new ImageCarousel('carousel', files, {
//                     visibleImages: 3,
//                     imageWidth: 200,
//                     gap: 10,
//                     onImageClick: (file) => {
//                         // Custom click handler
//                         this.displayImage(file,eqIds);
//                     },
//                     onImageHover: (file, isHovering) => {
//                         // Custom hover handler
//                     }
//                 });
//             }
//         });
//     },
//     displayImage: function(file, eqIds) {
//         const imageZoom = new ImageZoomInteractive('../' + file.fileLink, 'image');
//         const shapes = equipmentService.getShapes(file.points);
//         shapes.forEach(shape =>{
//             if(eqIds && eqIds.includes(shape.id)){
//                 shape.isSelected = true;
//             }
//             imageZoom.addShape(shape);
//         });

//     }
// };

const equipmentTable = {
    selectedEquipment: {},
    rowClickHandler: null,

    buildEquipmentTable: function() {
        const columns = ['tagNumber', 'description', 'location', 'system', 'eqType', 'vendor'];

        tableBuilder.buildTable(equipment, columns, 'tableContainer');

        // Remove existing event listener if it exists
        if (this.rowClickHandler) {
            document.removeEventListener('rowClick', this.rowClickHandler);
        }

        // Create new event listener
        this.rowClickHandler = (event) => {
            const clickedEquipment = event.detail;
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
        const imageZoom = new ImageZoomInteractive('../' + file.fileLink, 'image');
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