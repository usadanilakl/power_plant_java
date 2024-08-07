/***********************************************************************************************************************************
 * Building HTML form for each field of an object with searchable dropdowns:
 *  create an input with lable for each field of source object
 *  if field contains another object then create searchable dropdown for it
 *  assign an event listener for each form field to auto update respective field in the object
 *************************************************************************************************************************************/
const events = ['input', 'change', 'blur'];
async function buildFormFromObject(point){
    let form = document.createElement('form');
    for(let e in point){
        let div = document.createElement('div'); //input container
        div.classList.add('searchable-dropdown');
        form.appendChild(div);
        div.classList.add('form-group'); //bootstrap styling for input container
        let label = document.createElement('label'); //input name
        label.style.color = "white";
        div.appendChild(label);
        label.setAttribute('for',e);//connect label and input
        label.textContent = e;
        let input = document.createElement('input');
        div.appendChild(input);
        input.setAttribute('id',e);
        input.classList.add('form-control'); //bootstrap styling for input field
        input.value = point[e]; //assign value of given field to input field
        input.style.width = '100%';
        input.readOnly = true; //to prevent editing (edit mode will remove it)
        input.autocomplete = 'off';
        
        if(modes.editMode.state) input.readOnly = false;

        if(hideFormFields(point, e)) input.parentElement.classList.add('hide'); //this hides all listed fields
        let isCat = await isCategory(e);

        if(isCat){
            let cat;
            categoryObjects.forEach(c=>{if(c.alias===e)cat=c}); 
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
            input.setAttribute('data-object-id', point[e].id); //this is category object id from DB for proper mapping
            input.autocomplete = 'off';
            input.addEventListener('focus', () => input.classList.add("show")); //to show dropdown items when input is selected
            input.addEventListener('keyup', () => filterOptions(input,options)); //to filter options as user types into input field

            let items = await getValuesOfCategoryAlias(e); //get all values of given category
            let valuesOfCat = items.map(e=>e.name); //used it before when dropdowns could only take string values and not objects

            if(modes.editMode.state){

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
                    setCatPopup(e,items);
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

        input.addEventListener("input",(event)=>{
            let opt = event.target;
            if(isCat){
                point[e].id = opt.getAttribute('data-object-id');
                point[e].name= opt.textContent ;//assign value from input field back to object;
            }else{
                point[e] = input.value;
            }
            console.log(point[e]); //print assignment
        })
        
        input.addEventListener('click',async ()=>{
            let clipBoardText = await checkClipboardAndPasteShort(input);
            if(!isCat){
                point[e]= clipBoardText ;
            }
    }); //paste function 
        
    }

    
    if(point.objectType==="Equipment"){

        let lotoPointContainer = document.createElement('div');
        lotoPointContainer.id = 'loto-point-container';
        form.appendChild(lotoPointContainer);

        let submitButton = document.createElement('button');
        submitButton.id = 'eq-submit-button';
        submitButton.type = 'button';
        submitButton.classList.add('btn');
        submitButton.classList.add('btn-success');
        submitButton.textContent = 'Submit';
        submitButton.addEventListener('click',()=>{
            updatePoint(point);
            changeSubmitButtonToGreen(submitButton);
        })
        form.appendChild(submitButton);
        // document.getElementById('infoWindowPoint').appendChild(submitButton);

        let deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.classList.add('btn');
        deleteButton.classList.add('btn-danger');
        deleteButton.textContent = "Delete";
        deleteButton.addEventListener('click',()=>deletePoint(point.id))
        form.appendChild(deleteButton);
        // document.getElementById('infoWindowPoint').appendChild(deleteButton);
        getDataFromForm(form,oldFormData);
        getDataFromForm(form,newFormData);
        form.addEventListener('click',()=>{
            setTimeout(()=>{if(changeDetector(form)) changeSubmitButtonToRed(submitButton)},300);
        });
    }

    return form;
}

async function buildOptionsFromObject(){}

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
    console.log(items)
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



let hiddenEquipmentFields = [
    'id',
    'objectType',
    'name',
    'coordinates',
    'originalPictureSize',
    'lotoPoints',
    'specificLocation',
    'files',
    'mainFile'
]

let hiddenLotoPointFields = [
    'id',
    'objectType',
    'name',
    'lotos',
    'equipmentList',
    'oldId',
    'normalPosition',
    'isolatedPosition'
]

function hideFormFields(point, key){
    if(point.objectType === "Equipment" && hiddenEquipmentFields.includes(key)) return true;
    if(point.objectType === "LotoPoint" && hiddenLotoPointFields.includes(key)) return true;
    return false;
}

function changeSubmitButtonToRed(b){
    b.classList.remove('btn-success');
    b.classList.add('btn-danger');    
}
function changeSubmitButtonToGreen(b){
    b.classList.remove('btn-danger');
    b.classList.add('btn-success');    
}

let oldFormData = {};
let newFormData = {};

function changeDetector(form){
    getDataFromForm(form, newFormData);
    console.log(newFormData.description);
    console.log(oldFormData.description);
    let isChanged = false;
    if(Object.keys(oldFormData).length>0){
        isChanged = !compareObjects(oldFormData, newFormData);
    }
    oldFormData = {...newFormData};
    return isChanged;
}

function getDataFromForm(form,obj){
    const inputs = form.querySelectorAll('input');
    inputs.forEach(e=>obj[e.id]=e.value)
}

function compareObjects(obj1, obj2) {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) {
        return false;
    }

    return keys1.every(key => {
        const val1 = obj1[key];
        const val2 = obj2[key];
        if (typeof val1 === 'object' && typeof val2 === 'object') {
            return compareObjects(val1, val2); // Recursively compare nested objects
        }
        return val1 === val2;
    });
}




