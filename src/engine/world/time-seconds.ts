/** 03-B game clock display. All values are non-negative integer game seconds. */
export const GAME_DAY_SECONDS=86_400;
export const GAME_START_SECONDS=8*3600;
export function assertGameSeconds(value:number):number {
 if(!Number.isSafeInteger(value)||value<0)throw RangeError('Invalid game seconds');
 return value;
}
export function gameClockAt(elapsedSeconds:number){
 assertGameSeconds(elapsedSeconds);
 const absolute=GAME_START_SECONDS+elapsedSeconds;
 if(!Number.isSafeInteger(absolute))throw RangeError('Game clock overflow');
 return {day:Math.floor(absolute/GAME_DAY_SECONDS)+1,
  hour:Math.floor(absolute%GAME_DAY_SECONDS/3600),
  minute:Math.floor(absolute%3600/60),second:absolute%60};
}
export function formatTravelSeconds(value:number){
 assertGameSeconds(value);
 const d=Math.floor(value/GAME_DAY_SECONDS),h=Math.floor(value%GAME_DAY_SECONDS/3600),m=Math.floor(value%3600/60),s=value%60;
 return [d&&d+'일',h&&h+'시간',m&&m+'분',s&&s+'초'].filter(Boolean).join(' ')||'0초';
}
