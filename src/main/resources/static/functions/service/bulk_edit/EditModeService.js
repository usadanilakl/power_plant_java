
let editModes = {
    lotoPoint:{state:false,name:"Loto Point Assignment"},
    eqDescription:{state:false,name:"Equipment Description"},
    eqTagNumber:{state:true,name:"Tag Number"},
    eqVendor:{state:false,name:"Equipment Vendor"},
    eqLocation:{state:false,name:"General Location"},
    specificLocation:{state:false,name:"Specific Location"},
    system:{state:false,name:"System"},
    eqType:{state:false,name:"Equipment Type"},
    lotoPointDescription:{state:false,name:"Loto Point Description"},
    lotoPointPosition:{state:false,name:"Loto Point Isolated Position"},
    lotoPointNormPosition:{state:false,name:"Loto Point Normal Position"},
    lotoPointTagNumber:{state:false,name:"Loto Point Tag Number"}, 

}

function setEditMode(mode){
    let dropdown = document.getElementById('edit-mode-dropdown');
    for(let m in editModes){
        editModes[m].state = false
    }
    editModes[mode].state = true;
    //dropdown.value = mode;
}

function createModeButtons(){
    let dropdown = document.createElement('select');
    dropdown.setAttribute('id','edit-mode-dropdown')
    for(let m in editModes){
        let option = document.createElement('option');
        option.textContent = editModes[m].name;
        option.setAttribute('value', m);
        dropdown.appendChild(option);
    }
    dropdown.addEventListener('change',()=>{
        setEditMode(dropdown.value);
    });
    return dropdown;
}

function acceptPoint(highlight){
    selectedArea = selectedBundle.find(e=>e.highlight.id === highlight.id).eq;
    let info = highlight.querySelector('.highlightInfo');
    let controls = highlight.querySelector('.highlight-controls');
    highlight.removeChild(controls);
    info.innerHTML = "";
    highlight.querySelectorAll('.corners').forEach(e=>e.classList.add('hide'));

    if(editModes.eqTagNumber.state)updateEqTagNumber();
    if(editModes.eqDescription.state){
        updateEqDescription();
        document.getElementById('all').removeChild(highlight);
    }
    if(editModes.eqLocation.state){
        updateEqLocation();
        document.getElementById('all').removeChild(highlight);
    }
}

function removePoint(highlight){
    activeHighlights = activeHighlights.filter(e=>e.id!==highlight.id)
    selectedBundle = selectedBundle.filter(e=>e.highlight.id!==highlight.id)
    document.getElementById('all').removeChild(highlight);
    selectedArea = selectedBundle[selectedBundle.length-1].eq;
    fillExcelPointInfoWindow(getExcelPointsByLabel(selectedArea.tagNumber));
}

function renamePoint(highlight){
    selectedArea = selectedBundle.find(e=>e.highlight.id === highlight.id).eq;
    let text = highlight.querySelector('.responsive-text');
    let input = document.getElementById('value-editor-input');
    if(input.value){
        if(editModes.eqTagNumber.state)selectedArea.tagNumber = input.value;
        if(editModes.eqDescription.state)selectedArea.description = input.value;
        text.textContent = input.value;
    }
}

function setEditType(){
    if(editModes.eqTagNumber.state){
        //hideAllResizeElements();
    }
}

async function fillHighlightInfo(highlight){
    let point = getPointByIdFromCurrentFile(highlight.getAttribute('data-point-id'));
    if(!point && selectedArea.isNew) point = selectedArea;
    if(point){
        if(editModes.eqDescription.state){
            if(!point.description || point.description.trim()==="") point.description = point.lotoPoints[0].description;
            const currentWindow = document.querySelector(`div.newWindow[data-point-id='${point.id}']`);
            if(currentWindow) all.removeChild(currentWindow);
            let allInfoWindow = getEmptyWindow(point.tagNumber + ' - Edit Description');
            allInfoWindow.setAttribute('data-point-id', point.id);
            allInfoWindow.style.width = 'fit-content';
            allInfoWindow.style.height = 'fit-content';

            allInfoWindow.style.left = highlight.offsetLeft + 'px';
            allInfoWindow.style.top = highlight.offsetTop+highlight.offsetHeight+ 'px';
            document.getElementById('all').appendChild(allInfoWindow);

            allInfoWindow.appendChild(fillLotoPointInfo(point))
            point.lotoPoints.forEach(e=>{
                allInfoWindow.appendChild(fillLotoPointInfo(e))
            });

            if(allInfoWindow.offsetTop+allInfoWindow.offsetHeight>window.innerHeight){
                allInfoWindow.style.left = highlight.offsetLeft+highlight.offsetWidth + 'px';
                allInfoWindow.style.top = window.innerHeight-allInfoWindow.offsetHeight + 'px';
            }

        }
        else if(editModes.eqTagNumber.state){
            const currentWindow = document.querySelector(`div.newWindow[data-point-id='${point.id}']`);
            if(currentWindow) all.removeChild(currentWindow);

            let allInfoWindow = getEmptyWindow(point.tagNumber + ' - Edit Tag Number');
            allInfoWindow.setAttribute('data-point-id', point.id);

            let closeButton = allInfoWindow.querySelector(".closeWindow");
            closeButton.addEventListener('click',()=>removeResizeAndDisableLpConnection(highlight))

            allInfoWindow.style.width = 'fit-content';
            allInfoWindow.style.height = 'fit-content';

            allInfoWindow.style.left = highlight.offsetLeft + 'px';
            allInfoWindow.style.top = highlight.offsetTop+highlight.offsetHeight+ 'px';

            allInfoWindow.appendChild(fillLotoPointInfo(point))
            let lotoPointBox = document.createElement('div');
            let lotoBoxHeader = document.createElement('p');
            allInfoWindow.appendChild(lotoPointBox);
            lotoPointBox.appendChild(lotoBoxHeader);
            lotoPointBox.appendChild(await buildLotoPointList(point));

            lotoBoxHeader.classList.add('headerText');
            lotoBoxHeader.textContent = 'Assosiated LOTO points';
            lotoPointBox.style.backgroundColor = 'grey';

            document.getElementById('all').appendChild(allInfoWindow);
            
            if(allInfoWindow.offsetTop+allInfoWindow.offsetHeight>window.innerHeight){
                allInfoWindow.style.left = highlight.offsetLeft+highlight.offsetWidth + 'px';
                allInfoWindow.style.top = window.innerHeight-allInfoWindow.offsetHeight + 'px';
            }
        }
        else if(editModes.eqLocation.state){
            //if(!point.location || !point.location.name || point.location.name.trim()==="") point.description = point.lotoPoints[0].description;
            const currentWindow = document.querySelector(`div.newWindow[data-point-id='${point.id}']`);
            if(currentWindow) all.removeChild(currentWindow);
            let allInfoWindow = getEmptyWindow(point.tagNumber + ' - Edit Location');
            allInfoWindow.setAttribute('data-point-id', point.id);
            allInfoWindow.style.width = 'fit-content';
            allInfoWindow.style.height = 'fit-content';

            allInfoWindow.style.left = highlight.offsetLeft + 'px';
            allInfoWindow.style.top = highlight.offsetTop+highlight.offsetHeight+ 'px';

            allInfoWindow.appendChild(fillLotoPointInfo(point))
            point.lotoPoints.forEach(e=>{
                allInfoWindow.appendChild(fillLotoPointInfo(e))
            });

            document.getElementById('all').appendChild(allInfoWindow);
            
            if(allInfoWindow.offsetTop+allInfoWindow.offsetHeight>window.innerHeight){
                allInfoWindow.style.left = highlight.offsetLeft+highlight.offsetWidth + 'px';
                allInfoWindow.style.top = window.innerHeight-allInfoWindow.offsetHeight + 'px';
            }
        }
        else if(editModes.lotoPointPosition.state){
            const currentWindow = document.querySelector(`div.newWindow[data-point-id='${point.id}']`);
            if(currentWindow) all.removeChild(currentWindow);
            let allInfoWindow = getEmptyWindow(point.tagNumber + ' - Edit Isolated LOTO Position');
            allInfoWindow.setAttribute('data-point-id', point.id);
            allInfoWindow.style.width = 'fit-content';
            allInfoWindow.style.height = 'fit-content';

            allInfoWindow.style.left = highlight.offsetLeft + 'px';
            allInfoWindow.style.top = highlight.offsetTop+highlight.offsetHeight+ 'px';

            allInfoWindow.appendChild(fillLotoPointInfo(point))
            point.lotoPoints.forEach(e=>{
                allInfoWindow.appendChild(fillLotoPointInfo(e))
            });

            document.getElementById('all').appendChild(allInfoWindow);
            if(allInfoWindow.offsetTop+allInfoWindow.offsetHeight>window.innerHeight){
                allInfoWindow.style.left = highlight.offsetLeft+highlight.offsetWidth + 'px';
                allInfoWindow.style.top = window.innerHeight-allInfoWindow.offsetHeight + 'px';
            }
        }
        else if(editModes.lotoPointNormPosition.state){
            const currentWindow = document.querySelector(`div.newWindow[data-point-id='${point.id}']`);
            if(currentWindow) all.removeChild(currentWindow);
            let allInfoWindow = getEmptyWindow(point.tagNumber + ' - Edit Normal Position');
            allInfoWindow.setAttribute('data-point-id', point.id);
            allInfoWindow.style.width = 'fit-content';
            allInfoWindow.style.height = 'fit-content';

            allInfoWindow.style.left = highlight.offsetLeft + 'px';
            allInfoWindow.style.top = highlight.offsetTop+highlight.offsetHeight+ 'px';

            allInfoWindow.appendChild(fillLotoPointInfo(point))
            point.lotoPoints.forEach(e=>{
                allInfoWindow.appendChild(fillLotoPointInfo(e))
            });

            document.getElementById('all').appendChild(allInfoWindow);
            if(allInfoWindow.offsetTop+allInfoWindow.offsetHeight>window.innerHeight){
                allInfoWindow.style.left = highlight.offsetLeft+highlight.offsetWidth + 'px';
                allInfoWindow.style.top = window.innerHeight-allInfoWindow.offsetHeight + 'px';
            }
        }
        else if(editModes.system.state){
            const currentWindow = document.querySelector(`div.newWindow[data-point-id='${point.id}']`);
            if(currentWindow) all.removeChild(currentWindow);
            let allInfoWindow = getEmptyWindow(point.tagNumber + ' - Edit System');
            allInfoWindow.setAttribute('data-point-id', point.id);
            allInfoWindow.style.width = 'fit-content';
            allInfoWindow.style.height = 'fit-content';

            allInfoWindow.style.left = highlight.offsetLeft + 'px';
            allInfoWindow.style.top = highlight.offsetTop+highlight.offsetHeight+ 'px';

            allInfoWindow.appendChild(fillLotoPointInfo(point))

            document.getElementById('all').appendChild(allInfoWindow);
            if(allInfoWindow.offsetTop+allInfoWindow.offsetHeight>window.innerHeight){
                allInfoWindow.style.left = highlight.offsetLeft+highlight.offsetWidth + 'px';
                allInfoWindow.style.top = window.innerHeight-allInfoWindow.offsetHeight + 'px';
            }
        }
        else if(editModes.eqType.state){
            const currentWindow = document.querySelector(`div.newWindow[data-point-id='${point.id}']`);
            if(currentWindow) all.removeChild(currentWindow);
            let allInfoWindow = getEmptyWindow(point.tagNumber + ' - Edit Equipment Type');
            allInfoWindow.setAttribute('data-point-id', point.id);
            allInfoWindow.style.width = 'fit-content';
            allInfoWindow.style.height = 'fit-content';

            allInfoWindow.style.left = highlight.offsetLeft + 'px';
            allInfoWindow.style.top = highlight.offsetTop+highlight.offsetHeight+ 'px';

            allInfoWindow.appendChild(fillLotoPointInfo(point))

            document.getElementById('all').appendChild(allInfoWindow);
            if(allInfoWindow.offsetTop+allInfoWindow.offsetHeight>window.innerHeight){
                allInfoWindow.style.left = highlight.offsetLeft+highlight.offsetWidth + 'px';
                allInfoWindow.style.top = window.innerHeight-allInfoWindow.offsetHeight + 'px';
            }
        }

        let editWind = document.getElementById("point-info-"+point.id);
        let editAllButton = document.createElement('button');
        editAllButton.textContent = "Edit All Fields";
        editAllButton.addEventListener('click',()=>fillPointInfoWindow(point));
        editWind.appendChild(editAllButton);
    }
}

function highlightEditControls(highlight,resize){
    let controls = document.createElement('div');
    let accept = document.createElement('button');
    let rename = document.createElement('button');
    let remove = document.createElement('button');

    controls.setAttribute('name','highlight-ctrl');

    controls.classList.add('highlight-controls')
    accept.classList.add('highlight-control-accept');
    rename.classList.add('highlight-control-rename');
    remove.classList.add('highlight-control-remove');

    accept.textContent = "Accept";
    rename.textContent = "Rename";
    remove.textContent = "Delete";
    
    controls.appendChild(accept);
    controls.appendChild(rename);
    controls.appendChild(remove);
    highlight.appendChild(controls);

    accept.addEventListener('click',()=>acceptPoint(highlight))
    remove.addEventListener('click',()=>showDeleteEqPopup(highlight))
    rename.addEventListener('click',()=>renamePoint(highlight))

    if(resize)highlight.querySelectorAll('.corners').forEach(e=>e.classList.remove('hide'));
}

async function buildLotoPointList(eq){
    let lotoPoints = document.getElementById('loto-points-'+eq.id);
    let input = document.getElementById('value-editor-input');
    if(eq.lotoPoints===null || eq.lotoPoints.length===0) eq.lotoPoints = await getLotoPointsByTag(eq.tagNumber);

    if(lotoPoints){lotoPoints.innerHTML = "";}
    else{
        lotoPoints = document.createElement('div');
        lotoPoints.classList.add('highlihgt-loto-points');
        lotoPoints.id = 'loto-points-'+eq.id;
    } 
    let headerText = document.createElement('p');
    headerText.textContent = "Assosiated Loto Points"
    headerText.classList.add('headerText');
    eq.lotoPoints.forEach(e=>{
        let buttonContainer = document.createElement('div');
        let point = document.createElement('button');
        let control = document.createElement('button');
        let rename = document.createElement('button');

        buttonContainer.classList.add('loto-point-box');

        buttonContainer.appendChild(point);
        buttonContainer.appendChild(rename);
        buttonContainer.appendChild(control);

        point.textContent = e.tagNumber;
        control.textContent = "X";
        rename.textContent = "Rename";

        control.addEventListener('click',()=> removeLotoPoint(e.id,eq))
        rename.addEventListener('click',()=>e.tagNumber=input.value)
        lotoPoints.appendChild(buttonContainer);
    })
    return lotoPoints;
}

function enableLotoPointConnection(equipment){
    // let points = excelPointSearch(equipment.tagNumber)
    // fillExcelPointInfoWindow(points,equipment);
    selectedArea=equipment;
    document.querySelectorAll('.addButtons').forEach(e=>e.classList.remove('hide'));
    document.getElementById('newLPControls').classList.remove('hide');

}

function addLotoPoint(point,equipment){
    revisedExcelPoints.push(point);
    if(equipment){
        if(!equipment.lotoPoints) equipment.lotoPoints = [];
        equipment.lotoPoints.push(point);
        return buildLotoPointList(equipment);
    }else{
        if(!selectedArea.lotoPoints) selectedArea.lotoPoints = [];
        selectedArea.lotoPoints.push(point);
        return buildLotoPointList(selectedArea);
    }
}

function removeLotoPoint(id,eq){
    eq.lotoPoints = eq.lotoPoints.filter(e=>e.id!==id);
    return buildLotoPointList(eq);
}

function showInsturctions(){
    let instrWind = newWindow();
    let img = document.createElement('img');
    img.src = '';
    instrWind.appendChild(img);
}

async function moveToNextStep(){
    document.querySelectorAll('.newWindow').forEach(e=>e.parentNode.removeChild(e));
    if(editModes.eqTagNumber.state){
       let updatedFile = await updateFileEditStep("eqDescription");
        loadPictureWithLightFile(updatedFile);
    }
    if(editModes.eqDescription.state){
        let updatedFile = await updateFileEditStep("eqLocation");
        loadPictureWithLightFile(updatedFile);
    }
    if(editModes.eqLocation.state){
        let updatedFile = await updateFileEditStep("lotoPointPosition");
        loadPictureWithLightFile(updatedFile);
    }
    if(editModes.lotoPointPosition.state){
        let updatedFile = await updateFileEditStep("lotoPointNormPosition");
        loadPictureWithLightFile(updatedFile);
    }
    if(editModes.lotoPointNormPosition.state){
        let updatedFile = await updateFileEditStep("system");
        loadPictureWithLightFile(updatedFile);
    }
    if(editModes.system.state){
        let updatedFile = await updateFileEditStep("eqType");
        loadPictureWithLightFile(updatedFile);
    }
    if(editModes.eqType.state){
        let updatedFile = await updateFileEditStep("eqType"); //need to change file statys to completed
        loadPictureWithLightFile(updatedFile);
    }
}

async function moveToPreviousStep(){
    document.querySelectorAll('.newWindow').forEach(e=>e.parentNode.removeChild(e));
     if(editModes.eqDescription.state){
         let updatedFile = await updateFileEditStep("eqTagNumber");
         loadPictureWithLightFile(updatedFile);
     }
     if(editModes.eqLocation.state){
        let updatedFile = await updateFileEditStep("eqDescription");
        loadPictureWithLightFile(updatedFile);
     }
     if(editModes.lotoPointPosition.state){
        let updatedFile = await updateFileEditStep("eqLocation");
        loadPictureWithLightFile(updatedFile);
     }
     if(editModes.lotoPointNormPosition.state){
        let updatedFile = await updateFileEditStep("lotoPointPosition");
        loadPictureWithLightFile(updatedFile);
     }
     if(editModes.system.state){
        let updatedFile = await updateFileEditStep("lotoPointNormPosition");
        loadPictureWithLightFile(updatedFile);
     }
     if(editModes.eqType.state){
        let updatedFile = await updateFileEditStep("system");
        loadPictureWithLightFile(updatedFile);
     }
}

async function moveToStepByName(step){
    document.querySelectorAll('.newWindow').forEach(e=>e.parentNode.removeChild(e));

    let updatedFile = await updateFileEditStep(step);
    loadPictureWithLightFile(updatedFile);
}

function buildEditStepControls(){
    console.log("building edit controls for the page")
    let list = document.getElementById('bulk-edit-controls');
    let box = document.getElementById('step-option-box')

    list.style.display='inline';
    list.innerHTML = "";
    if(box)all.removeChild(box);

    let stepOptionBox = document.createElement('div');
    let steps = document.createElement('ul');
    let stepButton = document.createElement('li');

    stepButton.id = 'stepButton'
    stepButton.classList.add('btn');
    stepButton.classList.add('btn-outline-light');
    stepButton.addEventListener('click',()=>stepOptionBox.classList.toggle('hide'));
    
    list.appendChild(stepButton);

    stepOptionBox.appendChild(steps);
    stepOptionBox.id = 'step-option-box';
    stepOptionBox.backgroundColor = 'black';
    stepOptionBox.style.display = 'flex';
    stepOptionBox.style.flexDirection = 'column';
    stepOptionBox.style.position = 'absolute';
    stepOptionBox.style.left = stepButton.offsetLeft + 'px';
    all.appendChild(stepOptionBox);

    for(let i = 1; i<8; i++){
        let item = document.createElement('li');
        item.classList.add('smallBtn');
        item.classList.add("purple");
        item.name = 'step'+i;
        if(i===1){
            item.textContent = "Step 1 Select LOTO Points";
            item.id = "eqTagNumber";
            item.addEventListener('click',()=>{moveToStepByName("eqTagNumber")});
        }
        if(i===2){
            item.textContent = "Step 2 Edit Description";
            item.id = "eqDescription";
            item.addEventListener('click',()=>{moveToStepByName("eqDescription")});
        }
        if(i===3){
            item.textContent = "Step 3 Edit Location";
            item.id = "eqLocation";
            item.addEventListener('click',()=>{moveToStepByName("eqLocation")});
        }
        if(i===4){
            item.textContent = "Step 4 Edit Isolated Position";
            item.id = "lotoPointPosition";
            item.addEventListener('click',()=>{moveToStepByName("lotoPointPosition")});
        }
        if(i===5){
            item.textContent = "Step 5 Edit Normal Position";
            item.id = "lotoPointNormPosition";
            item.addEventListener('click',()=>{moveToStepByName("lotoPointNormPosition")});
        }
        if(i===6){
            item.textContent = "Step 6 Edit System";
            item.id = "system";
            item.addEventListener('click',()=>{moveToStepByName("system")});
        }
        if(i===7){
            item.textContent = "Step 7 Edit Equipment Type";
            item.id = "eqType";
            item.addEventListener('click',()=>{
                moveToStepByName("eqType");
            });
        }
        steps.appendChild(item);
    }

    let stepButtonRect = stepButton.getBoundingClientRect();
    stepOptionBox.style.top = stepButtonRect.top-stepOptionBox.offsetHeight-60 + 'px';
    stepOptionBox.style.zIndex = '3';
    console.log(window.innerHeight);
    console.log(stepOptionBox.offsetHeight);
    
    stepOptionBox.classList.add("hide");

    if(editModes.eqTagNumber.state){
        stepButton.textContent = "Step 1 Select LOTO Points";
        let li1 = document.createElement('li');
        let li2 = document.createElement('li');
        let li3 = document.createElement('li');
        let li4 = document.createElement('li');
        let inp = document.createElement('input');
        let pasteButton = document.createElement('button');

        li1.classList.add("btn")
        li1.classList.add("btn-outline-light")
        li2.classList.add("btn")
        li2.classList.add("btn-outline-light")
        li3.classList.add("btn")
        li3.classList.add("btn-outline-light")
        li4.classList.add("btn")
        li4.classList.add("btn-outline-light")
        pasteButton.classList.add("btn")
        pasteButton.classList.add("btn-outline-light")

        inp.type = 'text';
        inp.placeholder = "Type here for changes";
        inp.id = "value-editor-input";
        inp.style.width = 'auto';
        inp.autocomplete = 'off';

        li1.addEventListener('click',()=>showInsturctions());
        li3.addEventListener('click',()=>createNewHighlight());
        li4.addEventListener('click',()=>moveToNextStep());
        pasteButton.addEventListener('click',async()=>{
            await pasteFromClipboardWithoutClearing(inp);
        });

        li1.textContent = "Step 1: Select all loto points (click for details)";
        li3.textContent = "Highlight New Equipment";
        li4.textContent = "Submit Selected Points";
        pasteButton.textContent = "P"

        li2.appendChild(inp);
        li2.appendChild(pasteButton);
        // list.appendChild(li1);
        list.appendChild(li2);
        list.appendChild(li3);
        list.appendChild(li4);
        list.appendChild(document.createElement('li').appendChild(getTextButton()));
    }
    else if(editModes.eqDescription.state){
        stepButton.textContent = "Step 2 Edit Description";
        let li1 = document.createElement('li');
        let li2 = document.createElement('li');
        let li3 = document.createElement('li');
        let li4 = document.createElement('li');
        let inp = document.createElement('input');
        let pasteButton = document.createElement('button');

        li1.classList.add("btn")
        li1.classList.add("btn-outline-light")
        // li2.classList.add("btn")
        // li2.classList.add("btn-outline-light")
        li3.classList.add("btn")
        li3.classList.add("btn-outline-light")
        li4.classList.add("btn")
        li4.classList.add("btn-outline-light")
        pasteButton.classList.add("btn")
        pasteButton.classList.add("btn-outline-light")

        inp.type = 'text';
        inp.placeholder = "Type here for changes";
        inp.id = "value-editor-input";
        inp.style.width = '400px';
        inp.autocomplete = 'off';
        li2.style.width = 'auto';
        li2.style.display='inline';

        li1.addEventListener('click',()=>showInsturctions());
        li3.addEventListener('click',()=>moveToPreviousStep());
        li4.addEventListener('click',()=>moveToNextStep());
        pasteButton.addEventListener('click',async()=>{
            await pasteFromClipboardWithoutClearing(inp);
        });

        li1.textContent = "Step 2: Edit Equipment Description (click for details)";
        li3.textContent = "Previous Step";
        li4.textContent = "Next Step";
        pasteButton.textContent = "P"

        li2.appendChild(inp);
        li2.appendChild(pasteButton);
        // list.appendChild(li1);
        list.appendChild(li2);
        list.appendChild(li3);
        list.appendChild(li4);
        list.appendChild(document.createElement('li').appendChild(getTextButton()));
    }
    else if(editModes.eqLocation.state){
        stepButton.textContent = "Step 3 Edit Location";
        let li1 = document.createElement('li');
        let li2 = document.createElement('li');
        let li3 = document.createElement('li');
        let li4 = document.createElement('li');
        let li5 = document.createElement('li');
        let inp = document.createElement('input');
        let pasteButton = document.createElement('button');
        let sdropdown = document.createElement('input');

        li1.classList.add("btn")
        li1.classList.add("btn-outline-light")
        // li2.classList.add("btn")
        // li2.classList.add("btn-outline-light")
        li3.classList.add("btn")
        li3.classList.add("btn-outline-light")
        li4.classList.add("btn")
        li4.classList.add("btn-outline-light")
        li5.classList.add("btn")
        li5.classList.add("btn-outline-light")
        pasteButton.classList.add("btn")
        pasteButton.classList.add("btn-outline-light")

        inp.type = 'text';
        inp.placeholder = "Type Specific Location";
        inp.id = "value-editor-input";
        inp.style.width = '400px';
        li2.style.width = 'auto';
        li2.style.display='inline';
        sdropdown.type='text';
        sdropdown.placeholder = "Choose General Location"
        li5.textContent = 'Enable Bulk Edit';
        li5.id = 'bulk-edit-enabler'
        sdropdown.id = 'select-input-editor';

        inp.autocomplete = 'off';
        sdropdown.autocomplete = 'off';

        li1.addEventListener('click',()=>showInsturctions());
        li3.addEventListener('click',()=>moveToPreviousStep());
        li4.addEventListener('click',()=>moveToNextStep());
        li5.addEventListener('click',enableBulkEdit);
        pasteButton.addEventListener('click',async()=>{
            await pasteFromClipboardWithoutClearing(inp);
        });

        li1.textContent = "Step 3: Edit Equipment Location (click for details)";
        li3.textContent = "Previous Step"
        li4.textContent = "Next Step";
        pasteButton.textContent = "P"

        li2.appendChild(inp);
        li2.appendChild(pasteButton);
        // li5.appendChild(sdropdown)
        // list.appendChild(li1);
        list.appendChild(li3);
        list.appendChild(li2);
        list.appendChild(li4);
        list.appendChild(li5);
        list.appendChild(document.createElement('li').appendChild(getTextButton()));

        // buildDropdown("location", ["one","two","three"]);
        // //make dropdown apear on top:
        // let options = li5.querySelector("#location-options");
        // options.parentNode.removeChild(options);
        // document.getElementById('lower').appendChild(options);
        // options.style.position = 'absolute';
        // // options.style.top =li5.offsetTop-options.offsetHeight+"px";
        // options.style.bottom = '100%';
        // options.style.left = li5.offsetLeft+'px';

        buildCategorySelector("location");
    }
    else if(editModes.lotoPointPosition.state){
        stepButton.textContent = "Step 4 Edit Isolated Position";
        let li1 = document.createElement('li');
        let li2 = document.createElement('li');
        let li3 = document.createElement('li');
        let li4 = document.createElement('li');
        let li5 = document.createElement('li');

        li1.classList.add("btn")
        li1.classList.add("btn-outline-light")
        // li2.classList.add("btn")
        // li2.classList.add("btn-outline-light")
        li3.classList.add("btn")
        li3.classList.add("btn-outline-light")
        li4.classList.add("btn")
        li4.classList.add("btn-outline-light")
        li5.classList.add("btn")
        li5.classList.add("btn-outline-light")

        li5.textContent = 'Enable Bulk Edit';
        li5.id = 'bulk-edit-enabler'

        li1.addEventListener('click',()=>showInsturctions());
        li3.addEventListener('click',()=>moveToPreviousStep());
        li4.addEventListener('click',highlightMultipleLotoPointEq);
        li5.addEventListener('click',enableBulkEdit);

        li1.textContent = "Step 4: Edit Isolated Position (click for details)";
        li1.id = 'instructionButton';
        li3.textContent = "Previous Step"
        li4.textContent = "Next Step";
        li4.id='next-step-button';

        // list.appendChild(li1);
        list.appendChild(li3);
        list.appendChild(li4);
        list.appendChild(li5);
        list.appendChild(document.createElement('li').appendChild(getTextButton()));

        buildCategorySelector("isoPos");
    }
    else if(editModes.lotoPointNormPosition.state){
        stepButton.textContent = "Step 5 Edit Normal Position";
        let li1 = document.createElement('li');
        let li2 = document.createElement('li');
        let li3 = document.createElement('li');
        let li4 = document.createElement('li');
        let li5 = document.createElement('li');

        li1.classList.add("btn")
        li1.classList.add("btn-outline-light")
        // li2.classList.add("btn")
        // li2.classList.add("btn-outline-light")
        li3.classList.add("btn")
        li3.classList.add("btn-outline-light")
        li4.classList.add("btn")
        li4.classList.add("btn-outline-light")
        li5.classList.add("btn")
        li5.classList.add("btn-outline-light")

        li5.textContent = 'Enable Bulk Edit';
        li5.id = 'bulk-edit-enabler'

        li1.addEventListener('click',()=>showInsturctions());
        li3.addEventListener('click',()=>moveToPreviousStep());
        li4.addEventListener('click',highlightMultipleLotoPointEq);
        li5.addEventListener('click',enableBulkEdit);

        li1.textContent = "Step 5: Edit Normal Position (click for details)";
        li1.id = 'instructionButton';
        li3.textContent = "Previous Step"
        li4.textContent = "Next Step";
        li4.id='next-step-button';

        // list.appendChild(li1);
        list.appendChild(li3);
        list.appendChild(li4);
        list.appendChild(li5);
        list.appendChild(document.createElement('li').appendChild(getTextButton()));

        buildCategorySelector("normPos");
    }
    else if(editModes.system.state){
        stepButton.textContent = "Step 6 Edit System";
        let li1 = document.createElement('li');
        let li2 = document.createElement('li');
        let li3 = document.createElement('li');
        let li4 = document.createElement('li');
        let li5 = document.createElement('li');

        li1.classList.add("btn")
        li1.classList.add("btn-outline-light")
        li2.classList.add("btn")
        li2.classList.add("btn-outline-light")
        li3.classList.add("btn")
        li3.classList.add("btn-outline-light")
        li4.classList.add("btn")
        li4.classList.add("btn-outline-light")
        li5.classList.add("btn")
        li5.classList.add("btn-outline-light")


        li5.textContent = 'Enable Bulk Edit';
        li5.id = 'bulk-edit-enabler'

        li1.addEventListener('click',()=>showInsturctions());
        li3.addEventListener('click',()=>moveToPreviousStep());
        li4.addEventListener('click',()=>moveToNextStep());
        li5.addEventListener('click',enableBulkEdit);

        li1.textContent = "Step 6: Edit Equipment System (click for details)";
        li3.textContent = "Previous Step"
        li4.textContent = "Next Step";

        // list.appendChild(li1);
        list.appendChild(li3);
        list.appendChild(li2);
        list.appendChild(li4);
        list.appendChild(li5);
        list.appendChild(document.createElement('li').appendChild(getTextButton()));

        buildCategorySelector("system");
    }
    else if(editModes.eqType.state){
        stepButton.textContent = "Step 7 Edit Equipment Type";
        let li1 = document.createElement('li');
        let li2 = document.createElement('li');
        let li3 = document.createElement('li');
        let li4 = document.createElement('li');
        let li5 = document.createElement('li');
        let li6 = document.createElement('li');

        li1.classList.add("btn")
        li1.classList.add("btn-outline-light")
        li2.classList.add("btn")
        li2.classList.add("btn-outline-light")
        li3.classList.add("btn")
        li3.classList.add("btn-outline-light")
        li4.classList.add("btn")
        li4.classList.add("btn-outline-light")
        li5.classList.add("btn")
        li5.classList.add("btn-outline-light")
        li6.classList.add("btn")
        li6.classList.add("btn-outline-light")


        li5.textContent = 'Enable Bulk Edit';
        li5.id = 'bulk-edit-enabler'

        li6.textContent = 'Check Points';

        li1.addEventListener('click',()=>showInsturctions());
        li3.addEventListener('click',()=>moveToPreviousStep());
        li4.addEventListener('click',async()=>{
            await updateFileStatus(file.id,true);
            location.reload();
        } );
        li5.addEventListener('click',enableBulkEdit);

        li6.addEventListener('click', async ()=>{
            let resp = await fetch('/file-api/verify/'+file.id);
            let points = await resp.json();
            let w = document.getElementById('verification-window');
            if(w) all.removeChild(w);
            let newWind = getEmptyWindow();
            all.appendChild(newWind);
            newWind.id = 'verification-window';
            let l = document.createElement('ul');
            newWind.appendChild(l);
            l.style.backgroundColor = 'white'
            l.style.position = 'absolute';
            l.style.top = '30px';
            newWind.style.width = '80%';
            newWind.style.height = '80%';
            points.forEach(e=>{

                for(let key in e){
                    let ite = document.createElement('li');
                    ite.textContent = key + ': ' + e[key];
                    l.appendChild(ite);
                }



                // let it1 = document.createElement('li');
                // let it2 = document.createElement('li');
                // let it3 = document.createElement('li');

                // it1.textContent = e.Description;
                // it2.textContent = 'Eq: ' + e.Eq;
                // it3.textContent = 'LP: ' + e.LP;

                // l.appendChild(it1);
                // l.appendChild(it2);
                // l.appendChild(it3);
            });


            

        })

        li1.textContent = "Step 7: Edit Equipment Type (click for details)";
        li3.textContent = "Previous Step"
        li4.textContent = "Complete PID";

        // list.appendChild(li1);
        list.appendChild(li3);
        list.appendChild(li2);
        list.appendChild(li4);
        list.appendChild(li5);
        list.appendChild(document.createElement('li').appendChild(getTextButton()));
        list.appendChild(li6);

        buildCategorySelector("eqType");
    }

    let skipButton = document.createElement('li');
    let getSkippedButton = document.createElement('li');
    let getCompletedButton = document.createElement('li');
    let getIncompleteButton = document.createElement('li');

    skipButton.classList.add('btn');
    skipButton.classList.add('btn-secondary');
    getSkippedButton.classList.add('btn');
    getSkippedButton.classList.add('btn-secondary');
    getCompletedButton.classList.add('btn');
    getCompletedButton.classList.add('btn-secondary');
    getIncompleteButton.classList.add('btn');
    getIncompleteButton.classList.add('btn-secondary');

    skipButton.textContent = "Skip PID";
    getSkippedButton.textContent = "Get Skipped PIDs";
    getCompletedButton.textContent = "Get Completed PIDs";
    getIncompleteButton.textContent = "Get Incomplete PIDs";

    skipButton.addEventListener('click',async ()=>{
        await updateFileStatus(file.id,true);
        await updateFileEditStep("skip");
        location.reload();
    });
    getSkippedButton.addEventListener('click',async ()=>{
        let w = document.querySelector('[data-file-window="skipped"]');
        if(w) all.removeChild(w);
        let newWind = getEmptyWindow("Skipped Files");
        let box = document.createElement('div');
        let l = document.createElement('ul');

        newWind.setAttribute('data-file-window','skipped');

        box.style.position = 'absolute';
        box.style.top = "35px";

        let skippedFiles = await getSkippedFiles();

        skippedFiles.forEach(e=>{
            let f = document.createElement('li');
            f.classList.add('smallBtn');
            f.classList.add('yellow');
            f.textContent = e.fileNumber + ' - ' + (e.name?e.name:"")
            f.addEventListener('click',async ()=>{
                await updateFileEditStep("eqTagNumber");
                await updateFileStatus(e.id,false);
                location.reload();
            })
            l.appendChild(f)
        })

        box.appendChild(l);
        newWind.appendChild(box);
        all.appendChild(newWind);
    });

    getCompletedButton.addEventListener('click',async ()=>{
        let w = document.querySelector('[data-file-window="completed"]');
        if(w) all.removeChild(w);
        let newWind = getEmptyWindow("Skipped Files");
        let box = document.createElement('div');
        let l = document.createElement('ul');

        newWind.setAttribute('data-file-window','skipped');

        box.style.position = 'absolute';
        box.style.top = "35px";

        completedPid.forEach(e=>{
            let f = document.createElement('li');
            f.classList.add('smallBtn');
            f.classList.add('yellow');
            f.textContent = e.fileNumber + ' - ' + (e.name?e.name:"")
            f.addEventListener('click',async ()=>{
                await updateFileEditStep("eqTagNumber");
                await updateFileStatus(e.id,false);
                location.reload();
            })
            l.appendChild(f)
        })

        box.appendChild(l);
        newWind.appendChild(box);
        all.appendChild(newWind);
    });

    getIncompleteButton.addEventListener('click',()=>{
        let w = document.querySelector('[data-file-window="incomplete"]');
        if(w) all.removeChild(w);
        let newWind = getEmptyWindow("Skipped Files");
        let box = document.createElement('div');
        let l = document.createElement('ul');

        newWind.setAttribute('data-file-window','incomplete');

        box.style.position = 'absolute';
        box.style.top = "35px";

        incompletePid.forEach(e=>{
            let f = document.createElement('li');
            f.classList.add('smallBtn');
            f.classList.add('yellow');
            f.textContent = e.fileNumber + ' - ' + (e.name?e.name:"")
            f.addEventListener('click',async ()=>{
                //location.reload();
                loadPictureWithLightFile(e);
            })
            l.appendChild(f)
        })

        box.appendChild(l);
        newWind.appendChild(box);
        all.appendChild(newWind);
    })

    list.appendChild(skipButton);
    list.appendChild(getSkippedButton);
    list.appendChild(getCompletedButton);
    list.appendChild(getIncompleteButton);
}

async function buildCategorySelector(catAlias){
    let cat = categoryObjects.find(c=>c.alias===catAlias);
    let catWindow = document.querySelector(`[data-category-window='${cat.alias}'`);
    if(catWindow){
        all.removeChild(catWindow);
    }
    catWindow = getEmptyWindow(cat.name);
    catWindow.setAttribute('data-category-window',cat.alias)
    let box = document.createElement('div');
    let values = await getValuesOfCategoryAlias(catAlias);
    let search = document.createElement('input');
    let optionsBlock = buildOptions();
    let createButton = document.createElement('button');

    catWindow.style.height = '40%';
    catWindow.style.width = '35%';
    catWindow.style.bottom = '80px';
    catWindow.removeChild(catWindow.querySelector('.closeWindow'));

    box.style.position = 'absolute';
    box.style.top = '50px';
    box.style.width = '100%';

    createButton.classList.add('custom-btn-bg');
    createButton.textContent = "Create New " + cat.name;

    search.id = 'select-input-editor';
    search.style.width = '100%';
    search.placeholder = 'Type To Filter List';
    search.autocomplete = 'off';

    search.addEventListener('input',filter);
    createButton.addEventListener('click', ()=>setCatPopup(catAlias, values))

    box.appendChild(search);
    box.appendChild(optionsBlock);
    box.appendChild(createButton);
    catWindow.appendChild(box);
    all.appendChild(catWindow);

    function filter() {
        let filter = search.value.toUpperCase();
        var options = optionsBlock.getElementsByTagName("div");
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
        if(search.value!==null && search.value!=="" && hidden === options.length){
            search.style.backgroundColor = "red";
        }else{
            search.style.backgroundColor = "white"; 
        }
        
    }
    function buildOptions() {
        let dropdownContent = document.createElement('div');
        dropdownContent.style.width = '100%';
        // dropdownContent.classList.add('searchable-dropdown-content');
        values.forEach(e => {
            let option = document.createElement('div');
            option.textContent = e.name;
            option.setAttribute('data-object-id',e.id);
            dropdownContent.appendChild(option);
            option.classList.add('custom-btn-bw');
            option.style.width = '100%';
            option.style.whiteSpace = 'nowrap';
            option.addEventListener('click',()=>{
                search.value = option.textContent;
                search.setAttribute('data-object-id',option.getAttribute('data-object-id'));
        })
        });
    
        return dropdownContent;
    }


}

/***************************************************************************************************************
 * Loto Point Controls
 ****************************************************************************************************************/
function bindInputWithPoint(point,key){
    let input = document.querySelector(`[data-bind-point-id='${point.id}']`);
    point[key] = input.value;
}

async function acceptLotoPoint(point){
    const highlight = document.querySelector(`div.areaHighlights[data-point-id='${point.id}']`);
    const currentWindow = document.querySelector(`div.newWindow[data-point-id='${point.id}']`);

    const resize = highlight.querySelectorAll('.corners');
    if(resize) resize.forEach(e=>e.classList.add('hide'));

    if(editModes.eqTagNumber.state){
        bindInputWithPoint(point,'tagNumber');
        let pointsByTag = await getPointByTag(point.tagNumber);
        if(!pointsByTag===null || pointsByTag.length>0){
            point.location = pointsByTag[0].location;
            point.system = pointsByTag[0].system;
            point.eqType = pointsByTag[0].eqType;
            point.description = pointsByTag[0].description;
            let joinedLotoPoints = [];
            // if(pointsByTag[0].lotoPoints){
            //     pointsByTag[0].lotoPoints.forEach(e=>{if(!joinedLotoPoints.includes(e)) joinedLotoPoints.push(e)}); 
            // }
            // if(point.lotoPoints){
            //     point.lotoPoints.forEach(e=>{if(!joinedLotoPoints.includes(e)) joinedLotoPoints.push(e)});
            // } 

            // pointsByTag[0].lotoPoints = joinedLotoPoints;
            // point.lotoPoints = joinedLotoPoints;

            // updateEqAllFields(pointsByTag[0]);
            updateEqAllFields(point);
            
        }else{
          updateEqTagNumber(point);  
        }
        
        removeResizeAndDisableLpConnection(highlight);
        let area = setAreaAsLotoPoint(highlight);
        all.removeChild(highlight);
        if(point.id)all.removeChild(document.querySelector(`div.newWindow[data-point-id='${point.id}']`));
        else all.removeChild(document.querySelector(`div.newWindow[data-point-id='new']`));
        createHighlight(area)
    }
    if(editModes.eqDescription.state){
        bindInputWithPoint(point,'description');
        point.lotoPoints.forEach(p=>bindInputWithPoint(p,'description'));
        updateEqDescription(point);
        all.removeChild(currentWindow);
        all.removeChild(highlight);
    }
    if(editModes.eqLocation.state){
        point.lotoPoints.forEach(p=>bindInputWithPoint(p,'specificLocation'));
        updateEqLocation(point);
        all.removeChild(currentWindow);
        all.removeChild(highlight);
    }
    if(editModes.lotoPointPosition.state){
        updateIsoPos(point);
        all.removeChild(currentWindow);
        all.removeChild(highlight);
    }
    if(editModes.lotoPointNormPosition.state){
        updateNormPos(point);
        all.removeChild(currentWindow);
        all.removeChild(highlight);
    }
    if(editModes.system.state){
        updateSystem(point);
        all.removeChild(currentWindow);
        all.removeChild(highlight);
    }
    if(editModes.eqType.state){
        updateEqType(point);
        all.removeChild(currentWindow);
        all.removeChild(highlight);
    }
}

function renameLotoPoint(point){
    let input = document.getElementById('value-editor-input');
    const text = document.getElementById('point-info-text-'+point.id);
    const selectInput = document.getElementById('select-input-editor');
    if(editModes.eqLocation.state && point.objectType === "Equipment") input = selectInput;
    if(editModes.lotoPointPosition.state || editModes.lotoPointNormPosition.state || editModes.system.state || editModes.eqType.state) input = selectInput;
    if(input.value){
        if(editModes.eqTagNumber.state)point.tagNumber = input.value;
        if(editModes.eqDescription.state)point.description = input.value;
        if(editModes.eqLocation.state){
            if(point.objectType === "Equipment"){
                point.location = {};
                point.location.id = selectInput.getAttribute('data-object-id');
            }
            else point.specificLocation = input.value;
        }
        if(editModes.lotoPointPosition.state && point.objectType==="LotoPoint"){
            point.isoPos={};
            point.isoPos.id = input.getAttribute('data-object-id');
        }
        if(editModes.lotoPointNormPosition.state && point.objectType==="LotoPoint"){
            point.normPos = {};
            point.normPos.id = input.getAttribute('data-object-id');
        }
        if(editModes.system.state){
            point.system = {};
            point.system.id = input.getAttribute('data-object-id');
        }
        if(editModes.eqType.state){
            point.eqType = {};
            point.eqType.id = input.getAttribute('data-object-id');
        }
        text.value = input.value;

    }
}

function fillLotoPointInfo(point){
    let lotoPointInfo = document.createElement('div');
    let controls = lpEditControls(point);
    let text = document.createElement('input');
    text.readOnly = true;
    text.style.width = '100%'
    text.setAttribute('data-bind-point-id',point.id)

    lotoPointInfo.id = 'point-info-'+point.id;
    lotoPointInfo.classList.add('point-info-block');
    if(editModes.eqDescription.state){
        text.value = point.description;
        text.readOnly = false;
    } 
    else if(editModes.eqTagNumber.state){
        text.readOnly = false;
        text.value = point.tagNumber;
    }
    else if(editModes.eqLocation.state){
        if(point.objectType==="Equipment" && point.location && point.location.name)text.value = point.location.name;
        else{
            text.readOnly = false;
            text.value = point.specificLocation;
        }
    }
    else if(editModes.lotoPointPosition.state){
        text.readOnly = true;
        if(point.isoPos && point.isoPos.name) text.value = point.isoPos.name;
    }
    else if(editModes.lotoPointNormPosition.state){
        text.readOnly = true;
        if(point.normPos && point.normPos.name) text.value = point.normPos.name;
    }
    else if(editModes.system.state){
        text.readOnly = true;
        if(point.system && point.system.name) text.value = point.system.name;
    }
    else if(editModes.eqType.state){
        text.readOnly = true;
        if(point.eqType && point.eqType.name) text.value = point.eqType.name;
    }
    text.classList.add('responsive-text');
    text.id = 'point-info-text-'+point.id;
    controls.classList.add('lotoPointInfo');

    controls.appendChild(text);
    lotoPointInfo.appendChild(controls);
    return lotoPointInfo;
}

function lpEditControls(point){
    let controls = document.createElement('div');
    let name = document.createElement('p')
    let accept = document.createElement('button');
    let rename = document.createElement('button');

    controls.setAttribute('name','loto-point-ctrl');

    controls.classList.add('loto-point-controls');
    name.classList.add('headerText');
    accept.classList.add('highlight-control-accept');
    rename.classList.add('highlight-control-rename');

    if(point.objectType) name.textContent = point.objectType + ' - ' + point.tagNumber+ '/' + (point.description ?point.description : "");
    accept.textContent = "Accept";
    rename.textContent = "Rename";
    
    if(point.objectType==="Equipment" || point.id==='new')controls.appendChild(accept);
    controls.appendChild(rename);
    if(editModes.eqTagNumber.state){
        let enable = document.createElement('button');
        enable.classList.add('highlight-control-enable');
        enable.textContent = "Add Loto Points";
        controls.appendChild(enable);
        enable.addEventListener('click',()=>enableLotoPointConnection(point));

        let remove = document.createElement('button');
        remove.classList.add('highlight-control-remove');
        remove.textContent = "Delete";
        controls.appendChild(remove);
        remove.addEventListener('click',()=>showDeleteEqPopup(point));
    }
    controls.appendChild(name);

    accept.addEventListener('click',()=>acceptLotoPoint(point))
    rename.addEventListener('click',()=>renameLotoPoint(point))


    return controls;
}

function addResizeControls(highlight){
    highlight.querySelectorAll('.corners').forEach(e=>e.classList.remove('hide'));
}

function removeResizeAndDisableLpConnection(highlight){
    highlight.querySelectorAll('.corners').forEach(e=>e.classList.add('hide'));
    document.querySelectorAll('.addButtons').forEach(e=>e.classList.add('hide'));


}

/**
 * Current flow: 
 * Get all light incomplete files
 * Get all light completed files
 * Filter Kiewit only
 * Get first item from incomplete array use its link to get full file
 * Set edit mode before loading file using file bulkEditStep field
 * Load picture
 * Set Areas for each point
 * Depending on edit step set up highlights
 * On click on area or dobule click on highligh open edit info menu
 * Menu provides controls to edit and accept data
 * On accept - close info menu and handle point highlight (depending on editing mode)
 * 
 * Multiple info menues can be open - to track which point is beaing updated using highlight id to get assosiated point from selectedBundle
 * 
 */

/**
 * New flow: 
 * Get all light incomplete files
 * Get all light completed files
 * Filter Kiewit only
 * Get first item from incomplete array use its link to get full file
 * Set edit mode before loading file using file bulkEditStep field
 * Load picture
 * Set Areas for each point
 * 
 * Different:
 * Depending on edit step, set up highlights - create different logic for each step and combine it itno one method that selects correct method
 * On click on area or dobule click on highligh open edit info menu - as a new window
 * Menu provides controls to edit and accept data
 * On accept - close info menu and handle point highlight (depending on editing mode)
 * 
 * Multiple info menues can be open - to track which point is beaing updated using highlight id to get assosiated point from selectedBundle
 * 
 */


/*
Highlighter selects certain points (all loto points for example)
Builds a bundle of: area, highlight, point
Adds items into arrays: selectedAreas, selectedBundles
It needs to be able to build highlight without controls and info menu
 */
function highlighter(){ // this will go into setAreas
    if(editModes.eqTagNumber.state) highlightForEqTagNumber();
    if(editModes.eqDescription.state) highlightForEqDescription();
    if(editModes.eqLocation.state) highlightForLocation();
    if(editModes.lotoPointPosition.state) highlightForPosition();
    if(editModes.lotoPointNormPosition.state) highlightForNormPosition();
    if(editModes.system.state) highlightForSystem();
    if(editModes.eqType.state) highlightForEqType();
}

function highlightForEqDescription(){
    let areas = document.querySelectorAll('[data-loto-point-area]');
    removeAllHighlights();
    for(let e of areas){
        selectedArea = fileWithPoints.points.find(el=>el.id===parseInt(e.getAttribute('data-point-id')));
        if(editModes.eqDescription.state && selectedArea.description && selectedArea.description.trim()!==""){
            continue;
        }else{
        selectedAres.push(selectedArea);
        let hl = createHighlight(e); // need to add parameter to chose if controls needs to be built
        selectedBundle.push({"area":e,"eq":selectedArea,"highlight":hl});
        }
    }
}

function highlightForEqTagNumber(){
    let areas = document.querySelectorAll('[data-loto-point-area]');
    removeAllHighlights();
    for(let e of areas){
        selectedArea = fileWithPoints.points.find(el=>el.id===parseInt(e.getAttribute('data-point-id')));
        selectedAres.push(selectedArea);
        let hl = createHighlight(e); // without 2nd argument controls will not be built
        selectedBundle.push({"area":e,"eq":selectedArea,"highlight":hl});
    }
}

function highlightForLocation(){
    let areas = document.querySelectorAll('[data-loto-point-area]');
    removeAllHighlights();
    for(let e of areas){
        selectedArea = fileWithPoints.points.find(el=>el.id===parseInt(e.getAttribute('data-point-id')));
        if(editModes.eqLocation.state && selectedArea.location && selectedArea.location.name && selectedArea.location.name.trim()!==""){
            continue;
        }else{
        selectedAres.push(selectedArea);
        let hl = createHighlight(e); // need to add parameter to chose if controls needs to be built
        selectedBundle.push({"area":e,"eq":selectedArea,"highlight":hl});
        }
    }
}

function highlightForPosition(){
    let areas = document.querySelectorAll('[data-loto-point-area]');
    removeAllHighlights();
    for(let e of areas){
        selectedArea = fileWithPoints.points.find(el=>el.id===parseInt(e.getAttribute('data-point-id')));
        selectedAres.push(selectedArea);
        let hl = createHighlight(e);
        selectedBundle.push({"area":e,"eq":selectedArea,"highlight":hl});
    }
}

function highlightMultipleLotoPointEq(){
    let areas = getEqWithMultipleLotoPoints();
    removeAllHighlights();
    for(let e of areas){
        selectedArea = fileWithPoints.points.find(el=>el.id===parseInt(e.getAttribute('data-point-id')));
        selectedAres.push(selectedArea);
        let hl = createHighlight(e);
        selectedBundle.push({"area":e,"eq":selectedArea,"highlight":hl});
    }

    let instButton = document.getElementById('stepButton');
    instButton.textContent = 'Verify Equipment with multiple Loto Points'
    let nextButton = document.getElementById('next-step-button');
    nextButton.removeEventListener('click',highlightMultipleLotoPointEq);
    nextButton.addEventListener('click',moveToNextStep);
}

function highlightForNormPosition(){
    let areas = paintLotoPointForNormPos();
    removeAllHighlights();
    for(let e of areas){
        selectedArea = fileWithPoints.points.find(el=>el.id===parseInt(e.getAttribute('data-point-id')));
        selectedAres.push(selectedArea);
        let hl = createHighlight(e);
        selectedBundle.push({"area":e,"eq":selectedArea,"highlight":hl});
    }
}

function highlightForSystem(){
    let areas = document.querySelectorAll('[data-loto-point-area]');
    removeAllHighlights();
    for(let e of areas){
        selectedArea = fileWithPoints.points.find(el=>el.id===parseInt(e.getAttribute('data-point-id')));
        if(editModes.system.state && selectedArea.system && selectedArea.system.name && selectedArea.system.name.trim()!==""){
            continue;
        }else{
        selectedAres.push(selectedArea);
        let hl = createHighlight(e); // need to add parameter to chose if controls needs to be built
        selectedBundle.push({"area":e,"eq":selectedArea,"highlight":hl});
        }
    }
}

function highlightForEqType(){
    let areas = document.querySelectorAll('[data-loto-point-area]');
    removeAllHighlights();
    for(let e of areas){
        selectedArea = fileWithPoints.points.find(el=>el.id===parseInt(e.getAttribute('data-point-id')));
        if(editModes.eqType.state && selectedArea.eqType && selectedArea.eqType.name && selectedArea.eqType.name.trim()!==""){
            continue;
        }else{
        selectedAres.push(selectedArea);
        let hl = createHighlight(e); // need to add parameter to chose if controls needs to be built
        selectedBundle.push({"area":e,"eq":selectedArea,"highlight":hl});
        }
    }
}



/**
 * Bulk Edit Function:
 * Enable select 
 * Remove all highlights
 * Higlight multiple points
 * Add all points to array
 * Select value 
 * Assign new value to all points in array on submit
 * Save in DB
 */

let bulkEditArray = [];
let bulkEditEnabled = false;
let matchLpLocation = false;

function enableBulkEdit(){
    matchLpLocation = false;
    removeAllHighlights();
    bulkEditArray = [];
    bulkEditEnabled = true;
    let allLotoHighlights = document.querySelectorAll('[data-loto-point-area]');
    allLotoHighlights.forEach(e=>{
        e.addEventListener('click',addPointToArray);
    });
    let enable = document.getElementById('bulk-edit-enabler');
    enable.textContent = "Submit Selected Points";
    enable.removeEventListener('click', enableBulkEdit);
    enable.addEventListener('click',submitBulkEdit);
    bulkEditControlBuilder();
}

async function submitBulkEdit(){
    let categoryAlias;
    if(editModes.eqLocation.state)categoryAlias='location';
    if(editModes.lotoPointPosition.state)categoryAlias='isoPos';
    if(editModes.lotoPointNormPosition.state)categoryAlias='normPos';
    if(editModes.system.state)categoryAlias='system';
    if(editModes.eqType.state)categoryAlias='eqType';

    let value = document.getElementById('select-input-editor').getAttribute('data-object-id');
    let text = document.getElementById('select-input-editor').value;
    bulkEditEnabled = false;
    document.querySelectorAll('[data-loto-point-area]').forEach(e=>{
        e.removeEventListener('click',addPointToArray);
    });

    for(let e of bulkEditArray){
        if(editModes.eqLocation.state){
            e[categoryAlias] = {};
            e[categoryAlias].id = value;
            if(matchLpLocation === true){
                e.lotoPoints.forEach(p=>{
                    p.specificLocation=text
            });
            }
            await updateEqLocation(e);
        }
        if(editModes.lotoPointPosition.state){
            let lp = e.lotoPoints.find(el=>el.tagNumber===e.tagNumber);
            if(lp){
                lp.isoPos={};
                lp.isoPos.id=value;
                console.log(value)
                await updateIsoPos(e,true);
            }

        }
        if(editModes.lotoPointNormPosition.state){
            let lp = e.lotoPoints.find(el=>el.tagNumber===e.tagNumber);
            if(lp){
                lp.normPos={};
                lp.normPos.id=value;
                console.log(value)
                await updateNormPos(e,true);
            }
            
        }
        if(editModes.system.state){
            e[categoryAlias] = {};
            e[categoryAlias].id = value;
            await updateSystem(e);
        }
        if(editModes.eqType.state){
            e[categoryAlias] = {};
            e[categoryAlias].id = value;
            await updateEqType(e);
        }
    }
    loadPictureWithLightFile(file);
    let w = document.querySelector('[data-bulk-edit="controls-window"]');
    if(w) all.removeChild(w);
}

function addPointToArray(event){
    if(event.target.classList.contains('ar')){
        let point = getPointByIdFromCurrentFile(event.target.getAttribute('data-point-id'));
        bulkEditArray.push(point);
        console.log(bulkEditArray.length)
    }
}

function removePointFromBulkArray(highligh){
    let point = getPointByIdFromCurrentFile(highligh.getAttribute('data-point-id'));
    bulkEditArray=bulkEditArray.filter(e=>e.id!==point.id);
    console.log(bulkEditArray.length)
}

function bulkEditControlBuilder(){
    let w = document.querySelector('[data-bulk-edit="controls-window"]');
    if(w) all.removeChild(w);
    let newWind = getEmptyWindow();
    newWind.setAttribute('data-bulk-edit', 'controls-window');
    newWind.style.width = '20%';

    let controlsBox = document.createElement('div');
    let label = document.createElement('label');
    let check = document.createElement('input');
    let selectAllButton = document.createElement('button');
    let unselectAllButton = document.createElement('button');
    
    controlsBox.style.position = 'absolute';
    controlsBox.style.top = '35px';
    controlsBox.style.backgroundColor = 'white';
    controlsBox.style.display = 'flex';
    controlsBox.style.flexDirection = 'column';

    label.for = 'matchLocations';
    label.textContent = "Match LP location with Eq"
    check.id = 'matchLocations';
    check.type = 'checkbox';
    check.addEventListener('change', () => {
        matchLpLocation = check.checked;  // Update the boolean variable
        console.log(matchLpLocation)
    });

    selectAllButton.textContent = 'Select All';
    unselectAllButton.textContent = "Unselect All";
    selectAllButton.addEventListener('click',selectAllForBulkEdit);
    unselectAllButton.addEventListener('click',unselectAllForBulkEdit);

    controlsBox.appendChild(label);
    controlsBox.appendChild(check);
    controlsBox.appendChild(selectAllButton);
    controlsBox.appendChild(unselectAllButton);
    newWind.appendChild(controlsBox);
    all.appendChild(newWind);
}

function selectAllForBulkEdit(){
    bulkEditArray = [];
    let areas = document.querySelectorAll('[data-loto-point-area]');
    areas.forEach(e=>{
        let point = fileWithPoints.points.find(el=>el.id===parseInt(e.getAttribute('data-point-id')));
        bulkEditArray.push(point);
        createHighlight(e,true)
    })
}

function unselectAllForBulkEdit(){
    bulkEditArray = [];
    removeAllHighlights();
}



/*****
 * Get Equipment with multiple Loto Points
 */

function getEqWithMultipleLotoPoints(){
    let allPoints = document.querySelectorAll('[data-loto-point-area]');
    let hlWithMultiplePoints = []
    let eqWithMultiplePoints = [];
    allPoints.forEach(e=>{
        let point = getPointByIdFromCurrentFile(e.getAttribute('data-point-id'));
        if(point.lotoPoints.length>1 && !pointsAreSame(point)){
            eqWithMultiplePoints.push(point);
            hlWithMultiplePoints.push(e);
        } 
    })
    function pointsAreSame(point){
        let eqTag = point.tagNumber.trim().toLowerCase().substring(2);
        point.lotoPoints.forEach(e=>{
            let same = e.tagNumber.trim().toLowerCase().substring(2) === eqTag;
            if(!same) return same;
        })
    }
    return hlWithMultiplePoints;
}

function paintLotoPointForNormPos(){
    let allPoints = document.querySelectorAll('[data-loto-point-area]');
    for(let e of allPoints){
        let point = getPointByIdFromCurrentFile(e.getAttribute('data-point-id'));
        if(point.lotoPoints!=null && point.lotoPoints.length>0){
            directLotoPoint = point.lotoPoints.find(el=>el.tagNumber===point.tagNumber);
            if(!directLotoPoint) directLotoPoint = point.lotoPoints[0];
            if(directLotoPoint.normPos && directLotoPoint.normPos.name && directLotoPoint.normPos.name.toLowerCase().includes('open')){
                e.setAttribute('data-loto-point-area', true);
            }
            else if(directLotoPoint.normPos && directLotoPoint.normPos.name && directLotoPoint.normPos.name.toLowerCase().includes('closed')){
                e.setAttribute('data-loto-point-area', false);
            }
            else e.setAttribute('data-loto-point-area', '');
        }
    }
    return allPoints;
}
