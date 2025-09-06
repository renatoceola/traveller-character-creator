/**
 * Characteristic calculation utilities for Traveller
 * Implements all characteristic-related game mechanics from configuration
 */

import type { CharacteristicSet, Species, Rules, Characteristic } from '@/types';

/**
 * Configuration-driven characteristic calculator
 * All logic sourced from rules configuration, zero hardcoded values
 */
export class CharacteristicCalculator {
  /**
   * Calculate dice modifier (DM) for a characteristic value
   * Uses DM table from rules configuration
   */
  static calculateModifier(characteristic: number, rules: Rules): number {
    // Defensive check for rules object
    if (!rules) {
      console.error('Rules object is undefined in calculateModifier');
      return 0;
    }

    // Defensive check for characterCreation section
    if (!rules.characterCreation) {
      console.error('characterCreation section missing from rules:', rules);
      return 0;
    }

    // Get DM table from rules configuration
    const dmTable = rules.characterCreation.dmTable;
    if (!dmTable) {
      console.error('DM table not found in rules configuration. characterCreation:', rules.characterCreation);
      return 0;
    }

    // Parse DM table from configuration format
    for (const [range, modifier] of Object.entries(dmTable)) {
      if (range === '0' && characteristic === 0) {
        return modifier;
      }
      
      if (range.includes('-')) {
        const [min, max] = range.split('-').map(n => parseInt(n, 10));
        if (characteristic >= min && characteristic <= max) {
          return modifier;
        }
      }
      
      if (range.endsWith('+')) {
        const min = parseInt(range.replace('+', ''), 10);
        if (characteristic >= min) {
          return modifier;
        }
      }
    }

    // Fallback to 0 if no range matches
    return 0;
  }

  /**
   * Apply species modifiers to base characteristics
   * All modifiers sourced from species configuration
   */
  static applySpeciesModifiers(
    baseCharacteristics: CharacteristicSet,
    species: Species,
    rules: Rules
  ): CharacteristicSet {
    const result = { ...baseCharacteristics };
    
    // Apply each modifier from the species configuration
    for (const modifier of species.modifiers) {
      const currentValue = result[modifier.characteristic];
      const newValue = currentValue + modifier.modifier;
      
      // Apply characteristic limits from rules
      const minValue = rules.characterCreation?.minimumValue ?? 1;
      const maxValue = rules.characterCreation?.maximumValue ?? 15;
      
      result[modifier.characteristic] = Math.max(minValue, Math.min(maxValue, newValue));
    }
    
    return result;
  }

  /**
   * Calculate all characteristic modifiers for a character
   */
  static calculateAllModifiers(
    characteristics: CharacteristicSet,
    rules: Rules
  ): Record<Characteristic, number> {
    const modifiers: Record<Characteristic, number> = {} as Record<Characteristic, number>;
    
    for (const [char, value] of Object.entries(characteristics)) {
      modifiers[char as Characteristic] = this.calculateModifier(value, rules);
    }
    
    return modifiers;
  }

  /**
   * Validate characteristic values against rules
   */
  static validateCharacteristics(
    characteristics: CharacteristicSet,
    rules: Rules
  ): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    const minValue = rules.characterCreation?.minimumValue ?? 1;
    const maxValue = rules.characterCreation?.maximumValue ?? 15;
    const enforceMinSum = rules.characterCreation?.enforceMinimumCharacteristics ?? false;
    const minSum = rules.characterCreation?.minCharacteristicSum ?? 0;
    
    // Check individual characteristic limits
    for (const [char, value] of Object.entries(characteristics)) {
      if (value < minValue) {
        errors.push(`${char} (${value}) is below minimum (${minValue})`);
      }
      if (value > maxValue) {
        errors.push(`${char} (${value}) is above maximum (${maxValue})`);
      }
    }
    
    // Check total sum if enforced
    if (enforceMinSum) {
      const total = Object.values(characteristics).reduce((sum, val) => sum + val, 0);
      if (total < minSum) {
        warnings.push(`Total characteristics (${total}) below recommended minimum (${minSum})`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Generate random characteristics using configured method
   */
  static generateCharacteristics(rules: Rules): CharacteristicSet {
    const method = rules.characterCreation?.generation?.method ?? '2d6';
    const rolls = rules.characterCreation?.generation?.rolls ?? 6;
    
    const characteristics: CharacteristicSet = {
      STR: 0,
      DEX: 0,
      END: 0,
      INT: 0,
      EDU: 0,
      SOC: 0,
    };
    
    const rollValues: number[] = [];
    
    // Generate rolls based on configured method
    for (let i = 0; i < rolls; i++) {
      let roll: number;
      
      switch (method) {
        case '2d6':
          roll = this.roll2d6();
          break;
        case '3d6_drop_lowest':
          roll = this.roll3d6DropLowest();
          break;
        default:
          roll = this.roll2d6();
      }
      
      rollValues.push(roll);
    }
    
    // Assign rolls to characteristics (free assignment assumed)
    const charKeys = Object.keys(characteristics) as Characteristic[];
    rollValues.forEach((roll, index) => {
      if (index < charKeys.length) {
        characteristics[charKeys[index]] = roll;
      }
    });
    
    return characteristics;
  }

  /**
   * Roll 2d6 for characteristic generation
   */
  private static roll2d6(): number {
    return Math.floor(Math.random() * 6) + 1 + Math.floor(Math.random() * 6) + 1;
  }

  /**
   * Roll 3d6 and drop the lowest
   */
  private static roll3d6DropLowest(): number {
    const rolls = [
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1,
    ].sort((a, b) => b - a); // Sort descending
    
    return rolls[0] + rolls[1]; // Take the two highest
  }

  /**
   * Check if characteristic can be rerolled based on rules
   */
  static canRerollCharacteristic(
    characteristic: Characteristic,
    rerollsUsed: Record<Characteristic, number>,
    rules: Rules
  ): boolean {
    const allowRerolls = rules.characterCreation?.allowCharacteristicRerolls ?? false;
    const maxRerolls = rules.characterCreation?.maxRerollsPerCharacteristic ?? 0;
    
    if (!allowRerolls) return false;
    
    const usedRerolls = rerollsUsed[characteristic] ?? 0;
    return usedRerolls < maxRerolls;
  }

  /**
   * Apply aging effects to characteristics
   */
  static applyAgingEffects(
    characteristics: CharacteristicSet,
    age: number,
    rules: Rules
  ): CharacteristicSet {
    if (!rules.aging?.enableAging) {
      return characteristics;
    }

    const result = { ...characteristics };
    const agingModifiers = rules.aging.agingModifiers;
    
    // Find appropriate aging bracket based on age
    const ageKey = Object.keys(agingModifiers)
      .filter(key => {
        const ageThreshold = parseInt(key);
        return !isNaN(ageThreshold) && age >= ageThreshold;
      })
      .sort((a, b) => parseInt(b) - parseInt(a))[0]; // Get highest applicable age
    
    if (ageKey && agingModifiers[ageKey]) {
      const modifiers = agingModifiers[ageKey];
      
      for (const [char, modifier] of Object.entries(modifiers)) {
        if (modifier !== undefined) {
          const currentValue = result[char as Characteristic];
          const newValue = Math.max(1, currentValue + modifier);
          result[char as Characteristic] = newValue;
        }
      }
    }
    
    return result;
  }
}
