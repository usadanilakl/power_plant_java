let fileRepository;
let filesAreLoded = false;

let vendors=[];
let categories;

async function getAllFiles(){
    try{
        const data = await fetch('/data/get-files', { 
        method: 'GET',
        headers:{
        //'X-CSRF-TOKEN': csrfToken,
        'Content-Type': 'application/json'
        } 
    }); 
    fileRepository = await data.json();
    fileRepository.array.forEach(element => {
        element['value'] = element.fileNumber;
    });
    filesAreLoded = true;
    }catch(err){
        console.log(err)
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