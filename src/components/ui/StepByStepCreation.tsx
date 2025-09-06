/**
 * Step-by-Step Character Creation Demo
 * Demonstrates the new individual step components working together
 */

import React, { useState, useEffect } from 'react';
import type { Species, Rules, Character, StepResult, Skill } from '@/types';
import { StepManager } from '@/components/ui/StepManager';
import { CharacterHistoryDisplay } from '@/components/ui/CharacterHistoryDisplay';
import { CharacterHistoryManager } from '@/utils/characterHistory';

interface StepByStepCreationProps {
  species: Species[];
  rules: Rules;
  character: Character;
  onCharacterUpdate: (character: Character) => void;
  onComplete: () => void;
}

/**
 * Helper function to group skills by their source
 */
function getSkillsBySource(skills: Skill[]): Array<{ source: string; skills: Skill[] }> {
  const grouped = skills.reduce((acc, skill) => {
    const source = skill.source || 'unknown';
    if (!acc[source]) {
      acc[source] = [];
    }
    acc[source].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>);

  return Object.entries(grouped).map(([source, skills]) => ({ source, skills }));
}

/**
 * Create a fresh character with default values
 */
function createFreshCharacter(): Character {
  return {
    id: crypto.randomUUID(),
    name: '',
    species: '',
    characteristics: {
      STR: 0,
      DEX: 0,
      END: 0,
      INT: 0,
      EDU: 0,
      SOC: 0,
    },
    skills: [],
    age: 18,
    terms: 0,
    credits: 0,
    equipment: [],
    benefits: [],
    currentPhase: 'character-creation',
    phaseData: {},
    history: [],
  };
}

/**
 * Determine if back navigation should be blocked based on current step
 */
function shouldBlockBack(currentStepId: string, character: Character): boolean {
  // Block back navigation after certain milestones to prevent rollback issues
  const milestoneSteps = ['roll-characteristics', 'choose-species', 'homeworld', 'education'];
  
  // If we're past a milestone step and character data has been modified, block back
  const characterCreationSteps = [
    'roll-characteristics',
    'choose-species', 
    'character-details',
    'homeworld',
    'education'
  ];
  
  const currentIndex = characterCreationSteps.indexOf(currentStepId);
  
  for (let i = 0; i < currentIndex; i++) {
    const stepId = characterCreationSteps[i];
    if (milestoneSteps.includes(stepId)) {
      // Check if character has data from this milestone step
      switch (stepId) {
        case 'roll-characteristics':
          // Block back after characteristics are confirmed (any characteristic > 0)
          if (Object.values(character.characteristics).some(value => value > 0)) return true;
          break;
        case 'choose-species':
          if (character.species) return true;
          break;
        case 'homeworld':
          if (character.skills.some(skill => skill.source === 'homeworld')) return true;
          break;
        case 'education':
          if (character.skills.some(skill => skill.source === 'education')) return true;
          break;
      }
    }
  }
  
  return false;
}

interface StepByStepCreationProps {
  species: Species[];
  rules: Rules;
  character: Character;
  onCharacterUpdate: (character: Character) => void;
  onComplete: () => void;
}

/**
 * ✅ STANDARDS COMPLIANT: Step-by-step workflow demonstration
 * - Individual step component integration
 * - Proper state management
 * - Configuration-driven progression
 * - Type-safe throughout
 */
export const StepByStepCreation: React.FC<StepByStepCreationProps> = ({
  species,
  rules,
  character,
  onCharacterUpdate,
  onComplete,
}) => {
  // Define the character creation steps sequence
  const characterCreationSteps = [
    {
      id: 'roll-characteristics',
      title: 'Roll Characteristics',
      description: 'Roll or assign your character\'s six basic characteristics',
      component: 'RollCharacteristicsStep',
    },
    {
      id: 'choose-species',
      title: 'Choose Species',
      description: 'Select your character\'s species and apply modifiers',
      component: 'ChooseSpeciesStep',
    },
    {
      id: 'character-details',
      title: 'Character Details',
      description: 'Enter your character\'s name and background details',
      component: 'CharacterDetailsStep',
    },
    {
      id: 'homeworld',
      title: 'Homeworld',
      description: 'Choose your character\'s homeworld and gain associated skills',
      component: 'HomeworldStep',
    },
    {
      id: 'education',
      title: 'Education',
      description: 'Determine your character\'s educational background',
      component: 'EducationStep',
    },
    {
      id: 'choose-career',
      title: 'Choose Career',
      description: 'Select your character\'s initial career path',
      component: 'ChooseCareerStep',
    },
    {
      id: 'career-terms',
      title: 'Career Terms',
      description: 'Serve terms in your chosen career, gaining skills and benefits',
      component: 'CareerTermsStep',
    },
  ];

  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const currentStep = characterCreationSteps[currentStepIndex];
  const isLastStep = currentStepIndex === characterCreationSteps.length - 1;

  // Create new character handler
  const handleNewCharacter = (): void => {
    const confirmReset = window.confirm(
      'Are you sure you want to start a new character? This will reset all current progress.'
    );
    
    if (confirmReset) {
      const freshCharacter = createFreshCharacter();
      onCharacterUpdate(freshCharacter);
      setCurrentStepIndex(0);
    }
  };

  // Handle keyboard shortcuts (Ctrl+N for new character)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        handleNewCharacter();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleStepComplete = (stepId: string, result: StepResult): void => {
    // Update character based on step results
    let updatedCharacter = { ...character };

    // Add events to character history
    const stepName = characterCreationSteps.find(s => s.id === stepId)?.title || stepId;
    const phase = 'character-creation';

    switch (stepId) {
      case 'roll-characteristics':
        updatedCharacter.characteristics = result.data.characteristics as any;
        
        // Add all roll events
        if (result.data.rollEvents && Array.isArray(result.data.rollEvents)) {
          (result.data.rollEvents as any[]).forEach(event => {
            updatedCharacter = CharacterHistoryManager.addEvent(
              updatedCharacter, stepId, stepName, phase, event
            );
          });
        }
        
        // Add milestone event
        if (result.data.milestoneEvent) {
          updatedCharacter = CharacterHistoryManager.addEvent(
            updatedCharacter, stepId, stepName, phase, result.data.milestoneEvent as any
          );
        }
        break;
      
      case 'choose-species':
        updatedCharacter.species = result.data.species as string;
        updatedCharacter.characteristics = result.data.modifiedCharacteristics as any;
        
        // Add choice event
        if (result.data.choiceEvent) {
          updatedCharacter = CharacterHistoryManager.addEvent(
            updatedCharacter, stepId, stepName, phase, result.data.choiceEvent as any
          );
        }
        
        // Add modifier events
        if (result.data.modifierEvents && Array.isArray(result.data.modifierEvents)) {
          (result.data.modifierEvents as any[]).forEach(event => {
            updatedCharacter = CharacterHistoryManager.addEvent(
              updatedCharacter, stepId, stepName, phase, event
            );
          });
        }
        break;
      
      case 'character-details':
        updatedCharacter.name = result.data.name as string;
        
        // Add name choice event
        if (result.data.event) {
          updatedCharacter = CharacterHistoryManager.addEvent(
            updatedCharacter, stepId, stepName, phase, result.data.event as any
          );
        }
        break;
      
      case 'homeworld':
        // Add homeworld info to character
        if (result.data.homeworld) {
          updatedCharacter.phaseData = {
            ...updatedCharacter.phaseData,
            homeworld: result.data.homeworld,
          };
        }
        
        // Add homeworld skills to character
        if (result.data.backgroundSkills && Array.isArray(result.data.backgroundSkills)) {
          const newSkills = (result.data.backgroundSkills as string[]).map((skillName: string) => ({
            name: skillName,
            level: 0,
            source: 'homeworld',
          }));
          updatedCharacter.skills = [...updatedCharacter.skills, ...newSkills];
        }
        
        // Add events from HomeworldStep if they exist
        if (result.data.events && Array.isArray(result.data.events)) {
          (result.data.events as any[]).forEach(event => {
            updatedCharacter = CharacterHistoryManager.addEvent(
              updatedCharacter, stepId, stepName, phase, event
            );
          });
        } else {
          // Fallback: create basic gain events for background skills (in case events weren't passed)
          (result.data.backgroundSkills as string[])?.forEach(skill => {
            const skillEvent = CharacterHistoryManager.createGainEvent(
              'skill',
              skill,
              0,
              `Learned ${skill} from their homeworld background`,
              {
                skills: [skill],
                narrative: `Growing up on their homeworld, they naturally picked up knowledge of ${skill}.`
              }
            );
            
            updatedCharacter = CharacterHistoryManager.addEvent(
              updatedCharacter, stepId, stepName, phase, skillEvent
            );
          });
        }
        break;
      
      case 'education':
        // Update character with education results
        if (result.data.skills && Array.isArray(result.data.skills)) {
          updatedCharacter.skills = [...updatedCharacter.skills, ...(result.data.skills as any[])];
        }
        
        if (result.data.characteristics) {
          updatedCharacter.characteristics = result.data.characteristics as any;
        }
        
        // Add enrollment event
        if (result.data.enrollmentEvent) {
          updatedCharacter = CharacterHistoryManager.addEvent(
            updatedCharacter, stepId, stepName, phase, result.data.enrollmentEvent as any
          );
        }
        
        // Add graduation events
        if (result.data.graduationEvents && Array.isArray(result.data.graduationEvents)) {
          (result.data.graduationEvents as any[]).forEach(event => {
            updatedCharacter = CharacterHistoryManager.addEvent(
              updatedCharacter, stepId, stepName, phase, event
            );
          });
        }
        
        // Add pre-career events
        if (result.data.preCareerEvents && Array.isArray(result.data.preCareerEvents)) {
          (result.data.preCareerEvents as any[]).forEach(event => {
            updatedCharacter = CharacterHistoryManager.addEvent(
              updatedCharacter, stepId, stepName, phase, event
            );
          });
        }
        
        // Store education phase data
        if (result.data.phaseData && (result.data.phaseData as any).education) {
          updatedCharacter.phaseData = {
            ...updatedCharacter.phaseData,
            education: (result.data.phaseData as any).education,
          };
        }
        break;
      
      case 'choose-career':
        // Store career selection data
        if (result.data.career) {
          updatedCharacter.phaseData = {
            ...updatedCharacter.phaseData,
            career: result.data.career,
          };
        }
        
        // Add career choice event
        if (result.data.historyEvent) {
          updatedCharacter = CharacterHistoryManager.addEvent(
            updatedCharacter, stepId, stepName, phase, result.data.historyEvent as any
          );
        }
        break;
      
      case 'career-terms':
        // Update character with career progression results
        if (result.data.skills && Array.isArray(result.data.skills)) {
          updatedCharacter.skills = [...updatedCharacter.skills, ...(result.data.skills as any[])];
        }
        
        if (result.data.characteristics) {
          updatedCharacter.characteristics = result.data.characteristics as any;
        }
        
        if (result.data.age !== undefined) {
          updatedCharacter.age = result.data.age as number;
        }
        
        if (result.data.terms !== undefined) {
          updatedCharacter.terms = result.data.terms as number;
        }
        
        if (result.data.benefits && Array.isArray(result.data.benefits)) {
          updatedCharacter.benefits = [...updatedCharacter.benefits, ...(result.data.benefits as any[])];
        }
        
        if (result.data.equipment && Array.isArray(result.data.equipment)) {
          updatedCharacter.equipment = [...updatedCharacter.equipment, ...(result.data.equipment as any[])];
        }
        
        if (result.data.credits !== undefined) {
          updatedCharacter.credits = result.data.credits as number;
        }
        
        // Add career history events
        if (result.data.careerEvents && Array.isArray(result.data.careerEvents)) {
          (result.data.careerEvents as any[]).forEach(event => {
            updatedCharacter = CharacterHistoryManager.addEvent(
              updatedCharacter, stepId, stepName, phase, event
            );
          });
        }
        
        // Store career terms data
        if (result.data.phaseData && (result.data.phaseData as any).careerTerms) {
          updatedCharacter.phaseData = {
            ...updatedCharacter.phaseData,
            careerTerms: (result.data.phaseData as any).careerTerms,
          };
        }
        break;
      
      default:
        // Store other step data in phaseData
        updatedCharacter.phaseData = {
          ...updatedCharacter.phaseData,
          [stepId]: result.data,
        };
        
        // Add a generic milestone event for unhandled steps
        const genericEvent = CharacterHistoryManager.createMilestoneEvent(
          `Completed ${stepName}`,
          `They navigated through the ${stepName} phase of their character development.`,
          {
            narrative: `Another step forward in defining who they would become.`
          }
        );
        
        updatedCharacter = CharacterHistoryManager.addEvent(
          updatedCharacter, stepId, stepName, phase, genericEvent
        );
    }

    onCharacterUpdate(updatedCharacter);

    // Move to next step or complete
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handleBack = (): void => {
    // Check if back navigation should be blocked
    if (shouldBlockBack(currentStep.id, character)) {
      // Show a warning message instead of allowing back navigation
      alert('Cannot go back after completing this milestone to prevent character data conflicts. Please continue forward or restart character creation.');
      return;
    }
    
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const canGoBack = (): boolean => {
    return currentStepIndex > 0 && !shouldBlockBack(currentStep.id, character);
  };

  const getProgress = (): number => {
    return ((currentStepIndex + 1) / characterCreationSteps.length) * 100;
  };

  return (
    <div className="step-by-step-creation">
      {/* Progress Header */}
      <div className="creation-header mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-white">Character Creation</h1>
          <div className="flex items-center gap-4">
            <span className="text-slate-400">
              Step {currentStepIndex + 1} of {characterCreationSteps.length}
            </span>
            <button
              onClick={handleNewCharacter}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium text-sm"
              title="Start over with a new character (Ctrl+N)"
            >
              🆕 New Character
            </button>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="progress-bar w-full bg-slate-700 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${getProgress()}%` }}
          />
        </div>
        
        {/* Step Navigation */}
        <div className="step-navigation mt-4 flex justify-center">
          <div className="flex gap-2">
            {characterCreationSteps.map((step, index) => {
              const isCompleted = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const isLocked = isCompleted && shouldBlockBack(currentStep.id, character) && index >= currentStepIndex - 1;
              
              return (
                <div
                  key={step.id}
                  className={`w-3 h-3 rounded-full transition-colors relative ${
                    isCompleted 
                      ? 'bg-green-500' 
                      : isCurrent 
                      ? 'bg-blue-500' 
                      : 'bg-slate-600'
                  }`}
                  title={`${step.title}${isLocked ? ' (Locked)' : ''}`}
                >
                  {isLocked && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" 
                         title="Cannot go back past this step"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Warning about locked navigation */}
      {shouldBlockBack(currentStep.id, character) && (
        <div className="navigation-warning mb-6 p-4 bg-yellow-900/20 border border-yellow-600 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-yellow-400">🔒</span>
            <span className="text-yellow-300 font-medium">Navigation Locked</span>
          </div>
          <p className="text-yellow-200 text-sm mb-3">
            You cannot go back to previous steps after confirming your characteristics or completing major milestones. 
            This prevents character data conflicts. Continue forward or restart character creation if needed.
          </p>
          <button
            onClick={handleNewCharacter}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium transition-colors"
            title="Start a new character (Ctrl+N)"
          >
            🆕 Start New Character
          </button>
        </div>
      )}

      {/* Current Step */}
      <div className="current-step">
        <StepManager
          currentStep={currentStep}
          character={character}
          rules={rules}
          species={species}
          onStepComplete={handleStepComplete}
          onBack={canGoBack() ? handleBack : undefined}
        />
      </div>

      {/* Character Preview */}
      <div className="character-preview mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Info */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Character Preview</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
            <div>
              <span className="text-slate-400">Name: </span>
              <span className="text-white font-medium">
                {character.name || 'Unnamed'}
              </span>
            </div>
            
            <div>
              <span className="text-slate-400">Species: </span>
              <span className="text-white font-medium">
                {character.species || 'Not selected'}
              </span>
            </div>
            
            <div>
              <span className="text-slate-400">Skills: </span>
              <span className="text-white font-medium">
                {character.skills.length}
              </span>
            </div>
            
            <div>
              <span className="text-slate-400">Events: </span>
              <span className="text-white font-medium">
                {character.history.length}
              </span>
            </div>
          </div>
          
          {/* Characteristics Summary */}
          <div className="characteristics-summary pt-4 border-t border-slate-700 mb-4">
            <h4 className="text-slate-300 text-sm font-medium mb-2">Characteristics</h4>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {Object.entries(character.characteristics).map(([char, value]) => (
                <div key={char} className="text-center">
                  <div className="text-slate-400 text-xs">{char}</div>
                  <div className="text-white font-bold">{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Skills Summary */}
          {character.skills.length > 0 && (
            <div className="skills-summary pt-4 border-t border-slate-700">
              <h4 className="text-slate-300 text-sm font-medium mb-2">
                Skills ({character.skills.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-sm">
                {character.skills.map((skill, index) => (
                  <div key={`${skill.name}-${index}`} className="flex justify-between items-center py-1">
                    <span className="text-slate-300">{skill.name}</span>
                    <span className={`font-mono text-xs px-2 py-1 rounded ${
                      skill.level === 0 
                        ? 'bg-slate-600 text-slate-300' 
                        : 'bg-green-600 text-white'
                    }`}>
                      {skill.level}
                    </span>
                  </div>
                ))}
              </div>
              
              {/* Skills by Source */}
              <div className="mt-3 text-xs">
                {getSkillsBySource(character.skills).map(({ source, skills }) => (
                  <div key={source} className="mb-1">
                    <span className="text-slate-500 capitalize">{source}: </span>
                    <span className="text-slate-400">
                      {skills.map(s => s.name).join(', ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Species Special Rules */}
          {character.species && (
            <div className="species-rules pt-4 border-t border-slate-700">
              <h4 className="text-slate-300 text-sm font-medium mb-2">
                {character.species} Special Rules
              </h4>
              {(() => {
                const selectedSpecies = species.find(s => s.name === character.species);
                if (!selectedSpecies || !selectedSpecies.specialRules || selectedSpecies.specialRules.length === 0) {
                  return (
                    <div className="text-slate-400 text-sm italic">
                      No special rules for this species
                    </div>
                  );
                }
                
                return (
                  <div className="space-y-2">
                    {selectedSpecies.specialRules.map((rule, index) => {
                      // Split rule into name and description if it contains a colon
                      const [ruleName, ...ruleDescParts] = rule.split(':');
                      const ruleDescription = ruleDescParts.join(':').trim();
                      
                      return (
                        <div key={index} className="text-sm bg-slate-800 rounded p-2">
                          <div className="text-slate-300 flex items-start">
                            <span className="text-blue-400 mr-2 mt-0.5">•</span>
                            <div>
                              {ruleDescription ? (
                                <>
                                  <span className="text-blue-300 font-medium">{ruleName}:</span>
                                  <span className="text-slate-300 ml-1">{ruleDescription}</span>
                                </>
                              ) : (
                                <span className="text-slate-300">{rule}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Character History */}
        <CharacterHistoryDisplay character={character} />
      </div>
    </div>
  );
};
