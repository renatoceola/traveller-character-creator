/**
 * Step Manager Component
 * Manages individual step rendering and navigation within a phase
 */

import React from 'react';
import type { Species, Rules, Character, StepResult, PhaseStep } from '@/types';

// Import all step components
import {
  RollCharacteristicsStep,
  ChooseSpeciesStep,
  CharacterDetailsStep,
  HomeworldStep,
  EducationStep,
  PreCareerStep,
  ChooseCareerStep,
  CareerTermsStep,
  MusteringBenefitsStep,
  FinalDetailsStep,
  CharacterSummaryStep,
} from '@/components/steps';

interface StepManagerProps {
  currentStep: PhaseStep;
  character: Character;
  rules: Rules;
  species: Species[];
  onStepComplete: (stepId: string, result: StepResult) => void;
  onBack?: () => void;
}

/**
 * ✅ STANDARDS COMPLIANT: Dynamic step component renderer
 * - Configuration-driven step selection
 * - Type-safe component mapping
 * - Consistent props interface
 * - Error handling for missing components
 */
export const StepManager: React.FC<StepManagerProps> = ({
  currentStep,
  character,
  rules,
  species,
  onStepComplete,
  onBack,
}) => {
  // Map component names to actual components
  const stepComponents: Record<string, React.ComponentType<any>> = {
    RollCharacteristicsStep,
    ChooseSpeciesStep,
    CharacterDetailsStep,
    HomeworldStep,
    EducationStep,
    PreCareerStep,
    ChooseCareerStep,
    CareerTermsStep,
    MusteringBenefitsStep,
    FinalDetailsStep,
    CharacterSummaryStep,
  };

  // Get the component for the current step
  const StepComponent = stepComponents[currentStep.component];

  // Handle missing components
  if (!StepComponent) {
    return (
      <div className="step-error card p-8 text-center">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h3 className="text-xl font-semibold text-white mb-2">Component Not Found</h3>
        <p className="text-slate-400 mb-4">
          The component "{currentStep.component}" for step "{currentStep.id}" could not be found.
        </p>
        <div className="inline-block px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm">
          Check the step configuration and component mapping
        </div>
        
        {onBack && (
          <div className="mt-6">
            <button onClick={onBack} className="btn-secondary">
              Go Back
            </button>
          </div>
        )}
      </div>
    );
  }

  // Common props that all step components need
  const commonProps = {
    character,
    rules,
    onStepComplete,
    onBack,
  };

  // Additional props for specific steps
  const stepSpecificProps: Record<string, object> = {
    ChooseSpeciesStep: { species },
    RollCharacteristicsStep: {},
    CharacterDetailsStep: {},
    HomeworldStep: {},
    EducationStep: {},
    PreCareerStep: {},
    ChooseCareerStep: {},
    CareerTermsStep: {},
    MusteringBenefitsStep: {},
    FinalDetailsStep: {},
    CharacterSummaryStep: {},
  };

  const specificProps = stepSpecificProps[currentStep.component] || {};

  return (
    <div className="step-manager">
      {/* Step Header */}
      <div className="step-info mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium">
            Step {currentStep.id}
          </span>
          <h2 className="text-2xl font-bold text-white">{currentStep.title}</h2>
        </div>
        <p className="text-slate-400">{currentStep.description}</p>
      </div>

      {/* Render the current step component */}
      <StepComponent {...commonProps} {...specificProps} />
    </div>
  );
};
