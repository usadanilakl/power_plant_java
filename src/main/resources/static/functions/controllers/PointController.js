async function getPointInfoForm(id){
    const response = await fetch('/point/get-info-form/'+id);
    const data = await response.text();
    return data;
}


