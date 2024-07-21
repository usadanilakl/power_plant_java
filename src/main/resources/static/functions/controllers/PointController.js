let revisedExcelPoints = [];

let addLotoPointToEqUrl = '/points/add-loto-point/' //{eqId}/{pointOldId}
let createNewEqUrl = '/points/'

function getPostMetaDataWithBody(data){
    return{
        method: 'POST',
        headers: {
            'X-CSRF-TOKEN': token,
            'Content-Type': 'application/json'
        },
        body:JSON.stringify(data)
    }
}

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

async function getHtmlPointInfoForm(){
    const response = await fetch('/point/get-html-info-form');
    const data = await response.text();
    return data;
}

async function updatePoint(obj){
    // console.log(JSON.stringify(selectedArea));
    // selectedArea.coordinates = getNewAreaCoorinates(selectedArea);
    console.log(JSON.stringify(obj))
    let newObj = updateSelectedArea(obj);
    console.log(JSON.stringify(newObj));
    const response = await fetch(createNewEqUrl,getPostMetaDataWithBody(selectedArea));
    const data = await response.json();
    return data;
    
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

async function createNewEq(obj){
    const response = await fetch(createNewEqUrl,getPostMetaDataWithBody(obj));
    const data = await response.json();
    return data;
}

async function deletePoint(id){
    const response = await fetch(createNewEqUrl+id, deleteNoBody);
    const data = await response.text();
    file.points = file.points.filter(e=>e.id!==id);
    console.log(data)

}


getRevisedExcelPoints();

