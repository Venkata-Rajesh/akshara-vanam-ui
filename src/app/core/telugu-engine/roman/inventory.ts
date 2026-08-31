import { Consonant, Vowel } from '../types';
export interface RomanMapping<T> { roman: string; value: T; weight: number; }
export const VOWELS: RomanMapping<Vowel>[] = [
  ['ruu','ruu',1], ['ru','ru',1], ['aaa','aa',.7], ['aa','aa',1], ['iii','ii',.7], ['ii','ii',1], ['uuu','uu',.7], ['uu','uu',1], ['eee','ee',.7], ['ee','ee',1], ['ai','ai',1], ['ei','ai',.65], ['ooo','oo',.7], ['oo','oo',1], ['au','au',1], ['ou','au',.65], ['a','a',1], ['i','i',1], ['u','u',1], ['e','e',1], ['o','o',1],
].map(([roman, value, weight]) => ({ roman: roman as string, value: value as Vowel, weight: weight as number }));
export const CONSONANTS: RomanMapping<Consonant>[] = [
  ['chh','chh',1], ['tth','tth',1], ['ddh','ddh',1], ['kh','kh',1], ['gh','gh',1], ['jh','jh',1], ['th','th',1], ['dh','dh',1], ['ph','ph',1], ['bh','bh',1], ['shh','shh',1], ['ng','ng',1], ['ny','ny',1], ['tt','tt',1], ['dd','dd',1], ['nn','nn',1], ['ch','ch',1], ['sh','sh',1], ['ll','ll',.5], ['rr','rr',1], ['f','ph',.78], ['w','v',.78], ['z','j',.55], ['q','k',.55], ['x','k',.45], ['k','k',1], ['g','g',1], ['c','c',.9], ['j','j',1], ['t','t',1], ['d','d',1], ['n','n',1], ['p','p',1], ['b','b',1], ['m','m',1], ['y','y',1], ['r','r',1], ['l','l',1], ['v','v',1], ['s','s',1], ['h','h',1],
].map(([roman, value, weight]) => ({ roman: roman as string, value: value as Consonant, weight: weight as number }));
