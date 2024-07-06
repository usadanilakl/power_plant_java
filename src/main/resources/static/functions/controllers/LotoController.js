async function getTempLoto(){
    let response = await fetch('/api-lotos/get-temp');
    let data = await response.json();
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