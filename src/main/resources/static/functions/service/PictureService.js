//let picture = document.getElementById("picture");
//let map = document.getElementById("map");
let oldWidth; 
let activeHighlights = [];
let highlatedAreas = [];

function loadPictureWithAreas(src, areas){
    picture.setAttribute('src',src);
    removeAllHighlights();
    setAreas(areas);
}
function setAreas(areas){
    map.innerHTML = "";
    removeAllHighlights();
    let n = 1;

    areas.forEach(e=>{
        oldWidth = getOriginalPictureSizes(e.originalPictureSize).w;
        let area = createAreaElement(e);
        area.addEventListener('click',()=>{
            event.preventDefault();
            removeAllHighlights();
            createHighlight(area);
        })
        //doubleClick(shape, e);
        map.appendChild(area);
    });
    resizeAreas();
    //highlightAll()
    
}
function createAreaElement(area){
    
    let coord = getAreaCoordinates(area.coordinates);
    let newArea = document.createElement('area');
    newArea.setAttribute('alt',area.label);
    newArea.setAttribute('title', area.label);
    //newArea.setAttribute('href',area.label);
    newArea.setAttribute('class',"ar");
    //newArea.classList.add(area.eqType.name.replace(/" "/g, ""));
    newArea.setAttribute('id',coord);
    //newArea.classList.add(area.type);
    newArea.setAttribute('coords', coord);
    newArea.setAttribute('shape',"rect");

    //drag(newArea,pictureContainer);
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
function resizeHighlights(){
    
    let allHighlites = document.querySelectorAll('.areaHighlights');
    allHighlites.forEach(e=>{
        let area = document.getElementById(e.getAttribute('id').slice(0,-1));
       e.style.top = getShapeCoordinates(area).y; 
       e.style.left = getShapeCoordinates(area).x;
       e.style.width = getShapeCoordinates(area).w;
       e.style.height = getShapeCoordinates(area).h;
       //console.log(JSON.stringify(getShapeCoordinates(area)));

       //console.log(parseFloat((e.style.top.replace('px',''))-picture.offsetTop)*coefficient + picture.offsetTop+ 'px');
    })
}
function createHighlight(area){
    let position = getShapeCoordinates(area);
    let coords = area.getAttribute('coords').split(",");
    let highlight = document.createElement('div');
    highlight.setAttribute('id', area.getAttribute('id') + "h");
    highlight.setAttribute('class','areaHighlights');
    //if(area.classList.contains('connector'))highlight.classList.add('connector')
    highlight.setAttribute('name',area.getAttribute('title'))
    //document.body.appendChild(highlight);
    document.getElementById('all').appendChild(highlight);
    highlight.style.width = position.w;
    highlight.style.height = position.h;
    highlight.style.position = 'fixed';
    let y = parseFloat(coords[1])+picture.offsetTop;
    let x = parseFloat(coords[0])+picture.offsetLeft;
    highlight.style.top = position.y;
    highlight.style.left = position.x;
    highlight.style.zIndex = '1';

    highlight.addEventListener('mousedown',(event)=>{
        event.preventDefault();
        relocateHighlightsWithPicture(event);
    })
    const zoom = zoomPicture.bind(null,picture);
    highlight.addEventListener('wheel',zoom);

    const dClick = doubleClickArea.bind(null,highlight);
    highlight.addEventListener('click',dClick);
    setTimeout(()=>{
        highlight.removeEventListener('click',dClick);
        dbClick(highlight,()=>console.log("highlight one click"), ()=>console.log("highlight db click"));
    },300)

    

    activeHighlights.push(highlight);
    highlatedAreas.push(area);
    return highlight;
}
function getShapeCoordinates(area){
    let coords = area.getAttribute('coords').split(",");
    let width = (coords[2]-coords[0])+'px'; 
    let height = (coords[3]-coords[1])+'px'; 
    let y = parseFloat(coords[1])+picture.offsetTop + "px";
    let x = parseFloat(coords[0])+picture.offsetLeft + "px";
    return {w:width, h:height, y:y, x:x};
}
function getOriginalPictureSizes(originalPictureSize){
    let arr = originalPictureSize.split(",");
    let w = arr[0].substring(arr[0].indexOf(":")+1);
    let h = arr[1].substring(arr[1].indexOf(":")+1);
    return {w:w,h:h}
}
function removeAllHighlights(){
    document.querySelectorAll('.areaHighlights').forEach(e=>{
        document.getElementById('all').removeChild(e);
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
function doubleClickArea(element){
    jumpToFile(element.getAttribute('name'))
}
function jumpToFile(fileNumber, area){
   // if(area.getAttribute('class').includes('connector')){
        let file = findFileByPartualNumber(fileNumber)
        loadPictureWithAreas("uploads/jpg/P&IDs/Kiewit/"+file.fileNumber+".jpg", file.filePoints)
    //}
}
function findFileByPartualNumber(fileNumber){
    return files.find(e=>e.fileNumber.includes(fileNumber));
}
function zoomPicture(){

    let size = picture.getBoundingClientRect();
    let startW = picture.offsetWidth; // get current width of picture
    let startH = picture.offsetHeight;
    let correction = window.innerWidth*0.028
    correction = 0 //to turn off correction (it was caused by menu, now they overlap and no need for correction)
    
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
        areaX = areaX*zoomIn-correction; //this is X of where mosue was pointed before zooming
        areaY *= zoomIn; //this is Y of where mosue was pointed before zooming
        
            
    //scroll out   
    }else if(event.deltaY>0 && startW/window.innerWidth>0.2){
        scale *=zoomOut;
        areaX = areaX*zoomOut+correction; //this is X of where mosue was pointed before zooming
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
