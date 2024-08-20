import NewWindowDom from "../../dom/window/NewWindowDom.js";

class NewWindowService{

    static windowId = 1;
    static zIndexOfWindows = 100;

    static bringOnTop(element){
        NewWindowService.zIndexOfWindows++;
        element.style.zIndex=NewWindowService.zIndexOfWindows+'';
    }

    static getNewWindow(header){
        return NewWindowDom.getEmptyWindow(header);
    }

    static newInfoWindow(name){

    }

}
export default NewWindowService;



