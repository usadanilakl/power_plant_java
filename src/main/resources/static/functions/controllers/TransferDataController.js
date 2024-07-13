async function getTypesOfTransferedData(){
    const response = await fetch("/transfer-data/types");
    const data = await response.json();
    console.log(data);

}

async function getAllTransferDataFromDb(){
    const startTime = new Date().getTime();
    console.log("receiving data:")
    const response = await fetch("/transfer-data/all");
    const data = await response.json();
    console.log('hello' + JSON.stringify(data.hpipes[0]));
    const endTime = new Date().getTime();
    const duration = endTime - startTime;
    console.log('it took: '+ duration)
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

