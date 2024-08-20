import GlobalVariables from "../../global/GlobalVariables.js";
import EqRepo from "../../repository/EqRepo.js";

class CoordinateCalculator{
    static serverStringToAreaString(coord){
        let arr = coord.split(",");
        let result = 
        arr[0].substring(arr[0].indexOf(":")+1)+","+
        arr[1].substring(arr[1].indexOf(":")+1)+","+
        arr[2].substring(arr[2].indexOf(":")+1)+","+
        arr[3].substring(arr[3].indexOf(":")+1);
    
        return result;
    }

    static areaStringToXywhObject(area){
        let coords = area.getAttribute('coords').split(",");
        let width = (coords[2]-coords[0])+'px'; 
        let height = (coords[3]-coords[1])+'px'; 
        let y = parseFloat(coords[1])+picture.offsetTop + "px";
        let x = parseFloat(coords[0])+picture.offsetLeft + "px";
        return {w:width, h:height, y:y, x:x};
    }

    static originalPictureSizeStringToWh(originalPictureSize){
        let arr = originalPictureSize.split(",");
        let w = arr[0].substring(arr[0].indexOf(":")+1);
        let h = arr[1].substring(arr[1].indexOf(":")+1);
        EqRepo.OLD_WIDTH = w;
        EqRepo.ORIGINAL_WIDTH = w;
        return {w:w,h:h}
    }

    static getPictureSize(){
        const style = window.getComputedStyle(GlobalVariables.PICTURE);
        const paddingLeft = parseFloat(style.paddingLeft);
        const paddingRight = parseFloat(style.paddingRight);
        const picSizeWithoutPadding = GlobalVariables.PICTURE.clientWidth - paddingLeft - paddingRight;
        return picSizeWithoutPadding;
    }
    
    static registerMouseCoordsOnPicture(event){
        let x = event.clientX - GlobalVariables.PICTURE.offsetLeft;
        let y = event.clientY - GlobalVariables.PICTURE.offsetTop;
        return{x:x,y:y};
    }
    
    static registerMouseCoordsOnScreen(event){
        let x = event.clientX;
        let y = event.clientY;
        return{x:x,y:y};
    }
    
    static getPictureCoordsOnScreen(){
        let x = picture.offsetLeft;
        let y = picture.offsetTop;
        return{x:x,y:y};
    }
    
    static getObjCoordOnPicture(object){
        let x = object.offsetLeft - picture.offsetLeft;
        let y = object.offsetTop - picture.offsetTop;
        let w = object.offsetWidth;
        let h = object.offsetHeight;
        return {x:x,y:y,w:w,h:h};
    }

    static async offsetSizing(picture){

        const coefficientX = originalWidth/GlobalVariables.PICTURE.offsetWidth;
        
        coords.mouseOnPictureStart.x = Math.floor(coords.mouseOnPictureStart.x*coefficientX);
        coords.mouseOnPictureStart.y = Math.floor(coords.mouseOnPictureStart.y*coefficientX);
        coords.mouseOnPictureEnd.x = Math.floor(coords.mouseOnPictureEnd.x*coefficientX);
        coords.mouseOnPictureEnd.y = Math.floor(coords.mouseOnPictureEnd.y*coefficientX);
        }

}
export default CoordinateCalculator;