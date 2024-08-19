import NewWindowDom from "../../dom/window/NewWindowDom";

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

}
export default NewWindowService;



