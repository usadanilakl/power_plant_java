let allHtLight = [];
async function getAllHt(){
    const resp = await fetch();
    const data = await resp.json();
    allHtLight = data;
    return data;
}