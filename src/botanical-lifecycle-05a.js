import {BOTANICAL_RENEWAL_DAYS_05A} from './balance-botany-05a.js';
import {BOTANICAL_PROFILES_05A,BOTANICAL_PROFILE_BY_ID_05A} from './botanical-profiles-05a.js';
export const BOTANICAL_DAY_SECONDS_05A=86400;
const DAYPART=['dawn','day','dusk','night'];
export function botanicalCalendar05A(elapsed){
 if(!Number.isSafeInteger(elapsed)||elapsed<0)throw Error('INVALID_BOTANICAL_TIME');
 const day=Math.floor((elapsed+28800)/BOTANICAL_DAY_SECONDS_05A);
 const hour=Math.floor(((elapsed+28800)%BOTANICAL_DAY_SECONDS_05A)/3600);
 return {day,season:['spring','summer','autumn','winter'][Math.floor(day%112/28)],
  daypart:hour<6?DAYPART[0]:hour<18?DAYPART[1]:hour<21?DAYPART[2]:DAYPART[3]};
}
/** The plant remains present even outside its flowering window.
 * 'rain-pulse' requires actual authoritative weather: never fabricate rainfall.
 * Renewal periods are proposed game-time rules; these do not create new nodes.
 */
export function botanicalPhenology05A(profile,{season,weather,daypart}={}){
 if(!profile||!BOTANICAL_PROFILE_BY_ID_05A.has(profile.id))return {present:false,harvestable:false,bloom:false,reason:'UNKNOWN_PLANT'};
 const inSeason=profile.seasons.includes(season);
 const weatherValid=profile.renewalClass!=='rain-pulse'||weather==='rain';
 const bloom=inSeason&&weatherValid&&(profile.purpose!=='night-bloom'||daypart==='night');
 return {present:true,bloom,harvestable:profile.dropEnabled&&bloom,reason:!inSeason?'DORMANT':!weatherValid?'WEATHER_REQUIRED':!bloom?'NOT_BLOOMING':profile.dropEnabled?'AVAILABLE':'OBSERVATION_ONLY'};
}
export function botanicalRenewalSeconds05A(profile){
 const days=BOTANICAL_RENEWAL_DAYS_05A[profile?.renewalClass];
 if(!days)throw Error('INVALID_BOTANICAL_RENEWAL');
 return days*BOTANICAL_DAY_SECONDS_05A;
}
export function botanicalObserved05A(flags,id){return flags?.['botany05a:observed:'+id]===true;}
export function eligibleBotanicalObservations05A(region,seconds,flags){
 const {season,daypart}=botanicalCalendar05A(seconds);
 return BOTANICAL_PROFILES_05A.filter(p=>p.interaction==='observe'&&p.regions.includes(region)&&p.seasons.includes(season)&&
  !botanicalObserved05A(flags,p.id)&&(p.purpose!=='night-bloom'||daypart==='night'));
}

/** Global per-species harvest cooldown, persisted as ONE boolean game-state flag
 * per species. Old flag is replaced atomically so saves do not grow per harvest.
 * This is a conservative species-level cooldown, not individual patch ecology.
 */
const harvestPrefix=id=>'botany05a:last:'+id+':';
export function botanicalLastHarvest05A(flags,id){
 const keys=Object.keys(flags??{}).filter(x=>x.startsWith(harvestPrefix(id)));
 if(!keys.length)return null;
 const raw=keys[0].slice(harvestPrefix(id).length);
 const day=Number(raw);
 return Number.isSafeInteger(day)&&day>=0?day:null;
}
export function botanicalCanHarvest05A(flags,profile,seconds,weather){
 const calendar=botanicalCalendar05A(seconds);
 const phenology=botanicalPhenology05A(profile,{...calendar,weather});
 if(!phenology.harvestable)return {ok:false,reason:phenology.reason};
 const last=botanicalLastHarvest05A(flags,profile.id);
 const interval=Math.ceil(botanicalRenewalSeconds05A(profile)/BOTANICAL_DAY_SECONDS_05A);
 return last===null||calendar.day-last>=interval?{ok:true}:{ok:false,reason:'REPLENISHING'};
}
export function botanicalMarkHarvest05A(flags,profile,seconds){
 const day=botanicalCalendar05A(seconds).day;
 const prefix=harvestPrefix(profile.id);
 const next=Object.fromEntries(Object.entries(flags??{}).filter(([k])=>!k.startsWith(prefix)));
 next[prefix+day]=true;
 return next;
}
