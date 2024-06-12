function openDropdown(){
    // Select all elements of a certain class
    const elements = document.querySelectorAll('.dropdownDk');
    // Add a click event listener to each element
    elements.forEach(element => {
    const itemHolder = document.createElement('ul');
    element.parentElement.appendChild(itemHolder);
    element.addEventListener('click', function() {
        // Send a GET request when the element is clicked
        fetch('/data/get-items/'+element.getAttribute('id')+'?group=placeholder?type=subgroups')
        .then(response =>response.json())
        .then(list => fillDropdownWithSubgroups(list,element.parentElement))
        .catch(error => console.error('Error:', error));
    });
    });
}

function fillDropdownWithSubgroups(items,element){
   let list = element.querySelector('ul');
   items.forEach(e=>{
    let item = document.createElement('li'); //holds links to next level
    let button = document.createElement('a'); //Link to the next level
    let list2 = document.createElement('ul'); //container for the next level

    button.classList.add('btn'); //style link to look like button
    button.textContent = e.value; //text of the button

    let link; //link for the request
    if(e.type==="subgroups") link='/data/get-subgroups/'; //will get Strings with group names
    if(e.type==="items") link='/data/get-items/'; //will get file objects

    button.addEventListener('click', function() { //Send get request on click
        fetch(link + e.vale + '?field='+e.group)
        .then(response => response.json())
        .then(data =>{
            if(e.type==='subgroups')fillDropdownWithSubgroups(data,element.querySelector('ul'));
            else if(e.type==='items')fillDropdownWithItems(data,element.querySelector('ul'));
        })
        .catch(error => console.error('Error:', error));
    });
    button.setAttribute('id',e);
    item.appendChild(button);
    list.appendChild(item);
   })
}

function fillDropdownWithItems(items,element){
    let list = element.querySelector('ul');
    items.forEach(e=>{
     let item = document.createElement('li');
     let button = document.createElement('a');
     let list2 = document.createElement('ul');
 
     button.classList.add('btn');
     button.textContent = e.value;
     button.addEventListener('click', function() {
         // Send a GET request when the element is clicked
         fetch('/data/get-items/'+e.vale+'?field='+e.group)
         .then(response => response.json())
         .then(data =>{
             if(e.type==='items')fillDropdownWithItems(data,element.querySelector('ul'));
             if(e.type==='subgroups')fillDropdownWithSubgroups(data,element.querySelector('ul'));
         })
         .catch(error => console.error('Error:', error));
     });
     button.setAttribute('id',e.value);
     item.appendChild(button);
     list.appendChild(item);
    })
 }


 /*************************************************
  * send request: /data/get-items/vendors?group=all&type=items
  * get list of vendors where each item in the list holds items
  * 
  * send request: /data/get/kiewit?group=vendor&type=last
  * filter files by column vendor with value kiewit and 
  * *********************************************** */