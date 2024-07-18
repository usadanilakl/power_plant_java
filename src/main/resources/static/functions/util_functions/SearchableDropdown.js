
function buildDropdown(id, items, buttonAction) {
    let dropdown = document.createElement('div');
    dropdown.classList.add('searchable-dropdown');
    dropdown.classList.add('form-group');
    dropdown.id = "sdropdown-"
    //let dropdownHolder = document.getElementById(id);
    let dropdownHolder = document.querySelector(`[data-sdropdown=${id}]`)
    let oldValue;
    if(dropdownHolder.children.length>0) oldValue = dropdownHolder.querySelector('input').value;
    dropdownHolder.innerHTML="";
    dropdownHolder.appendChild(dropdown);


    let label = document.createElement('label');
    label.setAttribute('for',`${id}-input`);
    label.textContent = id;
    dropdown.appendChild(label);

    let inputWithAddButton = document.createElement('div');
    inputWithAddButton.style.display = "inline-block";
    dropdown.appendChild(inputWithAddButton);

    let input = document.createElement('input');
    input.setAttribute('type', 'text');
    input.setAttribute('data-object-info',id);
    input.id = `${id}-input`;
    input.placeholder = "Select " + id;
    if(oldValue) input.value = oldValue;
    input.addEventListener('focus', () => showOptions(id));
    input.addEventListener('keyup', () => filterFunction(id));
    inputWithAddButton.appendChild(input);
    inputWithAddButton.classList.add('form-control');
    // input.classList.add('form-control');

    if(buttonAction){
        let addButton = document.createElement('button');
        addButton.textContent = "+";
        inputWithAddButton.appendChild(addButton);

        addButton.addEventListener('click',buttonAction);
        addButton.setAttribute('type','button')   
    }


    let options = buildOptions(id, items);
    dropdown.appendChild(options);

    // Add the event listener after appending options to the dropdown
    document.addEventListener('click', function(event) {
        var isClickInside = document.getElementById(`${id}-input`).contains(event.target) || document.getElementById(`${id}-options`).contains(event.target);
        if (!isClickInside) {
            document.getElementById(`${id}-options`).classList.remove("show");
        }
    });

    options.addEventListener('click', function(event) {
        if (event.target.tagName.toLowerCase() === 'div') {
            document.getElementById(`${id}-input`).value = event.target.textContent;
            document.getElementById(`${id}-options`).classList.remove("show");
        }
    });

    return dropdown;
}

function addOptionsToExistingInput(id, items, buttonAction) { //not working
    let dropdownHolder = document.querySelector(`[data-sdropdown=${id}]`);
    let dropdown = dropdownHolder.querySelector('.searchable-dropdown');
    let input = dropdownHolder.querySelector('input');
    input.id = `${id}-input`;
    let addButton = dropdownHolder.querySelector('button');
    let oldValue;

    if(dropdownHolder.children.length>0) oldValue = input.value;

    if(buttonAction){
        addButton.addEventListener('click',buttonAction);
    }

    let options = buildOptions(id, items);
    dropdown.appendChild(options);

    // Add the event listener after appending options to the dropdown
    document.addEventListener('click', function(event) {
        var isClickInside = document.getElementById(`${id}-input`).contains(event.target) || document.getElementById(`${id}-options`).contains(event.target);
        if (!isClickInside) {
            document.getElementById(`${id}-options`).classList.remove("show");
        }
    });

    options.addEventListener('click', function(event) {
        if (event.target.tagName.toLowerCase() === 'div') {
            document.getElementById(`${id}-input`).value = event.target.textContent;
            document.getElementById(`${id}-options`).classList.remove("show");
        }
    });
}

function buildOptions(id, items) {
    let dropdownContent = document.createElement('div');
    dropdownContent.classList.add('searchable-dropdown-content');
    dropdownContent.id = `${id}-options`;
    items.forEach(e => {
        let option = document.createElement('div');
        option.textContent = e;
        dropdownContent.appendChild(option);
    });

    return dropdownContent;
}

function showOptions(id) {
    document.getElementById(`${id}-options`).classList.add("show");
}

function filterFunction(id) {
    var input, filter, div, i;
    input = document.getElementById(`${id}-input`);
    filter = input.value.toUpperCase();
    div = document.getElementById(`${id}-options`);
    div.classList.add("show");
    var options = div.getElementsByTagName("div");
    let hidden = 0;
    for (i = 0; i < options.length; i++) {
        var txtValue = options[i].textContent || options[i].innerText;
        if (txtValue.toUpperCase().indexOf(filter) > -1) {
            options[i].style.display = "";
        } else {
            options[i].style.display = "none";
            hidden++;
        }
    }
    if(input.value!==null && input.value!=="" && hidden === options.length){
        input.style.backgroundColor = "red";
    }else{
        input.style.backgroundColor = "white"; 
    }
}
