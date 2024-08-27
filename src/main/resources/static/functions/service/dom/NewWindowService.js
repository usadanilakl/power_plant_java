import NewWindowDom from "../../dom/window/NewWindowDom.js";

class NewWindowService{

    static windowId = 1;
    static zIndexOfWindows = 100;

    static bringOnTop(element){
        NewWindowService.zIndexOfWindows++;
        element.style.zIndex=NewWindowService.zIndexOfWindows+'';
    }

    static getNewWindow(header,all){
        return NewWindowDom.getEmptyWindow(header,all);
    }

    static getPopupWindow(header,all){
        return NewWindowDom.getEmptyWithdowWithCover(header,all);
    }

    static newInfoWindow(name){

    }

}
export default NewWindowService;



