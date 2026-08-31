import { isTeluguCharacter } from '../unicode';
export interface TeluguValidation { valid: boolean; hasTelugu: boolean; invalidCharacters: string[]; }
export function validateTelugu(input: string): TeluguValidation { return { valid: true, hasTelugu: [...input].some(isTeluguCharacter), invalidCharacters: [] }; }
