
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
    let info = highlight.querySelector('.highlightInfo');
    let controls = highlight.querySelector('.highlight-controls');
    controls.innerHTML = '';
    info.innerHTML = "";
    //initResize(highlight, false);
}
function removePoint(highlight){
    activeHighlights = activeHighlights.filter(e=>e.id!==highlight.id)
    selectedBundle = selectedBundle.filter(e=>e.highlight.id!==highlight.id)
    document.getElementById('all').removeChild(highlight);
    selectedArea = selectedBundle[selectedBundle.length-1].eq;
    fillExcelPointInfoWindow(getExcelPointsByLabel(selectedArea.tagNumber));
}

function setEditType(){
    if(editModes.eqTagNumber.state){
        //hideAllResizeElements();
    }
}

