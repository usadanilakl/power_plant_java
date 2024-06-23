
let modes = {
    editMode:{state:false, name:'Edit Mode'},
    drawMode:{state:false, name:'Draw Mode'},
    viewMode:{state:true, name:'View Mode'},
}

function setMode(mode){
    for(let m in modes){
        modes[m].state = false
    }
    modes[mode].state = true;
}

function createModeButtons(){
    let dropdown = document.createElement('select');
    for(let m in modes){
        let option = document.createElement('option');
        option.textContent = modes[m].name;
        option.setAttribute('value', m);
        dropdown.appendChild(option);
    }
    dropdown.addEventListener('change',()=>{setMode(dropdown.value)});
    return dropdown;
}
let left = document.getElementById('left');
left.appendChild(createModeButtons());