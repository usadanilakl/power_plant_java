import DomBuilder from "../../service/dom/DomBuilderService.js";

class FileMenu{

    static dropdownMenu(objects, attributes, styles,container){
        console.log("Building Dropdown")
        let list = DomBuilder.buildList();
        for (let ob of objects){
            let item = DomBuilder.buildItem(ob, attributes, styles,[ob.dropdownFunc]);
            item.setAttribute('data-file-menu','item')
            item.addEventListener('click',()=>FileMenu.highlightLastClickedButton('[data-file-menu="item"]',item));
            list.appendChild(item);
        }
        container.appendChild(list);
    }

    static highlightLastClickedButton(locator,button){
        let buttons = document.querySelectorAll(locator);
        buttons.forEach(b=>b.classList.remove('last-clicked'));
        button.classList.add('last-clicked');
    }
}
export default FileMenu;