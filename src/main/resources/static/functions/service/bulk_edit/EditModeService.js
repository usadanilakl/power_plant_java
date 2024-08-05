
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
    lotoPointPosition:{state:false,name:"Loto Point Position"},
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

function fillHighlightInfo(highlight){
    let highlightInfo = highlight.querySelector('.highlightInfo');
    if(selectedArea){
        if(editModes.eqDescription.state){
            if(!selectedArea.description || selectedArea.description.trim()==="") selectedArea.description = selectedArea.lotoPoints[0].description;
            let allInfoWindow = getEmptyWindow(selectedArea.tagNumber);
            allInfoWindow.style.width = 'fit-content';
            allInfoWindow.style.height = 'fit-content';

            allInfoWindow.style.left = highlight.offsetLeft + 'px';
            allInfoWindow.style.top = highlight.offsetTop+highlight.offsetHeight+ 'px';

            allInfoWindow.appendChild(fillLotoPointInfo(selectedArea))
            selectedArea.lotoPoints.forEach(e=>{
                allInfoWindow.appendChild(fillLotoPointInfo(e))
            });

            document.getElementById('all').appendChild(allInfoWindow);
            // allInfoWindow.style

            // let text = document.createElement('p');
            // text.classList.add('responsive-text')
            
            // text.textContent =  selectedArea.description;
            // highlightInfo.appendChild(text);
            // selectedArea.lotoPoints.forEach(e=>{
            //     highlight.appendChild(fillLotoPointInfo(e))
            // })

        }else if(editModes.eqTagNumber.state){
            let text = document.createElement('p');
            text.classList.add('responsive-text')
            text.textContent =  selectedArea.tagNumber;
            highlightInfo.appendChild(text);
            buildLotoPointList(selectedArea.lotoPoints, highlight);
        }
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

function buildLotoPointList(points, highlight){
    let lotoPoints = document.createElement('div');
    lotoPoints.classList.add('highlihgt-loto-points');
    points.forEach(e=>{
        let buttonContainer = document.createElement('div');
        let point = document.createElement('button');
        let control = document.createElement('button');

        buttonContainer.classList.add('loto-point-box');

        buttonContainer.appendChild(point);
        buttonContainer.appendChild(control);

        point.textContent = e.tagNumber;
        control.textContent = "X";

        control.addEventListener('click',()=> removeLotoPoint(e.id))
        lotoPoints.appendChild(buttonContainer);
    })
    if(!highlight) highlight = selectedBundle.find(el=>el.eq.id===selectedArea.id).highlight;
    let info = highlight.querySelector('.highlightInfo');
    let pointContainer = info.querySelector('.highlihgt-loto-points');
    if(pointContainer) info.removeChild(pointContainer);
    info.appendChild(lotoPoints);
    return lotoPoints;
}

function addLotoPoint(point){
    if(!selectedArea.lotoPoints) selectedArea.lotoPoints = [];
    selectedArea.lotoPoints.push(point);
    return buildLotoPointList(selectedArea.lotoPoints);
}

function removeLotoPoint(id){
    selectedArea.lotoPoints = selectedArea.lotoPoints.filter(e=>e.id!==id);
    return buildLotoPointList(selectedArea.lotoPoints);
}

function showInsturctions(){
    let instrWind = newWindow();
    let img = document.createElement('img');
    img.src = '';
    instrWind.appendChild(img);
}

async function moveToNextStep(){
    if(editModes.eqTagNumber.state){
       let updatedFile = await updateFileEditStep("eqDescription");
        loadPictureWithLightFile(updatedFile);
    }
    if(editModes.eqDescription.state){}
    if(editModes.eqTagNumber.state){}
}

function buildEditStepControls(){
    console.log("building edit controls for the page")
    let list = document.getElementById('bulk-edit-controls');
    list.innerHTML = "";
    if(editModes.eqTagNumber.state){
        let li1 = document.createElement('li');
        let li2 = document.createElement('li');
        let li3 = document.createElement('li');
        let li4 = document.createElement('li');
        let inp = document.createElement('input');

        li1.classList.add("btn")
        li1.classList.add("btn-outline-light")
        li2.classList.add("btn")
        li2.classList.add("btn-outline-light")
        li3.classList.add("btn")
        li3.classList.add("btn-outline-light")
        li4.classList.add("btn")
        li4.classList.add("btn-outline-light")

        inp.type = 'text';
        inp.placeholder = "Type here for changes";
        inp.id = "value-editor-input";

        li1.addEventListener('click',()=>showInsturctions());
        li3.addEventListener('click',()=>createNewHighlight());
        li4.addEventListener('click',()=>moveToNextStep());

        li1.textContent = "Step 1: Select all loto points (click for details)";
        li3.textContent = "Highlight New Equipment";
        li4.textContent = "Submit Selected Points";

        li2.appendChild(inp);
        list.appendChild(li1);
        list.appendChild(li2);
        list.appendChild(li3);
        list.appendChild(li4);
    }
    else if(editModes.eqDescription.state){
        let li1 = document.createElement('li');
        let li2 = document.createElement('li');
        let li3 = document.createElement('li');
        let li4 = document.createElement('li');
        let inp = document.createElement('input');

        li1.classList.add("btn")
        li1.classList.add("btn-outline-light")
        li2.classList.add("btn")
        li2.classList.add("btn-outline-light")
        li3.classList.add("btn")
        li3.classList.add("btn-outline-light")
        li4.classList.add("btn")
        li4.classList.add("btn-outline-light")

        inp.type = 'text';
        inp.placeholder = "Type here for changes";
        inp.id = "value-editor-input";

        li1.addEventListener('click',()=>showInsturctions());
        // li3.addEventListener('click',()=>createNewHighlight());
        li4.addEventListener('click',()=>moveToNextStep());

        li1.textContent = "Step 2: Edit Equipment Description (click for details)";
        li3.textContent = "";
        li4.textContent = "Next Step";

        li2.appendChild(inp);
        list.appendChild(li1);
        list.appendChild(li2);
        list.appendChild(li4);
    }
    else if(editModes.eqTagNumber.state){

    }
}

/***************************************************************************************************************
 * Loto Point Controls
 ****************************************************************************************************************/

function acceptLotoPoint(highlight){
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
}

function renameLotoPoint(highlight){
    selectedArea = selectedBundle.find(e=>e.highlight.id === highlight.id).eq;
    let text = highlight.querySelector('.responsive-text');
    let input = document.getElementById('value-editor-input');
    if(input.value){
        if(editModes.eqTagNumber.state)selectedArea.tagNumber = input.value;
        if(editModes.eqDescription.state)selectedArea.description = input.value;
        text.textContent = input.value;
    }
}

function fillLotoPointInfo(point){
    let lotoPointInfo = document.createElement('div');
    let controls = lpEditControls(point);
    let text = document.createElement('p');

    text.textContent = point.description;
    text.classList.add('responsive-text');
    controls.classList.add('lotoPointInfo');

    controls.appendChild(text);
    lotoPointInfo.appendChild(controls);
    return lotoPointInfo;
}

function lpEditControls(point){
    let controls = document.createElement('div');
    let accept = document.createElement('button');
    let rename = document.createElement('button');

    controls.setAttribute('name','loto-point-ctrl');

    controls.classList.add('loto-point-controls')
    accept.classList.add('highlight-control-accept');
    rename.classList.add('highlight-control-rename');

    accept.textContent = "Accept";
    rename.textContent = "Rename";
    
    controls.appendChild(accept);
    controls.appendChild(rename);

    accept.addEventListener('click',()=>acceptLotoPoint(point))
    rename.addEventListener('click',()=>renameLotoPoint(point))

    return controls;
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

