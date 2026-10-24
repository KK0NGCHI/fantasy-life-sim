import {substrateId05B,changeSubstrate05B} from './fungal-substrates-05b.js';
import {ecologyClimate05A} from './ecology-climate-05a.js';
import {FUNGAL_BY_ID_05B} from './fungal-ecology-05b.js';
import {ecologySiteId} from './ecology-core-05a.js';
const DAY=86400;
const bounded=n=>Number.isSafeInteger(n)&&n>=0;
const TREE_TYPES_05C=Object.freeze([
 {id:'oak',regions:['숲','초원·농경지'],growthDays:24,lifespanDays:420,litter:3,wood:12},
 {id:'pine',regions:['숲','산맥','설원'],growthDays:32,lifespanDays:500,litter:2,wood:14}
]);
export const TREE_DEFINITIONS_05C=TREE_TYPES_05C;
export function createTreeWorld05C(){
 return Object.fromEntries(TREE_TYPES_05C.flatMap(species=>species.regions.map(region=>{
  const id='tree05c:'+encodeURIComponent(region)+':'+species.id+':0';
  return [id,{id,region,speciesId:species.id,ageDays:40,health:100,alive:true,deadwood:0}];
 })));
}
export function validateTreeWorld05C(world){
 return !!world&&typeof world==='object'&&!Array.isArray(world)&&Object.keys(world).length<=40&&Object.entries(world).every(([id,t])=>{
  const def=TREE_TYPES_05C.find(x=>x.id===t?.speciesId);
  return def&&Object.keys(t).every(k=>['id','region','speciesId','ageDays','health','alive','deadwood'].includes(k))&&
   t.id===id&&t.id==='tree05c:'+encodeURIComponent(t.region)+':'+def.id+':0'&&
   def.regions.includes(t.region)&&bounded(t.ageDays)&&t.ageDays<=100000&&bounded(t.health)&&t.health<=100&&
   typeof t.alive==='boolean'&&bounded(t.deadwood)&&t.deadwood<=1000;
 });
}
const inc=(world,id,n,sec)=>world[id]?changeSubstrate05B(world,id,n,sec):world;
/** Advances by FULL calendar days only. No random number draws and no repeated
 * full-world scans during ordinary minute-scale actions. */
export function advanceWoodland05C(snapshot,seconds,seed){
 if(!snapshot||!validateTreeWorld05C(snapshot.trees)||!Number.isSafeInteger(snapshot.day)||snapshot.day<0||
 !bounded(seconds)||typeof seed!=='string'||!snapshot.substrates||!snapshot.sites)throw Error('INVALID_WOODLAND');
 const targetDay=Math.floor((seconds+28800)/DAY);
 if(targetDay<snapshot.day)throw Error('WOODLAND_TIME_REVERSED');
 if(targetDay-snapshot.day>20000)throw Error('WOODLAND_HORIZON_EXCEEDED');
 let trees=structuredClone(snapshot.trees),substrates=structuredClone(snapshot.substrates),sites=structuredClone(snapshot.sites);
 for(let d=snapshot.day+1;d<=targetDay;d++){
  const at=d*DAY-28800;
  for(const tree of Object.values(trees)){
   const def=TREE_TYPES_05C.find(x=>x.id===tree.speciesId);
   if(tree.alive){
    tree.ageDays++;
    const climate=ecologyClimate05A(seed,tree.region,at);
    const stressed=climate.weather==='clear'&&d%14===0;
    tree.health=Math.max(0,tree.health-(stressed?2:0));
    if(tree.ageDays>=def.lifespanDays||tree.health===0){tree.alive=false;tree.deadwood=def.wood;}
    else{
     substrates=inc(substrates,substrateId05B(tree.region,'leaf-litter'),def.litter,at);
     substrates=inc(substrates,substrateId05B(tree.region,'living-tree-roots'),1,at);
    }
   }
   if(!tree.alive&&tree.deadwood>0){
    const transfer=Math.min(tree.deadwood,2);
    tree.deadwood-=transfer;
    substrates=inc(substrates,substrateId05B(tree.region,'deadwood'),transfer,at);
    if(tree.deadwood===0)tree.health=0;
   }
  }
  // Leaf litter decomposes to rich soil only if both material ledgers exist.
  const regions=new Set(Object.values(substrates).map(x=>x.region));
  for(const region of regions){
   const leaf=substrateId05B(region,'leaf-litter'),soil=substrateId05B(region,'rich-soil');
   if(substrates[leaf]?.remaining>=4&&substrates[soil]){
    substrates=inc(substrates,leaf,-4,at);
    substrates=inc(substrates,soil,2,at);
   }
  }
  // Colonization requires living substrate and a locally established donor.
  // Each species can spread to at most one satellite patch (index 1).
  for(const species of FUNGAL_BY_ID_05B.values()){
   for(const region of species.regions){
    const host=substrates[substrateId05B(region,species.substrate)];
    const parentId=ecologySiteId(region,species.id,0),childId=ecologySiteId(region,species.id,1);
    const parent=sites[parentId];
    if(parent&&host?.remaining>=20&&!sites[childId]&&d%28===0){
     sites[childId]={...parent,id:childId,patch:1,remaining:0,updatedAt:at,discovered:false,wetCredit:0,
      substrateHealth:Math.min(50,parent.substrateHealth??100)};
    }
   }
  }
 }
 return {trees,substrates,sites,day:targetDay};
}
