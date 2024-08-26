import BaseDomBuilder from "./BaseDomBuilder.js";
import Input from "./Input.js";

class Form extends BaseDomBuilder{
    static formAttributes ={
        element:'form',
        attributes:[],
        styles:[],
        actions:[]
    }
    static inputContainerAttributes = {
        element:'div',
        attributes:[],
        styles:['searchable-dropdown','form-group',],
        actions:[]       
    }

    static inputAttributes = {
        element:'input',
        attributes:[],
        styles:[],
        actions:[]
    }

    static labelAttributes = {
        element:'label',
        attributes:[],
        styles:['white-text',],
        actions:[]
    }
    static buildFromFromObject(object){
        let form = super.createElementWithSettings(Form.formAttributes);
        for(let e in object){
            Form.labelAttributes.attributes.push({'for':e});

            let inputContainer = super.createElementWithSettings(Form.inputContainerAttributes);
            let input = super.createElementWithSettings(Form.inputAttributes);

            
        }

    
        return form;
    }
}
export default Form;