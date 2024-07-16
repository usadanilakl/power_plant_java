let postNoBody = {
    method: 'POST',
    headers: {
        'X-CSRF-TOKEN': token,
        'Content-Type': 'application/json'
    }
}
let createValueUrl = "/category/create";



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