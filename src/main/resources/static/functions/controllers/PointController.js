let revisedExcelPoints = [];
let oldLotoPoints = [];

let addLotoPointToEqUrl = '/points/add-loto-point/' //{eqId}/{pointOldId}
let baseEqUrl = '/points/';
let baseEqApiUrl = '/eq-api/';

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

function getPatchMetaDataWithBody(data){
    return{
        method: 'PATCH',
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

async function getOldExcelPoints(){
    let response = await fetch('/point/get-old-excel-points');
    let data = await response.json();
    oldExcelPoints = data;
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
    //let newObj = updateSelectedArea(obj);
    let message = equipmentFormValidation(obj);
    console.log(message);
    if(message!==null){
        displayMessagePopup(message);
        return;
    }
    const response = await fetch(baseEqUrl,getPostMetaDataWithBody(selectedArea));
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
    let updatedEq;
    if(oldId && eqId){
        let url = addLotoPointToEqUrl+eqId+"/"+oldId
        resp = await fetch(url,putNoBody);
        updatedEq = await resp.json();
        if(updatedEq && updatedEq.id){
        selectedArea.lotoPoints = updatedEq.lotoPoints;
        fillPointInfoWindow(selectedArea);
        }
    }else console.log("oldId: "+oldId + "eq id: " + eqId);
}

async function createNewEq(obj){
    console.log(obj.id);
    obj.id=null;
    const response = await fetch(baseEqUrl,getPostMetaDataWithBody(obj));
    const data = await response.json();
    console.log(data.id)
    return data;
}

async function deletePoint(id){
    const response = await fetch(baseEqUrl+id, deleteNoBody);
    const data = await response.text();
    file.points = file.points.filter(e=>e.id!==id);
    console.log(data)

}


/**********************************************************************************************************************8
 * Field By Field
 ***********************************************************************************************************************/
async function updateEqTagNumber(point){
    let message = tagValidation(point.tagNumber);
    if(message!==null){
        console.log(message);
        displayMessagePopup(message);
        return;
    }

    let emptyEqObj = {};
    emptyEqObj.tagNumber = point.tagNumber;
    emptyEqObj.coordinates = point.coordinates;
    emptyEqObj.lotoPoints = [...point.lotoPoints];

    if(point.isNew){
        point.id=null;
        console.log(JSON.stringify(point))
        return await createNewEq(point);
    }else{
        emptyEqObj.id = point.id;
        const response = await fetch(baseEqApiUrl,getPatchMetaDataWithBody(emptyEqObj));
        const data = await response.text();
        return data;
    }
}

async function updateEqDescription(point){
    let message = tagValidation(point.description);
    if(message!==null){
        console.log(message);
        displayMessagePopup(message);
        return;
    }

    let emptyEqObj = {};
    
    emptyEqObj.description = point.description;
    emptyEqObj.id = point.id;
    emptyEqObj.lotoPoints = [... point.lotoPoints]
    const response = await fetch(baseEqApiUrl,getPatchMetaDataWithBody(emptyEqObj));
    const data = await response.text();
    return data;
    
}

async function updateEqLocation(point){
    let message = locationValidation(point.location);
    if(message!==null){
        console.log(message);
        displayMessagePopup(message);
        return;
    }

    let emptyEqObj = {};
    
    emptyEqObj.location = point.location;
    emptyEqObj.id = point.id;
    emptyEqObj.lotoPoints = [... point.lotoPoints]
    const response = await fetch(baseEqApiUrl,getPatchMetaDataWithBody(emptyEqObj));
    const data = await response.text();
    return data;
    
}

async function updateIsoPos(point,directOnly){
    let directLotoPoint = point.lotoPoints.find(e=>e.tagNumber===point.tagNumber);
    if(directOnly){
        let message = isoPosValidation(directLotoPoint.isoPos);
        if(message!==null){
            console.log(message);
            displayMessagePopup(message);
            return;
        }
    }else{
        point.lotoPoints.forEach(e=>{
            let message = isoPosValidation(e.isoPos);
            if(message!==null){
                console.log(message);
                displayMessagePopup(message);
                return;
            }
        })
    }


    let emptyEqObj = {};
    
    emptyEqObj.id = point.id;
    emptyEqObj.lotoPoints = [... point.lotoPoints]
    console.log(JSON.stringify(emptyEqObj.lotoPoints[0]))
    const response = await fetch(baseEqApiUrl,getPatchMetaDataWithBody(emptyEqObj));
    const data = await response.text();
    return data;
    
}

async function updateNormPos(point,directOnly){
    let directLotoPoint = point.lotoPoints.find(e=>e.tagNumber===point.tagNumber);
    if(directOnly){
        let message = normPosValidation(directLotoPoint.normPos);
        if(message!==null){
            console.log(message);
            displayMessagePopup(message);
            return;
        }
    }else{
        point.lotoPoints.forEach(e=>{
            let message = normPosValidation(e.normPos);
            if(message!==null){
                console.log(message);
                displayMessagePopup(message);
                return;
            }
        })
    }


    let emptyEqObj = {};
    
    emptyEqObj.id = point.id;
    emptyEqObj.lotoPoints = [... point.lotoPoints]
    console.log(JSON.stringify(emptyEqObj.lotoPoints[0]))
    const response = await fetch(baseEqApiUrl,getPatchMetaDataWithBody(emptyEqObj));
    const data = await response.text();
    return data;
    
}

async function updateNormPos(point,directOnly){
    let directLotoPoint = point.lotoPoints.find(e=>e.tagNumber===point.tagNumber);
    if(directOnly){
        let message = normPosValidation(directLotoPoint.normPos);
        if(message!==null){
            console.log(message);
            displayMessagePopup(message);
            return;
        }
    }else{
        point.lotoPoints.forEach(e=>{
            let message = normPosValidation(e.normPos);
            if(message!==null){
                console.log(message);
                displayMessagePopup(message);
                return;
            }
        })
    }


    let emptyEqObj = {};
    
    emptyEqObj.id = point.id;
    emptyEqObj.lotoPoints = [... point.lotoPoints]
    const response = await fetch(baseEqApiUrl,getPatchMetaDataWithBody(emptyEqObj));
    const data = await response.text();
    return data;
    
}

async function updateSystem(point){
    let message = systemValidation(point.system);
    if(message!==null){
        console.log(message);
        displayMessagePopup(message);
        return;
    }

    let emptyEqObj = {};
    
    emptyEqObj.system = point.system;
    emptyEqObj.id = point.id;
    console.log(JSON.stringify(emptyEqObj))
    const response = await fetch(baseEqApiUrl,getPatchMetaDataWithBody(emptyEqObj));
    const data = await response.text();
    return data;
    
}

async function updateEqType(point){
    let message = eqTypeValidation(point.eqType);
    if(message!==null){
        console.log(message);
        displayMessagePopup(message);
        return;
    }

    let emptyEqObj = {};
    
    emptyEqObj.eqType = point.eqType;
    emptyEqObj.id = point.id;
    const response = await fetch(baseEqApiUrl,getPatchMetaDataWithBody(emptyEqObj));
    const data = await response.text();
    return data;
    
}


/**********************************************************************************************************************8
 * Loto Point Controller
 ***********************************************************************************************************************/
