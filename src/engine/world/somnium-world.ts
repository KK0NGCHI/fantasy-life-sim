import type {WorldDefinition,RegionDefinition,SiteDefinition,MapDefinition,RouteDefinition} from './world-model.js';
const entries=[
 ['town','거점 마을','settlement'],['plains','초원·농경지','field'],['forest','숲','field'],
 ['river','강·호수','field'],['wetland','습지','field'],['mountains','산맥','field'],
 ['mine','광산','dungeon'],['snowfield','설원','field'],['desert','사막','field'],
 ['coast','해안·항구','field'],['sea','바다','field'],['volcano','화산지대','field'],
 ['ruins','고대 유적','special'],['graveyard','폐허·묘지','special'],
 ['pantheon','만신전','special'],['labyrinth','지하미궁','dungeon']
] as const;
const region=(id:string)=>'core:region/'+id;
const site=(id:string)=>'core:site/'+id;
const tile=(id:string)=>'core:terrain/'+id;
export const SOMNIUM_REGION_IDS=entries.map(([id])=>region(id));
const regions:RegionDefinition[]=entries.map(([id,name],i)=>({
 id:region(id),name,biomeId:'core:biome/'+id,worldPoint:{x:i%5,y:Math.floor(i/5)},siteIds:[site(id)]
}));
const sites:SiteDefinition[]=entries.map(([id,,type]):SiteDefinition=>({
 id:site(id),regionId:region(id),type,
 generation:id==='town'||id==='plains'?'fixed':'seeded',
 templateId:'core:template/'+id,floors:[0],entryId:'core:entry/'+id,
 lifecycle:id==='town'?{kind:'permanent'}:id==='plains'?{kind:'renewable',renewalUnits:120}:id==='labyrinth'?{kind:'repeatable',regenerationUnits:360}:{kind:'temporary',lifetimeUnits:900}
}));
const maps:MapDefinition[]=entries.map(([id])=>({
 id:'core:map/'+id,siteId:site(id),floor:0,width:5,height:5,
 tiles:['# # # # #','# . . . #','# . . . #','# . . . #','# # # # #'].map(r=>r.split(' ').map(t=>tile(t==='#'?'wall':'ground')).join(' ')),
 entrances:[{id:'core:entry/'+id,x:2,y:2,destinationSiteId:site(id),destinationFloor:0,destinationEntryId:'core:entry/'+id}]
}));
/** Explicit narrative travel links. UI 4×4 position has no bearing on distance. */
// 03-B seconds-v1: worldUnits are game seconds ONLY for new timeBasis-tagged worlds.
const routeSpecs=[
 ['town','plains',2,900],['town','forest',3,1500],['town','river',3,2100],
 ['plains','forest',2,1200],['plains','river',3,1800],['forest','wetland',4,2700],
 ['forest','mountains',5,3900],['mountains','mine',3,2400],['mountains','snowfield',7,12600],
 ['mountains','volcano',11,28800],['river','coast',7,8100],['coast','sea',9,14400],
 ['coast','desert',14,28800],['desert','ruins',6,5400],['ruins','graveyard',5,3900],
 ['ruins','pantheon',8,7200],['graveyard','labyrinth',7,6300],['mine','labyrinth',10,10800]
] as const;
const routes:RouteDefinition[]=routeSpecs.map(([from,to,turns,worldUnits])=>({
 id:'core:route/'+from+'-'+to,fromSiteId:site(from),toSiteId:site(to),
 bidirectional:true,turns,worldUnits,requirementTags:[],hazardTags:[]
}));
/** 03-A fixture: every region is registered; terrain values and topology are test data, not production balance. */
export const SOMNIUM_WORLD_03A:WorldDefinition={
 id:'core:world/somnium',generatorVersion:1,regions,sites,maps,routes,
 terrains:[{id:tile('wall'),traversable:false,blocksSight:true,movementCost:1,hazardTags:[]},
 {id:tile('ground'),traversable:true,blocksSight:false,movementCost:1,hazardTags:[]}],
 initialSiteId:site('town')
};
