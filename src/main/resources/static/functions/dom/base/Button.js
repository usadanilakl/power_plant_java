import BaseDomBuilder from "./BaseDomBuilder.js";

class Button extends BaseDomBuilder{
    static createButton(){
        let button = super.createElement('button', attributes, styles, actions);
    }
}
export default Button;