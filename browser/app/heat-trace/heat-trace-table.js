const heatTraceTable = {
    selectedHeatTrace: {},
    buildTable: function() {
        const columns = ['tagNumber', 'panelLocation', 'breaker'];

        tableBuilder.buildTable(heatTrace, columns, 'tableContainer');

        // Add event listener for custom rowClick event
        document.addEventListener('rowClick', (event) => {
            const clickedHeatTrace = event.detail;
            this.selectedHeatTrace = clickedHeatTrace;
            if (clickedHeatTrace) {
                const fileIds = [...clickedHeatTrace.pids, clickedHeatTrace.isometric, clickedHeatTrace.panelSchedule];
                const files = fileService.getFilesByIds(fileIds);

                const eqIds = clickedHeatTrace.equipmentList;
                // const equipment = equipmentService.getEquipment(eqIds);

                if(clickedHeatTrace.lotoPointId){
                    const lotoPoint = lotoPointService.getLotoPoint(clickedHeatTrace.lotoPointId);
                    if(lotoPoint && lotoPoint.equipmentList && lotoPoint.equipmentList.length > 0  && lotoPoint.equipmentList[0]!= null  && lotoPoint.equipmentList[0]!= 0 ){
                        const breaker = equipmentService.getEquipment(lotoPoint.equipmentList);
                        eqIds.push(breaker);
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
        });
    },
    displayImage: function(file, eqIds) {
        const imageZoom = new ImageZoomInteractive('../' + file.fileLink, 'image');
        const shapes = equipmentService.getShapes(file.points);
        shapes.forEach(shape =>{
            if(eqIds && eqIds.includes(shape.id)){
                shape.isSelected = true;
            }
            imageZoom.addShape(shape);
        });

    }
}