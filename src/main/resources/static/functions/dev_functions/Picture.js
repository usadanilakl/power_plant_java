let picture = document.getElementById('picture')
let pictureContainer = document.getElementById('picture-container')
let map = document.getElementById('map')

const zoom = zoomPicture.bind(null,picture);

drag(picture, pictureContainer);
pictureContainer.addEventListener('wheel',zoom);


function drag(picture,element){
    let isDragging = false;
    let startMouseX = 0;
    let startMouseY = 0;
    let startPictureX = 0;
    let startPictureY = 0;

if(element==null){
    picture.addEventListener('mousedown', function(event){

      if(event.button === 0){
        event.preventDefault();
        isDragging = true;
        startMouseX = event.clientX;
        startMouseY = event.clientY;
        startPictureX = picture.offsetLeft;
        startPictureY = picture.offsetTop;
      }
        
    });
    picture.addEventListener('mouseup', function(){isDragging=false});
    picture.addEventListener('mouseleave', function(){isDragging=false});
    picture.addEventListener('mousemove', function(event) {
        if (isDragging) {
          const offsetX = event.clientX - startMouseX;
          const offsetY = event.clientY - startMouseY;
          const newPictureX = startPictureX + offsetX;
          const newPictureY = startPictureY + offsetY;
      
          picture.style.left = `${newPictureX}px`;
          picture.style.top = `${newPictureY}px`;
        }
      });
}else{
    element.addEventListener('mousedown', function(event){
    if(event.button===0){  
        event.preventDefault();
        isDragging = true;
        startMouseX = event.clientX;
        startMouseY = event.clientY;
        startPictureX = picture.offsetLeft;
        startPictureY = picture.offsetTop;
    }
        
    });
    element.addEventListener('mouseup', function(){isDragging=false});
    element.addEventListener('mouseleave', function(){isDragging=false});
    element.addEventListener('mousemove', function(event) {
        if (isDragging) {
          const offsetX = event.clientX - startMouseX;
          const offsetY = event.clientY - startMouseY;
          const newPictureX = startPictureX + offsetX;
          const newPictureY = startPictureY + offsetY;
      
          picture.style.left = `${newPictureX}px`;
          picture.style.top = `${newPictureY}px`;
        }
      });
}
    
}

function zoomPicture(picture){

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
    // resizeAreas(picture); 
    // resizeShapes(); 
    resizeManualHighlites(); 

}

async function createAreas(areas){
    image.src = picture.getAttribute('src');
    oldWidth2 = {w:image.naturalWidth};
    let element = document.getElementById("map");
    element.innerHTML = "";

    areas.forEach(area=>{
        //console.log(JSON.stringify(area));
        let coord = JSON.stringify(area.area.startX)+","+ JSON.stringify(area.area.startY)+","+JSON.stringify(area.area.endX)+","+JSON.stringify(area.area.endY)
        //console.log(coords);
        let newArea = document.createElement('area');
        newArea.setAttribute('alt',area.description);
        newArea.setAttribute('title', area.name);
        newArea.setAttribute('href',area.id);
        newArea.setAttribute('class',"ar");
        newArea.setAttribute('id',coord);
        newArea.classList.add(area.type);
        newArea.setAttribute('coords', String(coord));
        newArea.setAttribute('shape',"rect");
        doubleClick(newArea, area);
        element.appendChild(newArea);

        
        });
}

function resizeAreas(picture){
    
    const rect = picture.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const coefficient = width/JSON.stringify(oldWidth2.w);
    
      //console.log(coefficient);
    //  console.log("old width: "+oldWidth2.w);

    let allAreas = document.querySelectorAll('.ar');
    allAreas.forEach(e=>{
        //console.log(e.getAttribute('coords'));
        let coord = e.getAttribute('coords').split(",");
        for(let i = 0; i<coord.length; i++){
        coord[i] = coord[i]*coefficient;
        }
        e.setAttribute('coords', ""+coord.join(","));
        //console.log(""+coord.join(","))
    });

    resizeHighlite();
    resizeManualHighlites();
    oldWidth2.w = width; 
}

function highlightArea(area){
    let picture = document.getElementById('picture');
    let position = highlighterPosition(area);
    let coords = area.getAttribute('coords').split(",");
    let highlight = document.createElement('div');
    highlight.setAttribute('id', area.getAttribute('id') + "h");
    highlight.setAttribute('class','areaHglrts');
    //document.body.appendChild(highlight);
    document.getElementById('all').appendChild(highlight);
    highlight.style.width = position.width;
    highlight.style.height = position.height;
    highlight.style.position = 'fixed';
    let y = parseFloat(coords[1])+picture.offsetTop;
    let x = parseFloat(coords[0])+picture.offsetLeft;
    highlight.style.top = position.y;
    highlight.style.left = position.x;
    highlight.style.zIndex = '10';
    drag(highlight,picContainer);
    //console.log(JSON.stringify(position))
    highlight.addEventListener('click',()=>{
        document.getElementById('all').removeChild(highlight);
        
    })
}

function resizeHighlite(){
    
    let allHighlites = document.querySelectorAll('.areaHglrts');
    allHighlites.forEach(e=>{
        let area = document.getElementById(e.getAttribute('id').slice(0,-1));
       e.style.top = highlighterPosition(area).y; 
       e.style.left = highlighterPosition(area).x;
       e.style.width = highlighterPosition(area).width;
       e.style.height = highlighterPosition(area).height;

       //console.log(parseFloat((e.style.top.replace('px',''))-picture.offsetTop)*coefficient + picture.offsetTop+ 'px');
    })
}

function highlighterPosition(area){
    let picture = document.getElementById('picture');
    let coords = area.getAttribute('coords').split(",");
    let width = (coords[2]-coords[0])+'px'; 
    let height = (coords[3]-coords[1])+'px'; 
    let y = parseFloat(coords[1])+picture.offsetTop + "px";
    let x = parseFloat(coords[0])+picture.offsetLeft + "px";
    return {width:width, height:height, y:y, x:x};
}

function removeAllHighlights(){
    document.querySelectorAll('.areaHglrts').forEach(e=>{
        document.getElementById('all').removeChild(e);
    })
}

function showAllAreas(){
    document.querySelectorAll('.ar').forEach(e=>{
        highlightArea(e);
    })
}
