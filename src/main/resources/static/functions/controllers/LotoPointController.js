let baseLotoPointUrl = '/loto-points-api/'

async function getLotoPointByOldId(oldId){
    const resp = await fetch(baseLotoPointUrl+'old-id/'+oldId);
    const data = await resp.json();
    return data;
}

async function getEmptyLotoPoint(){
    const resp = await fetch(baseLotoPointUrl+'empty');
    const data = await resp.json();
    return data;
}

async function updateLotoPointDescription(point){
    let empty = {};
    empty.id = point.id;
    empty.description = point.description;
    const resp = await fetch(baseLotoPointUrl, getPatchMetaDataWithBody(empty));
    const data = await resp.text();
    return data;
}

async function getLotoPointsByTag(tag){
    const resp = await fetch(baseLotoPointUrl+'tag/'+tag);
    const data = await resp.json();
    return data;
}