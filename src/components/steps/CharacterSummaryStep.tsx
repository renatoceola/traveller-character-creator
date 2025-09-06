/**
 * Character Summary Step Component
 */

import React from 'react';
import { PlaceholderStep } from './PlaceholderStep';
import type { Character, Rules, StepResult } from '@/types';

interface CharacterSummaryStepProps {
  character: Character;
  rules: Rules;
  onStepComplete: (stepId: string, result: StepResult) => void;
  onBack?: () => void;
}

export const CharacterSummaryStep: React.FC<CharacterSummaryStepProps> = (props) => {
  return (
    <PlaceholderStep
      {...props}
      stepId="character-summary"
      title="Character Summary"
      description="Review your completed character and export or save your creation."
    />
  );
};
