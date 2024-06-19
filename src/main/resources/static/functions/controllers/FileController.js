async function getAllFiles(){
    try{
        const data = await fetch('/data/get-files', { 
        method: 'GET',
        headers:{
        //'X-CSRF-TOKEN': csrfToken,
        'Content-Type': 'application/json'
        } 
    }); 
    files = await data.json();
    //console.log(JSON.stringify(files[40]))
    return files;
    
    }catch(err){
        console.log(err)
    }    
}