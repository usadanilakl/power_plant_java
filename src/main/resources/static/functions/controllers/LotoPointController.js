let baseLotoPointUrl = '/loto-points-api/'

async function getLotoPointByOldId(oldId){
    const resp = await fetch(baseLotoPointUrl+'old-id/'+oldId);
    const data = await resp.json();
    return data;
}

async function getLotoPointById(id){
  const resp = await fetch(baseLotoPointUrl+'/'+id);
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
    try {
        const resp = await fetch(baseLotoPointUrl + 'tag/' + tag);
        if (!resp.ok) {
          throw new Error('HTTP error! status: ' + resp.status);
        }
        const data = await resp.json();
        return data;
      } catch (error) {
        console.error('Error:', error);
        return [];
      }
}