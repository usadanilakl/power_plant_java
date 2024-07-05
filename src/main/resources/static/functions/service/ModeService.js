
let modes = {
    viewMode:{state:true, name:'View Mode'},
    editMode:{state:false, name:'Edit Mode'},
    drawMode:{state:false, name:'Draw Mode'},
    lotoMode:{state:false, name:'Loto Mode'},
    
}

function setMode(mode){
    let dropdown = document.getElementById('mode-dropdown');
    for(let m in modes){
        modes[m].state = false
    }
    modes[mode].state = true;
    dropdown.value = mode;
    pointEditModeControl();
    lotoModeControl();
}

function createModeButtons(){
    let dropdown = document.createElement('select');
    dropdown.setAttribute('id','mode-dropdown')
    for(let m in modes){
        let option = document.createElement('option');
        option.textContent = modes[m].name;
        option.setAttribute('value', m);
        dropdown.appendChild(option);
    }
    dropdown.addEventListener('change',()=>{
        setMode(dropdown.value);
    });
    return dropdown;
}

