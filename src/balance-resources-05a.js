/** Provisional resource balance. Never treat these values as approved economy tuning. */
export const RESOURCE_BALANCE_ROWS_05A=Object.freeze([
 ['wild-herb','야생 약초','gather','숲',5,3,7],
 ['mushroom','일반 버섯','gather','숲',4,4,9],
 ['grass','들풀','gather','숲',8,2,3],
 ['oak-log','참나무 통나무','logging','숲',5,18,30],
 ['pine-log','소나무 통나무','logging','숲',4,14,24],
 ['birch-log','자작나무 통나무','logging','숲',4,16,25],
 ['willow-log','버드나무 통나무','logging','습지',4,12,23],
 ['stone','일반 돌','mining','광산',12,2,3],
 ['coal','석탄','mining','광산',10,0,8],
 ['copper-ore','구리광석','mining','광산',12,0,8],
 ['iron-ore','철광석','mining','광산',10,0,11],
 ['small-fish','작은 민물고기','fishing','강·호수',12,2,10],
 ['carp','잉어','fishing','강·호수',8,4,13],
 ['trout','송어','fishing','강·호수',6,5,16]
].map(row=>Object.freeze(row)));
