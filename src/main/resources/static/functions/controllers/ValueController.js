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
let patchNoBody = {
    method: 'PATCH',
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
let deleteValueUrl = "/values"
const getCatPopupUrl = "/cat/popup"
const getRefractorPopupUrl = "/cat/refractor-popup"

let categoryObjects = [];
let allAliases = [];
let valuesByCategory = {};

async function getValuesOfCategoryAlias(e){
    const resp = await fetch('/category/get-'+ e);
    const data = await resp.json();
    return data;
}

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

async function deleteWithRefactor(oldValue,newValue){
    const url = "/values/"+oldValue+"/"+newValue;
    const response = await fetch(url,deleteNoBody);
    const data = await response.json();
    console.log(JSON.stringify(data))
}

async function crudValue( method,category,value,newValue){
    let operation;
    let endpoint = createValueUrl+"/"+category+"/"+value;
    if(newValue!==null)endpoint = endpoint+"/"+newValue;
    if(method === "POST") operation = postNoBody; 
    if(method === "PUT") operation = putNoBody;
    if(method === "DELETE"){
        operation = deleteNoBody; 
        endpoint = deleteValueUrl+'/'+value
    } 
    const response = await fetch(endpoint,operation);
    const data = await response.json();
    console.log(JSON.stringify(data))
    if(data.action && data.action==='reassign'){
        setupRefractorPopup(data.categoryAlias,data.oldValue,data.list)
    }else{
        fillPointInfoWindow(selectedArea);
    }
    
}


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

async function getRefractorPopup(id){
    const response = await fetch(getRefractorPopupUrl);
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

async function getAllCategories(){
    const resp = await fetch('/category/');
    const data = await resp.json();
    allAliases = [...data];
    return data;
}

async function getAllCategoryObjects(){
    const resp = await fetch('/category/all');
    const data = await resp.json();
    categoryObjects = data;
    return data;
}

async function getCategoryByAlias(e){
    const resp = await fetch('/category/by-alias/'+e);
    const data = await resp.json();
    return data;
}

async function getAllValuesOfEachCategory(){
    for(let a of allAliases){
        valuesByCategory[a] = await getValuesOfCategoryAlias(a);
    }
}