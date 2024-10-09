let baseLotoPointUrl = '/loto-points-api/'

let matchedItems = [];

let allLotoPoints = [];
let activeLotoPoints = [];

async function getLotoPointByOldId(oldId){
    const resp = await fetch(baseLotoPointUrl+'old-id/'+oldId);
    const data = await resp.json();
    return data;
}

async function getLotoPointById(id){
  const resp = await fetch(baseLotoPointUrl+id);
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
        // const resp = await fetch(baseLotoPointUrl + 'tag/' + tag);
        const resp = await fetch(baseLotoPointUrl + 'tag-and-tag-in-description/' + tag);
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

async function createNew(point){
  const resp = await fetch(baseLotoPointUrl, getPostMetaDataWithBody(point));
  const data = await resp.json();
  console.log(data.tagNumber);
  return data;
}

async function matchLotoPoints(id){
  const resp = await fetch(baseLotoPointUrl+'match-points/'+id);
  const data = await resp.json();
  matchedItems = data;
  return data;
}

async function deleteLotoPoint(id){
  const resp = await fetch(baseLotoPointUrl+id,deleteNoBody);
  const data = await resp.text();
  console.log(data);
  return data;
}

async function getProjectStatus(){
  const resp = await fetch(baseLotoPointUrl+'project-status');
  const data = await resp.json();
  return data;
}

async function getActiveLotoPoints(){
  const resp = await fetch(baseLotoPointUrl+'get-active-points');
  const data = await resp.json();
  activeLotoPoints = data;
  return data;
}

async function getAllLotoPoints(){
  const resp = await fetch(baseLotoPointUrl);
  const data = await resp.json();
  allLotoPoints = data;
  return data;
}

async function allLotoPointsToExcel(){
  const resp = await fetch(baseLotoPointUrl+'to-excel');
  const data = await resp.text();
  console.log(data)
}

async function updateNonNullFields(lp){
  const resp = await fetch(baseLotoPointUrl,getPutMetaDataWithBody(lp));
}

async function getPointsByTagForUnit(unit,tags){
  const resp = await fetch(baseLotoPointUrl+'by-tag-by-unit/'+unit, getPostMetaDataWithBody(tags));
  const data = await resp.json();
  return data;
}

