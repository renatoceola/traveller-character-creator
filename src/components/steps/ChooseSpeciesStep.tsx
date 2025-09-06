/**
 * Choose Species Step Component
 * Second step in character creation - selecting character species
 */

import React, { useState } from 'react';
import type { Character, Rules, Species, StepResult } from '@/types';
import { CharacteristicCalculator } from '@/utils/characteristicCalculator';
import { CharacterHistoryManager } from '@/utils/characterHistory';

interface ChooseSpeciesStepProps {
  character: Character;
  rules: Rules;
  species: Species[];
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
export const ChooseSpeciesStep: React.FC<ChooseSpeciesStepProps> = ({
  character,
  rules,
  species,
  onStepComplete,
  onBack,
}) => {
  const [selectedSpecies, setSelectedSpecies] = useState<Species | null>(
    species.find(s => s.name === character.species) || null
  );

  const calculateModifiedCharacteristics = (spec: Species) => {
    return CharacteristicCalculator.applySpeciesModifiers(
      character.characteristics,
      spec,
      rules
    );
  };

  const calculateModifier = (value: number): string => {
    if (!rules || !rules.characterCreation || !rules.characterCreation.dmTable) {
      return '+0';
    }
    
    const dm = CharacteristicCalculator.calculateModifier(value, rules);
    return dm >= 0 ? `+${dm}` : `${dm}`;
  };

  const handleSpeciesSelect = (spec: Species): void => {
    setSelectedSpecies(spec);
  };

  const handleContinue = (): void => {
    if (!selectedSpecies) {
      alert('Please select a species before continuing.');
      return;
    }

    const modifiedCharacteristics = calculateModifiedCharacteristics(selectedSpecies);
    const allSpeciesNames = species.map(s => s.name);
    
    // Create choice event for species selection with enhanced context
    const choiceEvent = CharacterHistoryManager.createChoiceEvent(
      selectedSpecies.name,
      allSpeciesNames.filter(name => name !== selectedSpecies.name),
      `Chose to be a member of the ${selectedSpecies.name} species`,
      {
        characteristics: modifiedCharacteristics,
        narrative: `Their ${selectedSpecies.name} heritage granted them unique traits and abilities that would influence their entire life path.`
      },
      {
        reasoning: `Selected for their ${selectedSpecies.modifiers.length > 0 ? 'unique characteristics and abilities' : 'balanced nature and adaptability'}`,
        consequences: `This choice would influence their physical capabilities, cultural background, and opportunities throughout life`,
        worldBuilding: selectedSpecies.description || `The ${selectedSpecies.name} are known for their distinctive traits and place in the galaxy`,
        emotionalTone: 'positive' as const
      }
    );

    // Create gain events for characteristic modifiers with enhanced context
    const modifierEvents = selectedSpecies.modifiers.map(mod => 
      CharacterHistoryManager.createGainEvent(
        'characteristic',
        `${mod.characteristic} ${mod.modifier >= 0 ? '+' : ''}${mod.modifier}`,
        mod.modifier,
        `Gained ${mod.modifier >= 0 ? '+' : ''}${mod.modifier} to ${mod.characteristic} from ${selectedSpecies.name} heritage`,
        {
          characteristics: { [mod.characteristic]: mod.modifier } as any
        },
        {
          source: `${selectedSpecies.name} heritage`,
          method: 'natural_talent' as const,
          significance: Math.abs(mod.modifier) >= 2 ? 'life_changing' as const : 'moderate' as const,
          flavorText: `Their ${selectedSpecies.name} physiology ${mod.modifier > 0 ? 'enhanced' : 'limited'} their natural ${mod.characteristic.toLowerCase()}.`
        }
      )
    );
    
    onStepComplete('choose-species', {
      data: { 
        species: selectedSpecies.name,
        modifiedCharacteristics,
        specialRules: selectedSpecies.specialRules || [],
        choiceEvent,
        modifierEvents,
      },
      valid: true,
    });
  };

  return (
    <div className="choose-species-step">
      <div className="step-header mb-6">
        <h3 className="text-xl font-semibold text-white mb-2">Choose Species</h3>
        <p className="text-slate-400">
          Select your character's species. Each species has unique traits and characteristic modifiers.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Species Selection */}
        <div className="card p-6">
          <h4 className="text-lg font-medium text-white mb-4">Available Species</h4>
          
          <div className="space-y-3">
            {species.map((spec) => (
              <div
                key={spec.name}
                onClick={() => handleSpeciesSelect(spec)}
                className={`species-option p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  selectedSpecies?.name === spec.name
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-slate-600 bg-slate-700 hover:border-slate-500'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h5 className="text-white font-semibold">{spec.name}</h5>
                  {selectedSpecies?.name === spec.name && (
                    <span className="text-blue-400 text-sm">✓ Selected</span>
                  )}
                </div>
                
                <p className="text-slate-400 text-sm mb-3">{spec.description}</p>
                
                {/* Characteristic Modifiers */}
                {spec.modifiers.length > 0 && (
                  <div className="mb-3">
                    <span className="text-xs text-slate-500 uppercase tracking-wide">Modifiers:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {spec.modifiers.map((mod, index) => (
                        <span
                          key={index}
                          className={`text-xs px-2 py-1 rounded ${
                            mod.modifier >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {mod.characteristic} {mod.modifier >= 0 ? '+' : ''}{mod.modifier}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Special Rules */}
                {spec.specialRules && spec.specialRules.length > 0 && (
                  <div>
                    <span className="text-xs text-slate-500 uppercase tracking-wide">Special Rules:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {spec.specialRules.map((rule: string, index: number) => (
                        <span
                          key={index}
                          className="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded"
                        >
                          {rule}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Preview Modified Characteristics */}
        <div className="card p-6">
          <h4 className="text-lg font-medium text-white mb-4">Character Preview</h4>
          
          {selectedSpecies ? (
            <div>
              <div className="mb-4">
                <h5 className="text-white font-medium mb-2">{selectedSpecies.name} Characteristics</h5>
                <p className="text-slate-400 text-sm">After applying species modifiers:</p>
              </div>
              
              <div className="space-y-3">
                {Object.entries(calculateModifiedCharacteristics(selectedSpecies)).map(([char, value]) => {
                  const originalValue = character.characteristics[char as keyof typeof character.characteristics];
                  const modifier = value - originalValue;
                  
                  return (
                    <div key={char} className="flex items-center justify-between p-3 bg-slate-700 rounded">
                      <span className="text-slate-300 font-medium">{char}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-400 text-sm">{originalValue}</span>
                        {modifier !== 0 && (
                          <span className={`text-sm ${modifier > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {modifier > 0 ? '+' : ''}{modifier}
                          </span>
                        )}
                        <span className="text-white font-mono text-lg font-bold">{value}</span>
                        <span className="text-slate-400 text-sm">
                          ({calculateModifier(value)})
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Species Special Rules Details */}
              {selectedSpecies.specialRules && selectedSpecies.specialRules.length > 0 && (
                <div className="mt-6 p-4 bg-slate-800 rounded-lg">
                  <h6 className="text-white font-medium mb-2">Special Rules</h6>
                  <div className="space-y-2">
                    {selectedSpecies.specialRules.map((rule: string, index: number) => (
                      <div key={index} className="text-sm text-slate-300">
                        <span className="font-medium text-purple-400">{rule}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🤔</div>
              <p className="text-slate-400">Select a species to see the preview</p>
            </div>
          )}
        </div>
      </div>

      <div className="step-actions flex justify-between mt-6">
        {onBack && (
          <button onClick={onBack} className="btn-secondary">
            Back
          </button>
        )}
        
        <button
          onClick={handleContinue}
          disabled={!selectedSpecies}
          className={`btn-primary ${!selectedSpecies ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Continue
        </button>
      </div>
    </div>
  );
};
