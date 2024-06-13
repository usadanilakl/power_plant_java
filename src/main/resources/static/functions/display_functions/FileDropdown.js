function openDropdown(){
    const elements = document.querySelectorAll('.dropdownDk'); // Select all elements of a certain class
    elements.forEach(element => { 
    const itemHolder = document.createElement('ul'); // Create item container for next level list
    element.parentElement.appendChild(itemHolder); //Add container to the li of current level list
    element.addEventListener('click', function() {
        
        fetch('/data/get-subgroups/'+element.getAttribute('id').toLocaleLowerCase()) // Send a GET request when the element is clicked
        .then(response =>{
            return response.json().then(items=>{
            let data = {
                "itemType":response.headers.get("itemType"),
                "itemHolds":response.headers.get("itemHolds"),
                "field":response.headers.get("field"),
                "items":items
            }
            return data; 
        }) 
        })  
        
        .then(data => fillDropdownWithSubgroups(data,element.parentElement))
        .catch(error => console.error('Error:', error));
    });
    });
}

function fillDropdownWithSubgroups(data,element){
   let list = element.querySelector('ul'); //get container for items
   let items = data.items; //get items from previous response (if subgroup vendor, then items would be: Kiewit, Mitsu ...)
   let itemType = data.itemType; //get item type from previous response (subgroup/item/result)
   let itemHolds = data.itemHolds; //get info what item holds from previous response (subgroup/item/result)
   let field = data.field; //get field that holds value (subgroup vendor)

   items.forEach(e=>{
    let item = document.createElement('li'); //holds links to next level and container for the next level items
    let button = document.createElement('a'); //Link to the next level
    let list2 = document.createElement('ul'); //container for the next level

    button.classList.add('btn'); //style link to look like button
    button.textContent = e; //text of the button

    let link; //link for the request
    if(itemHolds==="subgroups") link='/data/get-subgroups/'+e; //will get Strings with group names
    if(itemHolds==="items") link='/data/get-items/'+e+'?field='+field; //will get file objects

    button.addEventListener('click', function() { //Send get request on click
        fetch(link)
        .then(response => handleResponse(response)) 
        .then(data =>{
            if(data.itemHolds==='subgroups')fillDropdownWithSubgroups(data,item);
            else if(data.itemHolds==='items'){
                console.log("getting items")
                fillDropdownWithItems(data,item);
            } 
        })
        .catch(error => console.error('Error:', error));
    });
    button.setAttribute('id',e);
    item.appendChild(button);
    item.appendChild(list2);
    list.appendChild(item);
   })
}

function fillDropdownWithItems(items,element){
    let list = element.querySelector('ul');

    items.items.forEach(e=>{
     let item = document.createElement('li');
     let showFileButton = document.createElement('a');
     let editFileButton = document.createElement('a');
     let deleteFileButton = document.createElement('a');
 
     showFileButton.classList.add('btn');
     editFileButton.classList.add('btn');
     deleteFileButton.classList.add('btn');

     showFileButton.textContent = e.fileNumber;
     editFileButton.textContent = "Edit";
     deleteFileButton.textContent = "Delete";

    //  showFileButton.setAttribute('href','/data/display/'+e.id);
     editFileButton.setAttribute('href','/file/edit/'+e.id);
     deleteFileButton.setAttribute('href','/file/delete/'+e.id);

     showFileButton.addEventListener('click', function() {
         fetch('/data/display/'+e.id)
         .then(response => console.log("success"))
         .catch(error => console.error('Error:', error));
     });

    //  editFileButton.addEventListener('click', function() {
    //     fetch('/file/edit/'+e.id)
    //     .then(response => console.log("success"))
    //     .catch(error => console.error('Error:', error));
    // });

    // deleteFileButton.addEventListener('click', function() {
    //     fetch('/file/delete/'+e.id)
    //     .then(response => console.log("success"))
    //     .catch(error => console.error('Error:', error));
    // });
     item.appendChild(showFileButton);
     item.appendChild(editFileButton);
     item.appendChild(deleteFileButton);
     list.appendChild(item);
    })
 }

 function handleResponse(response){
    return response.json().then(items=>{
    let data = {
        "itemType":response.headers.get("itemType"),
        "itemHolds":response.headers.get("itemHolds"),
        "field":response.headers.get("field"),
        "items":items
    }
    return data; 
}) 
}


 /*************************************************
  * send request: /data/get-items/vendors?group=all&type=items
  * get list of vendors where each item in the list holds items
  * 
  * send request: /data/get/kiewit?group=vendor&type=last
  * filter files by column vendor with value kiewit and 
  * *********************************************** */