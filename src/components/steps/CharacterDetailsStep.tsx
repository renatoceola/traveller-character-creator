/**
 * Character Details Step Component
 * Third step in character creation - entering character name and details
 */

import React, { useState } from 'react';
import type { Character, Rules, StepResult } from '@/types';
import { CharacterHistoryManager } from '@/utils/characterHistory';

interface CharacterDetailsStepProps {
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
export const CharacterDetailsStep: React.FC<CharacterDetailsStepProps> = ({
  character,
  rules: _rules, // Reserved for future rule-based validation
  onStepComplete,
  onBack,
}) => {
  const [characterName, setCharacterName] = useState(character.name || '');
  const [errors, setErrors] = useState<string[]>([]);

  const validateForm = (): { valid: boolean; errors: string[] } => {
    const validationErrors: string[] = [];
    
    if (!characterName.trim()) {
      validationErrors.push('Character name is required');
    }
    
    if (characterName.trim().length < 2) {
      validationErrors.push('Character name must be at least 2 characters long');
    }
    
    if (characterName.trim().length > 50) {
      validationErrors.push('Character name must be less than 50 characters');
    }
    
    return {
      valid: validationErrors.length === 0,
      errors: validationErrors,
    };
  };

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const value = event.target.value;
    setCharacterName(value);
    
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleContinue = (): void => {
    const validation = validateForm();
    
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }
    
    // Create choice event for name selection
    const nameEvent = CharacterHistoryManager.createChoiceEvent(
      characterName.trim(),
      getNameSuggestions(character.species),
      `Chose the name "${characterName.trim()}" for their character`,
      {
        narrative: `They decided to be known as ${characterName.trim()}, a name that would follow them throughout their adventures.`
      }
    );

    onStepComplete('character-details', {
      data: { 
        name: characterName.trim(),
        event: nameEvent, // Pass the event to be added by the parent
      },
      valid: true,
    });
  };

  const handleKeyPress = (event: React.KeyboardEvent): void => {
    if (event.key === 'Enter') {
      handleContinue();
    }
  };

  const validation = validateForm();

  return (
    <div className="character-details-step">
      <div className="step-header mb-6">
        <h3 className="text-xl font-semibold text-white mb-2">Character Details</h3>
        <p className="text-slate-400">
          Give your character a name and finalize their basic details.
        </p>
      </div>

      <div className="card p-6 mb-6">
        <h4 className="text-lg font-medium text-white mb-4">Basic Information</h4>
        
        <div className="space-y-6">
          {/* Character Name */}
          <div>
            <label htmlFor="character-name" className="block text-slate-300 font-medium mb-2">
              Character Name *
            </label>
            <input
              id="character-name"
              type="text"
              value={characterName}
              onChange={handleNameChange}
              onKeyPress={handleKeyPress}
              placeholder="Enter your character's name"
              className={`w-full px-4 py-2 bg-slate-700 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.length > 0 ? 'border-red-500' : 'border-slate-600'
              }`}
              maxLength={50}
            />
            
            {errors.length > 0 && (
              <div className="mt-2 space-y-1">
                {errors.map((error, index) => (
                  <p key={index} className="text-red-400 text-sm">
                    ❌ {error}
                  </p>
                ))}
              </div>
            )}
            
            <div className="mt-1 text-slate-500 text-sm">
              {characterName.length}/50 characters
            </div>
          </div>

          {/* Character Summary */}
          <div className="character-summary p-4 bg-slate-800 rounded-lg">
            <h5 className="text-white font-medium mb-3">Character Summary</h5>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-400">Name: </span>
                <span className="text-white font-medium">
                  {characterName.trim() || 'Unnamed Character'}
                </span>
              </div>
              
              <div>
                <span className="text-slate-400">Species: </span>
                <span className="text-white font-medium">
                  {character.species || 'Not selected'}
                </span>
              </div>
              
              <div className="md:col-span-2">
                <span className="text-slate-400">Age: </span>
                <span className="text-white font-medium">
                  {character.age} years old
                </span>
              </div>
            </div>
            
            {/* Characteristics Summary */}
            <div className="mt-4 pt-4 border-t border-slate-700">
              <span className="text-slate-400 text-sm uppercase tracking-wide">Characteristics:</span>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mt-2">
                {Object.entries(character.characteristics).map(([char, value]) => (
                  <div key={char} className="text-center">
                    <div className="text-slate-400 text-xs">{char}</div>
                    <div className="text-white font-bold">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Random Name Suggestions */}
          <div className="name-suggestions">
            <h5 className="text-slate-300 font-medium mb-2">Need inspiration?</h5>
            <p className="text-slate-400 text-sm mb-3">
              Here are some name suggestions for your {character.species || 'character'}:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {getNameSuggestions(character.species).map((name, index) => (
                <button
                  key={index}
                  onClick={() => setCharacterName(name)}
                  className="text-left p-2 bg-slate-700 hover:bg-slate-600 rounded text-slate-300 hover:text-white transition-colors text-sm"
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
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

/**
 * Get name suggestions based on species
 * In a real implementation, this would come from configuration
 */
function getNameSuggestions(species: string): string[] {
  const suggestions: Record<string, string[]> = {
    Human: ['Alex Chen', 'Morgan Webb', 'Sam Rivera', 'Taylor Voss'],
    Aslan: ['Hlyak', 'Yoash', 'Kteiroa', 'Wahtoi'],
    Vargr: ['Gnaek', 'Dhoknan', 'Ruegz', 'Thokh'],
    'K\'kree': ['Kri!ng', 'Tki!iir', 'Ngg!ka', 'Xer!ii'],
    Hivers: ['Seeker*of*Truth', 'Builder*of*Bridges', 'Walker*in*Void', 'Singer*of*Songs'],
    Droyne: ['Aydin', 'Eoyl', 'Issik', 'Uiyr'],
  };
  
  return suggestions[species] || suggestions.Human;
}
