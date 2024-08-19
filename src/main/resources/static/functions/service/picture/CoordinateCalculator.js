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
        return {w:w,h:h}
    }
}
export default CoordinateCalculator;