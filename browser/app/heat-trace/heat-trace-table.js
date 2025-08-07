// const heatTraceTable = {
//     selectedHeatTrace: {},
//     buildTable: function() {
//         const columns = ['tagNumber', 'panelLocation', 'breaker'];

//         tableBuilder.buildTable(heatTrace, columns, 'tableContainer');

//         // Add event listener for custom rowClick event
//         document.addEventListener('rowClick', (event) => {
//             const clickedHeatTrace = event.detail;
//             this.selectedHeatTrace = clickedHeatTrace;
//             if (clickedHeatTrace) {
//                 const fileIds = [...clickedHeatTrace.pids, clickedHeatTrace.isometric, clickedHeatTrace.panelSchedule];
//                 const files = fileService.getFilesByIds(fileIds);

//                 const eqIds = clickedHeatTrace.equipmentList;
//                 // const equipment = equipmentService.getEquipment(eqIds);

//                 if(clickedHeatTrace.lotoPointId){
//                     const lotoPoint = lotoPointService.getLotoPoint(clickedHeatTrace.lotoPointId)[0];
//                     if(lotoPoint && lotoPoint.equipmentList && lotoPoint.equipmentList.length > 0 ){
//                         const breakers = equipmentService.getEquipment(lotoPoint.equipmentList);
//                         console.log(breakers);
//                         eqIds.push(...breakers.map(e => e.id));
//                     }

//                 }

//                 this.displayImage(files[files.length - 1], eqIds);

//                 const carousel = new ImageCarousel('carousel', files, {
//                     visibleImages: 3,
//                     imageWidth: 200,
//                     gap: 10,
//                     onImageClick: (file) => {
//                         // Custom click handler
//                         this.displayImage(file, eqIds);
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
// }

const heatTraceTable = {
    selectedHeatTrace: {},
    rowClickHandler: null,

    buildTable: function() {
        const columns = ['tagNumber', 'panelLocation', 'breaker'];

        tableBuilder.buildTable(heatTrace, columns, 'tableContainer');

        // Remove existing event listener if it exists
        if (this.rowClickHandler) {
            document.removeEventListener('rowClick', this.rowClickHandler);
        }

        // Create new event listener
        this.rowClickHandler = (event) => {
            const clickedHeatTrace = event.detail;
            this.selectedHeatTrace = clickedHeatTrace;
            if (clickedHeatTrace && clickedHeatTrace.pids) {
                const fileIds = [...clickedHeatTrace.pids, clickedHeatTrace.isometric, clickedHeatTrace.panelSchedule];
                const files = fileService.getFilesByIds(fileIds);

                const eqIds = clickedHeatTrace.equipmentList || [];

                if (clickedHeatTrace.lotoPointId) {
                    const lotoPoint = lotoPointService.getLotoPoint(clickedHeatTrace.lotoPointId)[0];
                    if (lotoPoint && lotoPoint.equipmentList && lotoPoint.equipmentList.length > 0) {
                        const breakers = equipmentService.getEquipment(lotoPoint.equipmentList);
                        console.log(breakers);
                        eqIds.push(...breakers.map(e => e.id));
                    }
                }

                this.displayImage(files[files.length - 1], eqIds);

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