
let selectedArea = null;
let activeHighlights = []; 
highlatedAreas = [];

function loadPictureWithFile(file){
    const picture = document.getElementById('picture');
    picture.setAttribute('src','/'+file.fileLink);
    picture.setAttribute('data-file-id', file.id);
    removeAllHighlights();
    setAreas(file.points);
}
function setAreas(areas){
    map.innerHTML = "";
    removeAllHighlights();
    let reference =areas[0] ? getOriginalPictureSizes(areas[0].originalPictureSize).w : null
    oldWidth = reference ? reference : picture.naturalWidth;

    areas.forEach(e=>{
        let coord = matchAreaOriginalSizes(e,reference);
        let area = createAreaElement(e);
        area.setAttribute('coords',coord);
        area.addEventListener('click',()=>{
            event.preventDefault();
            removeAllHighlights();
            createHighlight(area);
            selectedArea = e;
        });
        area.addEventListener('touchstart', function(event) {
            event.preventDefault();
            removeAllHighlights();
            createHighlight(area);
            pointEditModeControl(); 
            selectedArea = e;
        });
        map.appendChild(area);
    });
    resizeAreas();
    highlightAll();
    
}
function createAreaElement(area){
    
    let coord = getAreaCoordinates(area.coordinates);
    let newArea = document.createElement('area');
    newArea.setAttribute('alt',area.tagNumber);
    newArea.setAttribute('title', area.tagNumber);
    newArea.setAttribute('data-point-id', area.id);
    newArea.setAttribute('class',"ar");
    newArea.setAttribute('id',coord);
    newArea.setAttribute('coords', coord);
    newArea.setAttribute('shape',"rect"); 

    let directLotoPoint;
    if(area.lotoPoints!=null && area.lotoPoints.length>0){
        directLotoPoint = area.lotoPoints.find(e=>e.tagNumber===area.tagNumber);
        if(!directLotoPoint) directLotoPoint = area.lotoPoints[0];
        if(directLotoPoint.isoPos && directLotoPoint.isoPos.name && directLotoPoint.isoPos.name.toLowerCase().includes('open')){
            newArea.setAttribute('data-loto-point-area', true);
        }
        else if(directLotoPoint.isoPos && directLotoPoint.isoPos.name && directLotoPoint.isoPos.name.toLowerCase().includes('closed')){
            newArea.setAttribute('data-loto-point-area', false);
        }
        else newArea.setAttribute('data-loto-point-area', '');
    } 
    newArea.addEventListener('mousedown',(event)=>{
        event.preventDefault();
        relocateHighlightsWithPicture(event);
    })

    return newArea;
}
function getAreaCoordinates(coord){
    let arr = coord.split(",");
    let result = 
    arr[0].substring(arr[0].indexOf(":")+1)+","+
    arr[1].substring(arr[1].indexOf(":")+1)+","+
    arr[2].substring(arr[2].indexOf(":")+1)+","+
    arr[3].substring(arr[3].indexOf(":")+1);

    return result;
}
function resizeAreas(){
    
    const rect = picture.getBoundingClientRect();
    const width = rect.width;
    const coefficient = width/oldWidth;
    let allAreas = document.querySelectorAll(".ar");

    allAreas.forEach(e=>{
        let coord = e.getAttribute('coords').split(",");
        for(let i = 0; i<coord.length; i++){
            coord[i] = coord[i]*coefficient;
        }
        e.setAttribute('coords', ""+coord.join(","));
    });

    //resizeHighlite();
    oldWidth = width; 
}
function matchAreaOriginalSizes(point,reference){
    let areaWidth = getOriginalPictureSizes(point.originalPictureSize).w;
    let coord = getAreaCoordinates(point.coordinates).split(",");
    if(areaWidth!==reference){
        let coefficient = reference/areaWidth;
        for(let i = 0; i<coord.length; i++){
            coord[i] = coord[i]*coefficient;
        }
    }
    return coord.join(",");
}
function resizeHighlights() {
    let allHighlights = document.querySelectorAll('.areaHighlights');
    
    allHighlights.forEach(highlight => {
        let area = document.getElementById(highlight.getAttribute('id').slice(0, -1));
        let coords = getShapeCoordinates(area);
        
        highlight.style.top = coords.y;
        highlight.style.left = coords.x;
        highlight.style.width = coords.w;
        highlight.style.height = coords.h;
    });
}
function getShapeCoordinates(area) {
    let coords = area.getAttribute('coords').split(",").map(Number);
    let pictureRect = picture.getBoundingClientRect();
    
    let width = coords[2] - coords[0];
    let height = coords[3] - coords[1];
    let x = coords[0] + pictureRect.left;
    let y = coords[1] + pictureRect.top;
    
    return {
        w: `${width}px`, 
        h: `${height}px`, 
        x: `${x}px`, 
        y: `${y}px`
    };
}
function createHighlight(area){
    let position = getShapeCoordinates(area);
    let coords = area.getAttribute('coords').split(",");
    let highlight = document.createElement('div');
    highlight.setAttribute('id', area.getAttribute('id') + "h");
    highlight.setAttribute('class','areaHighlights');
    highlight.setAttribute('name',area.getAttribute('title'))
    document.body.appendChild(highlight);
    highlight.style.width = position.w;
    highlight.style.height = position.h;
    highlight.style.position = 'fixed';
    let y = parseFloat(coords[1])+picture.offsetTop;
    let x = parseFloat(coords[0])+picture.offsetLeft;
    highlight.style.top = position.y;
    highlight.style.left = position.x;
    highlight.style.zIndex = '1';
        
    if(area.getAttribute('data-loto-point-area')==='true')highlight.setAttribute('data-loto-point-highlight',true);
    else if(area.getAttribute('data-loto-point-area')==='false')highlight.setAttribute('data-loto-point-highlight',false);

    highlight.addEventListener('mousedown',(event)=>{
        event.preventDefault();
        relocateHighlightsWithPicture(event); 
        
        // updatePointInfo(event);
    })

    const zoom = zoomPicture.bind(null,picture);
    highlight.addEventListener('wheel',zoom);


    highlight.addEventListener('click', () => {
        console.log("Single click on highlight");
    });

    highlight.addEventListener('dblclick', () => {
        console.log("Double click on highlight");
    });

    

    activeHighlights.push(highlight);
    highlatedAreas.push(area);
    return highlight;
}
function getOriginalPictureSizes(originalPictureSize){
    let arr = originalPictureSize.split(",");
    let w = arr[0].substring(arr[0].indexOf(":")+1);
    let h = arr[1].substring(arr[1].indexOf(":")+1);
    originalWidth = w;
    return {w:w,h:h}
}
function removeAllHighlights(){
    document.querySelectorAll('.areaHighlights').forEach(e=>{
        document.body.removeChild(e);
        activeHighlights = [];
        highlatedAreas = [];
    })
}
function highlightAll(){
    let areas = document.querySelectorAll('.ar');
    removeAllHighlights();
    areas.forEach(e=>{
        createHighlight(e);
    })
}
function highlightLotoPoints(){
    let areas = document.querySelectorAll('[data-loto-point-area]');
    removeAllHighlights();
    areas.forEach(e=>{
        createHighlight(e);
    })
}
function highlightEq(eqId){
    const area = document.querySelector(`[data-point-id='${eqId}']`);
    createHighlight(area);
}
function relocateHighlightsWithPicture(event){
    //let allHighlights = [...activeHighlights];

    let highlightPosition = [];
    activeHighlights.forEach(e=>{
        highlightPosition.push({top:e.offsetTop, left:e.offsetLeft}); // get current position of each highlight
    });
    
    let picPosition = {top:picture.offsetTop, left:picture.offsetLeft} // get current position of picture

    let startX = event.clientX; // get current position of mouse
    let startY = event.clientY;

    const handleMouseMove = (event) =>{
        let changeX = startX-event.clientX;
        let changeY = startY-event.clientY;

        let i = 0;
        activeHighlights.forEach(e=>{
            e.style.top = highlightPosition[i].top - changeY + 'px';
            e.style.left = highlightPosition[i].left - changeX + 'px';
            i++;
        });

        picture.style.top = picPosition.top - changeY + "px";
        picture.style.left = picPosition.left - changeX + "px";

    }

    const handleMouseUp = ()=>{
        document.removeEventListener('mousemove', handleMouseMove);
    }

    document.addEventListener('mousemove',handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);


}
function relocateHighlightsWithPictureTouch(event) {
    // Only proceed if there are exactly two touch points
    if (event.touches.length !== 2) return;

    let highlightPosition = [];
    activeHighlights.forEach(e => {
        highlightPosition.push({top: e.offsetTop, left: e.offsetLeft});
    });

    let picPosition = {top: picture.offsetTop, left: picture.offsetLeft};
    let startX = (event.touches[0].clientX + event.touches[1].clientX) / 2;
    let startY = (event.touches[0].clientY + event.touches[1].clientY) / 2;

    const handleTouchMove = (event) => {
        event.preventDefault(); // Prevent scrolling while moving
        if (event.touches.length !== 2) return;

        let currentX = (event.touches[0].clientX + event.touches[1].clientX) / 2;
        let currentY = (event.touches[0].clientY + event.touches[1].clientY) / 2;
        
        let changeX = startX - currentX;
        let changeY = startY - currentY;
        
        activeHighlights.forEach((e, i) => {
            e.style.top = highlightPosition[i].top - changeY + 'px';
            e.style.left = highlightPosition[i].left - changeX + 'px';
        });

        picture.style.top = picPosition.top - changeY + "px";
        picture.style.left = picPosition.left - changeX + "px";
    }

    const handleTouchEnd = () => {
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
    }

    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
}
function relocateHighlightsWithPictureDoubleTap(event) {
    let lastTap = 0;
    let isDragging = false;
    let highlightPosition = [];
    let picPosition = { top: picture.offsetTop, left: picture.offsetLeft };
    let startX, startY;

    picture.addEventListener('touchstart', handleTouchStart);

    function handleTouchStart(event) {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTap;
        
        if (tapLength < 300 && tapLength > 0 && event.touches.length===1) {
            // Double tap detected
            event.preventDefault();
            isDragging = true;
            
            highlightPosition = activeHighlights.map(e => ({
                top: e.offsetTop,
                left: e.offsetLeft
            }));

            picPosition = { top: picture.offsetTop, left: picture.offsetLeft };
            startX = event.touches[0].clientX;
            startY = event.touches[0].clientY;

            document.addEventListener('touchmove', handleTouchMove, { passive: false });
            document.addEventListener('touchend', handleTouchEnd);
        }
        
        lastTap = currentTime;
    }

    function handleTouchMove(event) {
        if (!isDragging) return;
        
        event.preventDefault(); // Prevent scrolling while moving

        let currentX = event.touches[0].clientX;
        let currentY = event.touches[0].clientY;
        
        let changeX = startX - currentX;
        let changeY = startY - currentY;
        
        activeHighlights.forEach((e, i) => {
            e.style.top = highlightPosition[i].top - changeY + 'px';
            e.style.left = highlightPosition[i].left - changeX + 'px';
        });

        picture.style.top = picPosition.top - changeY + "px";
        picture.style.left = picPosition.left - changeX + "px";
    }

    function handleTouchEnd() {
        isDragging = false;
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
    }
}
function zoomPicture(){

    let size = picture.getBoundingClientRect();
    let startW = picture.offsetWidth; // get current width of picture
    let startH = picture.offsetHeight;
    
    //finding the original spot where mosue is pointed before zooming
    let areaX = event.clientX - size.left;
    let areaY = event.clientY - size.top;
    
    // get new spot on the picture where mouse is currently pointing at
    let newAreaX = event.clientX - size.left; 
    let newAreaY = event.clientY - size.top;
    
    //find original picture position
    let startPictureX = picture.offsetLeft;
    let startPictureY = picture.offsetTop;
    
    let width = picture.offsetWidth;
    let scale = width;
    
    let zoomIn = 1.2;
    let zoomOut = 0.8;
    
    //scroll in
    if (event.deltaY < 0 && startW/window.innerWidth < 25) {
        scale *= zoomIn;
        areaX = areaX*zoomIn; //this is X of where mosue was pointed before zooming
        areaY *= zoomIn; //this is Y of where mosue was pointed before zooming
        
            
    //scroll out   
    }else if(event.deltaY>0 && startW/window.innerWidth>0.2){
        scale *=zoomOut;
        areaX = areaX*zoomOut; //this is X of where mosue was pointed before zooming
        areaY *= zoomOut; //this is Y of where mosue was pointed before zooming
        
    }
        // Apply the new scale to the picture
        picture.style.width = scale + 'px';
        event.preventDefault();
        let newPictureX = newAreaX - areaX + startPictureX;
        let newPictureY = newAreaY - areaY + startPictureY;
    
        picture.style.left = `${newPictureX}px`;
        picture.style.top = `${newPictureY}px`;
        resizeAreas(); 
        resizeHighlights(); 
        //resizeManualHighlites(); 
    
    }
function zoomPictureTouch(event) {
    // Sensitivity setting - adjust this value to change sensitivity
    const sensitivityThreshold = 0.05; // Higher value = less sensitive

    // Get the current size and position of the picture
    let size = picture.getBoundingClientRect();
    let startW = picture.offsetWidth;
    let startH = picture.offsetHeight;

    // Only proceed if there are exactly two touch points (for pinch-to-zoom)
    if (event.touches.length !== 2) return;

    event.preventDefault();

    let touch1 = event.touches[0];
    let touch2 = event.touches[1];

    let initialDistance = Math.hypot(
        touch1.clientX - touch2.clientX,
        touch1.clientY - touch2.clientY
    );

    let centerX = (touch1.clientX + touch2.clientX) / 2;
    let centerY = (touch1.clientY + touch2.clientY) / 2;

    let areaX = centerX - size.left;
    let areaY = centerY - size.top;

    let startPictureX = picture.offsetLeft;
    let startPictureY = picture.offsetTop;

    let scale = picture.offsetWidth;

    function handleTouchMove(e) {
        if (e.touches.length !== 2) return;

        let currentTouch1 = e.touches[0];
        let currentTouch2 = e.touches[1];

        let currentDistance = Math.hypot(
            currentTouch1.clientX - currentTouch2.clientX,
            currentTouch1.clientY - currentTouch2.clientY
        );

        let zoomFactor = currentDistance / initialDistance;

        // Only apply zoom if the change is greater than the threshold
        if (Math.abs(zoomFactor - 1) > sensitivityThreshold) {
            if ((zoomFactor > 1 && startW / window.innerWidth < 25) || 
                (zoomFactor < 1 && startW / window.innerWidth > 0.2)) {
                scale *= zoomFactor > 1 ? 1.1 : 0.9;
                areaX = areaX * (zoomFactor > 1 ? 1.1 : 0.9) + (zoomFactor > 1 ? -10 : 10);
                areaY *= zoomFactor > 1 ? 1.1 : 0.9;

                picture.style.width = scale + 'px';

                let newCenterX = (currentTouch1.clientX + currentTouch2.clientX) / 2;
                let newCenterY = (currentTouch1.clientY + currentTouch2.clientY) / 2;

                let newPictureX = newCenterX - areaX - size.left + startPictureX;
                let newPictureY = newCenterY - areaY - size.top + startPictureY;

                picture.style.left = `${newPictureX}px`;
                picture.style.top = `${newPictureY}px`;

                resizeAreas();
                resizeHighlights();

                initialDistance = currentDistance;
            }
        }
    }

    function handleTouchEnd() {
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
    }

    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
}

function handleMouseDown(event) {
    if(event.button===2){

    let shape = document.createElement('div');
    shape.setAttribute('class', 'areaHighlights');
    all.appendChild(shape);
    newHighlights.push({element:shape});
    shape.addEventListener('mousedown',(event)=>{
        event.preventDefault();
        event.stopImmediatePropagation();
        event.stopPropagation();
        relocateHighlightsWithPicture(event);
    })

    coords.picture = getPictureCoordsOnScreen();
    coords.mouseOnScreenStart = registerMouseCoordsOnScreen(event);
    coords.mouseOnPictureStart = registerMouseCoordsOnPicture(event);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup',handleMouseUp);    
}
}
  
function handleMouseMove(event) {

    coords.mouseOnPictureEnd = registerMouseCoordsOnPicture(event);

    let highlight = newHighlights[newHighlights.length-1].element;
    highlight.style.width = (coords.mouseOnPictureEnd.x-coords.mouseOnPictureStart.x)+'px';
    highlight.style.height = (coords.mouseOnPictureEnd.y-coords.mouseOnPictureStart.y)+'px';
    // highlight.style.border = '2px solid blue';
    highlight.style.position = 'fixed';
    highlight.style.top = coords.mouseOnScreenStart.y+'px';
    highlight.style.left = coords.mouseOnScreenStart.x+'px';
    highlight.style.zIndex = '10';

        
    if(highlight.getAttribute('data-loto-point-highlight')==='true')highlight.style.border = '2px solid red';
    else if(highlight.getAttribute('data-loto-point-highlight')==='false')highlight.style.border = '2px solid green';
    else highlight.style.border = '2px solid blue';

}

async function handleMouseUp() {

    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);

    await offsetSizing(picture);
    //await sendCoordinates();

    let areaCoordinates = 'StartX:'+coords.mouseOnPictureStart.x + ',StartY:' + coords.mouseOnPictureStart.y+ ',EndX:'+ coords.mouseOnPictureEnd.x + ',EndY:' + coords.mouseOnPictureEnd.y +',width:'+ coords.getObjWidth() +',height:'+ coords.getObjHeight();
    let id = coords.mouseOnPictureStart.x + ',' + coords.mouseOnPictureStart.y+ ','+ coords.mouseOnPictureEnd.x + ',' + coords.mouseOnPictureEnd.y;
    let picSize = picture.offsetWidth;

    // console.log(picSize)
    // console.log(getPictureSize()) //same as picSize


    newHighlights[newHighlights.length-1].id = id+'h';
    newHighlights[newHighlights.length-1].element.setAttribute('id',id+'h');
    newHighlights[newHighlights.length-1].picSize = picSize;

    if(coords.getObjWidth() > 20 && coords.getObjHeight() > 20){
        let image = document.getElementById('picture');
        areaInfo.coordinates = areaCoordinates;
        areaInfo.originalPictureSize = "width:"+image.naturalWidth + ",height:"+image.naturalHeight;

        areaInfo.tagNumber = "new Area";
        areaInfo.mainFile = file.fileLink;
        areaInfo.files = [];
        areaInfo.files.push(file.fileLink);
        if(file.vendor)areaInfo.vendor = file.vendor;
        if(file.system)areaInfo.system = file.system;
        areaInfo.eqType = null;
        areaInfo.location = null;

        if(!isGettingText){
            let area = createAreaElement(areaInfo);
            area.addEventListener('click',()=>{
                event.preventDefault();
                removeAllHighlights();
                createHighlight(area);
            })
            //doubleClick(shape, e);
            map.appendChild(area);
            resizeNewArea(area);
            removeAllHighlights();
            createHighlight(area);
            // console.log(JSON.stringify(areaInfo))
            // console.log(JSON.stringify(selectedArea))
            //let newEq = await createNewEq(areaInfo);
            //file.points.push(newEq);
            selectedArea = areaInfo;
            fillPointInfoWindow(selectedArea);        
        }else{
            let text = await getText(areaInfo.coordinates);
            saveInClipboard(text);
            removeLastHighlight();
        }
    } else{
        removeLastHighlight();
    }

    
}

async function offsetSizing(picture){

    const coefficientX = originalWidth/picture.offsetWidth;

    coords.mouseOnPictureStart.x = Math.floor(coords.mouseOnPictureStart.x*coefficientX);
    coords.mouseOnPictureStart.y = Math.floor(coords.mouseOnPictureStart.y*coefficientX);
    coords.mouseOnPictureEnd.x = Math.floor(coords.mouseOnPictureEnd.x*coefficientX);
    coords.mouseOnPictureEnd.y = Math.floor(coords.mouseOnPictureEnd.y*coefficientX);
}