let fileRepository;
let filesAreLoded = false;

let vendors=[];
let categories;
let file;

let completedPid = [];
let incompletePid = [];


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
        const response = await fetch('/fileObjects/get-by-link/' + link);
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
            else if(e.value.toLowerCase().includes("heat trace"))return heatTrace;
            else if(e.value.toLowerCase().includes("electrical"))return electircal;
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
    let result =  fileRepository.filter(e=>e.systems.includes(system));
    result.forEach(e=>{
        e['dropdownFunc'] = loadPictureWithFile(e);
    })
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
    const resp = await fetch('/file-api/'+id+'/'+status,putNoBody);
    const data = await resp.json();
}

  