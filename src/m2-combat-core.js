/** M2-01 encounter foundation: pure, deterministic, no combat movement. */
export const M2_ACTIONS=Object.freeze(['attack','defend','retreat']);
const safe=n=>Number.isSafeInteger(n)&&n>=0;
const clone=x=>structuredClone(x);
export function startM2Encounter({encounterId,playerHp,enemyHps=[12],seed=1}={}){
 if(typeof encounterId!=='string'||!encounterId||!safe(playerHp)||playerHp<1||
  !Array.isArray(enemyHps)||enemyHps.length<1||enemyHps.length>4||
  !enemyHps.every(n=>safe(n)&&n>0)||!safe(seed))return {ok:false,reason:'INVALID_ENCOUNTER'};
 const participants=[{id:'player',hp:playerHp,maxHp:playerHp,side:'player',guard:false},
  ...enemyHps.map((hp,i)=>({id:'enemy:'+i,hp,maxHp:hp,side:'enemy',guard:false}))];
 return {ok:true,state:{schema:1,encounterId,phase:'active',round:1,queue:participants.map(p=>p.id),
  cursor:0,participants,seed,log:[],outcome:null}};
}
export function validateM2Combat(s){
 return !!s&&s.schema===1&&typeof s.encounterId==='string'&&s.encounterId.length>0&&
  ['active','resolved'].includes(s.phase)&&safe(s.round)&&s.round>=1&&safe(s.seed)&&
  Array.isArray(s.participants)&&s.participants.length>=2&&s.participants.length<=5&&
  s.participants[0].id==='player'&&s.participants.every((p,i)=>p&&p.id===(i?'enemy:'+(i-1):'player')&&
    (i?p.side==='enemy':p.side==='player')&&safe(p.hp)&&safe(p.maxHp)&&p.maxHp>0&&p.hp<=p.maxHp&&typeof p.guard==='boolean')&&
  Array.isArray(s.queue)&&s.queue.length===s.participants.length&&new Set(s.queue).size===s.queue.length&&
  s.queue.every(id=>s.participants.some(p=>p.id===id))&&safe(s.cursor)&&s.cursor<s.queue.length&&
  Array.isArray(s.log)&&s.log.length<=40&&
  (s.outcome===null||['victory','defeat','retreat'].includes(s.outcome));
}
const roll=seed=>(Math.imul(seed,1664525)+1013904223)>>>0;
export function actM2Combat(source,{actorId,type,targetId}={}){
 if(!validateM2Combat(source))return {ok:false,reason:'INVALID_STATE'};
 if(source.phase!=='active')return {ok:false,reason:'RESOLVED'};
 if(!M2_ACTIONS.includes(type))return {ok:false,reason:'INVALID_ACTION'};
 const s=clone(source),actor=s.participants.find(p=>p.id===actorId);
 if(!actor||actor.hp===0||s.queue[s.cursor]!==actorId)return {ok:false,reason:'NOT_ACTORS_TURN'};
 if(actor.side==='enemy'&&type==='retreat')return {ok:false,reason:'INVALID_ACTION'};
 if(type==='retreat'&&actor.side==='player'){
  s.seed=roll(s.seed);
  if(s.seed%100<65){s.phase='resolved';s.outcome='retreat';}
  else s.log.push({type:'retreat.failed',actorId});
 }else if(type==='defend'){
  actor.guard=true;s.log.push({type:'defend',actorId});
 }else{
  const target=s.participants.find(p=>p.id===targetId);
  if(!target||target.hp===0||target.side===actor.side)return {ok:false,reason:'INVALID_TARGET'};
  s.seed=roll(s.seed);
  const raw=3+s.seed%4,damage=Math.max(1,raw-(target.guard?2:0));
  target.guard=false;target.hp=Math.max(0,target.hp-damage);
  s.log.push({type:'attack',actorId,targetId,damage});
 }
 if(s.phase==='active'){
  const enemies=s.participants.filter(p=>p.side==='enemy');
  if(enemies.every(p=>p.hp===0)){s.phase='resolved';s.outcome='victory';}
  else if(s.participants[0].hp===0){s.phase='resolved';s.outcome='defeat';}
 }
 if(s.phase==='active'){
  let advanced=0;
  do{s.cursor=(s.cursor+1)%s.queue.length;if(s.cursor===0)s.round++;advanced++;}
  while(s.participants.find(p=>p.id===s.queue[s.cursor]).hp===0&&advanced<=s.queue.length);
 }
 s.log=s.log.slice(-40);
 return {ok:true,state:s,event:s.log.at(-1)??{type:'resolved',outcome:s.outcome}};
}

/** A deterministic provisional enemy decision, evaluated only on its turn.
 * Defensive posture at low HP avoids every enemy blindly attacking. */
export function chooseM2EnemyAction(source){
 if(!validateM2Combat(source)||source.phase!=='active')return {ok:false,reason:'NO_ACTIVE_COMBAT'};
 const actorId=source.queue[source.cursor];
 const actor=source.participants.find(p=>p.id===actorId);
 if(!actor||actor.side!=='enemy'||actor.hp===0)return {ok:false,reason:'NOT_ENEMY_TURN'};
 if(actor.hp*3<=actor.maxHp&&!actor.guard)return {ok:true,action:{actorId,type:'defend'}};
 return {ok:true,action:{actorId,type:'attack',targetId:'player'}};
}
