//let picture = document.getElementById("picture");
//let map = document.getElementById("map");
let oldWidth = picture.naturalWidth; 

function loadPictureWithAreas(src, areas){
    picture.setAttribute('src',src);
    setAreas(areas);
}



function setAreas(areas){
    map.innerHTML = "";
    let n = 1;
    areas.forEach(e=>{
    let coord = e.coordinates;
    let shape = createRectangle(e);
    //doubleClick(shape, e);
    map.appendChild(shape);

    });
}

function createRectangle(area){
    let newArea = document.createElement('area');
    newArea.setAttribute('alt',area.description);
    newArea.setAttribute('title', area.name);
    newArea.setAttribute('href',area.label);
    newArea.setAttribute('class',"ar");
    newArea.setAttribute('id',area.coordinates);
    //newArea.classList.add(area.type);
    newArea.setAttribute('coords', coordinateTranslator(area.coordinates));
    newArea.setAttribute('shape',"rect");
    
}
function coordinateTranslator(coord){
    let arr = coord.split(",");
    let result = 
    arr[0].substring(arr[0].indexOf(":")+1)+","+
    arr[1].substring(arr[1].indexOf(":")+1)+","+
    arr[3].substring(arr[3].indexOf(":")+1)+","+
    arr[2].substring(arr[2].indexOf(":")+1);

    console.log(result)
    return result;
}