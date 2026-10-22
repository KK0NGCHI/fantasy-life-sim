import type { SaveSlot } from './save-format.js';
import type { SaveEnvelopeV2 } from './save-v2.js';
import type { ItemRegistry } from '../data/item-registry.js';
import { decodeSaveV2 } from './save-v2.js';

const DATABASE='somnium-saves-v2';
type Pointer={ slotId:string; revision:number; snapshotKey:string };
type Stored={ key:string; save:SaveEnvelopeV2 };
export class SaveConflictError extends Error { constructor(){super('Save revision conflict');} }
export interface SavedRevision { readonly key:string; readonly save:SaveEnvelopeV2 }
/** Browser-only: caller owns user confirmation and live-state replacement. */
export class IndexedDbSavesV2 {
 constructor(private readonly registry:ItemRegistry,private readonly databaseName=DATABASE) {}
 private open():Promise<IDBDatabase>{
  return new Promise((resolve,reject)=>{
   const request=indexedDB.open(this.databaseName,1);
   request.onupgradeneeded=()=>{
    const db=request.result;
    if(!db.objectStoreNames.contains('snapshots'))db.createObjectStore('snapshots',{keyPath:'key'});
    if(!db.objectStoreNames.contains('pointers'))db.createObjectStore('pointers',{keyPath:'slotId'});
   };
   request.onsuccess=()=>resolve(request.result);
   request.onerror=()=>reject(request.error??new Error('Database open failed'));
  });
 }
 /** Atomic commit: immutable snapshot plus pointer update in one transaction. */
 async commit(input:SaveEnvelopeV2,expectedRevision:number|null):Promise<SaveEnvelopeV2>{
  const decoded=decodeSaveV2(input,this.registry);
  if(!decoded.ok)throw new Error('Invalid save');
  if(expectedRevision!==null&&(!Number.isSafeInteger(expectedRevision)||expectedRevision<0))throw new RangeError('revision');
  const db=await this.open();
  try{
   return await new Promise((resolve,reject)=>{
    const tx=db.transaction(['snapshots','pointers'],'readwrite');
    const snapshots=tx.objectStore('snapshots'),pointers=tx.objectStore('pointers');
    let saved:SaveEnvelopeV2|undefined;
    let failure:Error|null=null;
    const request=pointers.get(input.slot.slotId);
    request.onsuccess=()=>{
     const prev=request.result as Pointer|undefined;
     if((prev?.revision??null)!==expectedRevision){failure=new SaveConflictError();tx.abort();return;}
     const revision=(prev?.revision??0)+1;
     const slot:SaveSlot={...input.slot,revision};
     saved={...decoded.save,slot};
     const key=slot.slotId+'@'+revision;
     snapshots.put({key,save:saved} satisfies Stored);
     pointers.put({slotId:slot.slotId,revision,snapshotKey:key} satisfies Pointer);
    };
    request.onerror=()=>{failure=request.error??new Error('Read failed');};
    tx.oncomplete=()=>saved?resolve(saved):reject(new Error('No saved snapshot'));
    tx.onabort=()=>reject(failure??tx.error??new Error('Save aborted'));
    tx.onerror=()=>{failure=tx.error??new Error('Save transaction failed');};
   });
  }finally{db.close();}
 }
 /** Read-only: damaged latest save does not erase or silently switch to previous revision. */
 async loadLatest(slotId:string):Promise<SaveEnvelopeV2|null>{
  const db=await this.open();
  try{
   return await new Promise((resolve,reject)=>{
    const tx=db.transaction(['snapshots','pointers'],'readonly');
    const request=tx.objectStore('pointers').get(slotId);
    let found:SaveEnvelopeV2|null=null, error:Error|null=null;
    request.onsuccess=()=>{
     const pointer=request.result as Pointer|undefined;
     if(!pointer)return;
     const snap=tx.objectStore('snapshots').get(pointer.snapshotKey);
     snap.onsuccess=()=>{
      const raw=(snap.result as Stored|undefined)?.save;
      if(!raw){error=new Error('Latest snapshot missing');return;}
      const checked=decodeSaveV2(raw,this.registry);
      if(!checked.ok){error=new Error('Latest snapshot invalid: '+checked.reason);return;}
      found=checked.save;
     };
    };
    tx.oncomplete=()=>error?reject(error):resolve(found);
    tx.onabort=()=>reject(tx.error??new Error('Load aborted'));
    tx.onerror=()=>{error=tx.error??new Error('Load failed');};
   });
  }finally{db.close();}
 }

 /** Lists saved slots without mutating them, exposing corruption rather than silently falling back. */
 async listSlots():Promise<readonly {slotId:string;revision:number;status:'valid'|'damaged';save:SaveEnvelopeV2|null}[]>{
  const db=await this.open();
  try{return await new Promise((resolve,reject)=>{
   const tx=db.transaction(['pointers','snapshots'],'readonly');
   const pointers=tx.objectStore('pointers'),snapshots=tx.objectStore('snapshots');
   const list:{slotId:string;revision:number;status:'valid'|'damaged';save:SaveEnvelopeV2|null}[]=[];
   const request=pointers.getAll();
   request.onsuccess=()=>{
    for(const pointer of request.result as Pointer[]){
     const snap=snapshots.get(pointer.snapshotKey);
     snap.onsuccess=()=>{
      const raw=(snap.result as Stored|undefined)?.save;
      const check=decodeSaveV2(raw,this.registry);
      list.push({slotId:pointer.slotId,revision:pointer.revision,
       status:check.ok?'valid':'damaged',save:check.ok?check.save:null});
     };
    }
   };
   tx.oncomplete=()=>resolve(list.sort((a,b)=>a.slotId.localeCompare(b.slotId)));
   tx.onerror=()=>reject(tx.error??new Error('Slot listing failed'));
   tx.onabort=()=>reject(tx.error??new Error('Slot listing aborted'));
  });}finally{db.close();}
 }

 /** Recovery candidates are read without mutating the active slot pointer. */
 async listRevisions(slotId:string):Promise<readonly SavedRevision[]>{
  const db=await this.open();
  try{
   return await new Promise((resolve,reject)=>{
    const tx=db.transaction('snapshots','readonly');
    const request=tx.objectStore('snapshots').getAll();
    let list:SavedRevision[]=[];
    request.onsuccess=()=>{
     list=(request.result as Stored[]).filter(x=>x.save?.slot?.slotId===slotId)
       .filter(x=>decodeSaveV2(x.save,this.registry).ok).map(x=>({key:x.key,save:x.save}))
       .sort((a,b)=>b.save.slot.revision-a.save.slot.revision);
    };
    tx.oncomplete=()=>resolve(list);
    tx.onerror=()=>reject(tx.error??new Error('List failed'));
    tx.onabort=()=>reject(tx.error??new Error('List aborted'));
   });
  }finally{db.close();}
 }
}
