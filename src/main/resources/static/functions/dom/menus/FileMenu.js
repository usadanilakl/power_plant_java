import DomBuilder from "../base/DomBuilder.js";

class FileMenu{
    domBuilder = new DomBuilder();

    dropdownMenu(objects, attributes, styles,container){
        let list = this.domBuilder.getList();
        for (let ob of objects){
            let item = this.domBuilder.getItem(ob, attributes, styles,[ob.dropdownFunc]);
            list.appendChild(item);
        }
        container.appendChild(list);
    }
}
export default FileMenu;