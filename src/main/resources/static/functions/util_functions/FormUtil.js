/***********************************************************************************************************************************
 * Building HTML form for each field of an object with searchable dropdowns:
 *  create an input with lable for each field of source object
 *  if field contains another object then create searchable dropdown for it
 *  assign an event listener for each form field to auto update respective field in the object
 *************************************************************************************************************************************/

async function buildFormFromObject(point){
    let form = document.createElement('form');
    for(let e in point){
        let div = document.createElement('div'); //input container
        div.classList.add('searchable-dropdown');
        form.appendChild(div);
        div.classList.add('form-group'); //bootstrap styling for input container
        let label = document.createElement('label'); //input name
        div.appendChild(label);
        label.setAttribute('for',e);//connect label and input
        label.textContent = e;
        let input = document.createElement('input');
        div.appendChild(input);
        input.setAttribute('id',e);
        input.classList.add('form-control'); //bootstrap styling for input field
        input.value = point[e]; //assign value of given field to input field
        input.readOnly = true; //to prevent editing (edit mode will remove it)

        if(hideFormFields(point, e)) input.parentElement.classList.add('hide'); //this hides all listed fields
        let isCat = await isCategory(e);

        if(isCat){            
            let cat;
            categoryObjects.forEach(c=>{
                if(c.alias===e)cat=c
            });
            if(!point[e]){
                point[e] = {id:null,
                    category:cat,
                    name:"no data"
                };
            } 
            
            label.textContent = point[e].category.name;
            input.value = point[e].name

            input.setAttribute('data-object-field', e); //this is the field name of main object, ex: point.vendor/point.eqType
            input.setAttribute('data-object-category', point[e].category.name); //this is category name for display, ex: Vendor/Equipment Type
            input.setAttribute('data-object-id', point[e].id); //this is object id from DB for proper mapping
            input.addEventListener('focus', () => input.classList.add("show")); //to show dropdown items when input is selected
            input.addEventListener('keyup', () => filterOptions(input,options)); //to filter options as user types into input field

            let resp = await fetch('/category/get-'+ e); //get all values of given category
            let items = await resp.json();
            let valuesOfCat = items.map(e=>e.name);

            if(modes.editMode.state){
                input.readOnly = false;

                let inputWrapper = document.createElement('div');
                inputWrapper.classList.add('input-group');
                input.parentNode.insertBefore(inputWrapper, input);
                inputWrapper.appendChild(input);

                let buttonWrapper = document.createElement('div');
                buttonWrapper.classList.add('input-group-append');
                inputWrapper.appendChild(buttonWrapper);

                let editButton = document.createElement('button');
                editButton.classList.add('btn')
                editButton.classList.add('btn-outline-secondary')
                editButton.type = 'button';
                editButton.innerText = '+';
                buttonWrapper.appendChild(editButton);
                editButton.addEventListener('click',()=>{
                    setCatPopup(e,valuesOfCat);
                });
            }



            let options = buildCategoryOptions(e, items); //build options for given category
            div.appendChild(options);

            document.addEventListener('click', function(event) { //this hides options if clicked away
                if(input){
                    var isClickInside = input.contains(event.target) || options.contains(event.target);
                    if (!isClickInside) {
                        options.classList.remove("show");
                    } 
                }
        
            });
        
            options.addEventListener('click', function(event) { //this assignes value of the option to input field 
                let opt = event.target;
                if (opt.tagName.toLowerCase() === 'div') {
                    input.value = opt.textContent;
                    input.setAttribute('data-object-id',event.target.getAttribute('data-object-id'));
                    options.classList.remove("show");
                    point[e].id = opt.getAttribute('data-object-id');
                    point[e].name= opt.textContent ;//assign value from input field back to object;
                }
                console.log(point[e]); //print assignment
            });
        }

        input.addEventListener('input',(event)=>{
            let opt = event.target;
            if(isCat){
                point[e].id = opt.getAttribute('data-object-id');
                point[e].name= opt.textContent ;//assign value from input field back to object;
            }else{
                point[e] = input.value;
            }
            console.log(point[e]); //print assignment
        })
        input.addEventListener('click',()=>checkClipboardAndPasteShort(input));
    }

    let submitButton = document.createElement('button');
    submitButton.type = 'button';
    submitButton.textContent = 'Submit';
    submitButton.addEventListener('click',()=>updatePoint(point))
    form.appendChild(submitButton);

    let deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener('click',()=>deletePoint(point.id))
    form.appendChild(deleteButton);
    return form;
}

function filterOptions(input, div) {
    let filter = input.value.toUpperCase();
    div.classList.add("show");
    var options = div.getElementsByTagName("div");
    let hidden = 0;
    for (let i = 0; i < options.length; i++) {
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

function buildCategoryOptions(id, items) {
    let dropdownContent = document.createElement('div');
    dropdownContent.classList.add('searchable-dropdown-content');
    dropdownContent.id = `${id}-options`;
    items.forEach(e => {
        let option = document.createElement('div');
        option.textContent = e.name;
        option.setAttribute('data-object-id',e.id);
        dropdownContent.appendChild(option);
    });

    return dropdownContent;
}


function isObject(element){
        if (typeof element === "object" && element !== null && !Array.isArray(element)) {
            return true;
        } else {
            return false;
        }
    
}

async function isCategory(key){
    // allAliases.forEach(e=>{
    //     if(e===key) return true
    // })
    if(allAliases.includes(key))return true;
    return false;
}

let hiddenEquipmentFields = [
    'id',
    'objectType',
    'name',
    'coordinates',
    'originalPictureSize',
    'lotoPoints'
]

function hideFormFields(point, key){
    if(point.objectType === "Equipment" && hiddenEquipmentFields.includes(key)) return true
    return false;
}





