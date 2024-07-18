let files;

function showNewUploads(){
    let itmes = document.getElementById('items');
    fetch("/data/get-files")
        .then(resp=>resp.json())
        .then(data=>{
            items.appendChild(buildList(Array.from(data)));
        })
}

function buildList(arr){
    let list = document.createElement('ul');
    arr.forEach(e=>{
        let item = document.createElement('li');
        item.setAttribute('id',e.id);
        list.appendChild(item);
        item.textContent = e.number;
        item.addEventListener('click', ()=>{
            //frame.setAttribute('src',e.folder+e.number)
            editPid(e.id);
        })
    })
    return list;
}

function itemEvent(item, action){

}

function deleteKiewit(){
    fetch('/data/delete-kiewit',{ method: 'DELETE' });
}

function editPid(id){
    $.get('/file/edit?id='+id, function(data) {
        $('#formContainer').html(data);
    });
}
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
    console.log(JSON.stringify(files[40]))
    }catch(err){
        console.log(err)
    }    
}
//getAllFiles();





/************************************************************************************************
 List Groups:
    P&IDs by vendor: get list of vendors/ each vendor gets list of P&IDs/each P&ID opens P&ID, shows items/each item
    P&IDs by system
    Heat Trace
    Electircal
    Isomentrics
 */