import {BOTANICAL_BACKLOG_05A} from './botanical-backlog-05a.js';
/** Reviewed species subset from the 80-entry research backlog.
 * Seasons below are Somnium gameplay proposals, NOT global biological phenology.
 * Rates are test balance candidates, not approved rarity or medicinal efficacy.
 */
export const BOTANICAL_SPECIES_05A=Object.freeze([
 {key:'plantago-major',name:'큰질경이',scientificName:'Plantago major',regions:['초원·농경지'],seasons:['spring','summer','autumn'],source:'https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:321286-2/general-information'},
 {key:'bellis-perennis',name:'데이지',scientificName:'Bellis perennis',regions:['초원·농경지'],seasons:['spring','summer'],source:'https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:184409-1/general-information'},
 {key:'achillea-millefolium',name:'서양톱풀',scientificName:'Achillea millefolium',regions:['초원·농경지','숲'],seasons:['summer','autumn'],source:'https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:2294-2/general-information'},
 {key:'allium-ursinum',name:'야생 마늘',scientificName:'Allium ursinum',regions:['숲'],seasons:['spring'],source:'https://www.woodlandtrust.org.uk/trees-woods-and-wildlife/plants/wild-flowers/wild-garlic/'},
 {key:'mentha-aquatica',name:'물박하',scientificName:'Mentha aquatica',regions:['습지'],seasons:['summer','autumn'],source:'https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:450192-1/general-information'},
 {key:'caltha-palustris',name:'동의나물',scientificName:'Caltha palustris',regions:['습지'],seasons:['spring'],source:'https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:42867-2'}
].map(x=>Object.freeze({...x,id:'item05a:'+x.key,regions:Object.freeze(x.regions),seasons:Object.freeze(x.seasons)})));
export const BOTANICAL_ALL_05A=Object.freeze([...BOTANICAL_SPECIES_05A,...BOTANICAL_BACKLOG_05A]);
export const BOTANICAL_ITEMS_05A=Object.freeze(BOTANICAL_ALL_05A.map(s=>Object.freeze({id:s.id,name:s.name,family:'herb'})));
