import type { GameStateV2 } from '../save/save-v2.js';
import type { ItemRegistry } from '../data/item-registry.js';
import type { ItemInstanceDraft, ItemLocation, RecipeDefinition, IngredientMatcher } from '../data/item-model.js';
import { validateItemWorld } from '../data/item-world.js';
import { canStackItems } from '../data/item-registry.js';

/** V2 item actions operate solely on GameStateV2; no legacy v1 state or UI mutation. */
export type ItemCommand =
 | { readonly type:'item.move'; readonly itemId:string; readonly to:ItemLocation }
 | { readonly type:'item.consume'; readonly itemId:string; readonly quantity:number }
 | { readonly type:'item.merge'; readonly fromId:string; readonly intoId:string }
 | { readonly type:'item.split'; readonly itemId:string; readonly newId:string; readonly quantity:number }
 | { readonly type:'item.craft'; readonly recipeId:string; readonly selections:readonly { readonly itemId:string; readonly quantity:number }[]; readonly resultId:string };
export type ItemOutcome =
 | { readonly accepted:true; readonly outcome:'success'|'failed'; readonly turnsSpent:1; readonly nextState:GameStateV2; readonly events:readonly {readonly type:string;readonly payload:Readonly<Record<string,unknown>>}[] }
 | { readonly accepted:false; readonly reason:'INVALID_COMMAND'|'INVALID_STATE';readonly turnsSpent:0 };

const positive=(n:unknown):n is number=>typeof n==='number'&&Number.isSafeInteger(n)&&n>0;
const ident=(x:unknown):x is string=>typeof x==='string'&&x.trim().length>0;
const clone=<T>(x:T):T=>structuredClone(x);
const rejected=(reason:'INVALID_COMMAND'|'INVALID_STATE'):ItemOutcome=>({accepted:false,reason,turnsSpent:0});
const matches=(item:ItemInstanceDraft,matcher:IngredientMatcher,registry:ItemRegistry):boolean=>{
 const definition=registry.items.get(item.definitionId);
 switch(matcher.kind){
 case 'item':return item.definitionId===matcher.definitionId;
 case 'material':return item.materialId===matcher.materialId;
 case 'category':return definition?.categoryId===matcher.categoryId;
 case 'tag':return definition?.tags.includes(matcher.tag)??false;
 }
};
const matchesRequirement=(item:ItemInstanceDraft,recipe:RecipeDefinition,index:number,registry:ItemRegistry):boolean=>
 recipe.ingredients[index]?.anyOf.some(m=>matches(item,m,registry))??false;

/** Caller supplies the final destination and concrete ingredient selections.
 * No hidden RNG, quality inheritance or material bonus. Crafting result is a plain instance.
 * A failed in-game action is accepted and costs one turn; malformed commands cost zero.
 */
export function dispatchItemAction(state:GameStateV2,command:ItemCommand,registry:ItemRegistry):ItemOutcome {
 if(state.schemaVersion!==2||!Number.isSafeInteger(state.turn)||state.turn<0||
    state.turn>=Number.MAX_SAFE_INTEGER||validateItemWorld(state.itemWorld,registry).length)return rejected('INVALID_STATE');
 const world=clone(state.itemWorld);
 const items=world.items.slice() as ItemInstanceDraft[];
 const placements=world.placements.slice();
 const containers=world.containers.map(c=>({containerId:c.containerId,itemIds:[...c.itemIds]}));
 const find=(id:string)=>items.findIndex(i=>i.id===id);
 const location=(id:string)=>placements.find(p=>p.itemId===id)?.location;
 const playerOwns=(id:string):boolean=>{
   const at=location(id);
   if(!at)return false;
   if(at.kind==='inventory'||at.kind==='equipped')return at.ownerId===state.player.id;
   if(at.kind!=='container')return false;
   const seen=new Set<string>();let parent=at.containerId;
   while(!seen.has(parent)){
    seen.add(parent);const where=location(parent);
    if(where?.kind==='inventory'||where?.kind==='equipped')return where.ownerId===state.player.id;
    if(where?.kind!=='container')return false;
    parent=where.containerId;
   }
   return false;
 };
 const replaceQuantity=(id:string,amount:number)=>{
   const index=find(id);if(index<0)return;
   const item=items[index]!;
   if(amount===0){
    items.splice(index,1);
    const pi=placements.findIndex(p=>p.itemId===id);if(pi>=0)placements.splice(pi,1);
    for(const c of containers){const ci=c.itemIds.indexOf(id);if(ci>=0)c.itemIds.splice(ci,1);}
   }else items[index]={...item,quantity:amount};
 };
 let outcome:'success'|'failed'='success';
 let eventType:string='item.changed';
 let eventPayload:Readonly<Record<string,unknown>>={};
 if(!command||typeof command!=='object'||!('type' in command))return rejected('INVALID_COMMAND');
 if(command.type==='item.move'){
   if(!ident(command.itemId)||!command.to||typeof command.to!=='object')return rejected('INVALID_COMMAND');
   const index=find(command.itemId);
   if(index<0)return rejected('INVALID_COMMAND');
   if(!playerOwns(command.itemId))outcome='failed';
   else {
    const current=location(command.itemId);
    if(command.to.kind==='container'){
      const containerIndex=find(command.to.containerId);
      if(containerIndex<0||!registry.items.get(items[containerIndex]!.definitionId)?.capabilities.includes('storage')||!playerOwns(command.to.containerId))outcome='failed';
    }else if(command.to.kind==='inventory'||command.to.kind==='equipped'){
      if(command.to.ownerId!==state.player.id)outcome='failed';
      if(command.to.kind==='equipped') {
        if(!registry.items.get(items[index]!.definitionId)?.capabilities.includes('equip'))outcome='failed';
        const targetSlotId=command.to.slotId;
        if(placements.some(p=>p.itemId!==command.itemId&&p.location.kind==='equipped'&&p.location.ownerId===state.player.id&&p.location.slotId===targetSlotId))outcome='failed';
      }
    }else outcome='failed'; // Moving to the world requires a world-placement action in a later stage.
    if(outcome==='success'&&current){
      if(current.kind==='container'){const containerId=current.containerId;const c=containers.find(c=>c.containerId===containerId);const at=c?.itemIds.indexOf(command.itemId)??-1;if(at>=0)c!.itemIds.splice(at,1);}
      const p=placements.findIndex(p=>p.itemId===command.itemId);
      placements[p]={itemId:command.itemId,location:clone(command.to)};
      if(command.to.kind==='container') {
        const destinationId=command.to.containerId;let c=containers.find(c=>c.containerId===destinationId);
        if(!c){c={containerId:command.to.containerId,itemIds:[]};containers.push(c);}
        c.itemIds.push(command.itemId);
      }
    }
   }
   eventType='item.moved';eventPayload={itemId:command.itemId};
 } else if(command.type==='item.consume'){
   if(!ident(command.itemId)||!positive(command.quantity)||find(command.itemId)<0)return rejected('INVALID_COMMAND');
   const i=items[find(command.itemId)]!;
   if(!playerOwns(command.itemId)||i.quantity<command.quantity||!registry.items.get(i.definitionId)?.capabilities.includes('eat'))outcome='failed';
   else replaceQuantity(command.itemId,i.quantity-command.quantity);
   eventType='item.consumed';eventPayload={itemId:command.itemId,quantity:command.quantity};
 } else if(command.type==='item.merge'){
   if(!ident(command.fromId)||!ident(command.intoId)||command.fromId===command.intoId||find(command.fromId)<0||find(command.intoId)<0)return rejected('INVALID_COMMAND');
   const from=items[find(command.fromId)]!,into=items[find(command.intoId)]!;
   if(!playerOwns(from.id)||!playerOwns(into.id)||!canStackItems(from,into,registry)||!Number.isSafeInteger(from.quantity+into.quantity)||
      containers.some(c=>c.containerId===from.id||c.containerId===into.id))outcome='failed';
   else {replaceQuantity(into.id,from.quantity+into.quantity);replaceQuantity(from.id,0);}
   eventType='item.merged';eventPayload={fromId:command.fromId,intoId:command.intoId};
 } else if(command.type==='item.split'){
   if(!ident(command.itemId)||!ident(command.newId)||!positive(command.quantity)||find(command.itemId)<0||find(command.newId)>=0||command.itemId===command.newId)return rejected('INVALID_COMMAND');
   const original=items[find(command.itemId)]!;
   const origin=location(command.itemId);
   if(!playerOwns(command.itemId)||!origin||original.quantity<=command.quantity||containers.some(c=>c.containerId===command.itemId))outcome='failed';
   else {
     replaceQuantity(command.itemId,original.quantity-command.quantity);
     items.push({...clone(original),id:command.newId,quantity:command.quantity});
     placements.push({itemId:command.newId,location:clone(origin)});
     if(origin.kind==='container')containers.find(c=>c.containerId===origin.containerId)?.itemIds.push(command.newId);
   }
   eventType='item.split';eventPayload={itemId:command.itemId,newId:command.newId,quantity:command.quantity};
 } else if(command.type==='item.craft'){
   const recipe=registry.recipes.get(command.recipeId);
   if(!ident(command.recipeId)||!ident(command.resultId)||!Array.isArray(command.selections)||!recipe)return rejected('INVALID_COMMAND');
   if(find(command.resultId)>=0)return rejected('INVALID_COMMAND');
   // Explicit recipe requirements; optional slots may be omitted. One selection per slot.
   if(command.selections.length>recipe.ingredients.length||command.selections.some((s,i)=>!s||!ident(s.itemId)||!positive(s.quantity)||!recipe.ingredients[i]||s.quantity!==recipe.ingredients[i]!.quantity))return rejected('INVALID_COMMAND');
   const counts=new Map<string,number>();
   for(let i=0;i<recipe.ingredients.length;i++){
     const req=recipe.ingredients[i]!, sel=command.selections[i];
     if(!sel){if(!req.optional)outcome='failed';continue;}
     counts.set(sel.itemId,(counts.get(sel.itemId)??0)+sel.quantity);
     const found=find(sel.itemId);
     if(found<0||!playerOwns(sel.itemId)||!matchesRequirement(items[found]!,recipe,i,registry))outcome='failed';
   }
   if([...counts].some(([key,amount])=>{const idx=find(key);return idx<0||items[idx]!.quantity<amount}))outcome='failed';
   if(outcome==='success'){
     for(const [key,amount] of counts){const i=items[find(key)]!;replaceQuantity(key,i.quantity-amount);}
     items.push({id:command.resultId,definitionId:recipe.resultDefinitionId,quantity:1});
     placements.push({itemId:command.resultId,location:{kind:'inventory',ownerId:state.player.id}});
   }
   eventType='item.crafted';eventPayload={recipeId:command.recipeId,resultId:command.resultId};
 }else return rejected('INVALID_COMMAND');
 const changed={items,placements,containers};
 if(validateItemWorld(changed,registry).length){
   // A well-formed game attempt which cannot produce a valid world is a failed attempt.
   outcome='failed';
   eventType='item.action_failed';
   return {accepted:true,outcome,turnsSpent:1,nextState:{...state,turn:state.turn+1},events:[{type:eventType,payload:{reason:'ILLEGAL_PLACEMENT'}}]};
 }
 return {accepted:true,outcome,turnsSpent:1,nextState:{...state,turn:state.turn+1,itemWorld:changed},
   events:[{type:outcome==='failed'?'item.action_failed':eventType,payload:eventPayload}]};
}
