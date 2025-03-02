function createShapeWithPopup() {
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
        startDrawingShape(shapeType, shapeColor);
    });
}

function startDrawingShape(shapeType, shapeColor) {
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
    drawingLayer.addEventListener('mouseup', endShape);

    function startShape(e) {
        isDrawing = true;
        startX = e.clientX;
        startY = e.clientY;

        shape = document.createElement('div');
        shape.style.position = 'fixed';
        shape.style.border = `2px solid ${shapeColor}`;
        shape.style.backgroundColor = shapeColor + '40'; // 40 is for 25% opacity
        document.body.appendChild(shape);
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

    function endShape() {
        isDrawing = false;
        document.body.removeChild(drawingLayer);
        // Here you can add code to save the shape or do further processing
        console.log('Shape drawn:', {
            type: shapeType,
            color: shapeColor,
            element: shape
        });
    }
}

// Call this function to start the process
// createShapeWithPopup();