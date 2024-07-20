let postNoBody = {
    method: 'POST',
    headers: {
        'X-CSRF-TOKEN': token,
        'Content-Type': 'application/json'
    }
}
let putNoBody = {
    method: 'PUT',
    headers: {
        'X-CSRF-TOKEN': token,
        'Content-Type': 'application/json'
    }
}
let deleteNoBody = {
    method: 'DELETE',
    headers: {
        'X-CSRF-TOKEN': token,
        'Content-Type': 'application/json'
    }
}
let createValueUrl = "/category";
const getCatPopupUrl = "/cat/popup"



function dropdownSelection(){
    const dropdown = event.target;
    var x = dropdown.value;
    const category = dropdown.id;
    console.log(category);
    // var x = document.getElementById(id).value;
    if(x === "-1") {
        setupPopup(category);
    }
}

async function createCategoryOptions(category){
    const response = await fetch('/category/get-'+category);
    const data = await response.json();
    let dropdown = document.getElementById(category);

    let title = document.createElement('option');
    title.value = "";
    title.textContent = "Select "+category;
    dropdown.appendChild(title);

    data.forEach(e=>{
        let option = document.createElement('option');
        option.value = e.name;
        option.textContent = e.name;
        dropdown.appendChild(option);
    })

    let add = document.createElement('option');
    add.value = -1;
    add.textContent = "Add New Item";
    dropdown.appendChild(add);
}

async function createNewValue(category,value){
    const response = await fetch(createValueUrl+"/"+category+"/"+value,postNoBody);
    const data = await response.json();
    console.log(JSON.stringify(data));
    fillPointInfoWindow(selectedArea.id);
}

async function crudValue( method,category,value,newValue){
    let operation;
    let endpoint = createValueUrl+"/"+category+"/"+value;
    if(newValue!==null)endpoint = endpoint+"/"+newValue;
    if(method === "POST") operation = postNoBody; 
    if(method === "PUT") operation = putNoBody;
    if(method === "DELETE") operation = deleteNoBody; 
    const response = await fetch(endpoint,operation);
    const data = await response.json();
    console.log(JSON.stringify(data));
    fillPointInfoWindow(eqFormInfo);
}

// async function getCatPopup(id){
//     const response = await fetch(getCatPopupUrl);
//     const data = await response.text();
//     let div = document.createElement('div');
//     div.id = "cat-popup-container";
//     div.innerHTML = data;
//     div.querySelector('#popupModal'+id);
//     return div;
// }

async function getCatPopup(id){
    const response = await fetch(getCatPopupUrl);
    const data = await response.text();
    let div = document.createElement('div');
    div.id = "cat-popup-container";
    div.innerHTML = data;
    let modal = div.querySelector('#popupModal');
    if (!modal) {
        console.error('Modal element not found.');
    }
    modal.id = 'popupModal-'+id
    return div;
}