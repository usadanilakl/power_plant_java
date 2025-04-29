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
        this.extension = extension;

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
    
        this.canvas.width = this.img.naturalWidth;
        this.canvas.height = this.img.naturalHeight;
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;
    
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
    
        this.scale = 1;
        this.pointX = 0;
        this.pointY = 0;
    }

    loadImage() {
        this.img.onload = () => {
            this.setInitialSize();
            this.drawShapes();
        };
        this.img.src = this.imageUrl;
    }

    drawShapes() {
        const ctx = this.canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.shapes.forEach(shape => {
            this.drawShape(ctx, shape);
        });
    }

    drawShape(ctx, shape) {
        const scale = this.calculateCurrentScale();
        ctx.strokeStyle = shape.color;
        ctx.fillStyle = shape.color;
        ctx.lineWidth = (shape.isSelected ? 3 : 1);

        const scaledShape = this.scaleShape(shape);

        switch (scaledShape.type) {
            case 'rectangle':
                const rect = scaledShape;
                ctx.strokeRect(
                    rect.x * scale,
                    rect.y * scale,
                    rect.width,
                    rect.height
                );

                if (shape.isSelected) {
                    this.drawSelectionHandles(ctx, shape);
                }
                break;
            case 'circle':
                const circle = scaledShape;
                ctx.beginPath();
                ctx.arc(
                    circle.x * scale,
                    circle.y * scale,
                    circle.radius,
                    0,
                    2 * Math.PI
                );
                ctx.stroke();
                break;
            case 'line':
                const line = scaledShape;
                ctx.beginPath();
                ctx.moveTo(line.startX * scale, line.startY * scale);
                ctx.lineTo(line.endX * scale, line.endY * scale);
                ctx.stroke();
                break;
            case 'text':
                const text = scaledShape;
                ctx.font = `${16 * scale}px Arial`;
                ctx.fillText(text.text, text.x * scale, text.y * scale);
                break;
        }
    }

    scaleShape(shape) {
        const calculatedScale = this.calculateCurrentScale();
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

    drawSelectionHandles(ctx, shape) {
        const scale = this.calculateCurrentScale();
        const handleSize = 8;
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
                x * scale - handleSize / 2,
                y * scale - handleSize / 2,
                handleSize,
                handleSize
            );
        });
    }

    calculateCurrentScale() {
        return this.scale;
    }

    updateCanvasSize() {
        const rect = this.img.getBoundingClientRect();
        this.canvas.width = this.img.naturalWidth*this.scale;
        this.canvas.height = this.img.naturalHeight*this.scale;
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
            this.isDragging = true;
            this.start = { x: e.clientX - this.pointX, y: e.clientY - this.pointY };
            this.setCursor('grabbing');
        }
    }

    onMouseMove(e) {
        if (this.isDragging) {
            e.preventDefault();
            this.pointX = e.clientX - this.start.x;
            this.pointY = e.clientY - this.start.y;
            this.setTransform();
        }
    }

    onMouseUp(e) {
        if (this.isDragging) {
            e.preventDefault();
            this.isDragging = false;
            this.setCursor('grab');
        }
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
        this.updateCanvasSize();
        this.drawShapes();
    }

    addShape(shape) {
        this.shapes.push(shape);
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
        placeholderButton.textContent = 'Placeholder';
        placeholderButton.onclick = () => console.log('Placeholder button clicked');
    
        menuContainer.appendChild(toggleButton);
        menuContainer.appendChild(placeholderButton);
    
        // Always append to the main container
        this.container.appendChild(menuContainer);
    }
}