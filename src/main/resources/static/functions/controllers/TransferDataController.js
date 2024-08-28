//let allTransferData = [];
let kiewitValves = [];
let hrsgValves = [];
let bypasses = [];


async function getTypesOfTransferedData(){
    const response = await fetch("/transfer-data/types");
    const data = await response.json();
    // transferDataTypes = data;
    return data;
    //console.log(data);
}

async function getAllTransferDataFromDb(){
    const startTime = new Date().getTime();
    console.log("receiving data: getAllFromDb")
    const response = await fetch("/transfer-data/all");
    const data = await response.json();
    allTransferData = data;
    const endTime = new Date().getTime();
    const duration = endTime - startTime;
    // console.log('it took: '+ duration)
    // it took: 2146 
}

// async function getTransferedDataFromMemory(){
//     const startTime = new Date().getTime();
//     console.log("receiving data:")
//     const response = await fetch("/memory-data/all");
//     const data = await response.json();
//     console.log('hello' + JSON.stringify(data.hpipes[0]));
//     const endTime = new Date().getTime();
//     const duration = endTime - startTime;
//     console.log('it took: '+ duration)
      
// }

async function getOldLotoPointsFromDb(){
    const startTime = new Date().getTime();
    // console.log("receiving data:")
    const response = await fetch("/transfer-data/old-loto-points");
    const data = await response.json();
    const endTime = new Date().getTime();
    const duration = endTime - startTime;
    // console.log('it took: '+ duration)
    // console.log(data.length)
    return data;
}

async function getLotoPointsFromDb(){
    const startTime = new Date().getTime();
    // console.log("receiving data:")
    const response = await fetch("/transfer-data/loto-points");
    const data = await response.json();
    const endTime = new Date().getTime();
    const duration = endTime - startTime;
    // console.log('it took: '+ duration)
    return data;
}

async function getPidsFromDb(){
    const startTime = new Date().getTime();
    // console.log("receiving data:")
    const response = await fetch("/transfer-data/pids");
    const data = await response.json();
    const endTime = new Date().getTime();
    const duration = endTime - startTime;
    // console.log('it took: '+ duration)
    return data;
}

async function getHtFromDb(){
    const startTime = new Date().getTime();
    // console.log("receiving data:")
    const response = await fetch("/transfer-data/ht");
    const data = await response.json();
    const endTime = new Date().getTime();
    const duration = endTime - startTime;
    // console.log('it took: '+ duration)
    return data;
}

async function getHighlightsFromDb(){
    const startTime = new Date().getTime();
    // console.log("receiving data:")
    const response = await fetch("/transfer-data/highlights");
    const data = await response.json();
    const endTime = new Date().getTime();
    const duration = endTime - startTime;
    // console.log('it took: '+ duration)
    return data;
}

async function getHrsgValvesFromDb(){
    const startTime = new Date().getTime();
    // console.log("receiving data:")
    const response = await fetch("/transfer-data/hrsg-valves");
    const data = await response.json();
    hrsgValves = data;
    const endTime = new Date().getTime();
    const duration = endTime - startTime;
    // console.log('it took: '+ duration)
    return data;
}

async function getHrsgPipesFromDb(){
    const startTime = new Date().getTime();
    // console.log("receiving data:")
    const response = await fetch("/transfer-data/hrsg-pipes");
    const data = await response.json();
    const endTime = new Date().getTime();
    const duration = endTime - startTime;
    // console.log('it took: '+ duration)
    return data;
}

async function getKiewitValvesFromDb(){
    const startTime = new Date().getTime();
    // console.log("receiving data:")
    const response = await fetch("/transfer-data/kiewit-valves");
    const data = await response.json();
    kiewitValves = data;
    const endTime = new Date().getTime();
    const duration = endTime - startTime;
    // console.log('it took: '+ duration)
    return data;
}

async function getKiewitPipesFromDb(){
    const startTime = new Date().getTime();
    // console.log("receiving data:")
    const response = await fetch("/transfer-data/kiewit-pipes");
    const data = await response.json();
    const endTime = new Date().getTime();
    const duration = endTime - startTime;
    // console.log('it took: '+ duration)
    return data;
}

async function getBypassesFromDb(){
    const startTime = new Date().getTime();
    // console.log("receiving data:")
    const response = await fetch("/transfer-data/bypasses");
    const data = await response.json();
    bypasses = data;
    const endTime = new Date().getTime();
    const duration = endTime - startTime;
    // console.log('it took: '+ duration)
    return data;
}


