// const extension = 'jpg';

class ImageZoomInteractive {
    constructor(imageUrl, containerId, extension = 'jpg') {
        this.imageUrl = imageUrl;
        this.container = document.getElementById(containerId);
        this.scale = 1;
        this.panning = false;
        this.isDragging = false;
        this.pointX = 0;
        this.pointY = 0;
        this.start = { x: 0, y: 0 };
        this.shapes = [];
        this.selectedShapes = [];
        this.extension = extension;
        
        this.moveThreshold = 5; // pixels
        this.clickTimeout = 200; // milliseconds
        this.mouseDownTime = 0;
        this.mouseDownPos = { x: 0, y: 0 };
        this.potentialClickedShape = null;

        this.isBuildingLoto = false;
        this.lotoBuildingService = null;
        this.lotoListComponent = null;

        this.init();
    }

    init() {
        this.container.innerHTML = '';
        this.container.style.position = 'relative'; // Ensure positioning context
        this.createImageMenu();
        if(this.extension === 'pdf') {
        
            this.iframe = document.createElement('iframe');
            this.iframe.style.width = '100%';
            this.iframe.style.height = '100%';
            this.iframe.style.border = 'none';
            const url = this.imageUrl.replace(/jpg/g, 'pdf').replace('file//', '');
            this.iframe.src = url;

            this.container.appendChild(this.iframe);
        

        }else{
            this.createElements();
            this.addEventListeners();
            this.loadImage();
        }
    }

    createElements() {
        this.zoomOuter = document.createElement('div');
        this.zoomOuter.className = 'zoom-outer';
        this.zoomOuter.style.overflow = 'hidden';
        this.zoomOuter.style.position = 'relative';
        this.zoomOuter.style.width = '100%';
        this.zoomOuter.style.height = '100%';
    
        this.zoomElement = document.createElement('div');
        this.zoomElement.className = 'zoom-element';
        this.zoomElement.style.position = 'absolute';
        this.zoomElement.style.top = '0';
        this.zoomElement.style.left = '0';
    
        this.img = document.createElement('img');
        this.img.style.display = 'block';
        this.img.style.width = '100%';
        this.img.style.height = '100%';
        this.img.style.objectFit = 'contain';
    
        this.canvas = document.createElement('canvas');
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.pointerEvents = 'none';
    
        this.zoomElement.appendChild(this.img);
        this.zoomElement.appendChild(this.canvas);
        this.zoomOuter.appendChild(this.zoomElement);
        this.container.appendChild(this.zoomOuter);
    }

    setInitialSize() {
        const containerRect = this.container.getBoundingClientRect();
        const imgAspectRatio = this.img.naturalWidth / this.img.naturalHeight;
        const containerAspectRatio = containerRect.width / containerRect.height;
    
        let width, height;
        if (imgAspectRatio > containerAspectRatio) {
            width = containerRect.width;
            height = containerRect.width / imgAspectRatio;
        } else {
            width = containerRect.height * imgAspectRatio;
            height = containerRect.height;
        }
    
        this.zoomElement.style.width = `${width}px`;
        this.zoomElement.style.height = `${height}px`;
    
        // Center the zoomElement
        const left = (containerRect.width - width) / 2;
        const top = (containerRect.height - height) / 2;
        this.zoomElement.style.left = `${left}px`;
        this.zoomElement.style.top = `${top}px`;
    
        // Store initial position and size
        this.initialLeft = left;
        this.initialTop = top;
        this.initialWidth = width;
        this.initialHeight = height;
    
        // Set canvas size to match the image's natural dimensions
        this.canvas.width = this.img.naturalWidth;
        this.canvas.height = this.img.naturalHeight;
    
        // Set canvas style to match the displayed image size
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
    
        this.scale = 1;
        this.pointX = 0;
        this.pointY = 0;
    }

    loadImage() {
        this.img.onload = () => {
            this.setInitialSize();
            const shps = [... this.shapes];
            this.shapes = shps.map(sh => this.scaleShapeToOriginalPictureSize(sh));
            this.drawShapes();
        };
        this.img.src = this.imageUrl.replace(/pdf/g, 'jpg').replace('file//', '');
    }

    calculateCurrentScale() {
        const currentWidth = this.zoomElement.getBoundingClientRect().width;
        return  currentWidth / this.img.naturalWidth;
    }

    addEventListeners() {
        this.zoomOuter.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.zoomOuter.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.zoomOuter.addEventListener('mouseup', this.onMouseUp.bind(this));
        this.zoomOuter.addEventListener('mouseleave', this.onMouseLeave.bind(this));
        this.zoomOuter.addEventListener('wheel', this.onWheel.bind(this));
        this.zoomOuter.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    onMouseDown(e) {
        if (e.button === 0) { // Left click
            e.preventDefault();
            const rect = this.zoomOuter.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;
            
            this.mouseDownTime = Date.now();
            this.mouseDownPos = { x: clickX, y: clickY };
            this.potentialClickedShape = this.clickedShape(clickX, clickY);
            
            // Start panning setup
            this.isDragging = true;
            this.start = { x: e.clientX - this.pointX, y: e.clientY - this.pointY };
            this.setCursor('grabbing');
        }
    }

    onMouseMove(e) {
        const rect = this.zoomOuter.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
    
        if (this.isDragging) {
            const dx = mouseX - this.mouseDownPos.x;
            const dy = mouseY - this.mouseDownPos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
    
            if (distance > this.moveThreshold) {
                // We've moved beyond the threshold, so this is definitely a drag
                this.potentialClickedShape = null;
            }
    
            e.preventDefault();
            this.pointX = e.clientX - this.start.x;
            this.pointY = e.clientY - this.start.y;
            this.setTransform();
        } else {
            // Check if mouse is over a shape
            const hoveredShape = this.clickedShape(mouseX, mouseY);
            if (hoveredShape) {
                this.setCursor('pointer');
                this.handleHoverShape(hoveredShape);
            } else {
                this.setCursor('grab');
                this.handleHoverShape(null);
            }
        }
    }

    onMouseUp(e) {
        if (this.isDragging) {
            e.preventDefault();
            this.isDragging = false;
            this.setCursor('grab');
    
            const clickDuration = Date.now() - this.mouseDownTime;
            const rect = this.zoomOuter.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            const dx = mouseX - this.mouseDownPos.x;
            const dy = mouseY - this.mouseDownPos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
    
            if (clickDuration < this.clickTimeout && distance <= this.moveThreshold && this.potentialClickedShape) {
                // This was a click on a shape
                this.handleShapeClick(this.potentialClickedShape);
            }
        }
        this.potentialClickedShape = null;
    }

    onMouseLeave(e) {
        if (this.isDragging) {
            this.isDragging = false;
            this.setCursor('grab');
        }
    }

    setCursor(cursorType) {
        this.zoomOuter.style.cursor = cursorType;
    }

    onWheel(e) {
        e.preventDefault();
        const rect = this.zoomOuter.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
    
        const wheelDelta = e.deltaY;
        const zoomFactor = wheelDelta > 0 ? 0.9 : 1.1; // Zoom out (0.9) or in (1.1)
    
        const newScale = this.scale * zoomFactor;
    
        // Limit the scale
        const limitedNewScale = Math.min(Math.max(0.1, newScale), 10);
    
        // Calculate the position of the mouse relative to the image
        const imageX = (mouseX - this.initialLeft - this.pointX) / this.scale;
        const imageY = (mouseY - this.initialTop - this.pointY) / this.scale;
    
        // Calculate new pointX and pointY
        const newPointX = mouseX - this.initialLeft - imageX * limitedNewScale;
        const newPointY = mouseY - this.initialTop - imageY * limitedNewScale;
    
        // Update the position and scale
        this.pointX = newPointX;
        this.pointY = newPointY;
        this.scale = limitedNewScale;
    
        this.setTransform();
    }

    setTransform() {
        const transform = `translate(${this.pointX}px, ${this.pointY}px) scale(${this.scale})`;
        this.zoomElement.style.transform = transform;
        
        // The canvas size remains constant, matching the image's natural dimensions
        // We don't need to update the canvas size here

        this.drawShapes();
    }

    toggleExtension() {
        this.extension = this.extension === 'jpg'? 'pdf' : 'jpg';
        this.init();
    }

    createImageMenu() {
        const menuContainer = document.createElement('div');
        menuContainer.className = 'image-menu';
        menuContainer.style.position = 'absolute';
        menuContainer.style.bottom = '10px';
        menuContainer.style.left = '50%';
        menuContainer.style.transform = 'translateX(-50%)';
        menuContainer.style.zIndex = '1000'; // Ensure it's above other elements
    
        const toggleButton = document.createElement('button');
        toggleButton.textContent = 'Toggle PDF/JPG';
        toggleButton.onclick = () => this.toggleExtension();
    
        const placeholderButton = document.createElement('button');
        placeholderButton.textContent = 'Print Tags';
        placeholderButton.onclick = () => this.printSelectedShapes();
    
        const buildLotoButton = document.createElement('button');
        buildLotoButton.textContent = 'Build LOTO';
        buildLotoButton.onclick = () => this.startBuildingLoto();
    
        menuContainer.appendChild(toggleButton);
        menuContainer.appendChild(placeholderButton);
        menuContainer.appendChild(buildLotoButton);
    
        // Always append to the main container
        this.container.appendChild(menuContainer);
    }



    //Shape functions

    addShape(shape) {
        this.shapes.push(shape);
        this.drawShapes();
    }

    drawShapes() {
        const ctx = this.canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.shapes.forEach(shape => {
            // const h = this.scaleShapeToOriginalPictureSize(shape);
            this.drawShape(ctx, shape);
        });
    }

    drawShape(ctx, shape) {
        ctx.strokeStyle = shape.color;
        ctx.fillStyle = shape.color;
        ctx.lineWidth = (shape.isSelected ? 3 : 1);
    
        switch (shape.type) {
            case 'rectangle':
                ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
                if (shape.isSelected) {
                    this.drawSelectionHandles(ctx, shape);
                }
                break;
            case 'circle':
                ctx.beginPath();
                ctx.arc(shape.x, shape.y, shape.radius, 0, 2 * Math.PI);
                ctx.stroke();
                break;
            case 'line':
                ctx.beginPath();
                ctx.moveTo(shape.startX, shape.startY);
                ctx.lineTo(shape.endX, shape.endY);
                ctx.stroke();
                break;
            case 'text':
                ctx.font = '16px Arial';
                ctx.fillText(shape.text, shape.x, shape.y);
                break;
        }
    }

    scaleShape(shape) {
        const calculatedScale = shape.originalWidth / this.img.offsetWidth;
        switch (shape.type) {
            case 'rectangle':
                return {
                    ...shape,
                    width: shape.width * calculatedScale,
                    height: shape.height * calculatedScale,
                };
            case 'circle':
                return {
                    ...shape,
                    radius: shape.radius * calculatedScale,
                };
            case 'line':
            case 'text':
                return { ...shape };
            default:
                return shape;
        }
    }

    scaleShapeToOriginalPictureSize(shape) {
        const scaleX = this.img.naturalWidth / shape.originalWidth;
        const scaleY = this.img.naturalHeight / shape.originalHeight;
    
        if (scaleX === 1) return shape;
    
        const scaledShape = { ...shape };
    
        switch (shape.type) {
            case 'rectangle':
                scaledShape.x *= scaleX;
                scaledShape.y *= scaleY;
                scaledShape.width *= scaleX;
                scaledShape.height *= scaleY;
                break;
            case 'circle':
                scaledShape.x *= scaleX;
                scaledShape.y *= scaleY;
                scaledShape.radius *= Math.min(scaleX, scaleY);
                break;
            case 'line':
                scaledShape.startX *= scaleX;
                scaledShape.startY *= scaleY;
                scaledShape.endX *= scaleX;
                scaledShape.endY *= scaleY;
                break;
            case 'text':
                scaledShape.x *= scaleX;
                scaledShape.y *= scaleY;
                // You might want to scale the font size as well
                break;
        }
    
        return scaledShape;
    }

    drawSelectionHandles(ctx, shape) {
        const scale = this.calculateCurrentScale();
        const handleSize = 8/scale;
        ctx.fillStyle = 'blue';

        let corners = [];

        switch (shape.type) {
            case 'rectangle':
                corners = [
                    [shape.x, shape.y],
                    [shape.x + shape.width, shape.y],
                    [shape.x, shape.y + shape.height],
                    [shape.x + shape.width, shape.y + shape.height]
                ];
                break;
            case 'circle':
                corners = [
                    [shape.x - shape.radius, shape.y - shape.radius],
                    [shape.x + shape.radius, shape.y - shape.radius],
                    [shape.x - shape.radius, shape.y + shape.radius],
                    [shape.x + shape.radius, shape.y + shape.radius]
                ];
                break;
            case 'line':
                corners = [
                    [shape.startX, shape.startY],
                    [shape.endX, shape.endY]
                ];
                break;
        }

        corners.forEach(([x, y]) => {
            ctx.fillRect(
                x - handleSize / 2,
                y - handleSize / 2,
                handleSize,
                handleSize
            );
        });
    }

    clickedShape(x, y) {
        const scale = this.calculateCurrentScale();
    
        // Convert click coordinates to canvas coordinates
        const canvasX = (x - this.initialLeft - this.pointX) / scale;
        const canvasY = (y - this.initialTop - this.pointY) / scale;
    
    
        for (let i = this.shapes.length - 1; i >= 0; i--) {
            const shape = this.shapes[i];
            switch (shape.type) {
                case 'rectangle':
                    if (canvasX >= shape.x && canvasX <= shape.x + shape.width &&
                        canvasY >= shape.y && canvasY <= shape.y + shape.height) {
                        return shape;
                    }
                    break;
                case 'circle':
                    const dx = canvasX - shape.x;
                    const dy = canvasY - shape.y;
                    if (dx * dx + dy * dy <= shape.radius * shape.radius) {
                        return shape;
                    }
                    break;
                case 'line':
                    const lineThickness = 5; // Adjust this value to change click sensitivity
                    const d = this.distanceToLine(canvasX, canvasY, shape.startX, shape.startY, shape.endX, shape.endY);
                    if (d <= lineThickness) {
                        return shape;
                    }
                    break;
                case 'text':
                    // For simplicity, we'll use a rectangular area around the text
                    const textWidth = 100; // Adjust based on your text size
                    const textHeight = 20; // Adjust based on your text size
                    if (canvasX >= shape.x && canvasX <= shape.x + textWidth &&
                        canvasY >= shape.y - textHeight && canvasY <= shape.y) {
                        return shape;
                    }
                    break;
            }
        }
        return null; // No shape was clicked
    }

    resetSelectedShapes(){
        this.shapes.forEach(shape => {
            shape.isSelected = false;
        });
        this.selectedShapes = [];
        this.drawShapes();
    }
    
    distanceToLine(x, y, x1, y1, x2, y2) {
        const A = x - x1;
        const B = y - y1;
        const C = x2 - x1;
        const D = y2 - y1;
    
        const dot = A * C + B * D;
        const len_sq = C * C + D * D;
        let param = -1;
        if (len_sq != 0) {
            param = dot / len_sq;
        }
    
        let xx, yy;
    
        if (param < 0) {
            xx = x1;
            yy = y1;
        }
        else if (param > 1) {
            xx = x2;
            yy = y2;
        }
        else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }
    
        const dx = x - xx;
        const dy = y - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }

    handleShapeClick(clickedShape) {
        // If the shape is already selected, deselect it
        const index = this.selectedShapes.findIndex(shape => shape === clickedShape);
        if (index !== -1) {
            this.selectedShapes.splice(index, 1);
            clickedShape.isSelected = false;
        } else {
            // If the shape is not selected, add it to the selection
            this.selectedShapes.push(clickedShape);
            clickedShape.isSelected = true;
        }
        
        this.drawShapes();
        this.showSelectedDetails();


        const carousel = new ImageCarousel('carousel', clickedShape.files, {
            visibleImages: 3,
            imageWidth: 200,
            gap: 10,
            onImageClick: (file) => {
                // Custom click handler
                displayImage(file, [...clickedShape.relatedEquipment,clickedShape.id]);
            },
            onImageHover: (file, isHovering) => {
                // Custom hover handler
            }
        });

        if(this.isBuildingLoto){
            this.lotoListComponent.addLotoPoints(clickedShape.lotoPoints);           
        }
    }

    showSelectedDetails() {
        const existingPopup = document.getElementById('shape-details-popup');
        if (this.selectedShapes.length > 0) {
            // Remove any existing popup
            if (existingPopup) {
                existingPopup.remove();
            }
    
            // Create popup container
            const popup = document.createElement('div');
            popup.id = 'shape-details-popup';
            popup.style.position = 'absolute';
            popup.style.top = '20px';
            popup.style.right = '20px';
            popup.style.backgroundColor = '#f0f0f0';  // Light gray background
            popup.style.border = '1px solid #333';
            popup.style.borderRadius = '5px';
            popup.style.padding = '15px';
            popup.style.zIndex = '1000';
            popup.style.maxHeight = '80%';
            popup.style.overflowY = 'auto';
            popup.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    
            // Create close button
            const closeButton = document.createElement('button');
            closeButton.textContent = 'X';
            closeButton.style.float = 'right';
            closeButton.style.border = 'none';
            closeButton.style.background = '#ddd';
            closeButton.style.color = '#333';
            closeButton.style.padding = '5px 10px';
            closeButton.style.cursor = 'pointer';
            closeButton.style.borderRadius = '3px';
            closeButton.onclick = () =>{
                popup.remove();
                this.resetSelectedShapes();
            }
            popup.appendChild(closeButton);
    
            // Add details for each selected shape
            this.selectedShapes.forEach((shape, index) => {
                const shapeDetails = document.createElement('div');
                shapeDetails.style.marginBottom = '20px';
                shapeDetails.style.clear = 'both';
    
                const title = document.createElement('h3');
                title.textContent = `${index + 1}. Tag Number: ${shape.tagNumber}`;
                title.style.marginBottom = '10px';
                title.style.color = '#333';
                shapeDetails.appendChild(title);
    
                const details = document.createElement('div');
                const detailsList = document.createElement('ul');
                detailsList.style.listStyleType = 'none';
                detailsList.style.padding = '0';
                detailsList.style.margin = '0';

                const detailsToShow = [
                    { label: 'Tag Number', value: shape.tagNumber, type: 'text' },
                    { label: 'Description', value: shape.description },
                    { label: 'Equipment Type', value: shape.eqType },
                    { label: 'Vendor', value: shape.vendor },
                    { label: 'System', value: shape.system },
                    { label: 'Location', value: shape.location },
                    { 
                        label: 'Related Files', 
                        value: shape.eqType === 'Connector' ? fileService.getFilesByNumberContaining(shape.tagNumber) : null, 
                        type: 'relatedFiles' 
                    },
                    { 
                        label: 'Related Loto Points', 
                        value: shape.lotoPoints, 
                        type: 'lotoPoints' 
                    },
                    { 
                        label: 'Related Heat Trace', 
                        value: this.getHeatTrace(shape.id), 
                        type: 'heatTrace' 
                    },
                    { 
                        label: 'Extended Heat Trace Search (Not Accurate)', 
                        value: this.getHeatTrace(shape.id,true), 
                        type: 'extendedHeatTrace' 
                    }
                ];

                detailsToShow.forEach(detail => {
                    if (detail.value) {
                        const li = document.createElement('li');
                        li.style.marginBottom = '10px';
                        li.style.color = '#333';
                
                        const label = document.createElement('strong');
                        label.textContent = `${detail.label}:`;
                        li.appendChild(label);
                
                        if (detail.type === 'relatedFiles' && Array.isArray(detail.value)) {
                            const fileList = document.createElement('ul');
                            fileList.style.listStyle = 'none';
                            fileList.style.padding = '5px 0 0 0';
                            fileList.style.margin = '0';
                
                            detail.value.forEach(file => {
                                const listItem = document.createElement('li');
                                listItem.style.marginBottom = '5px';
                                
                                const button = document.createElement('button');
                                button.textContent = file.name;
                                button.onclick = () => displayImage(file);
                                button.style.padding = '5px 10px';
                                button.style.cursor = 'pointer';
                                
                                listItem.appendChild(button);
                                fileList.appendChild(listItem);
                            });
                
                            li.appendChild(fileList);
                        } else if (detail.type === 'lotoPoints' && Array.isArray(detail.value)) {
                            const lotoPointsList = document.createElement('ul');
                            lotoPointsList.style.listStyle = 'none';
                            lotoPointsList.style.padding = '5px 0 0 0';
                            lotoPointsList.style.margin = '0';

                            const lotoPoints = lotoPointService.getLotoPoints(detail.value);

                            lotoPoints.forEach(lotoPoint => {
                                const listItem = document.createElement('li');
                                listItem.style.marginBottom = '10px';
                                
                                const button = document.createElement('button');
                                button.textContent = `${lotoPoint.tagNumber}`;
                                button.onclick = () => displayLotoPoint(lotoPoint);
                                button.style.padding = '5px 10px';
                                button.style.cursor = 'pointer';
                                
                                const details = document.createElement('div');
                                details.style.fontSize = '0.9em';
                                details.style.marginTop = '5px';
                                details.innerHTML = `
                                    <div>Description: ${lotoPoint.description}</div>
                                    <div>Normal Position: ${lotoPoint.normalPosition}</div>
                                    <div>Isolated Position: ${lotoPoint.isolatedPosition}</div>
                                    <div>Location: ${lotoPoint.specificLocation}</div>
                                `;
                                
                                listItem.appendChild(button);
                                listItem.appendChild(details);
                                lotoPointsList.appendChild(listItem);
                            });

                            li.appendChild(lotoPointsList);
                        } else if (detail.type === 'heatTrace' && Array.isArray(detail.value)) {
                            const heatTraceList = document.createElement('ul');
                            heatTraceList.style.listStyle = 'none';
                            heatTraceList.style.padding = '5px 0 0 0';
                            heatTraceList.style.margin = '0';

                            detail.value.forEach(heatTrace => {
                                const listItem = document.createElement('li');
                                listItem.style.marginBottom = '10px';
                                
                                const button = document.createElement('button');
                                button.textContent = `${heatTrace.tagNumber} (${heatTrace.panelNumber})`;
                                button.onclick = () => displayHeatTrace(heatTrace);
                                button.style.padding = '5px 10px';
                                button.style.cursor = 'pointer';
                                
                                const details = document.createElement('div');
                                details.style.fontSize = '0.9em';
                                details.style.marginTop = '5px';
                                details.innerHTML = `
                                    <div>Panel: ${heatTrace.panelNumber}</div>
                                    <div>Breaker: ${heatTrace.breaker}</div>
                                    <div>Location: ${heatTrace.panelLocation}</div>
                                `;
                                
                                listItem.appendChild(button);
                                listItem.appendChild(details);
                                heatTraceList.appendChild(listItem);
                            });

                            li.appendChild(heatTraceList);
                        } else if (detail.type === 'extendedHeatTrace' && Array.isArray(detail.value)) {
                            const heatTraceList = document.createElement('ul');
                            heatTraceList.style.listStyle = 'none';
                            heatTraceList.style.padding = '5px 0 0 0';
                            heatTraceList.style.margin = '0';

                            detail.value.forEach(heatTrace => {
                                const listItem = document.createElement('li');
                                listItem.style.marginBottom = '10px';
                                
                                const button = document.createElement('button');
                                button.textContent = `${heatTrace.tagNumber} (${heatTrace.panelNumber})`;
                                button.onclick = () => displayHeatTrace(heatTrace);
                                button.style.padding = '5px 10px';
                                button.style.cursor = 'pointer';
                                
                                const details = document.createElement('div');
                                details.style.fontSize = '0.9em';
                                details.style.marginTop = '5px';
                                details.innerHTML = `
                                    <div>Panel: ${heatTrace.panelNumber}</div>
                                    <div>Breaker: ${heatTrace.breaker}</div>
                                    <div>Location: ${heatTrace.panelLocation}</div>
                                `;
                                
                                listItem.appendChild(button);
                                listItem.appendChild(details);
                                heatTraceList.appendChild(listItem);
                            });

                            li.appendChild(heatTraceList);
                        } else {
                            const valueSpan = document.createElement('span');
                            valueSpan.textContent = ` ${detail.value}`;
                            li.appendChild(valueSpan);
                        }
                
                        detailsList.appendChild(li);
                    }
                });

                details.appendChild(detailsList);
                shapeDetails.appendChild(details);
    
                popup.appendChild(shapeDetails);
            });
    
            // Add popup to the container
            this.container.appendChild(popup);
        }else{
            
            if (existingPopup) {
                existingPopup.remove();
            }
        }
    }

    handleHoverShape(shape) {
        const existingHoverPopup = document.getElementById('shape-hover-popup');
        if (existingHoverPopup) {
            existingHoverPopup.remove();
        }
    
        if (shape) {
            // Create popup container
            const popup = document.createElement('div');
            popup.id = 'shape-hover-popup';
            popup.style.position = 'absolute';
            popup.style.top = '20px';
            popup.style.left = '20px';
            popup.style.backgroundColor = 'rgba(240, 240, 240, 0.9)';  // Light gray background with some transparency
            popup.style.border = '1px solid #333';
            popup.style.borderRadius = '5px';
            popup.style.padding = '10px';
            popup.style.zIndex = '1000';
            popup.style.maxWidth = '300px';
            popup.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    
            // Add details for the hovered shape
            const title = document.createElement('h4');
            title.textContent = `Tag Number: ${shape.tagNumber}`;
            title.style.marginTop = '0';
            title.style.marginBottom = '10px';
            title.style.color = '#333';
            popup.appendChild(title);
    
            const detailsList = document.createElement('ul');
            detailsList.style.listStyleType = 'none';
            detailsList.style.padding = '0';
            detailsList.style.margin = '0';
    
            const detailsToShow = [
                { label: 'Description', value: shape.description },
                { label: 'Equipment Type', value: shape.eqType },
                { label: 'Vendor', value: shape.vendor },
                { label: 'System', value: shape.system },
                { label: 'Location', value: shape.location }
            ];
    
            detailsToShow.forEach(detail => {
                if (detail.value) {
                    const li = document.createElement('li');
                    li.style.marginBottom = '5px';
                    li.style.color = '#333';
                    li.innerHTML = `<strong>${detail.label}:</strong> ${detail.value}`;
                    detailsList.appendChild(li);
                }
            });
    
            popup.appendChild(detailsList);
    
            // Add popup to the container
            this.container.appendChild(popup);
        }
    }

    printSelectedShapes() {
        const itemsToPrint = this.selectedShapes.map(sh => ({
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

    getHeatTrace(equipmentId, isExtendedSearch){
        let ht = null;
        if(!isExtendedSearch)ht = heatTraceService.getHeatTracesByEquipmentIds([equipmentId]);
        if(isExtendedSearch)ht = (heatTraceService.getExtendedHeatTrace(equipmentId));
        if(ht && ht.length > 0){
            return ht;
        }
        return null;
    }

    
    startBuildingLoto(){
        this.isBuildingLoto = true;
        this.lotoBuildingService = new LotoBuildingService();
        this.lotoListComponent = new LotoListComponent(this.lotoBuildingService);
        const allLotoPointIds = this.selectedShapes.flatMap(sh => sh.lotoPoints);
        this.lotoListComponent.addLotoPoints(allLotoPointIds);
    
        const myWindow = new FloatingWindow(null, 'Selected LOTO Points', 'loto-building-window');

        document.addEventListener('floatingWindowClosed', (event) => {
            console.log('Floating window closed:', event.detail.windowId);
            this.lotoListComponent.removeAllLotoPoints();
            this.isBuildingLoto = false;
        });
    }

}

function displayImage(file,ids){
    if(!file || !file.fileLink) return;

    const imageZoom = new ImageZoomInteractive('../' + file.fileLink, 'image');
    const shapes = equipmentService.getShapes(file.points);
        shapes.forEach(shape =>{
            if(ids && ids.includes(shape.id)){
                shape.isSelected = true;
            }
            imageZoom.addShape(shape);
        });
}

function displayHeatTrace(heatTrace){
    if(!heatTrace) return;
    const fileIds = [...heatTrace.pids, heatTrace.isometric, heatTrace.panelSchedule];
    const files = fileService.getFilesByIds(fileIds);

    const eqIds = heatTrace.equipmentList;
    // const equipment = equipmentService.getEquipment(eqIds);

    if(heatTrace.lotoPointId){
        const lotoPoint = lotoPointService.getLotoPoint(heatTrace.lotoPointId);
        if(lotoPoint && lotoPoint.equipmentList && lotoPoint.equipmentList.length > 0  && lotoPoint.equipmentList[0]!= null  && lotoPoint.equipmentList[0]!= 0 ){
            const breaker = equipmentService.getEquipment(lotoPoint.equipmentList);
            eqIds.push(breaker);
        }

    }

    displayImage(files[files.length - 1], eqIds);

    const carousel = new ImageCarousel('carousel', files, {
        visibleImages: 3,
        imageWidth: 200,
        gap: 10,
        onImageClick: (file) => {
            // Custom click handler
            displayImage(file, eqIds);
        },
        onImageHover: (file, isHovering) => {
            // Custom hover handler
        }
    });
}

function displayLotoPoint(lotoPoint){
    if(!lotoPoint) return;
    const equipmentIds = [...lotoPoint.equipmentList];
    const files = fileService.getFilesByEquipmentIds(equipmentIds);

    const eqIds = lotoPoint.equipmentList;
    // // const equipment = equipmentService.getEquipment(eqIds);

    // displayImage(files[files.length - 1], eqIds);

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