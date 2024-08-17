import BaseDomBuilder from "./BaseDomBuilder.js";

class Button extends BaseDomBuilder{
    createButton(){
        let button = super.createElement('button', attributes, styles, actions);
    }
}
export default Button;