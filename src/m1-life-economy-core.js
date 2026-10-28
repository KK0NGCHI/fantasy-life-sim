/**
 * M1 experimental life/economy domain. Pure reducer with no dependency on UI or
 * storage. The game bridge embeds farm/merchant runtime in v3 world state and
 * uses itemWorld for authoritative item ownership. All prices and durations are provisional.
 */
export const M1_CROPS=Object.freeze({
 wheat:{seed:'m1:seed:wheat',yield:'m1:crop:wheat',grow:86400,window:86400,quantity:3,repeat:0},
 potato:{seed:'m1:seed:potato',yield:'m1:crop:potato',grow:86400,window:86400,quantity:2,repeat:0},
 strawberry:{seed:'m1:seed:strawberry',yield:'m1:crop:strawberry',grow:86400,window:86400,quantity:2,repeat:2},
 blueberry:{seed:'m1:seed:blueberry',yield:'m1:crop:blueberry',grow:172800,window:86400,quantity:2,repeat:2}
});
export const M1_FOODS=Object.freeze({
 'm1:food:bread':{input:'m1:crop:wheat',quantity:2,hunger:15},
 'm1:food:baked-potato':{input:'m1:crop:potato',quantity:1,hunger:10}
});
export const M1_PRICES=Object.freeze({
 'm1:seed:wheat':2,'m1:seed:potato':2,'m1:seed:strawberry':4,'m1:seed:blueberry':4,
 'm1:crop:wheat':3,'m1:crop:potato':3,'m1:crop:strawberry':5,'m1:crop:blueberry':5,
 'm1:food:bread':9,'m1:food:baked-potato':5
});
const RESTOCK_SECONDS=7*86400;
const SEED_STOCK=Object.freeze({'m1:seed:wheat':8,'m1:seed:potato':8,'m1:seed:strawberry':4,'m1:seed:blueberry':4});
const integer=n=>Number.isSafeInteger(n)&&n>=0;
const fail=reason=>({ok:false,reason});
const own=(obj,key)=>Object.prototype.hasOwnProperty.call(obj,key);
const clone=x=>structuredClone(x);
export function newM1LifeState(){
 return {schema:1,now:0,turn:0,gold:20,hunger:85,inventory:{},plots:[null,null],
  facilities:{kitchen:true,workbench:true,plotCapacity:2},
  merchant:{stock:{...SEED_STOCK},lastRestock:0},
  events:[]};
}
export function validateM1LifeState(s){
 if(!s||s.schema!==1||!integer(s.now)||!integer(s.turn)||!integer(s.gold)||
   !integer(s.hunger)||s.hunger>100||!s.inventory||typeof s.inventory!=='object'||Array.isArray(s.inventory)||
   !Object.entries(s.inventory).every(([k,v])=>own(M1_PRICES,k)&&integer(v))||
   !Array.isArray(s.plots)||s.plots.length>32||!s.facilities||
   !integer(s.facilities.plotCapacity)||s.plots.length!==s.facilities.plotCapacity||
   typeof s.facilities.kitchen!=='boolean'||typeof s.facilities.workbench!=='boolean'||
   (s.facilities.woodShed!==undefined&&typeof s.facilities.woodShed!=='boolean')||
   !s.merchant||!s.merchant.stock||!Object.entries(s.merchant.stock).every(([k,v])=>own(M1_PRICES,k)&&integer(v))||
   !Array.isArray(s.events)||s.events.length>200||
   !integer(s.merchant.lastRestock??0)||s.merchant.lastRestock>s.now)return false;
 return s.plots.every(p=>p===null||(p&&own(M1_CROPS,p.crop)&&integer(p.readyAt)&&
  integer(p.spoilsAt)&&p.spoilsAt>=p.readyAt&&integer(p.remainingHarvests)&&
  p.remainingHarvests>=1&&p.remainingHarvests<=1+M1_CROPS[p.crop].repeat));
}
function changeStock(inv,id,delta){
 const next=(inv[id]??0)+delta;
 if(!integer(next))return false;
 if(next===0)delete inv[id];else inv[id]=next;
 return true;
}
export function runM1LifeAction(source,action){
 if(!validateM1LifeState(source)||!action||typeof action.type!=='string')return fail('INVALID_STATE_OR_ACTION');
 const s=clone(source),a=action,positive=n=>integer(n)&&n>0;
 let event={type:a.type};
 switch(a.type){
 case 'time.advance':{
  if(!positive(a.seconds)||a.seconds>365*86400||!integer(s.now+a.seconds))return fail('INVALID_TIME');
  s.now+=a.seconds;
  // Replenish seeds once per completed seven-day bucket; split and bulk clock
  // advances produce the same stock. No real-time refill and no cash cap.
  const anchor=s.merchant.lastRestock??0;
  const cycles=Math.floor((s.now-anchor)/RESTOCK_SECONDS);
  if(cycles>0){
   for(const [id,cap] of Object.entries(SEED_STOCK))
    s.merchant.stock[id]=Math.min(cap,(s.merchant.stock[id]??0)+cap*cycles);
   s.merchant.lastRestock=anchor+cycles*RESTOCK_SECONDS;
  }
  // Crops become spoiled in their field; inventory never ages.
  for(let i=0;i<s.plots.length;i++){
   const p=s.plots[i];
   if(p&&s.now>p.spoilsAt){s.plots[i]=null;event={type:'crop.overripe',plot:i,crop:p.crop};}
  }
  break;
 }
 case 'farm.plant':{
  if(!integer(a.plot)||a.plot>=s.plots.length||!own(M1_CROPS,a.crop))return fail('INVALID_PLOT_OR_CROP');
  if(s.plots[a.plot])return fail('PLOT_OCCUPIED');
  const c=M1_CROPS[a.crop];
  if((s.inventory[c.seed]??0)<1)return fail('NO_SEED');
  changeStock(s.inventory,c.seed,-1);
  s.plots[a.plot]={crop:a.crop,readyAt:s.now+c.grow,spoilsAt:s.now+c.grow+c.window,remainingHarvests:1+c.repeat};
  event={type:'farm.planted',plot:a.plot,crop:a.crop};
  break;
 }
 case 'farm.harvest':{
  if(!integer(a.plot)||a.plot>=s.plots.length)return fail('INVALID_PLOT');
  const p=s.plots[a.plot];
  if(!p)return fail('EMPTY_PLOT');
  if(s.now<p.readyAt)return fail('NOT_RIPE');
  if(s.now>p.spoilsAt)return fail('OVER_RIPE');
  const c=M1_CROPS[p.crop];
  changeStock(s.inventory,c.yield,c.quantity);
  p.remainingHarvests--;
  if(p.remainingHarvests===0)s.plots[a.plot]=null;
  else{p.readyAt=s.now+c.grow;p.spoilsAt=p.readyAt+c.window;}
  event={type:'farm.harvested',crop:p.crop,quantity:c.quantity};
  break;
 }
 case 'trade.buy':
 case 'trade.sell':{
  if(!own(M1_PRICES,a.item)||!positive(a.quantity)||a.quantity>10000)return fail('INVALID_TRADE');
  const cost=M1_PRICES[a.item]*a.quantity;
  if(!integer(cost))return fail('INVALID_TRADE');
  if(a.type==='trade.buy'){
   if((s.merchant.stock[a.item]??0)<a.quantity)return fail('OUT_OF_STOCK');
   if(s.gold<cost)return fail('INSUFFICIENT_GOLD');
   s.gold-=cost;changeStock(s.merchant.stock,a.item,-a.quantity);
   changeStock(s.inventory,a.item,a.quantity);
  }else{
   if((s.inventory[a.item]??0)<a.quantity)return fail('NOT_OWNED');
   if(!integer(s.gold+cost))return fail('GOLD_OVERFLOW');
   changeStock(s.inventory,a.item,-a.quantity);
   changeStock(s.merchant.stock,a.item,a.quantity);
   s.gold+=cost; // Merchant cash does not block sales.
  }
  event={type:a.type,item:a.item,quantity:a.quantity,amount:cost};
  break;
 }
 case 'food.cook':{
  if(!own(M1_FOODS,a.recipe))return fail('UNKNOWN_RECIPE');
  if(!s.facilities.kitchen)return fail('KITCHEN_REQUIRED');
  const f=M1_FOODS[a.recipe];
  if((s.inventory[f.input]??0)<f.quantity)return fail('MISSING_INGREDIENTS');
  changeStock(s.inventory,f.input,-f.quantity);
  changeStock(s.inventory,a.recipe,1);
  event={type:'food.cooked',recipe:a.recipe};
  break;
 }
 case 'food.eat':{
  const f=M1_FOODS[a.item];
  if(!f)return fail('NOT_EDIBLE');
  if((s.inventory[a.item]??0)<1)return fail('NOT_OWNED');
  changeStock(s.inventory,a.item,-1);
  s.hunger=Math.min(100,s.hunger+f.hunger);
  event={type:'food.eaten',item:a.item,hunger:s.hunger};
  break;
 }
 case 'home.expand':{
  if(s.facilities.plotCapacity>=32)return fail('MAX_PLOTS');
  if(s.gold<10)return fail('INSUFFICIENT_GOLD');
  s.gold-=10;s.facilities.plotCapacity++;s.plots.push(null);
  event={type:'home.expanded',plotCapacity:s.plots.length};
  break;
 }
 default:return fail('UNKNOWN_ACTION');
 }
 if(!integer(s.turn+1))return fail('TURN_OVERFLOW');
 s.turn+=1;
 s.events.push(event);if(s.events.length>200)s.events.shift();
 if(!validateM1LifeState(s))return fail('INVALID_RESULT');
 return {ok:true,state:s,event};
}
