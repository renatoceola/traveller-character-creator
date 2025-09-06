/**
 * Dice rolling utilities for Traveller
 */

export interface DiceResult {
  total: number;
  rolls: number[];
  dice: string;
  modifier: number;
}

/**
 * Parse a dice string (e.g., "2d6", "1d6+2", "3d6-1")
 */
export function parseDiceString(diceString: string): {
  count: number;
  sides: number;
  modifier: number;
} {
  const match = diceString.match(/^(\d+)d(\d+)([+-]\d+)?$/);
  
  if (!match) {
    throw new Error(`Invalid dice string: ${diceString}`);
  }

  const count = parseInt(match[1], 10);
  const sides = parseInt(match[2], 10);
  const modifier = match[3] ? parseInt(match[3], 10) : 0;

  return { count, sides, modifier };
}

/**
 * Roll a single die
 */
export function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

/**
 * Roll multiple dice
 */
export function rollDice(count: number, sides: number): number[] {
  const rolls: number[] = [];
  for (let i = 0; i < count; i++) {
    rolls.push(rollDie(sides));
  }
  return rolls;
}

/**
 * Roll dice from a dice string
 */
export function roll(diceString: string): DiceResult {
  const { count, sides, modifier } = parseDiceString(diceString);
  const rolls = rollDice(count, sides);
  const total = rolls.reduce((sum, roll) => sum + roll, 0) + modifier;

  return {
    total,
    rolls,
    dice: diceString,
    modifier,
  };
}

/**
 * Roll 2d6 (standard Traveller roll)
 */
export function roll2d6(): DiceResult {
  return roll('2d6');
}

/**
 * Roll 1d6
 */
export function roll1d6(): DiceResult {
  return roll('1d6');
}

/**
 * Roll 3d6 (for characteristics)
 */
export function roll3d6(): DiceResult {
  return roll('3d6');
}

/**
 * Roll with advantage (roll twice, take higher)
 */
export function rollWithAdvantage(diceString: string): DiceResult {
  const roll1 = roll(diceString);
  const roll2 = roll(diceString);
  
  return roll1.total >= roll2.total ? roll1 : roll2;
}

/**
 * Roll with disadvantage (roll twice, take lower)
 */
export function rollWithDisadvantage(diceString: string): DiceResult {
  const roll1 = roll(diceString);
  const roll2 = roll(diceString);
  
  return roll1.total <= roll2.total ? roll1 : roll2;
}

/**
 * Calculate DM (Dice Modifier) based on characteristic value
 */
export function calculateDM(characteristic: number): number {
  if (characteristic === 0) return -3;
  if (characteristic <= 2) return -2;
  if (characteristic <= 5) return -1;
  if (characteristic <= 8) return 0;
  if (characteristic <= 11) return 1;
  if (characteristic <= 14) return 2;
  if (characteristic <= 17) return 3;
  return 4; // 18+
}

/**
 * Get characteristic modifier as a string with sign
 */
export function getDMString(characteristic: number): string {
  const dm = calculateDM(characteristic);
  return dm >= 0 ? `+${dm}` : `${dm}`;
}

/**
 * Roll for a task check (2d6 + DM vs difficulty)
 */
export function taskCheck(
  dm: number, 
  difficulty: number = 8, 
  advantage?: boolean, 
  disadvantage?: boolean
): { 
  success: boolean; 
  roll: DiceResult; 
  target: number; 
  margin: number 
} {
  let diceRoll: DiceResult;
  
  if (advantage) {
    diceRoll = rollWithAdvantage('2d6');
  } else if (disadvantage) {
    diceRoll = rollWithDisadvantage('2d6');
  } else {
    diceRoll = roll2d6();
  }
  
  const total = diceRoll.total + dm;
  const success = total >= difficulty;
  const margin = total - difficulty;
  
  return {
    success,
    roll: diceRoll,
    target: difficulty,
    margin,
  };
}

/**
 * Common Traveller difficulties
 */
export const DIFFICULTY = {
  SIMPLE: 2,
  EASY: 4,
  ROUTINE: 6,
  AVERAGE: 8,
  DIFFICULT: 10,
  VERY_DIFFICULT: 12,
  FORMIDABLE: 14,
  IMPOSSIBLE: 16,
} as const;

/**
 * Get difficulty name from number
 */
export function getDifficultyName(difficulty: number): string {
  const entries = Object.entries(DIFFICULTY);
  const entry = entries.find(([, value]) => value === difficulty);
  return entry ? entry[0].replace('_', ' ').toLowerCase() : `difficulty ${difficulty}`;
}
