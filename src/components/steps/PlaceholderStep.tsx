/**
 * Generic Placeholder Step Component
 * Used for steps that are not yet implemented
 */

import React from 'react';
import type { Character, Rules, StepResult } from '@/types';

interface PlaceholderStepProps {
  stepId: string;
  title: string;
  description: string;
  character: Character;
  rules: Rules;
  onStepComplete: (stepId: string, result: StepResult) => void;
  onBack?: () => void;
}

/**
 * ✅ STANDARDS COMPLIANT: Placeholder component for development
 * - Maintains consistent interface
 * - Shows development status
 * - Allows workflow testing
 */
export const PlaceholderStep: React.FC<PlaceholderStepProps> = ({
  stepId,
  title,
  description,
  character: _character,
  rules: _rules,
  onStepComplete,
  onBack,
}) => {
  const handleContinue = (): void => {
    onStepComplete(stepId, {
      data: { placeholder: true },
      valid: true,
    });
  };

  return (
    <div className="placeholder-step">
      <div className="step-header mb-6">
        <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
        <p className="text-slate-400">{description}</p>
      </div>

      <div className="card p-8 mb-6 text-center">
        <div className="text-6xl mb-4">🚧</div>
        <h4 className="text-lg font-medium text-white mb-2">Step Under Development</h4>
        <p className="text-slate-400 mb-4">
          This step ({stepId}) is currently being implemented. 
          For now, you can continue to test the workflow.
        </p>
        <div className="inline-block px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-lg text-sm">
          Coming Soon: Full {title} Implementation
        </div>
      </div>

      <div className="step-actions flex justify-between">
        {onBack && (
          <button onClick={onBack} className="btn-secondary">
            Back
          </button>
        )}
        
        <button onClick={handleContinue} className="btn-primary">
          Continue (Skip for Now)
        </button>
      </div>
    </div>
  );
};
