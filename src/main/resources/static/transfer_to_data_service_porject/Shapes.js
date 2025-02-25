const originalPictureSize = {width:document.getElementById('picture').naturalWidth, height:document.getElementById('picture').naturalHeight};
let shapeRelocationIsEnabled = false;

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


