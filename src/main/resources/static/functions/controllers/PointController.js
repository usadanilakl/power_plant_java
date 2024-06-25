async function getPointInfoForm(id){
    const response = await fetch('/point/get-info-form/'+id);
    const data = await response.text();
    return data;
}

async function updatePoint(){
    let coordInputField = document.getElementById('coordinates');
    coordInputField.value = JSON.stringify(getNewAreaCoordinates(selectedArea))
    const response = await fetch('/point/update-point'+selectedArea.id)
    const data = await response.json;
    let index = fileRepository.findIndex(e=>e.id===picture.getAttribute('data-file-id'));  
    if(index!==-1) fileRepository.splice(index,1,data)
}

function findFile(path){
    let file = fileRepository.find(e=>e.fileLink===path);
    let pointArray = file.points;
    let index = pointArray.findIndex(e=>e.id===selectedArea.id);
    if(index!==-1) pointArray.splice(index,1,selectedArea)

}


