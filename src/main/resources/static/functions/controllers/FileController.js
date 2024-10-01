let fileRepository;
let filesAreLoded = false;
let fileByEqId = {};
fileWithPoints = [];

let vendors=[];
let systems = [];
let heatTracePanels = [];
let electricalPanels = [];

let categories;
let file;
let lightFile;

let completedPid = [];
let incompletePid = [];

let baseFileApiUrl = "/file-api/";

function getPostMetaDataWithStringBody(data){
    return{
        method: 'POST',
        headers: {
            'X-CSRF-TOKEN': token,
            'Content-Type': 'application/json'
        },
        body:data
    }
}

function filePutWithBody(data){
    return{
        method: 'POST',
        headers: {
            'X-CSRF-TOKEN': token,
            'Content-Type': 'application/json'
        },
        body:JSON.stringify(data)
    }
}

function filePatchWithBody(data){
    return{
        method: 'PATCH',
        headers: {
            'X-CSRF-TOKEN': token,
            'Content-Type': 'application/json'
        },
        body:JSON.stringify(data)
    }
}

async function getAllFiles(){
    let link = '/fileObjects/get-all-light';
    try{
        const resp = await fetch(link); 
        const data = await resp.json();
        fileRepository = [...data];
        fileRepository.forEach(element => {
            element['value'] = element.fileNumber;
        });
    filesAreLoded = true;
    }catch(err){
        console.log(err)
    }    
}

async function getFileFromDbByLink(link) {
    try {
        const response = await fetch('/fileObjects/get-by-link/'+link);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        file = { ...data };
        return data;
    } catch (error) {
        console.error('Error fetching file:', error);
    }
}

async function getFileByLink(link) {
    try {
        const response = await fetch('/fileObjects/get-by-link',getPostMetaDataWithStringBody(link));
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        file = { ...data };
        return data;
    } catch (error) {
        console.error('Error fetching file:', error);
    }
}

async function getUploadFileForm(){
    const response = await fetch('/file/upload');
    const data = await response.text();
    return data;
}

async function getCategories(){
    const response = await fetch('/data/get-categories');
    const data = await response.json();
    categories = data;
    categories.forEach(e=>{
        e['getContent'] = function(){
            if(e.value.toLowerCase().includes("vendor"))return vendors;
            else if(e.value.toLowerCase().includes("system"))return systems;
            else if(e.value.toLowerCase().includes("heat trace"))return heatTracePanels;
            else if(e.value.toLowerCase().includes("electrical"))return electricalPanels;
        }
        e['dropdownFunc'] = function(event){createDropdownItem(this.getContent(e.value), event.target.parentNode);}.bind(e) 
    })
    return data;
}

async function getVendors(){
    const response = await fetch('/data/get-vendors');
    const data = await response.json();
    data.forEach(e=>{
        let i = {
            'value': e,
            'getContent': function() {
              return getFilesByVendor(e);
            }
          };
          i.dropdownFunc = function(event) {
            createDropdownItem(this.getContent(), event.target.parentNode);
          }.bind(i);
          vendors.push(i);
    });
    return data;
}

async function getSystems(){
    const resp = await fetch('/data/get-systems');
    const data = await resp.json();
    data.forEach(e=>{
        let i = {};
        i.value = e;
        i.getContent = function(){return getFilesBySystem(e.system.name)};
        i.dropdownFunc = function(event){createDropdownItem(this.getContent(), event.target.parentNode);}.bind(i);
        systems.push(i);
    })
    return data;
}

async function getHtPanels(){
    const resp = await fetch('/data/get-htPanels');
    const data = await resp.json();
    data.forEach(e=>{
        let i = {};
        i.value = e;
        i.getContent = async function(){return await getHtBreakers(e)};
        i.dropdownFunc = async function(event){
            createDropdownItem(await this.getContent(), event.target.parentNode);
            console.log(e);
            let panelSchedule;
            fileRepository.forEach(f=>{if(f && f.name && f.name.includes(e))panelSchedule=f});
            if(panelSchedule)await loadPictureWithLightFile(panelSchedule);
        }.bind(i);
        heatTracePanels.push(i);
    })
    return data;
}

async function getHtBreakers(panel){
    const resp = await fetch('/data/get-htBrakers/'+panel)
    const data = await resp.json();
    data.forEach(e=>{
        e.value = 'BR:'+e.brNumber;
        e.getContent = function(){return getFilesByHtBreaker(e);};
        e.dropdownFunc = function(event){createDropdownItem(this.getContent(), event.target.parentNode);}.bind(e);
    });
    return data;
}

function getFilesByHtBreaker(breaker){
    let fileIds = [];
    let eqIds = [];
    let hts = breaker.equipmentList;
    if(hts){
        hts.forEach(e=>{
            if(e.htIso) fileIds.push(e.htIso.id);
            if(e.pid) e.pid.forEach(p=>fileIds.push(p.id));
            if(e.equipmentList)e.equipmentList.forEach(eq=>eqIds.push(eq.id))
        });
    }

    let result =  fileRepository.filter(e=>e!==null && e.id!==null && fileIds.includes(e.id));
    result.forEach(e=>{
        e['dropdownFunc'] = async function(){
            await loadPictureWithLightFile(e);
            setTimeout(() => {
                eqIds.forEach(id=>{
                highlightEq(id);
                })
            }, 500);

            
        }
        e.value = e.fileNumber;
    })
    return result;
}

async function getElPanels(){
    const resp = await fetch('/data/get-elPanels');
    const data = await resp.json();
    data.forEach(e=>{
        let i = {};
        i.value = e;
        i.getContent = function(){return getFilesByPenalTag(e)};
        i.dropdownFunc = function(event){createDropdownItem(this.getContent(), event.target.parentNode);}.bind(i);
        electricalPanels.push(i);
    })
    return data;
}

async function editFile(itemId){
    console.log('/edit/itmem/'+itemId);
}

function getVendor(vendor){
    return fileRepository.filter(e=>e.fileNumber.includes(vendor));
}

function getFilesByVendor(vendor){
    let result =  fileRepository.filter(e=>e!==null && e.vendor!==null && e.vendor.name.toLowerCase().includes(vendor.toLowerCase()) && e.fileType.name==='PID');
    result.forEach(e=>{
        e['dropdownFunc'] = function(){loadPictureWithLightFile(e);} 
        // e['dropdownFunc'] = function(){loadPictureWithFile(e);} 
        e.value = e.fileNumber;
    })
    return result;
}

function getFilesBySystem(system){
    let result =  fileRepository.filter(e=>e.relatedSystems.includes(system));
    result.forEach(e=>{
        e['dropdownFunc'] = function(){loadPictureWithLightFile(e);} 
        e.value = e.fileNumber;
    })
    return result;
}

function getFilesByPenalTag(tagNumber){
    let result =  fileRepository.filter(e=> e.name && e.name.toLowerCase().includes(tagNumber.toLowerCase()) || e.fileNumber.toLowerCase().includes(tagNumber.toLowerCase()));
    result.forEach(e=>{
        e['dropdownFunc'] = function(){loadPictureWithLightFile(e)};
        e.value = e.name ? e.name : e.fileNumber
        // console.log(e.fileNumber);
    });
    return result;
}

async function submitFile(file){
    const resp = await fetch('/file-api/',filePutWithBody(file));
    const data = await resp.text();

}

async function getCompletedFiles(){
    const resp = await fetch('/file-api/completed');
    const data = await resp.json();
    completedPid = data;
}

async function getIncompleteFiles(){
    const resp = await fetch('/file-api/incomplete');
    const data = await resp.json();
    incompletePid = data;
}

async function updateFileStatus(id,status){
    await updateFileEditStep('eqTagNumber',id);
    const resp = await fetch('/file-api/'+id+'/'+status,putNoBody);
    const data = await resp.json();
}

async function updateFileEditStep(step, id){
    let empty = {};
    empty.id = fileWithPoints.id;
    if(id)empty.id = id;
    empty.bulkEditStep = step;

    const resp = await fetch(baseFileApiUrl,filePatchWithBody(empty));
    const data = await resp.json();
    return data;
}

async function getSkippedFiles(){
    const resp = await fetch(baseFileApiUrl+'skip')
    const data = await resp.json();
    return data;
}

async function getPdfAndConvertToJpg(id){
    const resp = await fetch(baseFileApiUrl+'convert/'+id);
    const data = await resp.text();
    return data;
}

async function getFileWithCopiedPoints(sourceId,destId){
    console.log(sourceId+'||'+destId);
    const resp = await fetch(baseFileApiUrl+'copy-file-points/'+sourceId+'/'+destId);
    const data = await resp.json();
    console.log(JSON.stringify(data))
    return data;
}

async function getFileIdByDocNum(docNum){
    const resp = await fetch(baseFileApiUrl+'get-id/'+docNum);
    const data = await resp.text();
    return data;
}

async function getFileByEqId(eqId){
    const resp = await fetch(baseFileApiUrl+'get-file-by-eq-id/'+eqId);
    const data = await resp.json();
    fileByEqId = data;
    return data;
}

async function openEqFile(eqId){
    try {
        const url = `/file/show-eq-in-file/${eqId}/${isUpdating}`;
        window.open(url, '_blank', 'width=800,height=600');
    } catch (error) {
        console.error('Error:', error);
    }
}