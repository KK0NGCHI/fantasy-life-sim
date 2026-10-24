/** Shared deterministic regional climate. Provisional Somnium climate model:
 * reproducible from saved world seed, game day, and region, not wall clock.
 * No ambient random draws; any ecology kind may consume its outputs.
 */
const REGION_CLIMATE_05A=Object.freeze({
 '초원·농경지':{wet:0.25,snow:0.07},
 '숲':{wet:0.34,snow:0.12},
 '습지':{wet:0.45,snow:0.08},
 '강·호수':{wet:0.30,snow:0.12},
 '해안·항구':{wet:0.27,snow:0.03},
 '바다':{wet:0.34,snow:0.00},
 '산맥':{wet:0.21,snow:0.35},
 '설원':{wet:0.13,snow:0.65},
 '사막':{wet:0.055,snow:0.00},
 '광산':{wet:0.05,snow:0.0},
 '화산지대':{wet:0.08,snow:0.0},
 '고대 유적':{wet:0.20,snow:0.05},
 '폐허·묘지':{wet:0.18,snow:0.08},
 '거점 마을':{wet:0.22,snow:0.06}
});
function hash(seed,day,region){
 const text=seed+'|'+day+'|'+region;
 let x=2166136261;
 for(let i=0;i<text.length;i++)x=Math.imul(x^text.charCodeAt(i),16777619)>>>0;
 x^=x>>>16;x=Math.imul(x,2246822507)>>>0;x^=x>>>13;
 return (x>>>0)/4294967296;
}
export function ecologyClimate05A(seed,region,seconds){
 if(typeof seed!=='string'||seed.length<1||seed.length>200||typeof region!=='string'||!region||
 !Number.isSafeInteger(seconds)||seconds<0)throw Error('INVALID_ECOLOGY_CLIMATE');
 const day=Math.floor((seconds+28800)/86400),season=Math.floor(day%112/28);
 const c=REGION_CLIMATE_05A[region]??{wet:0.20,snow:0.05};
 const rainBoost=[1.25,1.45,0.85,0.60][season],chance=c.wet*rainBoost;
 const r=hash(seed,day,region);
 const cold=(season===3?1:season===0?0.45:0.03);
 const snowChance=Math.min(chance,c.snow*cold);
 const weather=r<snowChance?'snow':r<chance?'rain':r>0.94?'fog':'clear';
 return {region,day,season:['spring','summer','autumn','winter'][season],
  weather,climateModel:'05a-regional-provisional-v1'};
}
