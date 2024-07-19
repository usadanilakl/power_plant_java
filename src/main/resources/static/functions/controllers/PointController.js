let revisedExcelPoints = [];

// let postNoBody = {
//     method: 'POST',
//     headers: {
//         'X-CSRF-TOKEN': token,
//         'Content-Type': 'application/json'
//     }
// }
// let putNoBody = {
//     method: 'PUT',
//     headers: {
//         'X-CSRF-TOKEN': token,
//         'Content-Type': 'application/json'
//     }
// }
// let deleteNoBody = {
//     method: 'DELETE',
//     headers: {
//         'X-CSRF-TOKEN': token,
//         'Content-Type': 'application/json'
//     }
// }
// let createValueUrl = "/category";
// const getCatPopupUrl = "/cat/popup"


let addLotoPointToEqUrl = '/points/add-loto-point/' //{eqId}/{pointOldId}

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

async function addPointToEquipment(lotoPoint){
    console.log("adding loto point to equipment" + lotoPoint.tagNumber)
    let oldId = lotoPoint.originalId;
    let eqId = selectedArea.id;
    let resp;
    if(oldId && eqId){
        let url = addLotoPointToEqUrl+eqId+"/"+oldId
       resp = await fetch(url,putNoBody);
       updatedEq = await resp.json();
       if(updatedEq && updatedEq.id){
            console.log(JSON.stringify(updatedEq))
            selectedArea = updatedEq;
            let updatedPoints = [];
            updatedEq.lotoPoints.forEach(e=>{
            updatedPoints.push(convertToLotoPointFormDto(e));
            });
            eqFormInfo.lotoPoints = updatedPoints;
            fillPointInfoWindow(eqFormInfo)
            getFileFromDbByLink(file.fileNumber)
       }console.log("Updated result: "+JSON.stringify(updatedEq))
       
    }else console.log("oldId: "+oldId + "eq id: " + eqId);
}


getRevisedExcelPoints();

let button = document.getElementById('pointUpdateButton');
button.addEventListener('click',updatePoint); 