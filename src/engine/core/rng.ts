import type { RandomState } from './contracts.js';

/** Two independently advanced PRNG streams; non-cryptographic, versioned xorshift32. */
const hash = (s: string): number => {
  let x = 2166136261;
  for (let i = 0; i < s.length; i++) { x = Math.imul(x ^ s.charCodeAt(i), 16777619); }
  return x >>> 0 || 1;
};
export type RngStream = 'world' | 'action';
export function createRandomState(seed: string): RandomState {
  if (!seed) throw new RangeError('A nonempty seed is required');
  return { algorithm: 'xorshift32-two-stream-v1', seed, state: [hash(seed + ':world'), hash(seed + ':action')] };
}
export function drawRandom(state: RandomState, stream: RngStream): { value: number; rng: RandomState } {
  if (state.algorithm !== 'xorshift32-two-stream-v1' || state.state.length !== 2) throw new RangeError('Unknown PRNG state');
  const index = stream === 'world' ? 0 : 1;
  let x = state.state[index];
  if (x === undefined || !Number.isInteger(x) || x <= 0 || x > 0xffffffff) throw new RangeError('Invalid PRNG state');
  x ^= x << 13; x ^= x >>> 17; x ^= x << 5; x >>>= 0;
  const next = [...state.state]; next[index] = x;
  return { value: x / 0x100000000, rng: { ...state, state: next } };
}
export function randomInt(state: RandomState, stream: RngStream, min: number, max: number): { value: number; rng: RandomState } {
  if (!Number.isSafeInteger(min) || !Number.isSafeInteger(max) || min > max || max - min >= 0x100000000) throw new RangeError('Invalid interval');
  const result = drawRandom(state, stream);
  return { value: min + Math.floor(result.value * (max - min + 1)), rng: result.rng };
}
