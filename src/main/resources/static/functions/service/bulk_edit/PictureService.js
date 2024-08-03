//let picture = document.getElementById("picture");
//let map = document.getElementById("map");
let oldWidth;
let originalWidth;
let activeHighlights = []; 
let highlatedAreas = [];
let selectedAres = [];
let selectedArea;
let selectedBundle = [];
let currentSizeCoefficient;
// let eqFormInfo; //moved to global variables

/*****************************************************DISPLAY FUNCTIONS*****************************************************************/

function loadPictureWithAreas(src, areas){
    picture.setAttribute('src',src);
    removeAllHighlights();
    setAreas(areas);
}
function loadPictureWithFile(file){
    picture.setAttribute('src','/'+file.fileLink);
    picture.setAttribute('data-file-id', file.id);
    removeAllHighlights();
    setAreas(file.points);
}
async function loadPictureWithLightFile(file){
    picture.setAttribute('src','/'+file.fileLink);
    picture.setAttribute('data-file-id', file.id);
    removeAllHighlights();
    fileWithPoints = await getFileFromDbByLink(file.fileNumber);
    setAreas(fileWithPoints.points);
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
            selectedArea = e;
            selectedAres.push(selectedArea);
            //removeAllHighlights();
            let highlight = createHighlight(area);
            selectedBundle.push({"area":area,"eq":e,"highlight":highlight});
            pointEditModeControl(); 
            console.log(selectedBundle.length)
            //fillPointInfoWindow(selectedArea);
            let points = getExcelPointsByLabel(e.tagNumber);
            fillExcelPointInfoWindow(points);
            //positionInfoWindowsInline();
            //  console.log(event.target)
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
    newArea.setAttribute('alt',area.tagNumber);
    newArea.setAttribute('title', area.tagNumber);
    newArea.setAttribute('data-point-id', area.id);
    //newArea.setAttribute('href',area.label);
    newArea.setAttribute('class',"ar");
    //newArea.classList.add(area.eqType.name.replace(/" "/g, ""));
    newArea.setAttribute('id',coord);
    //newArea.classList.add(area.type);
    newArea.setAttribute('coords', coord);
    newArea.setAttribute('shape',"rect");

    if(area.lotoPoints!=null && area.lotoPoints.length>0){
      if(area.lotoPoints[0].isolatedPosition.toLowerCase().includes('open')) newArea.setAttribute('data-loto-point-area', true); 
      else newArea.setAttribute('data-loto-point-area', false);
    } 

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
    currentSizeCoefficient = coefficient;
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

        // let info = e.querySelector('.highlightInfo');
        // info.style.width = info.offsetWidth * currentSizeCoefficient + "px";
        // info.style.height = 'auto';

        // let infput = info.querySelector('input');
        // infput.style.width = info.offsetWidth * currentSizeCoefficient + "px";
        // infput.style.height = 'auto';
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
        
    if(area.getAttribute('data-loto-point-area')==='true')highlight.setAttribute('data-loto-point-highlight',true);
    else if(area.getAttribute('data-loto-point-area')==='false')highlight.setAttribute('data-loto-point-highlight',false);

    highlight.addEventListener('mousedown',(event)=>{
        event.preventDefault();
        relocateHighlightsWithPicture(event); 
        
        // updatePointInfo(event);
    })

    const zoom = zoomPicture.bind(null,picture);
    highlight.addEventListener('wheel',zoom);

    function highlightOneClickFunction(){
        activeHighlights = activeHighlights.filter(e=>e.id!==highlight.id)
        selectedBundle = selectedBundle.filter(e=>e.highlight.id!==highlight.id)
        document.getElementById('all').removeChild(highlight);
        selectedArea = selectedBundle[selectedBundle.length-1].eq;
        fillExcelPointInfoWindow(getExcelPointsByLabel(selectedArea.tagNumber));
    }

    const dClick = doubleClickArea.bind(null,highlight);
    highlight.addEventListener('click',dClick);

    const highlightDbClick = ()=>{
        let counter = 0;
        const clickCounter = (event) => {
            if(event.target.classList.contains('highlightInfo') || event.target.tagName === "INPUT") return
            counter++;
            if (counter === 1) {
                setTimeout(() => {
                    if (counter === 1) {
                        highlightOneClickFunction();
                    } else if (counter > 1) {
                       console.log('double click');
                    }
                    counter = 0; // reset counter
                }, 300);
            }
        };
        highlight.addEventListener('click', clickCounter);
    }
    setTimeout(()=>{
        highlight.removeEventListener('click',dClick);
        // dbClick(highlight,()=>highlightOneClickFunction(), ()=>console.log("highlight db click"));
        highlightDbClick();
    },300)

    

    activeHighlights.push(highlight);
    highlatedAreas.push(area);
    initResize(highlight, true); //resizing tools setup (for editing)
    highlight.querySelectorAll('.corners').forEach(e=>{
        e.addEventListener('click', updatePointInfo)
    })

    let highlightInfo = document.createElement('div');
    let controls = document.createElement('div');
    let accept = document.createElement('button');
    let rename = document.createElement('button');

    accept.classList.add('highlight-control-accept');
    rename.classList.add('highlight-control-buttons');
    highlightInfo.classList.add('highlightInfo');
    accept.textContent = "+";
    rename.textContent = "X";
    controls.classList.add('highlight-controls')

    controls.appendChild(accept);
    controls.appendChild(rename);
    highlight.appendChild(controls);

    highlight.appendChild(highlightInfo);
    if(selectedArea && selectedArea.lotoPoints){
        if(editModes.lotoPoint.state){
            selectedArea.lotoPoints.forEach(e=>{
                let text = document.createElement('p');
                text.classList.add('responsive-text')
                text.textContent =  e.tagNumber;
                highlightInfo.appendChild(text); 
            }) 
        }else if(editModes.eqTagNumber.state){
            let text = document.createElement('p');
            text.classList.add('responsive-text')
            text.textContent =  selectedArea.tagNumber;
            highlightInfo.appendChild(text);            
        }  
    }
    


    return highlight;
}
function highlightModeControl(){

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
    originalWidth = w;
    return {w:w,h:h}
}
function removeAllHighlights(){
    document.querySelectorAll('.areaHighlights').forEach(e=>{
        document.getElementById('all').removeChild(e);
        activeHighlights = [];
        highlatedAreas = [];
    })
}
function removeHighlightById(id){
    let h = document.getElementById('id');
        document.getElementById('all').removeChild(h);
        // activeHighlights = [];
        // highlatedAreas = [];
    
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
    if(modes.viewMode.state) jumpToFile(element.getAttribute('name'))
    else if(modes.editMode.state) console.log('editing'+element.getAttribute('name'))
}
function jumpToFile(fileNumber, area){
   // if(area.getAttribute('class').includes('connector')){
        let file = findFileByPartualNumber(fileNumber)
        loadPictureWithAreas("/uploads/jpg/P&IDs/Kiewit/"+file.fileNumber+".jpg", file.points)
    //}
}
function findFileByPartualNumber(fileNumber){
    return fileRepository.find(e=>e.fileNumber.includes(fileNumber));
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

/************************************************************EDIT FUNCTIONS****************************************************************************/

let newHighlights = [];
let coords = {}
coords.getObjWidth = function(){return this.mouseOnPictureEnd.x-this.mouseOnPictureStart.x}.bind(coords);
coords.getObjHeight = function(){return this.mouseOnPictureEnd.y-this.mouseOnPictureStart.y}.bind(coords);
let areaInfo = {
    tagNumber:null,
    description:null,
    location:"",//{category:"Location",name:null,id:null},
    specificLocation:null,
    system:"",//{category:"System",name:null,id:null},
    files:null,
    mainFile:null,
    coordinates:null,
    originalPictureSize:null,
    vendor:"", //{category:"Vendor",name:null,id:null},
    eqType:"", //{category:"Equipment Type",name:null,id:null},
    lotoPoints:[]
}

function getPictureSize(){
    const style = window.getComputedStyle(picture);
    const paddingLeft = parseFloat(style.paddingLeft);
    const paddingRight = parseFloat(style.paddingRight);
    const picSizeWithoutPadding = picture.clientWidth - paddingLeft - paddingRight;
    return picSizeWithoutPadding;
}

function registerMouseCoordsOnPicture(event){
    let x = event.clientX - picture.offsetLeft;
    let y = event.clientY - picture.offsetTop;
    return{x:x,y:y};
}

function registerMouseCoordsOnScreen(event){
    let x = event.clientX;
    let y = event.clientY;
    return{x:x,y:y};
}

function getPictureCoordsOnScreen(){
    let x = picture.offsetLeft;
    let y = picture.offsetTop;
    return{x:x,y:y};
}

function getObjCoordOnPicture(object){
    let x = object.offsetLeft - picture.offsetLeft;
    let y = object.offsetTop - picture.offsetTop;
    let w = object.offsetWidth;
    let h = object.offsetHeight;
    return {x:x,y:y,w:w,h:h};
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

    if(coords.getObjWidth() < 20 && coords.getObjHeight() < 20) removeLastHighlight();
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
    //fillPointInfoWindow(selectedArea);
    
}

async function offsetSizing(picture){

const coefficientX = originalWidth/picture.offsetWidth;

coords.mouseOnPictureStart.x = Math.floor(coords.mouseOnPictureStart.x*coefficientX);
coords.mouseOnPictureStart.y = Math.floor(coords.mouseOnPictureStart.y*coefficientX);
coords.mouseOnPictureEnd.x = Math.floor(coords.mouseOnPictureEnd.x*coefficientX);
coords.mouseOnPictureEnd.y = Math.floor(coords.mouseOnPictureEnd.y*coefficientX);
}

function removeLastHighlight(){
    let i = newHighlights.length-1;
    newHighlights.pop().element.remove();
}

function resizeNewArea(area){
    let coefficient = picture.offsetWidth/originalWidth;
    let coord = area.getAttribute('coords').split(",");
    for(let i = 0; i<coord.length; i++){
        coord[i] = coord[i]*coefficient;
    }
    area.setAttribute('coords', ""+coord.join(","));
}

function pointEditModeControl(){
    if(modes.viewMode.state){
        hideAllResizeElements();
        //if(selectedArea) fillPointInfoWindow(selectedArea);
        
    }else if(modes.editMode.state){
        showAllResizeElements();
        //fillPointInfoWindow(selectedArea);
        document.querySelectorAll('.addButtons').forEach(e=>{
            e.classList.add('hide');
        })
    }
}

function convertCoordsToOriginalSize(event) {
    let coords = getObjCoordOnPicture(event.target);
    let extractedWidth = selectedArea.originalPictureSize.split(",")[0].trim();
    let w = parseInt(extractedWidth.substring(extractedWidth.indexOf(":")+1));
    let k = w / picture.clientWidth;
    // let k = w / picture.offsetWidth;
    let result =  {
            x: coords.x * k,
            y: coords.y * k,
            w: coords.w * k,
            h: coords.h * k
        };
    return result;
}

function getNewAreaCoordinates(area){
    let coords = getObjCoordOnPicture(area);
    return {
        startX:coords.x,
        startY:coords.y,
        endX:coords.x+w,
        endY:coords.y+h,
        width:coords.w,
        height:coords.y
    }

}

function formatCoordsForServer(coords){
    return {
        startX:coords.x,
        startY:coords.y,
        endX:coords.x + coords.w,
        endY:coords.y + coords.h,
        width:coords.w,
        height:coords.y
    }
}

function updatePointInfo(event){
    let newCoords = convertCoordsToOriginalSize(event);
    let updatedCoords = formatCoordsForServer(newCoords);
    let pointForm = document.getElementById('point-info-form');
    let coordsInputField = document.querySelector('[id="coordinates"]');
    let oldCoords = getAreaCoordinates(coordsInputField.value).split(",");
    // console.log(JSON.stringify(oldCoords));
    // console.log(updatedCoords);
    let result = JSON.stringify(updatedCoords).replace("{").replace("}");
    coordsInputField.value = result;
    selectedArea.coordinates = result;
    // let form = new FormData(pointForm);
    // form.set('coords',JSON.stringify(updatedCoords));
    // console.log(form.get('coords'));
}
