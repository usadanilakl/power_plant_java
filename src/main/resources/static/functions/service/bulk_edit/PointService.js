/****************************************************************************************************************************************************************************************
 *                                                                      Point Flow Process
 * On click on area:
    * Get equipment ifo
    * Open info window
    * Fill info window with equipment info, a dropdown for each loto point that would expand and collaps on click
 * 
 * Old Loto Point Info:
    *Create a button that would open infowindow with old loto points
    *By default show related points to currently selected equipment
    *Add search function to the info window

 * Edit mode:
    * When enabled, add control buttons to revised loto points to be able to add loto point to the equipment
    * Add control buttons for category dropdowns to edit categories
    * Remove read only from fields
 *
 * Updating DB:
    *
 * 
 ****************************************************************************************************************************************************************************************/


/***********************************************************************************************************************************
 * Excel Points and LotoPoints functions
 *************************************************************************************************************************************/
let hiddenRevisedPointFields=[
    "name", 
    "id",
    "objectType",
    "originalId"
]

let hiddenOldPointFields=[
    "name",
    "id",
    "objectType"
]

let pointsToMatch =[];

function hideExcelFields(point,field){
    if(point.objectType === "OldLotoPoint" && hiddenOldPointFields.includes(field)) return true;
    if(point.objectType === "RevisedLotoPoints" && hiddenRevisedPointFields.includes(field)) return true;
}

function getExcelPointsByLabel(label){
    let result = [];
    revisedExcelPoints.forEach(e=>{
        if(e.tagNumber && formatLabel(e.tagNumber).includes(formatLabel(label)) ) result.push(e);
        if(e.description && trimToLowerCaseRemoveDashes(e.description).includes(trimToLowerCaseRemoveDashes(label))) result.push(e)
    })
    oldExcelPoints.forEach(e=>{
        if(formatLabel(e.tagNumber).includes(formatLabel(label)) ) result.push(e);
    })
    hrsgValves.forEach(e=>{
        if(formatLabel(e.tagNumber).includes(formatLabel(label)) ) result.push(e);
    })
    kiewitValves.forEach(e=>{
        if(formatLabel(e.tagNumber).includes(formatLabel(label)) ) result.push(e);
    })
    bypasses.forEach(e=>{
        if(formatLabel(e.tagNumber).includes(formatLabel(label)) ) result.push(e);
    })
    return result;
}

function getOldPointsByLabel(label){
    let result = [];
    oldExcelPoints.forEach(e=>{
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
        if(hideFormFields(point, e)) continue;
        // let isCat = await isCategory(e);
        let div = document.createElement('div');
        form.appendChild(div);
        div.classList.add('form-group');
        let label = document.createElement('label');
        div.appendChild(label);
        label.setAttribute('for',e);
        label.textContent = e;
        label.style.color = "white";
        if(point.objectType === "OldLotoPoint" && e==="isoPos") label.textContent = "Description";
        let input = document.createElement('input');
        div.appendChild(input);
        input.setAttribute('id',e);
        input.classList.add('form-control');
        if(point[e] && point[e].name) input.value = point[e].name;
        else input.value = point[e];
        input.readOnly = true;
        input.addEventListener('click',()=>{copyToClipboard(input)})
        if(hideExcelFields(point,e)) div.classList.add('hide');
    }
    return form; 
}

function excelPointDropdown(points,equipment){
    let list = document.createElement('ul');
    points.forEach(e=>{
        let item = document.createElement('li');
        item.style.width = '100%'
        list.appendChild(item);

        let buttons = document.createElement('div');
        item.appendChild(buttons);
        buttons.classList.add('flex-inline');
        let button = document.createElement('button');
        buttons.appendChild(button);
        let formContainer = document.createElement('div');
        item.appendChild(formContainer);

        // if(e.objectType==="OldLotoPoint") button.style.backgroundColor = "red";
        // else if(e.objectType==="RevisedLotoPoints") button.style.backgroundColor = "green";
        // else button.style.backgroundColor = "blue";
        
        if(e.objectType==="OldLotoPoint"){
            button.classList.add('smallBtn');
            button.classList.add('red');
        } 
        else if(e.objectType==="RevisedLotoPoints" || e.objectType==="LotoPoint"){
            button.classList.add('smallBtn');
            button.classList.add('lime');
        } 
        else{
            button.classList.add('blue');
            button.classList.add('smallBtn');
        } 

        button.textContent = e.tagNumber + " - " + e.description;
        button.addEventListener('click', ()=>{
            if(formContainer.children.length === 0){
                formContainer.appendChild(showPointInfo(e));
            }else{
                formContainer.innerHTML = "";
            }
        });

        if(e.objectType === "RevisedLotoPoints" || e.objectType==="LotoPoint") {
            let addButton = document.createElement('button');
            buttons.appendChild(addButton);
            addButton.classList.add('addButtons');
            addButton.classList.add('yellow');
            addButton.classList.add('smallBtn');
            addButton.textContent = "ADD";
            addButton.classList.add('hide');

            const editModeAction = async function(){
                let lotoPoint = await getLotoPointById(e.id);
                // let lotoPoint = await getLotoPointByOldId(e.originalId);
                addLotoPoint(lotoPoint);
            }
            addButton.addEventListener('click',editModeAction);
        
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
        button.type = 'button';
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
        addButton.type = "button";
        buttons.appendChild(addButton);
        addButton.classList.add('addButtons');
        addButton.textContent = "--";
        addButton.classList.add('hide');

        if(modes.editMode.state || modes.lotoMode.state){
            
            addButton.classList.remove('hide');
            const lotoModeAction = function(){
                addPointToLotoWindow(e);
            }
            const editModeAction = function(){
                removePointFromEquipment(e);
            }
            if(modes.editMode.state)addButton.addEventListener('click',editModeAction);
            if(modes.lotoMode.state)addButton.addEventListener('click',lotoModeAction);
        }

    });
    return list;
}

async function lotoPointMatcherDropdown(points){
    let list = document.createElement('ul');

    for(let e of points){
        let item = document.createElement('li');
        list.appendChild(item);
        let buttons = document.createElement('div');
        item.appendChild(buttons);
        buttons.classList.add('flex-inline');
        let button = document.createElement('button');
        buttons.appendChild(button);
        let formContainer = document.createElement('div');
        item.appendChild(formContainer);

        if(e.id) item.id = 'item-'+e.id;

        let tagText = e.tagNumber ? e.tagNumber : "no tag";
        let descriptionText = e.description ? e.description : "no description";
        let locationText = e.specificLocation ? e.specificLocation : "no location";
        let isoPosText = e.isoPos?.name ? e.isoPos.name : "no iso pos";
        let normPosText = e.normPos?.name ? e.normPos.name : "no norm pos";

        let color = e.type==='original' ? 'green' : e.type==='match' ? 'blue' : 'red';
        if(e.id) list.id = 'list-'+e.id;
        
        button.textContent = tagText + " || " + descriptionText + " || " + locationText + " || " + isoPosText + "/" + normPosText;
        button.type = 'button';
        button.style.backgroundColor = color;
        button.addEventListener('click', async ()=>{
            if(formContainer.children.length === 0){
                const form = await buildFormFromObject(e);
                formContainer.appendChild(form);

                let cont = document.createElement('div');
                let sub = document.createElement('button');
                let del = document.createElement('button');

                sub.type = 'button';
                del.type = 'button';

                sub.textContent = "Submit";
                del.textContent = "Delete";

                cont.appendChild(sub);
                cont.appendChild(del);
                form.appendChild(cont);

                sub.addEventListener('click',async ()=>{
                    await createNew(e);
                });
                del.addEventListener('click', async()=>{
                    if(e.id) await deleteLotoPoint(e.id);
                    for(let m of matchedItems){
                        m.Match = m.Match.filter(p=>p.id!==e.id);
                    }
                    item.parentElement.removeChild(item);
                });
            }else{
                formContainer.innerHTML = "";
            }
        });


        let addButton = document.createElement('button');
        buttons.appendChild(addButton);
        addButton.type = 'button';
        addButton.textContent = '+'
        addButton.id = 'add-to-match-button-' + e.id ? e.id :"";
        addButton.addEventListener('click',async ()=>{
            
            if(addButton.textContent==="+"){
                if(pointsToMatch.length===0) addButton.style.backgroundColor = 'red'
                else addButton.style.backgroundColor = 'green'
                pointsToMatch.push(e);
                addButton.textContent = "-"
                if(pointsToMatch.length===2) {
                    let readyPoints = await matchPoints(pointsToMatch[0],pointsToMatch[1]);
                }
            } 
            else{
                pointsToMatch = pointsToMatch.filter(p=>p.id !== e.id)
                addButton.textContent = '+';
                addButton.style.backgroundColor = ''
            } 
        })



    };
    return list;
}

async function matchPoints(source,destination){
    let sourceTagNumber = source.tagNumber;
    let destenationTagNumber = "";
    let destDescription = "";
    let specificLocation = "";
    if(sourceTagNumber.startsWith("01")){
        destenationTagNumber = "02"+sourceTagNumber.substring(2);
        if(source.description!=null)destDescription = source.description.split(" ").map(e=>{
            if(e.startsWith("01")) return e = "02"+e.substring(2);
            else return e;
        }).join(" ")
        .replace(/Unit1/g, "Unit2")
        .replace(/UNIT 1/g, "UNIT2")
        .replace(/UNIT1/g, "UNIT2")
        .replace(/Unit 1/g, "Unit 2")
        .replaceAll(/U1/g, "U2");

        if(source.specificLocation!=null) specificLocation = source.specificLocation.split(" ").map(e=>{
            if(e.startsWith("01")) return e = "02"+e.substring(2);
            else return e;
        }).join(" ")
        .replace(/Unit1/g, "Unit2")
        .replace(/UNIT 1/g, "UNIT2")
        .replace(/UNIT1/g, "UNIT2")
        .replace(/Unit 1/g, "Unit 2")
        .replaceAll(/U1/g, "U2");

    }
    else if (sourceTagNumber.startsWith("02")){
        destenationTagNumber = "01"+sourceTagNumber.substring(2);

        if(source.description!=null){
            destDescription = source.description.split(" ").map(e=>{
                if(e.startsWith("02")) return e = "01"+e.substring(2);
                else return e;
            }).join(" ")
            .replace(/Unit2/g, "Unit1")
            .replace(/UNIT2/g, "UNIT1")
            .replace(/UNIT 2/g, "UNIT1")
            .replace(/Unit 2/g, "Unit 1")
            .replace(/U2/g, "U1");
        }

        if(source.specificLocation!=null){
            specificLocation = source.specificLocation.split(" ").map(e=>{
                if(e.startsWith("02")) return e = "01"+e.substring(2);
                else return e;
            }).join(" ")
            .replace(/Unit2/g, "Unit1")
            .replace(/UNIT2/g, "UNIT1")
            .replace(/UNIT 2/g, "UNIT1")
            .replace(/Unit 2/g, "Unit 1")
            .replace(/U2/g, "U1");
        }
    }
    if(!destination) destination = {};
    destination.tagNumber = destenationTagNumber;
    destination.specificLocation = specificLocation;
    destination.description = destDescription;
    destination.isoPos = source.isoPos;
    destination.normPos = source.normPos;

    let list = document.getElementById('main-list')
    list.innerHTML = "";
    pointsToMatch = [];

    for(let e of matchedItems){
        let f = await lotoPointMatcherDropdown(e.Match);
        let submitBtn = document.createElement('button');
        list.appendChild(f);
        f.appendChild(submitBtn);

        submitBtn.type = 'button';
        submitBtn.textContent = "Submit";
        submitBtn.addEventListener('click', async ()=>{
            for(let el of e.Match)await createNew(el);

            const index = matchedItems.indexOf(e);
            if (index !== -1){
                matchedItems.splice(index, 1);
                f.parentElement.removeChild(f);
            }

        });
    }



    return [source,destination];
}

async function fillExcelPointInfoWindow(points,eq){
    let infoFrame = document.getElementById('infoFrameOld-LOTO-Points'); 
    let infoContainer = document.getElementById('infoWindowOld-LOTO-Points');   
    if(infoContainer === null) newInfoWindow("Old-LOTO-Points");
    if(infoFrame.classList.contains('hide')) infoFrame.classList.remove('hide');
    infoContainer.innerHTML = "";
    infoContainer.appendChild(buildPointSearchField()); 

    if(points){
        let form = excelPointDropdown(points,eq);
        infoContainer.appendChild(form);        
    }


    let newLPcontainer = document.createElement('div');
    let newLPtag = document.createElement('input');
    let newLotoPointButton = document.createElement('button');
    newLPcontainer.id = 'newLPControls';
    newLotoPointButton.type = 'button';
    newLotoPointButton.textContent = "Add New";
    newLPtag.placeholder = "New Tag Number"
    newLotoPointButton.addEventListener('click',()=>createNewLotoPoint(newLPtag.value));
    newLPcontainer.appendChild(newLPtag);
    newLPcontainer.appendChild(newLotoPointButton);

    newLPcontainer.style.display = 'inline';
    infoContainer.appendChild(newLPcontainer);

    newLPcontainer.classList.add('hide');
}

function excelPointSearch(searchValue){
    let result = [];
    revisedExcelPoints.forEach(e=>{
        if(e.tagNumber){
            if(
                trimToLowerCaseRemoveDashes(e.tagNumber).includes(trimToLowerCaseRemoveDashes(searchValue)) || 
                trimToLowerCaseRemoveDashes(searchValue).includes(trimToLowerCaseRemoveDashes(e.tagNumber))
            )result.push(e);
        }
         if(e.description){
            if(
                trimToLowerCaseRemoveDashes(e.description).includes(trimToLowerCaseRemoveDashes(searchValue)) ||
                trimToLowerCaseRemoveDashes(searchValue).includes(trimToLowerCaseRemoveDashes(e.description))
        ) result.push(e);
         }
            
    });
    oldExcelPoints.forEach(e=>{
        if(e.tagNumber!==""&&(trimToLowerCaseRemoveDashes(e.tagNumber).includes(trimToLowerCaseRemoveDashes(searchValue)) || trimToLowerCaseRemoveDashes(searchValue).includes(trimToLowerCaseRemoveDashes(e.tagNumber)))) result.push(e);
    })
    hrsgValves.forEach(e=>{
        if(e&&(trimToLowerCaseRemoveDashes(e.tagNumber).includes(trimToLowerCaseRemoveDashes(searchValue)) || trimToLowerCaseRemoveDashes(searchValue).includes(trimToLowerCaseRemoveDashes(e.tagNumber)))) result.push(e);
    })
    kiewitValves.forEach(e=>{
        if(trimToLowerCaseRemoveDashes(e.tagNumber).includes(trimToLowerCaseRemoveDashes(searchValue)) || trimToLowerCaseRemoveDashes(searchValue).includes(trimToLowerCaseRemoveDashes(e.tagNumber))) result.push(e);
    })
    bypasses.forEach(e=>{
        if(trimToLowerCaseRemoveDashes(e.tagNumber).includes(trimToLowerCaseRemoveDashes(searchValue)) || trimToLowerCaseRemoveDashes(searchValue).includes(trimToLowerCaseRemoveDashes(e.tagNumber))) result.push(e);
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

async function createNewLotoPoint(tag){
    let newLotoPoint = {};
    newLotoPoint.tagNumber = tag;
    let savedPoint = await createNew(newLotoPoint);
    revisedExcelPoints.push(savedPoint);
    addLotoPoint(savedPoint);
}


/************************************************************************************************************************************ *
 * HTML Point Form functions
************************************************************************************************************************************ */
function getPointFromArrById(id){
    return file.points.find(e => e.id === id);
}

async function fillPointInfoWindow(point){
    let form = await buildFormFromObject(point); 
    let infoFrame = document.getElementById('infoFramePoint');
    let infoContainer = document.getElementById('infoWindowPoint');
    if(infoContainer === null) newInfoWindow("Point");
    if(infoFrame.classList.contains('hide')) infoFrame.classList.remove('hide');

    infoContainer.innerHTML = "";
    infoContainer.appendChild(form);
    
    if(selectedArea.lotoPoints){
        const list = await lotoPointDropdown(selectedArea.lotoPoints); 
        // infoContainer.appendChild(list);
        document.getElementById('loto-point-container').appendChild(list);
    } 
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
    fillPointInfoWindow(selectedArea);
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

function equipmentFormValidation(eq){
    if(eq.description === null || eq.description.trim()==="") return "Fill out description";
    if(eq.tagNumber === null || eq.tagNumber.trim()==="") return "Fill out tagNumber";
    if(validateCategory("vendor", eq.vendor.name)) return validateCategory("vendor", eq.vendor.name);
    if(validateCategory("eqType", eq.eqType.name))return validateCategory("eqType", eq.eqType.name);
    if(validateCategory("location", eq.location.name))return validateCategory("location", eq.location.name);
    if(validateCategory("system", eq.system.name))return validateCategory("system", eq.system.name);
    return null;
}

