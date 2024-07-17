let revisedExcelPoints = [];

async function getRevisedExcelPoints(){
    let response = await fetch('/point/get-revised-excel-points');
    let data = await response.json();
    revisedExcelPoints = data;
    return data;
}

async function getPointInfoForm(id){
    const response = await fetch('/point/get-info-form/'+id);
    const data = await response.text();
    return data;
}
async function getPoint(id){
    const response = await fetch('/points/get-point/'+id);
    const data = await response.json();
    return data;
}

async function getHtmlPointInfoForm(id){
    const response = await fetch('/point/get-html-info-form/'+id);
    const data = await response.text();
    return data;
}

async function updatePoint(){
    console.log(JSON.stringify(selectedArea));
    selectedArea.coordinates = getNewAreaCoorinates(selectedArea);
}

function findFile(path){
    let file = fileRepository.find(e=>e.fileLink===path);
    let pointArray = file.points;
    let index = pointArray.findIndex(e=>e.id===selectedArea.id);
    if(index!==-1) pointArray.splice(index,1,selectedArea)

}

getRevisedExcelPoints();

let button = document.getElementById('pointUpdateButton');
button.addEventListener('click',updatePoint);


