import Dropdown from "../../dom/base/Dropdown.js";
import Input from "../../dom/base/Input.js";
import List from "../../dom/base/List.js";

class DomBuilderService{
    static buildList(attributes,styles){return List.list(attributes,styles);}
    static buildItem(obj,attributes,styles,actions){return List.item(obj,attributes,styles,actions);}
    static buildInputWithLabelAndControls(labelText,placeholderText,id){return Input.buildInputWithLabelAndControls(labelText,placeholderText,id)}
    static buildCatInputDropdownWithControls(object,key){return Dropdown.buildCatInputDropdown(object,key);}
    static buildInputDdropdown(header, items, id){return Dropdown.buildInputDropdown(header, items, id)}
}
export default DomBuilderService;