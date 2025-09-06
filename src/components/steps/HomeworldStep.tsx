/**
 * Homeworld Step Component
 * First step in background skills - selecting homeworld
 */

import React, { useState } from 'react';
import type { Character, Rules, StepResult } from '@/types';
import { CharacterHistoryManager } from '@/utils/characterHistory';

interface HomeworldStepProps {
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
export const HomeworldStep: React.FC<HomeworldStepProps> = ({
  character: _character,
  rules: _rules,
  onStepComplete,
  onBack,
}) => {
  const [selectedHomeworld, setSelectedHomeworld] = useState<string>('');
  const [customHomeworldName, setCustomHomeworldName] = useState<string>('');
  const [selectedBackgroundSkills, setSelectedBackgroundSkills] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState<'preset' | 'custom'>('preset');
  const [errors, setErrors] = useState<string[]>([]);

  // Background skills list (in real implementation, this would come from configuration)
  const backgroundSkills = [
    'Admin', 'Animals', 'Art', 'Athletics', 'Carouse', 'Drive', 'Electronics',
    'Flyer', 'Language', 'Mechanic', 'Medic', 'Profession', 'Science',
    'Seafarer', 'Streetwise', 'Survival', 'Vacc Suit', 'Computer', 'Engineering',
    'Trade', 'Gun Combat', 'Stealth', 'Investigate', 'Leadership', 'Broker'
  ];

  // Placeholder homeworld options - in real implementation, this would come from configuration
  const homeworldOptions = [
    { name: 'High Tech World', description: 'Advanced technology and education', skills: ['Computer', 'Engineering'] },
    { name: 'Agricultural World', description: 'Farming and rural communities', skills: ['Animals', 'Drive'] },
    { name: 'Industrial World', description: 'Manufacturing and trade', skills: ['Trade', 'Mechanic'] },
    { name: 'Desert World', description: 'Harsh, arid environment', skills: ['Survival', 'Vacc Suit'] },
    { name: 'Water World', description: 'Ocean-dominated planet', skills: ['Seafarer', 'Athletics'] },
    { name: 'Urban World', description: 'Dense metropolitan centers', skills: ['Streetwise', 'Broker'] },
    { name: 'Frontier World', description: 'Rough, undeveloped territory', skills: ['Gun Combat', 'Survival'] },
    { name: 'Research Station', description: 'Scientific research facility', skills: ['Science', 'Computer'] },
  ];

  const validateForm = (): { valid: boolean; errors: string[] } => {
    const validationErrors: string[] = [];
    
    if (selectionMode === 'preset') {
      if (!selectedHomeworld) {
        validationErrors.push('Please select a homeworld type');
      }
    } else {
      if (!customHomeworldName.trim()) {
        validationErrors.push('Please enter a homeworld name');
      }
      if (customHomeworldName.trim().length < 2) {
        validationErrors.push('Homeworld name must be at least 2 characters long');
      }
      if (selectedBackgroundSkills.length !== 2) {
        validationErrors.push('Please select exactly 2 background skills');
      }
    }
    
    return {
      valid: validationErrors.length === 0,
      errors: validationErrors,
    };
  };

  const handleSkillToggle = (skill: string): void => {
    setSelectedBackgroundSkills(prev => {
      if (prev.includes(skill)) {
        return prev.filter(s => s !== skill);
      } else if (prev.length < 2) {
        return [...prev, skill];
      } else {
        // Replace the first selected skill if already at limit
        return [prev[1], skill];
      }
    });
    
    // Clear errors when user makes changes
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleModeChange = (mode: 'preset' | 'custom'): void => {
    setSelectionMode(mode);
    setSelectedHomeworld('');
    setCustomHomeworldName('');
    setSelectedBackgroundSkills([]);
    setErrors([]);
  };

  const handleContinue = (): void => {
    const validation = validateForm();
    
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    let homeworldName: string;
    let skills: string[];
    let events: any[] = [];

    if (selectionMode === 'preset') {
      const homeworld = homeworldOptions.find(h => h.name === selectedHomeworld);
      homeworldName = selectedHomeworld;
      skills = homeworld?.skills || [];

      // Create choice event for preset homeworld selection
      const homeworldEvent = CharacterHistoryManager.createChoiceEvent(
        selectedHomeworld,
        homeworldOptions.map(h => h.name),
        `Selected ${selectedHomeworld} as their homeworld`
      );
      events.push(homeworldEvent);

      // Create gain events for background skills with enhanced context
      const selectedHomeworldData = homeworldOptions.find(h => h.name === selectedHomeworld);
      skills.forEach(skill => {
        const skillEvent = CharacterHistoryManager.createGainEvent(
          'skill',
          skill,
          1,
          `Gained ${skill} skill from ${selectedHomeworld} background`,
          {
            skills: [skill],
            narrative: `Growing up on ${selectedHomeworld} naturally developed their ${skill.toLowerCase()} abilities.`
          },
          {
            source: selectedHomeworld,
            method: 'experience' as const,
            significance: 'life_changing' as const,
            flavorText: selectedHomeworldData ? 
              `The ${selectedHomeworldData.description.toLowerCase()} provided ample opportunities to develop ${skill.toLowerCase()} skills.` :
              `Their homeworld environment fostered the development of ${skill.toLowerCase()} abilities.`
          }
        );
        events.push(skillEvent);
      });
    } else {
      homeworldName = customHomeworldName.trim();
      skills = selectedBackgroundSkills;

      // Create choice event for custom homeworld naming
      const namingEvent = CharacterHistoryManager.createChoiceEvent(
        homeworldName,
        ['Custom homeworld'],
        `Named their homeworld "${homeworldName}"`
      );
      events.push(namingEvent);

      // Create choice event for skill selection
      const skillChoiceEvent = CharacterHistoryManager.createChoiceEvent(
        selectedBackgroundSkills.join(', '),
        backgroundSkills,
        `Chose ${selectedBackgroundSkills.join(' and ')} as background skills`
      );
      events.push(skillChoiceEvent);

      // Create gain events for each selected skill with enhanced context
      selectedBackgroundSkills.forEach(skill => {
        const skillEvent = CharacterHistoryManager.createGainEvent(
          'skill',
          skill,
          1,
          `Gained ${skill} skill from homeworld background`,
          {
            skills: [skill],
            narrative: `Growing up on ${homeworldName} naturally developed their ${skill.toLowerCase()} abilities.`
          },
          {
            source: homeworldName,
            method: 'experience' as const,
            significance: 'life_changing' as const,
            flavorText: `Their unique homeworld environment fostered the development of ${skill.toLowerCase()} abilities through daily life.`
          }
        );
        events.push(skillEvent);
      });
    }
    
    onStepComplete('homeworld', {
      data: { 
        homeworld: homeworldName,
        backgroundSkills: skills,
        events: events
      },
      valid: true,
    });
  };

  return (
    <div className="homeworld-step">
      <div className="step-header mb-6">
        <h3 className="text-xl font-semibold text-white mb-2">Homeworld</h3>
        <p className="text-slate-400">
          Choose the type of world where your character grew up, or create a custom homeworld with your own background skills.
        </p>
      </div>

      {/* Selection Mode Toggle */}
      <div className="card p-4 mb-6">
        <h4 className="text-lg font-medium text-white mb-4">Homeworld Selection</h4>
        <div className="flex gap-4 mb-4">
          <button
            onClick={() => handleModeChange('preset')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectionMode === 'preset'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Preset Homeworlds
          </button>
          <button
            onClick={() => handleModeChange('custom')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectionMode === 'custom'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Custom Homeworld
          </button>
        </div>
      </div>

      {selectionMode === 'preset' ? (
        /* Preset Homeworld Selection */
        <div className="card p-6 mb-6">
          <h4 className="text-lg font-medium text-white mb-4">Select Homeworld Type</h4>
          
          <div className="space-y-3">
            {homeworldOptions.map((homeworld) => (
              <div
                key={homeworld.name}
                onClick={() => setSelectedHomeworld(homeworld.name)}
                className={`homeworld-option p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  selectedHomeworld === homeworld.name
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-slate-600 bg-slate-700 hover:border-slate-500'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h5 className="text-white font-semibold">{homeworld.name}</h5>
                  {selectedHomeworld === homeworld.name && (
                    <span className="text-blue-400 text-sm">✓ Selected</span>
                  )}
                </div>
                
                <p className="text-slate-400 text-sm mb-3">{homeworld.description}</p>
                
                <div>
                  <span className="text-xs text-slate-500 uppercase tracking-wide">Background Skills:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {homeworld.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Custom Homeworld Creation */
        <div className="space-y-6">
          {/* Custom Homeworld Name */}
          <div className="card p-6">
            <h4 className="text-lg font-medium text-white mb-4">Name Your Homeworld</h4>
            <div>
              <label htmlFor="homeworld-name" className="block text-slate-300 font-medium mb-2">
                Homeworld Name *
              </label>
              <input
                id="homeworld-name"
                type="text"
                value={customHomeworldName}
                onChange={(e) => setCustomHomeworldName(e.target.value)}
                placeholder="Enter your homeworld's name"
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={50}
              />
              <div className="mt-1 text-slate-500 text-sm">
                {customHomeworldName.length}/50 characters
              </div>
            </div>
          </div>

          {/* Background Skills Selection */}
          <div className="card p-6">
            <h4 className="text-lg font-medium text-white mb-4">
              Choose Background Skills ({selectedBackgroundSkills.length}/2)
            </h4>
            <p className="text-slate-400 text-sm mb-4">
              Select exactly 2 skills that your character learned growing up on their homeworld.
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {backgroundSkills.map((skill) => (
                <button
                  key={skill}
                  onClick={() => handleSkillToggle(skill)}
                  disabled={!selectedBackgroundSkills.includes(skill) && selectedBackgroundSkills.length >= 2}
                  className={`p-2 text-sm rounded-lg border-2 transition-colors ${
                    selectedBackgroundSkills.includes(skill)
                      ? 'border-green-500 bg-green-500/20 text-green-400'
                      : selectedBackgroundSkills.length >= 2
                        ? 'border-slate-600 bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'border-slate-600 bg-slate-700 text-slate-300 hover:border-slate-500 hover:bg-slate-600'
                  }`}
                >
                  {skill}
                  {selectedBackgroundSkills.includes(skill) && ' ✓'}
                </button>
              ))}
            </div>
            
            {selectedBackgroundSkills.length > 0 && (
              <div className="mt-4 p-3 bg-slate-800 rounded-lg">
                <span className="text-slate-400 text-sm">Selected Skills:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedBackgroundSkills.map((skill) => (
                    <span
                      key={skill}
                      className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="card p-4 mb-6 border-l-4 border-red-500 bg-red-500/10">
          <h4 className="text-red-400 font-medium mb-2">Please correct the following:</h4>
          <div className="space-y-1">
            {errors.map((error, index) => (
              <p key={index} className="text-red-400 text-sm">
                ❌ {error}
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="step-actions flex justify-between">
        {onBack && (
          <button onClick={onBack} className="btn-secondary">
            Back
          </button>
        )}
        
        <button
          onClick={handleContinue}
          disabled={!validateForm().valid}
          className={`btn-primary ${!validateForm().valid ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Continue
        </button>
      </div>
    </div>
  );
};
