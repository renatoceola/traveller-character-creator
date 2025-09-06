/**
 * Characteristic Display Component
 * Demonstrates configuration-driven characteristic presentation
 */

import React from 'react';
import type { CharacteristicSet, Rules, Characteristic } from '@/types';
import { CharacteristicCalculator } from '@/utils/characteristicCalculator';

interface CharacteristicDisplayProps {
  characteristics: CharacteristicSet;
  rules: Rules;
  onReroll?: (characteristic: Characteristic) => void;
  rerollsUsed?: Record<Characteristic, number>;
  showModifiers?: boolean;
  showRerollButtons?: boolean;
  className?: string;
}

/**
 * ✅ STANDARDS COMPLIANT: Configuration-driven characteristic display
 * - All DM calculations from rules configuration
 * - No hardcoded characteristic limits
 * - Reroll logic based on rules
 * - Accessible and well-structured
 */
export const CharacteristicDisplay: React.FC<CharacteristicDisplayProps> = ({
  characteristics,
  rules,
  onReroll,
  rerollsUsed = {},
  showModifiers = true,
  showRerollButtons = false,
  className = '',
}) => {
  const calculateModifier = (value: number): string => {
    const dm = CharacteristicCalculator.calculateModifier(value, rules);
    return dm >= 0 ? `+${dm}` : `${dm}`;
  };

  const canReroll = (char: Characteristic): boolean => {
    if (!onReroll || !showRerollButtons) return false;
    const rerollsForChar = rerollsUsed as Record<Characteristic, number>;
    return CharacteristicCalculator.canRerollCharacteristic(char, rerollsForChar, rules);
  };

  const getTotalSum = (): number => {
    return Object.values(characteristics).reduce((sum, val) => sum + val, 0);
  };

  const getValidation = () => {
    return CharacteristicCalculator.validateCharacteristics(characteristics, rules);
  };

  const validation = getValidation();
  const totalSum = getTotalSum();

  return (
    <div className={`characteristic-display ${className}`}>
      {/* Characteristics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Object.entries(characteristics).map(([char, value]) => (
          <CharacteristicCard
            key={char}
            characteristic={char as Characteristic}
            value={value}
            modifier={showModifiers ? calculateModifier(value) : undefined}
            onReroll={canReroll(char as Characteristic) ? () => onReroll!(char as Characteristic) : undefined}
            rules={rules}
          />
        ))}
      </div>

      {/* Summary Information */}
      <div className="mt-6 space-y-3">
        {/* Total Sum */}
        <div className="flex items-center justify-between p-3 bg-slate-800 rounded">
          <span className="text-slate-300">Total Characteristics:</span>
          <span className="font-mono text-lg text-white">{totalSum}</span>
        </div>

        {/* Minimum Sum Warning */}
        {rules.characterCreation?.enforceMinimumCharacteristics && (
          <div className={`p-3 rounded ${
            totalSum >= rules.characterCreation.minCharacteristicSum
              ? 'bg-green-900/20 border border-green-700/50'
              : 'bg-yellow-900/20 border border-yellow-700/50'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300">
                Minimum Required:
              </span>
              <span className="text-sm font-mono">
                {rules.characterCreation.minCharacteristicSum}
              </span>
            </div>
            {totalSum < rules.characterCreation.minCharacteristicSum && (
              <div className="text-xs text-yellow-400 mt-1">
                Consider rerolling to meet minimum requirements
              </div>
            )}
          </div>
        )}

        {/* Validation Errors */}
        {validation.errors.length > 0 && (
          <div className="p-3 bg-red-900/20 border border-red-700/50 rounded">
            <div className="text-sm font-medium text-red-400 mb-1">Validation Errors:</div>
            <ul className="space-y-1">
              {validation.errors.map((error, index) => (
                <li key={index} className="text-xs text-red-300">• {error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Validation Warnings */}
        {validation.warnings.length > 0 && (
          <div className="p-3 bg-yellow-900/20 border border-yellow-700/50 rounded">
            <div className="text-sm font-medium text-yellow-400 mb-1">Warnings:</div>
            <ul className="space-y-1">
              {validation.warnings.map((warning, index) => (
                <li key={index} className="text-xs text-yellow-300">• {warning}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Reroll Information */}
      {showRerollButtons && rules.characterCreation?.allowCharacteristicRerolls && (
        <div className="mt-4 p-3 bg-slate-800 rounded">
          <div className="text-xs text-slate-400 mb-2">
            Rerolls remaining: {rules.characterCreation.maxRerollsPerCharacteristic} per characteristic
          </div>
          <div className="text-xs text-slate-500">
            Click the dice icon next to any characteristic to reroll it
          </div>
        </div>
      )}
    </div>
  );
};

interface CharacteristicCardProps {
  characteristic: Characteristic;
  value: number;
  modifier?: string;
  onReroll?: () => void;
  rules: Rules;
}

const CharacteristicCard: React.FC<CharacteristicCardProps> = ({
  characteristic,
  value,
  modifier,
  onReroll,
  rules,
}) => {
  const minValue = rules.characterCreation?.minimumValue ?? 1;
  const maxValue = rules.characterCreation?.maximumValue ?? 15;
  
  const isLow = value <= minValue + 1;
  const isHigh = value >= maxValue - 1;
  const isOutOfRange = value < minValue || value > maxValue;

  const getValueColorClass = (): string => {
    if (isOutOfRange) return 'text-red-400';
    if (isLow) return 'text-yellow-400';
    if (isHigh) return 'text-green-400';
    return 'text-white';
  };

  return (
    <div className={`
      p-4 rounded border-2 transition-colors
      ${isOutOfRange 
        ? 'border-red-600 bg-red-900/10' 
        : 'border-slate-600 bg-slate-800/50'
      }
    `}>
      {/* Characteristic Name */}
      <div className="text-center mb-2">
        <div className="text-sm font-medium text-slate-300 uppercase tracking-wide">
          {characteristic}
        </div>
      </div>

      {/* Value and Modifier */}
      <div className="text-center mb-3">
        <div className={`text-2xl font-mono font-bold ${getValueColorClass()}`}>
          {value}
        </div>
        {modifier && (
          <div className="text-sm text-slate-400 mt-1">
            DM: {modifier}
        </div>
        )}
      </div>

      {/* Reroll Button */}
      {onReroll && (
        <div className="text-center">
          <button
            onClick={onReroll}
            className="btn-secondary text-xs px-2 py-1"
            title={`Reroll ${characteristic}`}
          >
            🎲 Reroll
          </button>
        </div>
      )}

      {/* Range Indicator */}
      <div className="mt-2">
        <div className="w-full bg-slate-700 rounded-full h-1">
          <div 
            className={`h-1 rounded-full transition-all ${
              isOutOfRange ? 'bg-red-500' : 'bg-blue-500'
            }`}
            style={{ 
              width: `${Math.min(100, Math.max(0, ((value - minValue) / (maxValue - minValue)) * 100))}%` 
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>{minValue}</span>
          <span>{maxValue}</span>
        </div>
      </div>
    </div>
  );
};
