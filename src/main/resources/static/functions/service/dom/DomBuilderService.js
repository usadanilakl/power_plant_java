import BaseDomBuilder from "../../dom/base/BaseDomBuilder.js";
import Dropdown from "../../dom/base/Dropdown.js";
import Input from "../../dom/base/Input.js";
import List from "../../dom/base/List.js";
import Table from "../../dom/base/Table.js";

class DomBuilderService extends BaseDomBuilder{
    static buildList(attributes,styles){return List.list(attributes,styles);}
    static buildItem(obj,attributes,styles,actions){return List.item(obj,attributes,styles,actions);}
    static buildInputWithLabelAndControls(labelText,placeholderText,id){return Input.buildInputWithLabelAndControls(labelText,placeholderText,id)}
    static async buildCatInputDropdownWithControls(object,key){return await Dropdown.buildCatInputDropdown(object,key);}
    static async buildCatInputDropdownFromCatObj(catObj){return await Dropdown.buildCatInputDropdownFromCatObj(catObj);}
    static buildInputDdropdown(header, items, id){return Dropdown.buildInputDropdown(header, items, id)}
    // static buildTableFromObject(array, ignoreFields, style){return Table.buildTableFromObject(array,ignoreFields,style)}
}
export default DomBuilderService;