/***********************************************************************************************************************************
 * Building HTML form for each field of an object with searchable dropdowns:
 *  create an input with lable for each field of source object
 *  if field contains another object then create searchable dropdown for it
 *  assign an event listener for each form field to auto update respective field in the object
 *************************************************************************************************************************************/

function buildFormFromObject(point){
    let form = document.createElement('form');
    for(let e in point){
        let div = document.createElement('div'); //input container
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

        if(isObject(e)){
            label.textContent = e.category.name;
            input.value = e.name

            input.setAttribute('data-object-field', e); //this is the field name of main object, ex: point.vendor/point.eqType
            input.setAttribute('data-object-category', e.category.name); //this is category name for display, ex: Vendor/Equipment Type
            input.setAttribute('data-object-id', e.id); //this is object id from DB for proper mapping
            input.addEventListener('focus', () => input.classList.add("show")); //to show dropdown items when input is selected
            input.addEventListener('keyup', () => filterFunction(input,options)); //to filter options as user types into input field
            let options = buildOptions(id, items); //build options for given category
            div.appendChild(options);

            document.addEventListener('click', function(event) {
                if(input){
                    var isClickInside = input.contains(event.target) || options.contains(event.target);
                    if (!isClickInside) {
                        options.classList.remove("show");
                    } 
                }
        
            });
        
            options.addEventListener('click', function(event) {
                if (event.target.tagName.toLowerCase() === 'div') {
                    input.value = event.target.textContent;
                    document.getElementById(`${id}-options`).classList.remove("show");
                    eqFormInfo[input.getAttribute('data-object-info')] = event.target.textContent;
                    
                }
            });
        }
    }
    return form;
}

function filterFunction(input, div) {
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
    updateEqFormInfo(input);
    
}

function updateEqFormInfo(input){ //need to update - this is old version.
    let key = input.getAttribute('data-object-info');
    if(eqFormInfo.hasOwnProperty(key)) eqFormInfo[key] = input.value;
}

function isObject(element){
        if (typeof element === "object" && element !== null && !Array.isArray(element)) {
            return true;
        } else {
            return false;
        }
    
}

