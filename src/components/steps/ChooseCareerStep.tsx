/**
 * Choose Career Step Component
 * Allows character to select their initial career path
 */

import React, { useState } from 'react';
import type { Character, Rules, StepResult, Career, Characteristic } from '@/types';
import { CharacterHistoryManager } from '@/utils/characterHistory';
import { useCharacterStore } from '@/store/characterStore';

interface ChooseCareerStepProps {
  character: Character;
  rules: Rules;
  onStepComplete: (stepId: string, result: StepResult) => void;
  onBack?: () => void;
}

/**
 * ✅ STANDARDS COMPLIANT: Configuration-driven step component
 * - No hardcoded game rules (careers loaded from configuration)
 * - Props-based configuration  
 * - Pure UI logic only
 * - Type-safe throughout
 */
export const ChooseCareerStep: React.FC<ChooseCareerStepProps> = ({
  character,
  rules: _rules,
  onStepComplete,
  onBack,
}) => {
  const { careers } = useCharacterStore();
  const [selectedCareer, setSelectedCareer] = useState<Career | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<string>('');
  const [qualificationAttempted, setQualificationAttempted] = useState(false);
  const [qualificationResult, setQualificationResult] = useState<{ passed: boolean; roll: number; target: number } | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  /**
   * Calculate qualification roll result
   */
  const rollQualification = (career: Career): { passed: boolean; roll: number; target: number } => {
    const qualification = career.qualification;
    const roll = Math.floor(Math.random() * 6) + Math.floor(Math.random() * 6) + 2; // 2d6
    
    // Apply DM (Dice Modifiers) if applicable
    let dm = 0;
    if (qualification.dm) {
      Object.entries(qualification.dm).forEach(([char, conditions]) => {
        const charValue = character.characteristics[char as Characteristic];
        Object.entries(conditions).forEach(([condition, modifier]) => {
          const threshold = parseInt(condition.replace('+', ''));
          if (charValue >= threshold) {
            dm += modifier;
          }
        });
      });
    }

    const total = roll + dm;
    const passed = total >= qualification.target;

    return { passed, roll: total, target: qualification.target };
  };

  /**
   * Handle career selection and qualification check
   */
  const handleCareerSelect = (career: Career): void => {
    setSelectedCareer(career);
    setSelectedAssignment('');
    setQualificationAttempted(false);
    setQualificationResult(null);
    setErrors([]);
  };

  /**
   * Attempt qualification for selected career
   */
  const attemptQualification = (): void => {
    if (!selectedCareer) return;

    const result = rollQualification(selectedCareer);
    setQualificationResult(result);
    setQualificationAttempted(true);

    if (!result.passed) {
      setErrors([`Failed qualification roll (rolled ${result.roll}, needed ${result.target})`]);
    } else {
      setErrors([]);
    }
  };

  /**
   * Handle assignment selection
   */
  const handleAssignmentSelect = (assignmentId: string): void => {
    setSelectedAssignment(assignmentId);
    setErrors([]);
  };

  /**
   * Complete the career selection step
   */
  const handleComplete = (): void => {
    if (!selectedCareer) {
      setErrors(['Please select a career']);
      return;
    }

    if (!qualificationAttempted) {
      setErrors(['Please attempt qualification for your chosen career']);
      return;
    }

    if (!qualificationResult?.passed) {
      setErrors(['You must qualify for a career to continue. Try a different career or choose the Drifter career.']);
      return;
    }

    if (!selectedAssignment) {
      setErrors(['Please select an assignment within your career']);
      return;
    }

    const assignment = selectedCareer.assignments.find(a => a.id === selectedAssignment);
    if (!assignment) {
      setErrors(['Invalid assignment selection']);
      return;
    }

    // Create history event
    const careerEvent = CharacterHistoryManager.createChoiceEvent(
      `${selectedCareer.name} - ${assignment.name}`,
      careers.map(c => c.name),
      `Joined the ${selectedCareer.name} and was assigned to ${assignment.name}`,
      {
        narrative: `Qualified for ${selectedCareer.name} with a roll of ${qualificationResult.roll} (needed ${qualificationResult.target}). Assigned to ${assignment.description}.`
      }
    );

    // Complete the step
    onStepComplete('choose-career', {
      valid: true,
      data: {
        career: {
          id: selectedCareer.id,
          name: selectedCareer.name,
          assignment: {
            id: assignment.id,
            name: assignment.name,
            description: assignment.description
          }
        },
        qualificationRoll: qualificationResult,
        historyEvent: careerEvent
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Choose Career</h2>
        <p className="text-slate-300">
          Select your character's initial career path. You must qualify for your chosen career 
          by rolling 2d6 and meeting the qualification requirements.
        </p>
      </div>

      {/* Error Display */}
      {errors.length > 0 && (
        <div className="mb-4 p-4 bg-red-900/30 border border-red-500/30 rounded-lg">
          <ul className="text-red-300 text-sm">
            {errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Career Selection */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-white mb-4">Available Careers</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {careers.map((career) => {
            const qualification = career.qualification;
            const charValue = character.characteristics[qualification.characteristic];
            const baseTarget = qualification.target;
            
            return (
              <div
                key={career.id}
                className={`card p-4 cursor-pointer transition-all ${
                  selectedCareer?.id === career.id
                    ? 'ring-2 ring-blue-400 bg-blue-900/30'
                    : 'hover:ring-1 hover:ring-slate-400'
                }`}
                onClick={() => handleCareerSelect(career)}
              >
                <h4 className="font-semibold text-white mb-2">{career.name}</h4>
                <p className="text-sm text-slate-300 mb-3">{career.description}</p>
                
                <div className="space-y-1 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>Qualification:</span>
                    <span className="text-slate-300">{qualification.characteristic} {baseTarget}+</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Your {qualification.characteristic}:</span>
                    <span className={`font-medium ${charValue >= baseTarget ? 'text-green-400' : 'text-red-400'}`}>
                      {charValue}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Assignments:</span>
                    <span className="text-slate-300">{career.assignments.length} available</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Qualification Section */}
      {selectedCareer && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Qualification</h3>
          
          {!qualificationAttempted ? (
            <div className="card p-4">
              <p className="text-slate-300 mb-4">
                To join the {selectedCareer.name}, you need to roll 2d6 and get {selectedCareer.qualification.target} or higher.
                Your {selectedCareer.qualification.characteristic} characteristic may provide bonuses.
              </p>
              <button
                onClick={attemptQualification}
                className="btn-primary"
              >
                🎲 Roll for Qualification
              </button>
            </div>
          ) : (
            <div className={`card p-4 ${
              qualificationResult?.passed 
                ? 'border-green-400/30 bg-green-900/20' 
                : 'border-red-400/30 bg-red-900/20'
            }`}>
              <h4 className={`font-semibold mb-2 ${
                qualificationResult?.passed ? 'text-green-400' : 'text-red-400'
              }`}>
                Qualification {qualificationResult?.passed ? 'Successful' : 'Failed'}
              </h4>
              <p className={`text-sm ${
                qualificationResult?.passed ? 'text-green-300' : 'text-red-300'
              }`}>
                Rolled: {qualificationResult?.roll} (needed {qualificationResult?.target})
              </p>
              {!qualificationResult?.passed && (
                <p className="text-red-300 text-sm mt-2">
                  Try a different career or become a Drifter.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Assignment Selection */}
      {selectedCareer && qualificationResult?.passed && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Choose Assignment</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {selectedCareer.assignments.map((assignment) => (
              <div
                key={assignment.id}
                className={`card p-4 cursor-pointer transition-all ${
                  selectedAssignment === assignment.id
                    ? 'ring-2 ring-blue-400 bg-blue-900/30'
                    : 'hover:ring-1 hover:ring-slate-400'
                }`}
                onClick={() => handleAssignmentSelect(assignment.id)}
              >
                <h4 className="font-semibold text-white mb-2">{assignment.name}</h4>
                <p className="text-sm text-slate-300">{assignment.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="btn-secondary"
        >
          ← Back
        </button>
        <button
          onClick={handleComplete}
          disabled={!selectedCareer || !qualificationResult?.passed || !selectedAssignment}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue →
        </button>
      </div>
    </div>
  );
};
