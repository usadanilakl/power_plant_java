import BaseDomBuilder from "./BaseDomBuilder.js";

class List extends BaseDomBuilder{
    item(object,attributes,styles,actions){    
        let i = super.createElement('li', attributes, styles, actions)
        i.textContent = object.itemText;
        console.log(JSON.stringify(object));

        attributes.forEach(e=>{
            for(let key in e){
                i.setAttribute(key,object[e[key]]);
                console.log(key);
                console.log(e[key]);
            }
        })

        return i;
    }

    list(attributes,styles){
        let l = super.createElement('ul',attributes,styles,null)
        return l;
    }
}
export default List;