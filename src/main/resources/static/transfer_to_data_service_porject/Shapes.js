const originalPictureSize = {width:document.getElementById('picture').naturalWidth, height:document.getElementById('picture').naturalHeight};
let shapeRelocationIsEnabled = false;
let selectedShape = null;

function getCurrentPictureSize(){
    return {width:document.getElementById('picture').width, height:document.getElementById('picture').height};
}

function getOriginalPictureSize(){
    return {
        width:document.getElementById('picture').naturalWidth,
        height:document.getElementById('picture').naturalHeight
    }
}

function getResizeFactor(){
    return getOriginalPictureSize().width / getCurrentPictureSize().width;
}

function getShapeCoordinatesOnPicture(shape) {
    let shapeRect = shape.getBoundingClientRect();
    let pictureRect = document.getElementById('picture').getBoundingClientRect();

    // Calculate shape position relative to the picture
    let relativeLeft = shapeRect.left - pictureRect.left;
    let relativeTop = shapeRect.top - pictureRect.top;

    // Calculate the scale factor
    let scaleFactor = getResizeFactor();

    // Convert to original picture coordinates
    let startX = Math.round(relativeLeft * scaleFactor);
    let startY = Math.round(relativeTop * scaleFactor);
    let width = Math.round(shapeRect.width * scaleFactor);
    let height = Math.round(shapeRect.height * scaleFactor);

    // Return in the specified format
    return {
        startX: startX,
        startY: startY,
        endX: startX + width,
        endY: startY + height,
        width: width,
        height: height
    };
}

function enableShapeDrag(shape) {
    let isDragging = false;
    let startX, startY;

    shape.addEventListener('mousedown', startDragging);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDragging);

    function startDragging(e) {
        if (!shapeRelocationIsEnabled) return;
        isDragging = true;
        startX = e.clientX - shape.offsetLeft;
        startY = e.clientY - shape.offsetTop;
        shape.style.cursor = 'grabbing';
    }

    function drag(e) {
        if (!isDragging) return;
        e.preventDefault();
        e.stopPropagation();
        let newX = e.clientX - startX;
        let newY = e.clientY - startY;
        
        // Ensure the shape stays within the picture boundaries
        let picture = document.getElementById('picture');
        let pictureRect = picture.getBoundingClientRect();
        let shapeRect = shape.getBoundingClientRect();
        
        newX = Math.max(pictureRect.left, Math.min(newX, pictureRect.right - shapeRect.width));
        newY = Math.max(pictureRect.top, Math.min(newY, pictureRect.bottom - shapeRect.height));
        
        shape.style.left = `${newX}px`;
        shape.style.top = `${newY}px`;
    }

    function stopDragging() {
        isDragging = false;
        shape.style.cursor = 'grab';
    }
}



//DRAWING FUNCTIONS
function createShapeWithPopup(callback) {
    // Create and show the popup
    const popup = document.createElement('div');
    popup.innerHTML = `
        <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 20px; border: 1px solid black; z-index: 1000;">
            <h3>Create New Shape</h3>
            <select id="shapeType">
                <option value="rect">Rectangle</option>
                <option value="circle">Circle</option>
                <option value="poly">Polygon</option>
                <option value="triangle">Triangle</option>
            </select>
            <input type="color" id="shapeColor" value="#ff0000">
            <button id="startDrawing">Start Drawing</button>
        </div>
    `;
    document.body.appendChild(popup);

    // Add event listener to the Start Drawing button
    document.getElementById('startDrawing').addEventListener('click', () => {
        const shapeType = document.getElementById('shapeType').value;
        const shapeColor = document.getElementById('shapeColor').value;
        document.body.removeChild(popup);
        startDrawingShape(shapeType, shapeColor,callback);
    });
}

function startDrawingShape(shapeType, shapeColor, callback) {
    let isDrawing = false;
    let shape;
    let startX, startY;

    const drawingLayer = document.createElement('div');
    drawingLayer.style.position = 'fixed';
    drawingLayer.style.top = '0';
    drawingLayer.style.left = '0';
    drawingLayer.style.width = '100%';
    drawingLayer.style.height = '100%';
    drawingLayer.style.zIndex = '1000';
    drawingLayer.style.cursor = 'crosshair';
    document.body.appendChild(drawingLayer);

    drawingLayer.addEventListener('mousedown', startShape);
    drawingLayer.addEventListener('mousemove', drawShape);
    drawingLayer.addEventListener('mouseup', async (e)=> await endShape(e));

    function startShape(e) {
        isDrawing = true;
        startX = e.clientX;
        startY = e.clientY;

        shape = document.createElement('div');
        shape.style.position = 'fixed';
        shape.style.border = `2px solid ${shapeColor}`;
        shape.style.backgroundColor = shapeColor + '40'; // 40 is for 25% opacity
        document.body.appendChild(shape);

        let clickTimer = null;
        let clickDelay = 300; // milliseconds

        shape.addEventListener('click', async (event) => {
            event.preventDefault();
            if (clickTimer === null) {
                clickTimer = setTimeout(async function() {
                    clickTimer = null;
                    selectedShape = shape;//USED FOR ROATION
                    currentShape.shape = shape;
                    currentShape.coordinates = getShapeCoordinatesOnPicture(shape);
                    currentShape.originalPictureSize = getOriginalPictureSize();
                }, clickDelay);
            } else {
                clearTimeout(clickTimer);
                clickTimer = null;
                console.log("Double click on highlight");
                shapeRelocationIsEnabled = !shapeRelocationIsEnabled;
                console.log("Shape relocation is enabled " + shapeRelocationIsEnabled);
            }
        });
    
        enableShapeDrag(shape);
        activeHighlights.push(shape);
    }

    function drawShape(e) {
        if (!isDrawing) return;

        const currentX = e.clientX;
        const currentY = e.clientY;

        if (shapeType === 'rect') {
            const width = Math.abs(currentX - startX);
            const height = Math.abs(currentY - startY);
            shape.style.left = Math.min(startX, currentX) + 'px';
            shape.style.top = Math.min(startY, currentY) + 'px';
            shape.style.width = width + 'px';
            shape.style.height = height + 'px';
        } else if (shapeType === 'circle') {
            const radius = Math.sqrt(Math.pow(currentX - startX, 2) + Math.pow(currentY - startY, 2));
            shape.style.left = (startX - radius) + 'px';
            shape.style.top = (startY - radius) + 'px';
            shape.style.width = (radius * 2) + 'px';
            shape.style.height = (radius * 2) + 'px';
            shape.style.borderRadius = '50%';
        } else if (shapeType === 'poly') {
            // For simplicity, we'll just draw a triangle
            const points = `${startX},${startY} ${currentX},${currentY} ${startX},${currentY}`;
            shape.style.clipPath = `polygon(${points})`;
            shape.style.width = Math.abs(currentX - startX) + 'px';
            shape.style.height = Math.abs(currentY - startY) + 'px';
            shape.style.left = Math.min(startX, currentX) + 'px';
            shape.style.top = Math.min(startY, currentY) + 'px';
        } else if (shapeType === 'triangle') {
            const width = Math.abs(currentX - startX);
            const height = Math.abs(currentY - startY);
            const points = `50% 0%, 0% 100%, 100% 100%`;
            shape.style.clipPath = `polygon(${points})`;
            shape.style.width = width + 'px';
            shape.style.height = height + 'px';
            shape.style.left = Math.min(startX, currentX) + 'px';
            shape.style.top = Math.min(startY, currentY) + 'px';
        }
    }

    async function endShape(e) {
        isDrawing = false;
        document.body.removeChild(drawingLayer);
        // Here you can add code to save the shape or do further processing
        console.log('Shape drawn:', {
            type: shapeType,
            color: shapeColor,
            element: shape
        });

        currentShape.coordinates = JSON.stringify(getShapeCoordinatesOnPicture(shape)).replace(/[{}"]/g, '');
        currentShape.originalPictureSize =JSON.stringify(getOriginalPictureSize()).replace(/[{}"]/g, '');
        currentShape.shape = shape;
        currentShape.type = shapeType;
        currentShape.color = shapeColor;
        currentShape.clipPath = shape.style.clipPath;
        currentShape.rotation = getRotation(shape);

            // Execute the callback function if it exists
        if (typeof callback === 'function') {
            await callback();
        }
    }
}

function rotateShape(shape) {
    let currentRotation = shape.style.transform ? parseInt(shape.style.transform.replace('rotate(', '').replace('deg)', '')) || 0 : 0;
    let newRotation = (currentRotation + 90) % 360;
    
    shape.style.transform = `rotate(${newRotation}deg)`;
    
    // Adjust the shape's position to rotate around its center
    let rect = shape.getBoundingClientRect();
    let centerX = rect.left + rect.width / 2;
    let centerY = rect.top + rect.height / 2;
    
    // Swap width and height
    let tempWidth = shape.style.width;
    shape.style.width = shape.style.height;
    shape.style.height = tempWidth;
    
    // Recalculate position to keep the center point the same
    let newRect = shape.getBoundingClientRect();
    let newLeft = centerX - newRect.width / 2;
    let newTop = centerY - newRect.height / 2;
    
    shape.style.left = `${newLeft}px`;
    shape.style.top = `${newTop}px`;
    
    // If it's a triangle, adjust the clip-path
    if (shape.style.clipPath && shape.style.clipPath.includes('polygon')) {
        let currentClipPath = shape.style.clipPath;
        if (currentClipPath === 'polygon(50% 0%, 0% 100%, 100% 100%)') {
            shape.style.clipPath = 'polygon(100% 50%, 0% 0%, 0% 100%)';
        } else if (currentClipPath === 'polygon(100% 50%, 0% 0%, 0% 100%)') {
            shape.style.clipPath = 'polygon(50% 100%, 100% 0%, 0% 0%)';
        } else if (currentClipPath === 'polygon(50% 100%, 100% 0%, 0% 0%)') {
            shape.style.clipPath = 'polygon(0% 50%, 100% 100%, 100% 0%)';
        } else {
            shape.style.clipPath = 'polygon(50% 0%, 0% 100%, 100% 100%)';
        }
    }
}

function rotateSelectedShape() {
    if (selectedShape) {
        rotateShape(selectedShape);
    } else {
        console.log("No shape selected");
    }
}

function getRotation(shape) {
    if (shape.style.transform) {
        const transformValue = shape.style.transform;
        const rotateMatch = transformValue.match(/rotate\((-?\d+(?:\.\d+)?)deg\)/);
        if (rotateMatch) {
            return parseFloat(rotateMatch[1]);
        }
    }
    return 0; // Default to 0 if no rotation is set
}

function deleteShape(shape){
    document.body.removeChild(shape);
    console.log("Shape deleted");
}

function deleteSelectedShape(){
    if (selectedShape) {
        deleteShape(selectedShape);
        selectedShape = null;
    } else {
        console.log("No shape selected");
    }
}


