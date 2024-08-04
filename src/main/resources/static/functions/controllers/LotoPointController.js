let baseLotoPointUrl = '/loto-points-api/'

async function getLotoPointByOldId(oldId){
    const resp = await fetch(baseLotoPointUrl+'old-id/'+oldId);
    const data = await resp.json();
    return data;
}