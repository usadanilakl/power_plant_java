
class EqService{
    static doubleClickArea(element){
        if(modes.viewMode.state) jumpToFile(element.getAttribute('name'))
        else if(modes.editMode.state) console.log('editing'+element.getAttribute('name'))
    }

}
export default EqService;