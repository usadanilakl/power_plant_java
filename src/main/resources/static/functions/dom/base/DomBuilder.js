import List from "./List.js";

class DomBuilder{
    list = new List();
    getList(attributes,styles){return this.list.list(attributes,styles);}
    getItem(obj,attributes,styles,actions){return this.list.item(obj,attributes,styles,actions);}

}
export default DomBuilder;