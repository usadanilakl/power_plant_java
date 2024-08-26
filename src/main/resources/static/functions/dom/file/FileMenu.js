import DomBuilder from "../../service/dom/DomBuilderService.js";

class FileMenu{

    static dropdownMenu(objects, attributes, styles,container){
        console.log("Building Dropdown")
        let list = DomBuilder.buildList();
        for (let ob of objects){
            let item = DomBuilder.buildItem(ob, attributes, styles,[ob.dropdownFunc]);
            list.appendChild(item);
        }
        container.appendChild(list);
    }
}
export default FileMenu;