/****************************************************************************************************************************************************************************************
 *                                                                      Point Flow Process
 * On click on area:
    * Get equipment ifo
    * Open info window
    * Fill info window with 3 dropdowns: Equipment, LOTO points, Related Data
    * Each dropdown will have table/form that contains information related to the equipment:
 * 
 * On click on the Equipment dropdown button: 
    * Create a form for each field of the equipment
    * Create mode function that would enable editing
    * Wire it to end point to update edits        
 * 
 ****************************************************************************************************************************************************************************************/




function getExcelPointsByLabel(label){
    let result = [];
    revisedExcelPoints.forEach(e=>{
        if(formatLabel(e.label).includes(formatLabel(label)) ) result.push(e);
    })
    return result;
}

function formatLabel(label){
    // console.log("label: "+label)
    let result = label.toLowerCase();
    result = result.trim();
    result = result.replace(/-/g, "");
    if(result.startsWith("01") || result.startsWith("02") || result.startsWith("00") || result.startsWith("**")) result = result.substring(2);
    // console.log("result: "+result)
    return result;
}

function trimToLowerCaseRemoveDashes(label){
        let result = label.toLowerCase();
        result = result.trim();
        result = result.replace(/-/g, "");
        return result;
}

function showPointInfo(point){
    let form = document.createElement('form');
    for(let e in point){
        let div = document.createElement('div');
        form.appendChild(div);
        div.classList.add('form-group');
        let label = document.createElement('label');
        div.appendChild(label);
        label.setAttribute('for',e);
        label.textContent = e;
        let input = document.createElement('input');
        div.appendChild(input);
        input.setAttribute('id',e);
        input.classList.add('form-control');
        input.value = point[e];
        input.readOnly = true;
    }
    return form;
}

function excelPointDropdown(points){
    let list = document.createElement('ul');
    points.forEach(e=>{
        let item = document.createElement('li');
        list.appendChild(item);
        let buttons = document.createElement('div');
        item.appendChild(buttons);
        buttons.classList.add('flex-inline');
        let button = document.createElement('button');
        buttons.appendChild(button);
        let formContainer = document.createElement('div');
        item.appendChild(formContainer);

        button.textContent = e.label;
        button.addEventListener('click', ()=>{
            if(formContainer.children.length === 0){
                formContainer.appendChild(showPointInfo(e));
            }else{
                formContainer.innerHTML = "";
            }
        });
        let addButton = document.createElement('button');
        buttons.appendChild(addButton);
        addButton.classList.add('addButtons');
        addButton.textContent = "ADD";
        // if(!modes.lotoMode.status) addButton.classList.add('hide');
        // else addButton.classList.remove('hide');
        addButton.addEventListener('click',()=>addPointToLotoWindow(e));
    });
    return list;
}

// async function fillPointInfoWindow(id){ //Old Version
//     let form = await getPointInfoForm(id);
//     let infoFrame = document.getElementById('infoFramePoint');
//     let infoContainer = document.getElementById('infoWindowPoint');
//     if(infoContainer === null) newInfoWindow("Point");
//     if(infoFrame.classList.contains('hide')) infoFrame.classList.remove('hide');
//     infoContainer.innerHTML = "";
//     infoContainer.innerHTML = form;
//     createCategoryOptions("equipment");
//     createCategoryOptions("vendor");
//     createCategoryOptions("location");
//     createCategoryOptions("system");
// }



async function fillExcelPointInfoWindow(points){
    let form = excelPointDropdown(points);
    let infoFrame = document.getElementById('infoFrameOld-LOTO-Points');
    let infoContainer = document.getElementById('infoWindowOld-LOTO-Points');
    if(infoContainer === null) newInfoWindow("Old-LOTO-Points");
    if(infoFrame.classList.contains('hide')) infoFrame.classList.remove('hide');
    infoContainer.innerHTML = "";
    infoContainer.appendChild(form);
}

function excelPointSearch(searchValue){
    let result = [];
    revisedExcelPoints.forEach(e=>{
        if(trimToLowerCaseRemoveDashes(e.label).includes(trimToLowerCaseRemoveDashes(searchValue)) || trimToLowerCaseRemoveDashes(searchValue).includes(trimToLowerCaseRemoveDashes(e.label))) result.push(e);
    })
    return result;
}

function buildPointSearchField(){
    let div = document.createElement('div');
    div.classList.add('searchInputField');
    let input = document.createElement('input');
    div.appendChild(input);
    input.setAttribute('type','text');
    input.setAttribute('placeholder','search');
    let button = document.createElement('button');
    div.appendChild(button);
    button.textContent = "Search";
    button.addEventListener('click', ()=>{
        let points = excelPointSearch(input.value);
        fillExcelPointInfoWindow(points);
    });
    return div;
} 


/************************************************************************************************************************************ *
 * HTML Point Form functions
************************************************************************************************************************************ */
function getPointFromArrById(id){
    return file.points.find(e => e.id === id);
}
async function fillPointInfoWindow(id){
    // let point = await getPoint(id);
    // let point = getPointFromArrById(id);
    let point = id;
    let form = await getHtmlPointInfoForm(id.id);
    let formInfo = convertToFormDto(point);
    let infoFrame = document.getElementById('infoFramePoint');
    let infoContainer = document.getElementById('infoWindowPoint');
    if(infoContainer === null) newInfoWindow("Point");
    if(infoFrame.classList.contains('hide')) infoFrame.classList.remove('hide');
    infoContainer.innerHTML = "";
    infoContainer.innerHTML = form;
    setFormValues(infoContainer,formInfo);
    if(modes.editMode.state){
        //removeReadOnly();
        createSearchableDropdown("equipment");
        createSearchableDropdown("vendor");
        createSearchableDropdown("location");
        createSearchableDropdown("system");
    }

}

function convertToFormDto(point){
    let formDto = {
        tagNumber:point.tagNumber,
        description:point.description,
        specificLocation:point.specificLocation,
        mainFile:point.mainFile,
        files:point.files,
        id:point.id,
        coordinates:point.coordinates,
        originalPictureSize:point.originalPictureSize


    }

    if (point.vendor && point.vendor.name) formDto.vendor = point.vendor.name;
    if (point.location && point.location.name) formDto.location = point.location.name;
    if (point.system && point.system.name) formDto.system = point.system.name;
    if (point.eqType && point.eqType.name) formDto.eqType = point.eqType.name;
    return formDto;
}

function setFormValues(form, values) {
    for (const key in values) {
        if (values.hasOwnProperty(key)) {
            let element = form.querySelector(`[id="${key}"]`);
            if (element.tagName.toLowerCase() === 'div') {
                const inputInsideDiv = element.querySelector('input');
                if (inputInsideDiv) {
                    element = inputInsideDiv;
                }
            }
            if (element) {
                element.value = values[key];
            }
        }
    }
}

async function createSearchableDropdown(category){
    const response = await fetch('/category/get-'+category);
    const data = await response.json();   
    let stringData = data.map(e=>e.name); 
    buildDropdown(category,stringData,()=>setCatPopup(category, stringData));
}

let setCatPopup = async function(category,list){
    const popup = await setupPopup(category);
    buildDropdown("edit-existing",list, null);
    buildDropdown("delete-existing",list, null);
}

function removeReadOnly(element){
    if(element===null) element = document.getElementById('point-info-form');
    
    console.log(element)
    let inputs = element.querySelectorAll('input');
    inputs.forEach(e=>{
        e.removeAttribute('readonly');
    })
}

function applyReadOnly(element){
    if(element===null) element = document.getElementById('point-info-form');
    let inputs = element.querySelectorAll('input');
    inputs.forEach(e=>{
        e.setAttribute('readonly',true);
    })
}


/******************************
 * Need to collect values from form
 * Add then into object
 * Update DB
 * *************************************** */
function collectFormValues(form) {
    let formInfo = new FormData(form);
    let formObj = {};

    // Collect all form data except for 'select' elements
    formInfo.forEach((value, key) => {
        if (!form.querySelector(`[name="${key}"]`).tagName.toLowerCase() === 'select') {
            formObj[key] = value;
        }
    });

    // Collect all options from 'select' elements
    form.querySelectorAll('select').forEach(select => {
        let options = Array.from(select.options).map(option => option.value);
        formObj[select.name] = options;
    });

    return formObj;
}

function addOptionToSelect(selectElement, optionText, optionValue) {
    let option = document.createElement("option");
    option.text = optionText;
    option.value = optionValue;
    selectElement.add(option);
}


/**************************************
 * Put/Collect arrays in form using <select>
 * Add function to add new options to select from UI that will be added to DB
 * ***************************************** */