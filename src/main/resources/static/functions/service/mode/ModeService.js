import EqService from "../equipment/EqService.js";
import LotoService from "../permits/LotoService.js";

class ModeService{
    static MODES = {
        viewMode:{state:true, name:'View Mode'},
        editMode:{state:false, name:'Edit Mode'},
        drawMode:{state:false, name:'Draw Mode'},
        lotoMode:{state:false, name:'Loto Mode'},
        
    }
    
    static setMode(mode){
        let dropdown = document.getElementById('mode-dropdown');
        for(let m in ModeService.MODES){
            ModeService.MODES[m].state = false
        }
        ModeService.MODES[mode].state = true;
        dropdown.value = mode;
        EqService.eqEditModeControl();
        LotoService.lotoModeControl();
    }
    
    static createModeButtons(){
        let dropdown = document.createElement('select');
        dropdown.setAttribute('id','mode-dropdown')
        for(let m in ModeService.MODES){
            let option = document.createElement('option');
            option.textContent = ModeService.MODES[m].name;
            option.setAttribute('value', m);
            dropdown.appendChild(option);
        }
        dropdown.addEventListener('change',()=>{
            ModeServicesetMode(dropdown.value);
        });
        return dropdown;
    }
}

export default ModeService;




