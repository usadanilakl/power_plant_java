class BaseDomBuilder{
    static createElement(element,attributes,styles,actions){
        let i = document.createElement(element);

        //Set attirbutes for the item        
        if(attributes){
            attributes.forEach(a=>{
                for(let key in a){
                    i.setAttribute(key,a[key])
                }
            })
        }

        //Set styles for the itme
        if(styles){
            styles.forEach(s=>{
                i.classList.add(s);
            })
        }

        //Set click action for the item
        if(actions){
            actions.forEach(a=>{
                i.addEventListener('click',a); 
            })
            
        }
        return i;
    }
    static createElementWithSettings(set){
        return BaseDomBuilder.createElement(set.element, set.attributes, set.styles, set.actions);
    }

    static createContainer(attributes, styles){
        return BaseDomBuilder.createElement('div', attributes, styles, null)
    }
}
export default BaseDomBuilder;