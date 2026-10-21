// Prototype-only content; values do not represent approved game balance.
export const REGIONS=['거점 마을','초원·농경지','숲','강·호수','습지','산맥','광산','설원','사막','해안·항구','바다','화산지대','고대 유적','폐허·묘지','만신전','지하미궁'];
export const ACTIONS={
'거점 마을':['밭을 돌본다','작물을 수확한다','작업대를 사용한다','휴식한다'],
'초원·농경지':['약초를 채집한다','풀을 벤다','농지를 살핀다'],
'숲':['나무를 조사한다','나뭇가지를 줍는다','버섯을 채집한다'],
'강·호수':['낚시한다','강변을 조사한다'],
'광산':['광석을 채굴한다','지층을 조사한다'],
'지하미궁':['던전에 진입한다']
};
export const START_ITEMS=[
{id:'core:wheat',name:'밀',group:'식재료',qty:12,tags:['material:plant','craft:edible']},
{id:'core:wood',name:'참나무 목재',group:'재료',qty:7,tags:['material:wood','craft:structural']},
{id:'core:fish',name:'강송어',group:'식재료',qty:2,tags:['origin:freshwater','craft:edible']},
{id:'core:iron',name:'철광석',group:'광석',qty:4,tags:['material:metal','craft:smeltable']},
{id:'core:herb',name:'향기풀',group:'약초',qty:5,tags:['material:plant','craft:alchemical']}
];
export const SKILLS=[['농업',18],['낚시',12],['채집',16],['벌목',9],['채광',8],['요리',14],['대장장이',6],['연금술',4],['목축',7],['학문',11]];
export const TILES=[
'################',
'#.....#........#',
'#..*..#...o....#',
'#.....#........#',
'#..............#',
'#....###.......#',
'#......#.......#',
'#......#...>...#',
'#............!.#',
'################'
];