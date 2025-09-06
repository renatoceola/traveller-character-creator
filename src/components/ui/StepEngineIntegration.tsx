/**
 * Step Engine Integration Hook
 * Demonstrates proper integration of configuration-driven step management
 */

import { useMemo } from 'react';
import { StepEngine } from '@/core/StepEngine';
import { useCharacterStore, useCharacterActions } from '@/store/characterStore';
import type { StepResult, StepContext } from '@/types';

/**
 * ✅ STANDARDS COMPLIANT: Configuration-driven step management
 * - No hardcoded step logic
 * - All workflow from configuration
 * - Type-safe step transitions
 * - Proper error handling
 */
export const useStepEngine = () => {
  const character = useCharacterStore((state) => state.character);
  const rules = useCharacterStore((state) => state.rules);
  const species = useCharacterStore((state) => state.species);
  const phases = useCharacterStore((state) => state.phases);
  const currentPhase = useCharacterStore((state) => state.currentPhase);
  const currentStep = useCharacterStore((state) => state.currentStep);
  const history = useCharacterStore((state) => state.history);

  const { completeStep, goToStep, goToPhase } = useCharacterActions();

  // Create step engine instance with current configuration
  const stepEngine = useMemo(() => {
    if (phases.length === 0 || !rules || species.length === 0) {
      return null;
    }
    // Create mutable copies to avoid readonly issues
    return new StepEngine([...phases], rules, [...species]);
  }, [phases, rules, species]);

  // Get current step data
  const currentStepData = useMemo(() => {
    if (!stepEngine) return null;
    return stepEngine.getStep(currentPhase, currentStep);
  }, [stepEngine, currentPhase, currentStep]);

  // Get current phase data
  const currentPhaseData = useMemo(() => {
    if (!stepEngine) return null;
    return stepEngine.getPhase(currentPhase);
  }, [stepEngine, currentPhase]);

  // Create step context for current step
  const stepContext = useMemo((): StepContext | null => {
    if (!stepEngine || !currentStepData) return null;

    // Build previous steps data from history
    const previousSteps: Record<string, unknown> = {};
    history.forEach(event => {
      if (event.result.valid && event.result.data) {
        previousSteps[event.stepId] = event.result.data;
      }
    });

    return stepEngine.createStepContext(character, currentStepData, previousSteps);
  }, [stepEngine, currentStepData, character, history]);

  // Navigation functions
  const canGoBack = useMemo(() => {
    if (!stepEngine) return false;
    const previousStep = stepEngine.getPreviousStep(currentPhase, currentStep);
    return previousStep !== undefined || history.length > 0;
  }, [stepEngine, currentPhase, currentStep, history]);

  const canGoForward = useMemo(() => {
    if (!stepEngine) return false;
    const nextStep = stepEngine.getNextStep(currentPhase, currentStep);
    const nextPhase = stepEngine.getNextPhase(currentPhase);
    return nextStep !== undefined || nextPhase !== undefined;
  }, [stepEngine, currentPhase, currentStep]);

  const goBack = () => {
    if (!stepEngine || !canGoBack) return;

    if (history.length > 0) {
      // Go back to previous completed step
      const previousEvent = history[history.length - 1];
      const previousStep = stepEngine.getStep(currentPhase, previousEvent.stepId);
      
      if (previousStep) {
        goToStep(previousEvent.stepId);
      } else {
        // Previous step was in a different phase
        const previousPhase = stepEngine.getPreviousPhase(currentPhase);
        if (previousPhase) {
          goToPhase(previousPhase.name);
        }
      }
    } else {
      // Go to previous step in current phase
      const previousStep = stepEngine.getPreviousStep(currentPhase, currentStep);
      if (previousStep) {
        goToStep(previousStep.id);
      }
    }
  };

  const goForward = () => {
    if (!stepEngine || !canGoForward) return;

    const nextStep = stepEngine.getNextStep(currentPhase, currentStep);
    if (nextStep) {
      goToStep(nextStep.id);
    } else {
      const nextPhase = stepEngine.getNextPhase(currentPhase);
      if (nextPhase) {
        goToPhase(nextPhase.name);
      }
    }
  };

  // Complete current step with validation
  const completeCurrentStep = (result: StepResult) => {
    if (!stepEngine || !currentStepData) {
      console.error('Cannot complete step: step engine or current step not available');
      return;
    }

    // Validate step result using configuration-driven validation
    const validation = stepEngine.validateStepResult(currentStepData, result);
    
    const validatedResult: StepResult = {
      ...result,
      valid: validation.isValid && result.valid,
      errors: [...(result.errors || []), ...validation.errors],
      warnings: [...(result.warnings || []), ...validation.warnings],
    };

    if (validatedResult.valid) {
      // Calculate next step using step engine
      const nextStepInfo = stepEngine.calculateNextStep(currentPhase, currentStep, validatedResult);
      
      if (nextStepInfo.completed) {
        // Character creation completed
        validatedResult.nextStep = undefined;
      } else if (nextStepInfo.nextPhaseName && nextStepInfo.nextPhaseName !== currentPhase) {
        // Moving to next phase
        goToPhase(nextStepInfo.nextPhaseName);
        return;
      } else if (nextStepInfo.nextStepId) {
        // Moving to next step in same phase
        validatedResult.nextStep = nextStepInfo.nextStepId;
      }
    }

    completeStep(currentStepData.id, validatedResult);
  };

  // Get progress information
  const progress = useMemo(() => {
    if (!stepEngine) return null;
    return stepEngine.getProgress(currentPhase, currentStep);
  }, [stepEngine, currentPhase, currentStep]);

  // Check step dependencies
  const canExecuteCurrentStep = useMemo(() => {
    if (!stepEngine || !currentStepData) return { canExecute: false, missingDependencies: [] };

    const previousSteps: Record<string, unknown> = {};
    history.forEach(event => {
      if (event.result.valid && event.result.data) {
        previousSteps[event.stepId] = event.result.data;
      }
    });

    return stepEngine.canExecuteStep(currentStepData, character, previousSteps);
  }, [stepEngine, currentStepData, character, history]);

  return {
    // State
    stepEngine,
    currentStepData,
    currentPhaseData,
    stepContext,
    progress,
    canExecuteCurrentStep,
    
    // Navigation
    canGoBack,
    canGoForward,
    goBack,
    goForward,
    
    // Step management
    completeCurrentStep,
    
    // Utility functions
    getPhases: () => stepEngine?.getPhases() || [],
    getPhase: (phaseName: string) => stepEngine?.getPhase(phaseName),
    getStep: (phaseName: string, stepId: string) => stepEngine?.getStep(phaseName, stepId),
  };
};
