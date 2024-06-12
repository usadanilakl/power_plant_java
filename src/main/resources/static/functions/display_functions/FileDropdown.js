function openDropdown(){
    // Select all elements of a certain class
    const elements = document.querySelectorAll('.dropdownDk');
    // Add a click event listener to each element
    elements.forEach(element => {
    const itemHolder = document.createElement('ul');
    element.parentElement.appendChild(itemHolder);
    element.addEventListener('click', function() {
        // Send a GET request when the element is clicked
        console.log('/data/get-items/'+element.getAttribute('id')+'?group=placeholder')
        fetch('/data/get-items/'+element.getAttribute('id')+'?group=placeholder')
        .then(response =>response.json())
        .then(data => fillDropdownWithItems(data,element.parentElement))
        .catch(error => console.error('Error:', error));
    });
    });
}

function fillDropdownWithItems(items,element){
   let list = element.querySelector('ul');
   console.log(element.querySelector('ul'))
   items.forEach(e=>{
    let item = document.createElement('li');
    let button = document.createElement('a');
    let list2 = document.createElement('ul');

    button.classList.add('btn');
    button.textContent = e;
    button.addEventListener('click', function() {
        // Send a GET request when the element is clicked
        fetch('/data/get-items/'+e)
        .then(response => response.json())
        .then(data => fillDropdownWithItems(data,element.querySelector('ul')))
        .catch(error => console.error('Error:', error));
    });
    button.setAttribute('id',e);
    item.appendChild(button);
    list.appendChild(item);

    
   })
}
