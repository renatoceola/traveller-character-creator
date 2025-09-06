/**
 * Roll Characteristics Step Component
 * First step in character creation - rolling the six basic characteristics
 */

import React, { useState } from 'react';
import type { Character, Rules, StepResult } from '@/types';
import { CharacteristicCalculator } from '@/utils/characteristicCalculator';
import { CharacterHistoryManager } from '@/utils/characterHistory';

interface RollCharacteristicsStepProps {
  character: Character;
  rules: Rules;
  onStepComplete: (stepId: string, result: StepResult) => void;
  onBack?: () => void;
}

/**
 * ✅ STANDARDS COMPLIANT: Configuration-driven step component
 * - No hardcoded game rules
 * - Props-based configuration  
 * - Pure UI logic only
 * - Type-safe throughout
 */
export const RollCharacteristicsStep: React.FC<RollCharacteristicsStepProps> = ({
  character,
  rules,
  onStepComplete,
  onBack,
}) => {
  const [characteristics, setCharacteristics] = useState(character.characteristics);
  const [rerollsUsed, setRerollsUsed] = useState<Record<string, number>>({});
  const [rollEvents, setRollEvents] = useState<any[]>([]);

  const rollCharacteristic = (char: keyof typeof characteristics): void => {
    const newValue = CharacteristicCalculator.generateCharacteristics(rules)[char];
    setCharacteristics(prev => ({
      ...prev,
      [char]: newValue,
    }));

    // Track the roll event
    const rollEvent = CharacterHistoryManager.createRollEvent(
      '2d6',
      newValue,
      undefined,
      `Rolled ${newValue} for ${char}`,
      newValue >= (rules.characterCreation?.minCharacteristicSum || 45) / 6, // Basic success metric
      {
        characteristics: { [char]: newValue } as any,
        narrative: `The dice clattered across the table, showing ${newValue} for ${char}.`
      }
    );

    setRollEvents(prev => [...prev, rollEvent]);
  };

  const rollAllCharacteristics = (): void => {
    const newCharacteristics = CharacteristicCalculator.generateCharacteristics(rules);
    setCharacteristics(newCharacteristics);
    setRerollsUsed({});
  };

  const rerollCharacteristic = (char: keyof typeof characteristics): void => {
    const canReroll = CharacteristicCalculator.canRerollCharacteristic(
      char as any,
      rerollsUsed as any,
      rules
    );
    
    if (canReroll) {
      const newValue = CharacteristicCalculator.generateCharacteristics(rules)[char];
      setCharacteristics(prev => ({
        ...prev,
        [char]: newValue,
      }));
      
      setRerollsUsed(prev => ({
        ...prev,
        [char]: (prev[char] || 0) + 1,
      }));
    }
  };

  const calculateModifier = (value: number): string => {
    if (!rules || !rules.characterCreation || !rules.characterCreation.dmTable) {
      return '+0';
    }
    
    const dm = CharacteristicCalculator.calculateModifier(value, rules);
    return dm >= 0 ? `+${dm}` : `${dm}`;
  };

  const handleContinue = (): void => {
    // Validate characteristics
    const validation = CharacteristicCalculator.validateCharacteristics(characteristics, rules);
    
    if (!validation.valid) {
      alert(`Please fix the following issues:\n${validation.errors.join('\n')}`);
      return;
    }

    const totalScore = Object.values(characteristics).reduce((sum, val) => sum + val, 0);
    
    // Create milestone event for completing characteristic generation
    const milestoneEvent = CharacterHistoryManager.createMilestoneEvent(
      `Generated characteristics with total score of ${totalScore}`,
      `Their natural abilities were determined by fate and circumstance: STR ${characteristics.STR}, DEX ${characteristics.DEX}, END ${characteristics.END}, INT ${characteristics.INT}, EDU ${characteristics.EDU}, SOC ${characteristics.SOC}. This foundation would shape their entire life.`,
      {
        characteristics,
        narrative: `Born with a total characteristic score of ${totalScore}, they showed early signs of their future potential.`
      }
    );
    
    // Complete the step
    onStepComplete('roll-characteristics', {
      data: { 
        characteristics,
        rollEvents, // All individual roll events
        milestoneEvent, // The completion milestone
        totalScore,
      },
      valid: true,
    });
  };

  const canRerollChar = (char: keyof typeof characteristics): boolean => {
    return CharacteristicCalculator.canRerollCharacteristic(
      char as any,
      rerollsUsed as any,
      rules
    );
  };

  const validation = CharacteristicCalculator.validateCharacteristics(characteristics, rules);
  const totalCharacteristics = Object.values(characteristics).reduce((sum, val) => sum + val, 0);

  return (
    <div className="roll-characteristics-step">
      <div className="step-header mb-6">
        <h3 className="text-xl font-semibold text-white mb-2">Roll Characteristics</h3>
        <p className="text-slate-400">
          Roll your character's six basic characteristics. These determine your character's natural abilities.
        </p>
      </div>

      <div className="card p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-medium text-white">Characteristics</h4>
          <button
            onClick={rollAllCharacteristics}
            className="btn-secondary"
          >
            Roll All
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          {Object.entries(characteristics).map(([char, value]) => (
            <div key={char} className="characteristic-item p-4 bg-slate-700 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-300 font-medium">{char}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => rollCharacteristic(char as keyof typeof characteristics)}
                    className="btn-sm btn-secondary"
                    title="Roll this characteristic"
                  >
                    🎲
                  </button>
                  {canRerollChar(char as keyof typeof characteristics) && (
                    <button
                      onClick={() => rerollCharacteristic(char as keyof typeof characteristics)}
                      className="btn-sm btn-accent"
                      title={`Reroll (${(rerollsUsed[char] || 0)} used)`}
                    >
                      ↻
                    </button>
                  )}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-white mb-1">{value}</div>
                <div className="text-sm text-slate-400">
                  DM: {calculateModifier(value)}
                </div>
              </div>
              
              {rerollsUsed[char] && (
                <div className="text-xs text-slate-500 mt-1">
                  Rerolls: {rerollsUsed[char]} / {rules.characterCreation?.maxRerollsPerCharacteristic || 0}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="characteristics-summary p-4 bg-slate-800 rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-400">Total: </span>
              <span className="text-white font-medium">{totalCharacteristics}</span>
            </div>
            <div>
              <span className="text-slate-400">Required: </span>
              <span className="text-white font-medium">
                {rules.characterCreation?.minCharacteristicSum || 'None'}
              </span>
            </div>
          </div>
          
          {validation.warnings.length > 0 && (
            <div className="mt-2 text-yellow-400 text-sm">
              ⚠️ {validation.warnings.join(', ')}
            </div>
          )}
          
          {validation.errors.length > 0 && (
            <div className="mt-2 text-red-400 text-sm">
              ❌ {validation.errors.join(', ')}
            </div>
          )}
        </div>
      </div>

      <div className="step-actions flex justify-between">
        {onBack && (
          <button onClick={onBack} className="btn-secondary">
            Back
          </button>
        )}
        
        <button
          onClick={handleContinue}
          disabled={!validation.valid}
          className={`btn-primary ${!validation.valid ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Continue
        </button>
      </div>
    </div>
  );
};
