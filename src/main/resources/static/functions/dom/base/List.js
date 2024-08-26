import BaseDomBuilder from "./BaseDomBuilder.js";

class List extends BaseDomBuilder{
    static item(object,attributes,styles,actions){
        let i = super.createElement('li', attributes, styles, actions)
        i.textContent = object.itemText;

        attributes.forEach(e=>{
            for(let key in e){
                i.setAttribute(key,object[e[key]]);
            }
        })

        return i;
    }

    static list(attributes,styles){
        let l = super.createElement('ul',attributes,styles,null)
        return l;
    }
}
export default List;