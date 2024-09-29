async function getTempLoto(){
    let response = await fetch('/api-lotos/get-temp');
    let data = await response.json();
    console.log(JSON.stringify(data))
    return data;
}

async function updateTempLoto(loto,csrfToken){
    console.log('set to server: ' + JSON.stringify(loto));
    let response = await fetch('/lotos/update-points',
        {
            method:'POST',
            headers:{
                'Content-type':'application/json',
                'X-CSRF-TOKEN': csrfToken,
            },
            body:JSON.stringify(loto)

        }
    )

    let data = await response.text();
    window.location.href = '/lotos/create';
}

async function buildLoto(){
    let tags = selectedLotoPoints.map(p=>p.tagNumber);
    const resp = await fetch('/api-lotos/build-loto',getPostMetaDataWithBody(tags));
}

async function buildLotoWithNewPoints(){
    let tags = selectedLotoPoints.map(p=>p.tagNumber);
    const resp = await fetch('/api-lotos/build-loto-with-new-points',getPostMetaDataWithBody(tags));
}

