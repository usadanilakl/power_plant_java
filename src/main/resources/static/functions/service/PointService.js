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


/***********************************************************************************************************************************
 * Excel Points and LotoPoints functions
 *************************************************************************************************************************************/

function getExcelPointsByLabel(label){
    let result = [];
    revisedExcelPoints.forEach(e=>{
        if(formatLabel(e.tagNumber).includes(formatLabel(label)) ) result.push(e);
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
        input.addEventListener('click',()=>{copyToClipboard(input)})
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

        button.textContent = e.tagNumber;
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
        addButton.classList.add('hide');

        if(modes.lotoMode.state || modes.editMode.state){
            addButton.classList.remove('hide');
            const lotoModeAction = function(){
                addPointToLotoWindow(e);
            }
            const editModeAction = function(){
                addPointToEquipment(e);
            }
            if(modes.lotoMode.state)addButton.addEventListener('click',lotoModeAction);
            if(modes.editMode.state)addButton.addEventListener('click',editModeAction);
        }

    });
    return list;
}

async function lotoPointDropdown(points){
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

        button.textContent = e.tagNumber;
        button.addEventListener('click', async ()=>{
            if(formContainer.children.length === 0){
                // formContainer.appendChild(showPointInfo(e));//old version
                const form = await buildFormFromObject(e);
                formContainer.appendChild(form);
            }else{
                formContainer.innerHTML = "";
            }
        });
        let addButton = document.createElement('button');
        buttons.appendChild(addButton);
        addButton.classList.add('addButtons');
        addButton.textContent = "-";
        addButton.classList.add('hide');

        if(modes.editMode.state){
            
            addButton.classList.remove('hide');
            const editModeAction = function(){
                removePointFromEquipment(e);
            }
            addButton.addEventListener('click',editModeAction);
        }

    });
    return list;
}

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

async function fillPointInfoWindow(point){//old way was eqFormInfo in setArea() in picture service
    let form = await buildFormFromObject(point); //this is new way
    // let form = await getHtmlPointInfoForm();//this is old way
    let infoFrame = document.getElementById('infoFramePoint');
    let infoContainer = document.getElementById('infoWindowPoint');
    if(infoContainer === null) newInfoWindow("Point");
    if(infoFrame.classList.contains('hide')) infoFrame.classList.remove('hide');

    infoContainer.innerHTML = "";
    infoContainer.appendChild(form);//this is new way
    // infoContainer.innerHTML = form;//this is old way
    setFormValues(infoContainer,point);

    // if(modes.editMode.state){
    //     removeReadOnly(infoFrame.querySelector('form'));
    //     createSearchableDropdown("eqType");
    //     createSearchableDropdown("vendor");
    //     createSearchableDropdown("location");
    //     createSearchableDropdown("system");
    // }

    // if(eqFormInfo.lotoPoints)infoContainer.appendChild(lotoPointDropdown(eqFormInfo.lotoPoints));//old version
    const list = await lotoPointDropdown(selectedArea.lotoPoints);
    if(selectedArea.lotoPoints)infoContainer.appendChild(list);

    // let button = document.getElementById('pointUpdateButton');
    // let button2 = document.getElementById('pointDeleteButton');
    // button.addEventListener('click',()=>updatePoint(point)); 
    // button2.addEventListener('click',()=>deletePoint(point.id)); 

}

function convertToLotoPointFormDto(p){
    return{
        unit:p.unit,
        tagNumber:p.tagNumber,
        description: p.description,
        location: p.location,
        specificLocation:p.specificLocation,
        normalPosition:p.normalPosition,
        isolatedPosition: p.isolatedPosition,
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
        originalPictureSize:point.originalPictureSize,
        objectType:point.objectType
    }

    if (point.vendor && point.vendor.name) formDto.vendor = point.vendor.name;
    if (point.location && point.location.name) formDto.location = point.location.name;
    if (point.system && point.system.name) formDto.system = point.system.name;
    if (point.eqType && point.eqType.name) formDto.eqType = point.eqType.name;

    if(point.lotoPoints){
        formDto.lotoPoints = [];
        if(point.lotoPoints.length > 0){
            point.lotoPoints.forEach(e=>{
            formDto.lotoPoints.push(convertToLotoPointFormDto(e))
         })
        }
    }
    return formDto;
}

function updateSelectedArea(point){
    let ready = {
        vendor:{name:"",id:null},
        location:{name:"",id:null},
        eqType:{name:"",id:null},
        system:{name:"",id:null},
    };
    if (point.tagNumber) ready.tagNumber = point.tagNumber;
    if (point.description) ready.description = point.description;
    if (point.specificLocation) ready.specificLocation=point.specificLocation;
    if (point.mainFile) ready.mainFile=point.mainFile;
    if (point.files) ready.files=point.files;
    if (point.coordinates) ready.coordinates=point.coordinates;
    ready.id = point.id;

    if (point.vendor) ready.vendor.name = point.vendor;
    if (point.location) ready.location.name = point.location;
    if (point.system) ready.system.name = point.system;
    if (point.eqType) ready.eqType.name = point.eqType;
    return ready;
}

function removePointFromEquipment(point){
    let arr = [];
    selectedArea.lotoPoints.forEach(el=>{
        if(el.tagNumber!==point.tagNumber) arr.push(el)
    });
    selectedArea.lotoPoints = arr;
}

function setFormValues(form, values) {
    for (const key in values) {
        if (values.hasOwnProperty(key)) {
            let element = form.querySelector(`[data-object-info="${key}"]`);
            if (element) {
                element.value = values[key];
                element.addEventListener('change', (event) => {
                    if (values.hasOwnProperty(key)) {
                        values[key] = event.target.value;
                    }
                });
            }
        }
    }
    // if(modes.editMode.state)removeReadOnly(form)
}

/************************************************************************************************************************************ *
 * Form Searchable Dropdown functions
************************************************************************************************************************************ */

async function createSearchableDropdown(category){
    const response = await fetch('/category/get-'+category);
    const data = await response.json();   
    let stringData = data.map(e=>e.name); 
    buildDropdown(category,stringData,()=>setCatPopup(category, stringData));
}

async function addSearchableDropdownToInput(category){
    const response = await fetch('/category/get-'+category);
    const data = await response.json();   
    let stringData = data.map(e=>e.name); 
    addOptionsToExistingInput(category,stringData,()=>setCatPopup(category, stringData));
}

let setCatPopup = async function(category,list){
    const popup = await setupPopup(category);
    buildDropdown("edit-existing",list, null);
    buildDropdown("delete-existing",list, null);
}

function removeReadOnly(element){
    if(element===null) element = document.getElementById('point-info-form');

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

function addOptionToSelect(selectElement, optionText, optionValue) { //Non Searchable dropdown function
    let option = document.createElement("option");
    option.text = optionText;
    option.value = optionValue;
    selectElement.add(option);
}

