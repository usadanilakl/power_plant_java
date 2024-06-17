//let picture = document.getElementById("picture");
//let map = document.getElementById("map");
let oldWidth; 

function loadPictureWithAreas(src, areas){
    picture.setAttribute('src',src);
    setAreas(areas);
}
function setAreas(areas){
    map.innerHTML = "";
    removeAllHighlights();
    let n = 1;

    areas.forEach(e=>{
        oldWidth = getOriginalPictureSizes(e.originalPictureSize).w;
        let area = createAreaElement(e);
        let shape = createHighlight(area);
        //doubleClick(shape, e);
        map.appendChild(area);
    });
    resizeAreas();
    resizeHighlites();
    
}
function createAreaElement(area){
    
    let coord = getAreaCoordinates(area.coordinates);
    let newArea = document.createElement('area');
    newArea.setAttribute('alt',area.label);
    newArea.setAttribute('title', area.name);
    newArea.setAttribute('href',area.label);
    newArea.setAttribute('class',"ar");
    newArea.setAttribute('id',coord);
    //newArea.classList.add(area.type);
    newArea.setAttribute('coords', coord);
    newArea.setAttribute('shape',"rect");
    return newArea;
}
function getAreaCoordinates(coord){
    let arr = coord.split(",");
    let result = 
    arr[0].substring(arr[0].indexOf(":")+1)+","+
    arr[1].substring(arr[1].indexOf(":")+1)+","+
    arr[2].substring(arr[2].indexOf(":")+1)+","+
    arr[3].substring(arr[3].indexOf(":")+1);

    console.log(result)
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
function resizeHighlites(){
    
    let allHighlites = document.querySelectorAll('.areaHighlights');
    allHighlites.forEach(e=>{
        let area = document.getElementById(e.getAttribute('id').slice(0,-1));
       e.style.top = getShapeCoordinates(area).y; 
       e.style.left = getShapeCoordinates(area).x;
       e.style.width = getShapeCoordinates(area).w;
       e.style.height = getShapeCoordinates(area).h;
       console.log(JSON.stringify(getShapeCoordinates(area)));

       //console.log(parseFloat((e.style.top.replace('px',''))-picture.offsetTop)*coefficient + picture.offsetTop+ 'px');
    })
}
function createHighlight(area){
    let position = getShapeCoordinates(area);
    let coords = area.getAttribute('coords').split(",");
    let highlight = document.createElement('div');
    highlight.setAttribute('id', area.getAttribute('id') + "h");
    highlight.setAttribute('class','areaHighlights');
    //document.body.appendChild(highlight);
    document.getElementById('all').appendChild(highlight);
    highlight.style.width = position.w;
    highlight.style.height = position.h;
    highlight.style.position = 'fixed';
    let y = parseFloat(coords[1])+picture.offsetTop;
    let x = parseFloat(coords[0])+picture.offsetLeft;
    highlight.style.top = position.y;
    highlight.style.left = position.x;
    highlight.style.zIndex = '10';
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
    })
}
function highlightAll(){

}