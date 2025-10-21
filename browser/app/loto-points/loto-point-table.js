
const lotoPointTable = {
    selectedLotoPoints: [],
    selectedLotoPoint: {},
    rowClickHandler: null,

    buildTable: function() {
        const columns = [
            { name: 'tagNumber', label: 'Tag Number', inputType: 'text' },
            { name: 'description', label: 'Description', inputType: 'text' },
            { name: 'specificLocation', label: 'Specific Location', inputType: 'text' },
            { name: 'isolatedPosition', label: 'Isolated Position', inputType: 'text' },
            { name: 'normalPosition', label: 'Normal Position', inputType: 'text' }
        ]

        tableBuilder.buildTable(lotoPoints, columns, 'tableContainer');

        // Remove existing event listener if it exists
        if (this.rowClickHandler) {
            document.removeEventListener('rowClick', this.rowClickHandler);
        }

        // Create new event listener
        this.rowClickHandler = (event) => {
            const clickedItem = event.detail.data;
            const mouseButton = event.detail.mouseButton;
            const keyInfo = event.detail.keyboard;

            // console.log('item: ', clickedItem);
            // console.log('button: ', clickedButton);
            // console.log('key: ', keyInfo);
            if(mouseButton===0 && keyInfo.ctrlKey){
                this.selectedLotoPoints.push(clickedItem);
            }else if(mouseButton===0){
                this.selectedLotoPoints = [];
                this.selectedLotoPoint = clickedItem;
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
            }else if(mouseButton===2){
                this.printSelectedShapes([clickedItem])
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
    },    
    
    printSelectedShapes(shapes) {
        const itemsToPrint = shapes.map(sh => ({
            tagNumber: sh.tagNumber,
            description: sh.description
        }));

        console.log(`Sending items to print: ${JSON.stringify(itemsToPrint)}`);

        fetch(properties.serverUrl + '/print/list', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(itemsToPrint)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.status === 'success') {
                // Open the redirectUrl in a new tab
                window.open(properties.serverUrl + data.redirectUrl, '_blank');
            } else {
                throw new Error('Server returned an error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
    }
};