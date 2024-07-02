function getExcelPointsByLabel(label){
    let result = [];
    revisedExcelPoints.forEach(e=>{
        if(formatLabel(e.label).includes(formatLabel(label))) result.push(e);
    })
    return result;
}

function formatLabel(label){
    // console.log("label: "+label)
    let result = label.toLowerCase();
    result = result.trim();
    result = result.replace(/-/g, "");
    if(result.startsWith("01") || result.startsWith("02") || result.startsWith("00") || result.startsWith("**")) result = result.substring(2);
    // console.log("result: "+result)
    return result;
}