class LotoBuildingService{
    constructor(){
        this.selectedLotoPoints = [];
        this.isBuildingLoto = false;

    }

    
    addLotoPoint(lotoPoint) {
        if (lotoPoint && lotoPoint.id) {
            // Check if the lotoPoint with the same id already exists
            if (!this.selectedLotoPoints.some(point => point.id === lotoPoint.id)) {
                this.selectedLotoPoints.push(lotoPoint);
            }
        } else if (lotoPoint && typeof lotoPoint === 'number' && !isNaN(lotoPoint)) {
            const lp = lotoPointService.getLotoPoint(lotoPoint);
            if (lp && lp.length > 0) {
                lp.forEach(point => {
                    // Check if the point with the same id already exists
                    if (!this.selectedLotoPoints.some(existingPoint => existingPoint.id === point.id)) {
                        this.selectedLotoPoints.push(point);
                    }
                });
            }
        }
    }

    addLotoPoints(lotoPoints) {
        if (Array.isArray(lotoPoints)) {
            lotoPoints.forEach(point => this.addLotoPoint(point));
        }
    }

    removeAllLotoPoints(){
        this.selectedLotoPoints = [];
    }

    
    buildLotoPointList() {
        return this.selectedLotoPoints.map((lotoPoint, index) => ({
            id: lotoPoint.id,
            index: index + 1,
            tagNumber: lotoPoint.tagNumber,
            description: lotoPoint.description,
            normalPosition: lotoPoint.normalPosition,
            isolatedPosition: lotoPoint.isolatedPosition,
            specificLocation: lotoPoint.specificLocation || 'Not specified'
        }));
    }
    
    // Add a method to remove a specific LOTO point
    removeLotoPoint(lotoPointId) {
        this.selectedLotoPoints = this.selectedLotoPoints.filter(point => point.id !== lotoPointId);
    }

    updateLotoPoint(updatedPoint) {
        const index = this.selectedLotoPoints.findIndex(point => point.id === updatedPoint.id);
        if (index !== -1) {
            this.selectedLotoPoints[index] = { ...this.selectedLotoPoints[index], ...updatedPoint };
        }
    }
}


class LotoListComponent {
    constructor(lotoBuildingService) {
        console.log('LotoListComponent initialized');
        this.lotoBuildingService = lotoBuildingService;
        this.lotoPoints = [];
        this.updateList();
    }

    updateList() {
        this.lotoPoints = this.lotoBuildingService.buildLotoPointList();
        this.render();
    }

    addLotoPoint(lotoPoint) {
        if(!lotoPoint) return;
        this.lotoBuildingService.addLotoPoint(lotoPoint);
        this.updateList();
    }

    addLotoPoints(lotoPoints) {
        if(!lotoPoints) return;
        this.lotoBuildingService.addLotoPoints(lotoPoints);
        this.updateList();
    }

    removeLotoPoint(lotoPointId) {
        this.lotoBuildingService.removeLotoPoint(lotoPointId);
        this.updateList();
    }

    render() {
        if(!this.lotoPoints || this.lotoPoints.length === 0) return;
        let windowObject = null;
        // Find the LOTO building window
        let lotoBuildingWindow = document.getElementById('loto-building-window');
        if (!lotoBuildingWindow) {
            windowObject = new FloatingWindow(null, 'Selected LOTO Points', 'loto-building-window');
            lotoBuildingWindow = document.getElementById('loto-building-window');
        }
    
        // Find the content container within the window
        const listContainer = lotoBuildingWindow.querySelector('.floating-window-content');
        if (!listContainer) {
            console.error('Content container not found in LOTO building window');
            return;
        }
    
        // Clear existing list
        listContainer.innerHTML = '';

        // Create a fixed menu
        const fixedMenu = document.createElement('div');
        fixedMenu.style.position = 'sticky';
        fixedMenu.style.top = '0';
        fixedMenu.style.backgroundColor = '#f0f0f0';
        fixedMenu.style.padding = '10px';
        fixedMenu.style.marginBottom = '10px';
        fixedMenu.style.zIndex = '1000';
        fixedMenu.style.borderBottom = '1px solid #ccc';

        // Add buttons to the fixed menu
        // const addButton = this.createButton('Add LOTO Point', () => this.openAddLotoPointDialog());
        // const clearButton = this.createButton('Clear All', () => this.clearAllLotoPoints());
        const exportButton = this.createButton('Submit', () => this.exportLotoPoints());

        // fixedMenu.appendChild(addButton);
        // fixedMenu.appendChild(clearButton);
        fixedMenu.appendChild(exportButton);

        // Add the fixed menu to the list container
        listContainer.appendChild(fixedMenu);
    
        // Render new list
        if (this.lotoPoints.length === 0) {
            listContainer.innerHTML = '<p>No LOTO points selected.</p>';
        } else {
            const ul = document.createElement('ul');
            ul.style.listStyleType = 'none';
            ul.style.padding = '0';

            this.lotoPoints.forEach(point => {
                const listItem = document.createElement('li');
                listItem.style.marginBottom = '15px';
                listItem.style.borderBottom = '1px solid #ccc';
                listItem.style.paddingBottom = '10px';

                const normalPositionOptions = ['OPEN', 'CLOSED', 'On', 'Off'];
                const isolatedPositionOptions = ['OPEN', 'CLOSED', 'On', 'Off'];

                const normalPositionSelect = this.createDropdown(normalPositionOptions, point.normalPosition, 'normal', point.id);
                const isolatedPositionSelect = this.createDropdown(isolatedPositionOptions, point.isolatedPosition, 'isolated', point.id);

                listItem.innerHTML = `
                    <h3 style="margin: 0 0 5px 0;">${point.index}. ${point.tagNumber}</h3>
                    <p style="margin: 0 0 5px 0;"><strong>Description:</strong> ${point.description}</p>
                    <p style="margin: 0 0 5px 0;"><strong>Normal Position:</strong></p>
                    <p style="margin: 0 0 5px 0;"><strong>Isolated Position:</strong></p>
                    <p style="margin: 0;"><strong>Location:</strong> ${point.specificLocation}</p>
                    <button class="remove-loto-point" data-id="${point.id}">Remove</button>
                `;

                const normalPositionP = listItem.querySelector('p:nth-of-type(2)');
                const isolatedPositionP = listItem.querySelector('p:nth-of-type(3)');

                normalPositionP.appendChild(normalPositionSelect);
                isolatedPositionP.appendChild(isolatedPositionSelect);

                ul.appendChild(listItem);
            });

            listContainer.appendChild(ul);

            // Add event listener for remove buttons and dropdowns
            listContainer.addEventListener('click', (event) => {
                if (event.target.classList.contains('remove-loto-point')) {
                    const lotoPointId = parseInt(event.target.getAttribute('data-id'), 10);
                    this.removeLotoPoint(lotoPointId);
                }
            });

            listContainer.addEventListener('change', (event) => {
                if (event.target.classList.contains('position-dropdown')) {
                    const lotoPointId = parseInt(event.target.getAttribute('data-id'), 10);
                    const positionType = event.target.getAttribute('data-type');
                    const newValue = event.target.value;
                    this.updateLotoPointPosition(lotoPointId, positionType, newValue);
                }
            });
            // const ul = document.createElement('ul');
            // ul.style.listStyleType = 'none';
            // ul.style.padding = '0';

            // this.lotoPoints.forEach(point => {
            //     const listItem = document.createElement('li');
            //     listItem.style.marginBottom = '15px';
            //     listItem.style.borderBottom = '1px solid #ccc';
            //     listItem.style.paddingBottom = '10px';
            //     listItem.innerHTML = `
            //         <h3 style="margin: 0 0 5px 0;">${point.index}. ${point.tagNumber}</h3>
            //         <p style="margin: 0 0 5px 0;"><strong>Description:</strong> ${point.description}</p>
            //         <p style="margin: 0 0 5px 0;"><strong>Normal Position:</strong> ${point.normalPosition}</p>
            //         <p style="margin: 0 0 5px 0;"><strong>Isolated Position:</strong> ${point.isolatedPosition}</p>
            //         <p style="margin: 0;"><strong>Location:</strong> ${point.specificLocation}</p>
            //         <button class="remove-loto-point" data-id="${point.id}">Remove</button>
            //     `;
            //     ul.appendChild(listItem);
            // });

            // listContainer.appendChild(ul);

            // // Add event listener for remove buttons
            // listContainer.addEventListener('click', (event) => {
            //     if (event.target.classList.contains('remove-loto-point')) {
            //         const lotoPointId = parseInt(event.target.getAttribute('data-id'), 10);
            //         this.removeLotoPoint(lotoPointId);
            //     }
            // });
        }
    }

    createDropdown(options, currentValue, type, id) {
        const select = document.createElement('select');
        select.classList.add('position-dropdown');
        select.setAttribute('data-type', type);
        select.setAttribute('data-id', id);

        options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.textContent = option;
            if (option.trim().toLowerCase() === currentValue.trim().toLowerCase()) {
                optionElement.selected = true;
            }
            select.appendChild(optionElement);
        });

        return select;
    }

    updateLotoPointPosition(lotoPointId, positionType, newValue) {
        const lotoPoint = this.lotoPoints.find(point => point.id === lotoPointId);
        if (lotoPoint) {
            if (positionType === 'normal') {
                lotoPoint.normalPosition = newValue;
            } else if (positionType === 'isolated') {
                lotoPoint.isolatedPosition = newValue;
            }
            // Update the LOTO point in the service
            this.lotoBuildingService.updateLotoPoint(lotoPoint);
        }
    }

    createButton(text, onClick) {
        const button = document.createElement('button');
        button.textContent = text;
        button.style.marginRight = '10px';
        button.addEventListener('click', onClick);
        return button;
    }

    openAddLotoPointDialog() {
        // Implement the logic to open a dialog for adding a new LOTO point
        console.log('Open add LOTO point dialog');
    }

    clearAllLotoPoints() {
        this.lotoBuildingService.removeAllLotoPoints();
        this.updateList();
    }

    exportLotoPoints() {
        const selectedPoints = this.lotoBuildingService.selectedLotoPoints.map(point => ({
            id: point.id,
            tagNumber: point.tagNumber,
            description: point.description,
            normalPosition: point.normalPosition,
            isolatedPosition: point.isolatedPosition,
            specificLocation: point.specificLocation
        }));

        if (selectedPoints.length === 0) {
            alert('No LOTO points selected. Please select at least one point before submitting.');
            return;
        }

        fetch(properties.serverUrl+'/api-lotos/build-red-tag-loto', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(selectedPoints),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.text();
        })
        .then(data => {
            console.log('Success:', data);
            alert('LOTO points submitted successfully!');
            // Optionally, clear the list after successful submission
            this.clearAllLotoPoints();
        })
        .catch((error) => {
            console.error('Error:', error);
            alert('Failed to submit LOTO points. Please try again.');
        });
    }

}

// // Usage
const lotoBuildingService = new LotoBuildingService();
const lotoListComponent = new LotoListComponent(lotoBuildingService);

// // To add a new LOTO point
// lotoListComponent.addLotoPoint(newLotoPoint);

// // To remove a LOTO point
// lotoListComponent.removeLotoPoint(lotoPointId);