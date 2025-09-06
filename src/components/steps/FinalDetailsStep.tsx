/**
 * Final Details Step Component
 */

import React from 'react';
import { PlaceholderStep } from './PlaceholderStep';
import type { Character, Rules, StepResult } from '@/types';

interface FinalDetailsStepProps {
  character: Character;
  rules: Rules;
  onStepComplete: (stepId: string, result: StepResult) => void;
  onBack?: () => void;
}

export const FinalDetailsStep: React.FC<FinalDetailsStepProps> = (props) => {
  return (
    <PlaceholderStep
      {...props}
      stepId="final-details"
      title="Final Details"
      description="Finalize your character details and organize equipment before completion."
    />
  );
};
