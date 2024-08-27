import UtilService from "../../service/util/UtilService.js";
import BaseDomBuilder from "./BaseDomBuilder.js";

class Input extends BaseDomBuilder{
    static buildInputWithLabel(labelText,placeholderText,id){
        let div = document.createElement('div'); //input container
        let label = document.createElement('label'); //input name
        let input = document.createElement('input');

        div.classList.add('form-group'); //bootstrap styling for input container

        label.setAttribute('for',id);//connect label and input
        label.textContent = labelText;
        
        input.setAttribute('id',id);
        input.setAttribute('placeholder',placeholderText);
        input.classList.add('custom-input'); //bootstrap styling for input field

        div.appendChild(label);
        div.appendChild(input);
        return div;
    }

    static buildInputWithLabelAndButton(labelText,placeholderText,id){
        let container = Input.buildInputWithLabel(labelText,placeholderText,id);
        const elementToWrap = container.querySelector('input');
        const wrapper = document.createElement('div');
        const button = document.createElement('button');

        button.textContent = '+';

        elementToWrap.parentNode.insertBefore(wrapper, elementToWrap);
        wrapper.appendChild(elementToWrap);
        wrapper.appendChild(button);
        wrapper.style.display = 'inline';

        return container;
    }

    static buildInputWithLabelAndControls(labelText,placeholderText,id){
        let container = Input.buildInputWithLabel(labelText,placeholderText,id);
        const input = container.querySelector('input');
        const wrapper = document.createElement('div');
        const button = document.createElement('button');
        const copyBtn = document.createElement('button');
        const pasteBtn = document.createElement('button');

        wrapper.classList.add('input-block');

        button.textContent = '+';
        copyBtn.textContent = 'C';
        pasteBtn.textContent = 'P';

        button.type = 'button';
        copyBtn.type = 'button';
        pasteBtn.type = 'button';

        button.classList.add('util-button');
        button.classList.add('smallBtn');
        button.classList.add('green');

        copyBtn.classList.add('copy-button');
        copyBtn.classList.add('smallBtn');
        copyBtn.classList.add('blue');

        pasteBtn.classList.add('paste-button');
        pasteBtn.classList.add('smallBtn');
        pasteBtn.classList.add('red');

        copyBtn.addEventListener('click',()=>UtilService.copyToClipboard(input));
        pasteBtn.addEventListener('click',()=>UtilService.pasteFromClipboardWithoutClearing(input));

        input.parentNode.insertBefore(wrapper, input);
        wrapper.appendChild(copyBtn);
        wrapper.appendChild(pasteBtn);
        wrapper.appendChild(input);
        wrapper.appendChild(button);

        return container;
    }
    

}

export default Input;