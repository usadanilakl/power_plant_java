async function getText(coords){
    let path = file.fileLink;
    let input = {path:path,coordinates:coords}

    const resp = await fetch('/images-api/text',getPostMetaDataWithBody(input));
    const data = await resp.text();
    return data;
}
