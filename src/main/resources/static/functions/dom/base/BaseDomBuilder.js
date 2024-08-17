class BaseDomBuilder{
    createElement(element,attributes,styles,actions){
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

    createContainer(attributes, styles){
        let c = this.createElement('div', attributes, styles, null)
    }
}
export default BaseDomBuilder;