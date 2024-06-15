//let picture = document.getElementById("picture");
//let map = document.getElementById("map");
let oldWidth = picture.naturalWidth; 

function loadPictureWithAreas(src, areas){
    picture.setAttribute('src',src);
    setAreas(areas);
}



function setAreas(areas){
    map.innerHTML = "";
    areas.forEach(e=>{
        let coord = e.coordinates;
        console.log(coord);
        console.log(JSON.stringify(e));
        // let newArea = document.createElement('area');
        // newArea.setAttribute('alt',area.description);
        // newArea.setAttribute('title', area.name);
        // newArea.setAttribute('href',area.id);
        // newArea.setAttribute('class',"ar");
        // newArea.setAttribute('id',coord);
        // newArea.classList.add(area.type);
        // newArea.setAttribute('coords', String(coord));
        // newArea.setAttribute('shape',"rect");
        // doubleClick(newArea, area);
        // element.appendChild(newArea);
    });
}