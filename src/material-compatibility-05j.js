/** 05-J: pure material-compatibility and inventory allocation core.
 * Prototype only. The caller must derive inventory metadata from validated item
 * definitions; never trust client-supplied family/grade/origin attributes.
 * Does not perform crafting, turn charging, stack merging, or save migrations.
 */
const record=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const positive=x=>Number.isSafeInteger(x)&&x>0;
const tags=x=>Array.isArray(x)&&x.every(t=>typeof t==='string'&&t.length>0);

export function materialMatches(item,slot){
 if(!record(item)||!record(slot))return false;
 if(slot.allowedItemId!==undefined&&item.id!==slot.allowedItemId)return false;
 if(typeof slot.exactId==='string')return item.definitionId===slot.exactId;
 if(!record(slot.material))return false;
 if(slot.allowedDefinitionId!==undefined&&item.definitionId!==slot.allowedDefinitionId)return false;
 const m=slot.material;
 if(typeof m.family!=='string'||!m.family||item.family!==m.family)return false;
 if(m.form!==undefined&&item.form!==m.form)return false;
 if(m.minGrade!==undefined&&(!Number.isSafeInteger(m.minGrade)||m.minGrade<0||!Number.isSafeInteger(item.grade)||item.grade<m.minGrade))return false;
 const itemTags=new Set(tags(item.traits)?item.traits:[]);
 if(m.requiredTraits!==undefined&&(!tags(m.requiredTraits)||!m.requiredTraits.every(t=>itemTags.has(t))))return false;
 if(m.excludedTraits!==undefined&&(!tags(m.excludedTraits)||!m.excludedTraits.every(t=>!itemTags.has(t))))return false;
 if(m.allowedOrigins!==undefined&&(!tags(m.allowedOrigins)||!m.allowedOrigins.includes(item.originClass)))return false;
 return true;
}

/** Plan all slots jointly using integral max-flow. Exact-ID reservations and
 * flexible alternatives cannot consume the same stock twice. No state writes.
 */
export function planMaterialAllocation(inventory,slots){
 if(!Array.isArray(inventory)||!Array.isArray(slots)||slots.length<1||slots.length>64||
    !slots.every(s=>record(s)&&typeof s.slotId==='string'&&s.slotId&&positive(s.quantity)&&
      ((typeof s.exactId==='string'&&s.exactId.length>0&&!record(s.material))||
       (s.exactId===undefined&&record(s.material)&&typeof s.material.family==='string'&&s.material.family)))||
    !inventory.every(i=>record(i)&&typeof i.id==='string'&&i.id&&
      typeof i.definitionId==='string'&&i.definitionId&&positive(i.quantity))||
    new Set(inventory.map(i=>i.id)).size!==inventory.length||
    new Set(slots.map(s=>s.slotId)).size!==slots.length)
    return {ok:false,reason:'INVALID_MATERIAL_PLAN'};
 const total=slots.reduce((n,s)=>n+s.quantity,0);
 if(!Number.isSafeInteger(total)||total>1000000)return {ok:false,reason:'INVALID_MATERIAL_PLAN'};
 const N=2+inventory.length+slots.length,source=0,sink=N-1;
 const graph=Array.from({length:N},()=>[]);
 const add=(u,v,cap)=>{
  const forward={to:v,cap,reverse:graph[v].length,initial:cap};
  const backward={to:u,cap:0,reverse:graph[u].length,initial:0};
  graph[u].push(forward);graph[v].push(backward);return forward;
 };
 inventory.forEach((item,i)=>add(source,1+i,item.quantity));
 const connections=[];
 inventory.forEach((item,i)=>slots.forEach((slot,j)=>{
  if(materialMatches(item,slot)){
   const edge=add(1+i,1+inventory.length+j,Math.min(item.quantity,slot.quantity));
   connections.push({itemId:item.id,slotId:slot.slotId,edge});
  }
 }));
 slots.forEach((slot,j)=>add(1+inventory.length+j,sink,slot.quantity));
 let flow=0;
 while(flow<total){
  const parent=Array(N).fill(null),queue=[source];parent[source]={};
  for(let h=0;h<queue.length&&!parent[sink];h++){
   const u=queue[h];
   for(let k=0;k<graph[u].length;k++){
    const e=graph[u][k];if(e.cap<=0||parent[e.to])continue;
    parent[e.to]={u,k};queue.push(e.to);if(e.to===sink)break;
   }
  }
  if(!parent[sink])break;
  let amount=total-flow;
  for(let v=sink;v!==source;){const {u,k}=parent[v];amount=Math.min(amount,graph[u][k].cap);v=u;}
  for(let v=sink;v!==source;){const {u,k}=parent[v],edge=graph[u][k];edge.cap-=amount;graph[v][edge.reverse].cap+=amount;v=u;}
  flow+=amount;
 }
 if(flow!==total)return {ok:false,reason:'INSUFFICIENT_MATERIAL'};
 return {ok:true,total,allocations:connections
  .filter(x=>x.edge.initial>x.edge.cap)
  .map(x=>({slotId:x.slotId,itemId:x.itemId,quantity:x.edge.initial-x.edge.cap}))};
}
