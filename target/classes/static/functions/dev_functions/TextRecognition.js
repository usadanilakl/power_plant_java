function manualValve(text){
    let startsWith = "";
    if(String(text).includes("01-")) startsWith = "01-";
    else if(String(text).includes("02-")) startsWith ="02-";
    else if(String(text).includes("00-")) startsWith ="00-";
    let unit = String(startsWith).substring(0,2);
    let ready = String(text).substring(String(text).indexOf(startsWith), String(text).indexOf(startsWith)+10);
    console.log(ready);
    return ready;
}

function line(text){
    let original = String(text);
    let startsWith = "";
    if(original.includes("01-")) startsWith = "01-";
    else if(original.includes("02-")) startsWith = "02-";
    else if(original.includes("00-")) startsWith = "00-";
    
    let endsWith = "";
    if(original.includes('"EOH')) endsWith = '"EOH';
    else if(original.includes('"MOH')) endsWith = '"MOH';
    else if(original.includes('"MOC')) endsWith = '"MOC';
    else if(original.includes('"EOC')) endsWith = '"EOC';
    else if(original.includes('"EIC')) endsWith = '"EIC';
    else if(original.includes('"MIC')) endsWith = '"MIC';
    else if(original.includes('"AS')) endsWith = '"AS';
    else if(original.includes('"EII')) endsWith = '"EII';
    else if(original.includes('"MII')) endsWith = '"MII';
    else if(original.includes('"MOI')) endsWith = '"MOI';
    else if(original.includes('"EOI')) endsWith = '"EOI';
    else if(original.includes('A1A')) endsWith = 'A1A';
    else if(original.includes('B1A')) endsWith = 'B1A';
    else if(original.includes('C1A')) endsWith = 'C1A';
    else if(original.includes('A2A')) endsWith = 'A2A';
    else if(original.includes('B2A')) endsWith = 'B2A';
    else if(original.includes('C2A')) endsWith = 'C2A';
    else if(original.includes('A1U')) endsWith = 'A1U';
    else if(original.includes('H1A')) endsWith = 'H1A';
    else if(original.includes('R1A')) endsWith = 'R1A';
    else if(original.includes('B3A')) endsWith = 'B3A';
    else if(original.includes('B1U')) endsWith = 'B1U';
    else if(original.includes('A3A')) endsWith = 'A3A';
    let ready = original
    .replace(/\\/g,'')
    .substring(original.indexOf(startsWith), original.indexOf(endsWith)+2);

    if(endsWith==="") return airSupply(text);
    return ready;
}

function instrument(text){
    let original = String(text);
    startsWith = "";
    if(original.includes("01-")) startsWith = "01-";
    else if(original.includes("02-")) startsWith = "02-";
    else if(original.includes("00-")) startsWith = "00-";
    let ready = original
    .replace(/\\n/g,"-")
    .replace(/--/g,'-')
    //.substring(original.indexOf(startsWith), original.indexOf(startsWith)+12);
    .substring(original.indexOf(startsWith));
    ready = (ready.startsWith("-"))? ready.substring(1) : ready;
    ready = (ready.endsWith('-"'))? ready.substring(0,ready.length-2) : ready;
    return filterNumLettersSymb(ready);
}

function connector(text){
    let original = String(text);
    original = original.substring(String(original).indexOf("PD-"), String(original).indexOf("PD-")+7);
    return filterNumLettersSymb(original);
}

function airSupply(text){
    let original = String(text);
    return original.substring(original.indexOf("0"))
    .trim()
    .replace(/\\n/g,"-")
    .replace(/\\/g,"")
    .replace(/ /g,"")
    .replace(/--/g,"-")
    .slice(0,-2);
}

function typeOfEquipment(type,text){
    if(type === "manualValve") return manualValve(text);
    if(type === "line") return line(text);
    if(type === "instrument" || type==='AOV' || type==='MOV' || type==="SOV") return instrument(text);
    if(type === "connector") return connector(text);
    if(type === "airSupply") return airSupply(text);
}

function filterNumLetters(text){
    let result = "";

    for(let i = 0; i<String(text).length; i++){
        if(isNumber(text.charAt(i)) || isLetter(text.charAt(i))){
            result+=text.charAt(i);
        }
    }
    console.log(result);
    return result;
}

function filterNumLettersSymb(text){
    let result = "";
    
    for(let i = 0; i<String(text).length; i++){
        if(isNumber(text.charAt(i)) || isLetter(text.charAt(i)) || isMySymbol(text.charAt(i))){
            result+=text.charAt(i);
        }
    }
    console.log(result);
    return result;
}

function isNumber(char) {
    return !isNaN(char);
  }
  
function isLetter(char) {
    return /^[a-zA-Z]$/.test(char);
  }
 
function isMySymbol(char) {
    return /^[-"]$/.test(char);
  }

module.exports = typeOfEquipment;
  