let fileRepository;
let filesAreLoded = false;

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