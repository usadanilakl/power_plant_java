class BaseEqService{
    static getExcelPointsByLabel(label){
        let result = [];
        revisedExcelPoints.forEach(e=>{
            if(formatLabel(e.tagNumber).includes(formatLabel(label)) ) result.push(e); //old version
        })
        oldExcelPoints.forEach(e=>{
            if(formatLabel(e.tagNumber).includes(formatLabel(label)) ) result.push(e);
        })
        hrsgValves.forEach(e=>{
            if(formatLabel(e.tagNumber).includes(formatLabel(label)) ) result.push(e);
        })
        kiewitValves.forEach(e=>{
            if(formatLabel(e.tagNumber).includes(formatLabel(label)) ) result.push(e);
        })
        bypasses.forEach(e=>{
            if(formatLabel(e.tagNumber).includes(formatLabel(label)) ) result.push(e);
        })
        return result;
    }
}
export default BaseEqService;