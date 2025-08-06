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
                listItem.innerHTML = `
                    <h3 style="margin: 0 0 5px 0;">${point.index}. ${point.tagNumber}</h3>
                    <p style="margin: 0 0 5px 0;"><strong>Description:</strong> ${point.description}</p>
                    <p style="margin: 0 0 5px 0;"><strong>Normal Position:</strong> ${point.normalPosition}</p>
                    <p style="margin: 0 0 5px 0;"><strong>Isolated Position:</strong> ${point.isolatedPosition}</p>
                    <p style="margin: 0;"><strong>Location:</strong> ${point.specificLocation}</p>
                    <button class="remove-loto-point" data-id="${point.id}">Remove</button>
                `;
                ul.appendChild(listItem);
            });

            listContainer.appendChild(ul);

            // Add event listener for remove buttons
            listContainer.addEventListener('click', (event) => {
                if (event.target.classList.contains('remove-loto-point')) {
                    const lotoPointId = parseInt(event.target.getAttribute('data-id'), 10);
                    this.removeLotoPoint(lotoPointId);
                }
            });
        }
    }
}

// // Usage
const lotoBuildingService = new LotoBuildingService();
const lotoListComponent = new LotoListComponent(lotoBuildingService);

// // To add a new LOTO point
// lotoListComponent.addLotoPoint(newLotoPoint);

// // To remove a LOTO point
// lotoListComponent.removeLotoPoint(lotoPointId);