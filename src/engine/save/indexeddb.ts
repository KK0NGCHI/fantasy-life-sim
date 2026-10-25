import type { SaveEnvelope, SaveSlot } from './save-format.js';
import { decodeSave } from './save-format.js';

const DATABASE='somnium-saves-v1';
type Pointer={ slotId:string; revision:number; snapshotKey:string };
type Stored={ key:string; save:SaveEnvelope };
export class SaveConflictError extends Error { constructor(){super('Save revision conflict');} }
export interface SavedRevision { readonly key:string; readonly save:SaveEnvelope }
/** Browser-only: caller owns user confirmation and live-state replacement. */
export class IndexedDbSaves {
 constructor(private readonly databaseName=DATABASE) {}
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
 async commit(input:SaveEnvelope,expectedRevision:number|null):Promise<SaveEnvelope>{
  const decoded=decodeSave(input);
  if(!decoded.ok)throw new Error('Invalid save');
  if(expectedRevision!==null&&(!Number.isSafeInteger(expectedRevision)||expectedRevision<0))throw new RangeError('revision');
  const db=await this.open();
  try{
   return await new Promise((resolve,reject)=>{
    const tx=db.transaction(['snapshots','pointers'],'readwrite');
    const snapshots=tx.objectStore('snapshots'),pointers=tx.objectStore('pointers');
    let saved:SaveEnvelope|undefined;
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
 async loadLatest(slotId:string):Promise<SaveEnvelope|null>{
  const db=await this.open();
  try{
   return await new Promise((resolve,reject)=>{
    const tx=db.transaction(['snapshots','pointers'],'readonly');
    const request=tx.objectStore('pointers').get(slotId);
    let found:SaveEnvelope|null=null, error:Error|null=null;
    request.onsuccess=()=>{
     const pointer=request.result as Pointer|undefined;
     if(!pointer)return;
     const snap=tx.objectStore('snapshots').get(pointer.snapshotKey);
     snap.onsuccess=()=>{
      const raw=(snap.result as Stored|undefined)?.save;
      if(!raw){error=new Error('Latest snapshot missing');return;}
      const checked=decodeSave(raw);
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
       .filter(x=>decodeSave(x.save).ok).map(x=>({key:x.key,save:x.save}))
       .sort((a,b)=>b.save.slot.revision-a.save.slot.revision);
    };
    tx.oncomplete=()=>resolve(list);
    tx.onerror=()=>reject(tx.error??new Error('List failed'));
    tx.onabort=()=>reject(tx.error??new Error('List aborted'));
   });
  }finally{db.close();}
 }
}
