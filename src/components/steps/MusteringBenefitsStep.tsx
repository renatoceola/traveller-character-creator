/**
 * Mustering Benefits Step Component
 */

import React from 'react';
import { PlaceholderStep } from './PlaceholderStep';
import type { Character, Rules, StepResult } from '@/types';

interface MusteringBenefitsStepProps {
  character: Character;
  rules: Rules;
  onStepComplete: (stepId: string, result: StepResult) => void;
  onBack?: () => void;
}

export const MusteringBenefitsStep: React.FC<MusteringBenefitsStepProps> = (props) => {
  return (
    <PlaceholderStep
      {...props}
      stepId="mustering-benefits"
      title="Mustering Benefits"
      description="Roll for final cash and material benefits upon leaving your career."
    />
  );
};
