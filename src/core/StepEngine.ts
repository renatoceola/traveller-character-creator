import type { 
  Phase, 
  PhaseStep, 
  StepContext, 
  StepResult, 
  Character, 
  Rules, 
  Species 
} from '@/types';

/**
 * Step execution engine for the character creation process
 */
export class StepEngine {
  private phases: Phase[];
  private rules: Rules;
  private species: Species[];

  constructor(phases: Phase[], rules: Rules, species: Species[]) {
    // Create a new array to avoid mutating the input array
    this.phases = [...phases].sort((a, b) => a.order - b.order);
    this.rules = rules;
    this.species = species;
  }

  /**
   * Get all phases in order
   */
  getPhases(): Phase[] {
    return this.phases;
  }

  /**
   * Get a specific phase by name
   */
  getPhase(phaseName: string): Phase | undefined {
    return this.phases.find(phase => phase.name === phaseName);
  }

  /**
   * Get a specific step by phase and step ID
   */
  getStep(phaseName: string, stepId: string): PhaseStep | undefined {
    const phase = this.getPhase(phaseName);
    return phase?.steps.find(step => step.id === stepId);
  }

  /**
   * Get the first step of a phase
   */
  getFirstStep(phaseName: string): PhaseStep | undefined {
    const phase = this.getPhase(phaseName);
    return phase?.steps[0];
  }

  /**
   * Get the next step in the current phase
   */
  getNextStep(phaseName: string, currentStepId: string): PhaseStep | undefined {
    const phase = this.getPhase(phaseName);
    if (!phase) return undefined;

    const currentIndex = phase.steps.findIndex(step => step.id === currentStepId);
    if (currentIndex === -1 || currentIndex === phase.steps.length - 1) {
      return undefined;
    }

    return phase.steps[currentIndex + 1];
  }

  /**
   * Get the previous step in the current phase
   */
  getPreviousStep(phaseName: string, currentStepId: string): PhaseStep | undefined {
    const phase = this.getPhase(phaseName);
    if (!phase) return undefined;

    const currentIndex = phase.steps.findIndex(step => step.id === currentStepId);
    if (currentIndex <= 0) {
      return undefined;
    }

    return phase.steps[currentIndex - 1];
  }

  /**
   * Get the next phase
   */
  getNextPhase(currentPhaseName: string): Phase | undefined {
    const currentIndex = this.phases.findIndex(phase => phase.name === currentPhaseName);
    if (currentIndex === -1 || currentIndex === this.phases.length - 1) {
      return undefined;
    }

    return this.phases[currentIndex + 1];
  }

  /**
   * Get the previous phase
   */
  getPreviousPhase(currentPhaseName: string): Phase | undefined {
    const currentIndex = this.phases.findIndex(phase => phase.name === currentPhaseName);
    if (currentIndex <= 0) {
      return undefined;
    }

    return this.phases[currentIndex - 1];
  }

  /**
   * Check if a step's dependencies are satisfied
   */
  canExecuteStep(
    step: PhaseStep, 
    _character: Character, 
    completedSteps: Record<string, unknown>
  ): { canExecute: boolean; missingDependencies: string[] } {
    if (!step.dependencies || step.dependencies.length === 0) {
      return { canExecute: true, missingDependencies: [] };
    }

    const missingDependencies = step.dependencies.filter(dep => !completedSteps[dep]);
    
    return {
      canExecute: missingDependencies.length === 0,
      missingDependencies,
    };
  }

  /**
   * Create step context for execution
   */
  createStepContext(
    character: Character,
    currentStep: PhaseStep,
    previousSteps: Record<string, unknown> = {}
  ): StepContext {
    return {
      character,
      rules: this.rules,
      species: this.species,
      currentStep,
      previousSteps,
    };
  }

  /**
   * Validate step result
   */
  validateStepResult(step: PhaseStep, result: StepResult): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation
    if (!result.valid) {
      errors.push('Step marked as invalid');
    }

    if (!result.data || typeof result.data !== 'object') {
      errors.push('Step result must contain data object');
    }

    // Custom validation rules
    if (step.validation) {
      for (const rule of step.validation) {
        const validationResult = this.executeValidationRule(rule, result);
        if (!validationResult.valid) {
          if (validationResult.severity === 'error') {
            errors.push(validationResult.message);
          } else {
            warnings.push(validationResult.message);
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors: [...(result.errors || []), ...errors],
      warnings: [...(result.warnings || []), ...warnings],
    };
  }

  /**
   * Execute a validation rule
   */
  private executeValidationRule(
    rule: string, 
    result: StepResult
  ): { valid: boolean; message: string; severity: 'error' | 'warning' } {
    // This is a simplified validation system
    // In a real implementation, you might have a more sophisticated rule engine
    
    switch (rule) {
      case 'required-name': {
        return {
          valid: !!(result.data?.name && typeof result.data.name === 'string' && result.data.name.trim()),
          message: 'Character name is required',
          severity: 'error',
        };
      }
        
      case 'required-species': {
        return {
          valid: !!(result.data?.species),
          message: 'Species selection is required',
          severity: 'error',
        };
      }
        
      case 'valid-characteristics': {
        const characteristics = result.data?.characteristics as Record<string, unknown> | undefined;
        if (!characteristics) {
          return {
            valid: false,
            message: 'Characteristics are required',
            severity: 'error',
          };
        }
        
        const sum = Object.values(characteristics).reduce((a: number, b: unknown) => a + (Number(b) || 0), 0);
        const minSum = this.rules.characterCreation?.minCharacteristicSum || 0;
        
        return {
          valid: !this.rules.characterCreation?.enforceMinimumCharacteristics || sum >= minSum,
          message: `Characteristic sum (${sum}) must be at least ${minSum}`,
          severity: 'warning',
        };
      }
        
      default:
        return {
          valid: true,
          message: '',
          severity: 'error',
        };
    }
  }

  /**
   * Calculate the next step after completing the current step
   */
  calculateNextStep(
    currentPhaseName: string,
    currentStepId: string,
    result: StepResult
  ): { nextStepId?: string; nextPhaseName?: string; completed: boolean } {
    // If the result specifies a next step, use that
    if (result.nextStep) {
      return { nextStepId: result.nextStep, nextPhaseName: currentPhaseName, completed: false };
    }

    // Otherwise, try to get the next step in the current phase
    const nextStep = this.getNextStep(currentPhaseName, currentStepId);
    if (nextStep) {
      return { nextStepId: nextStep.id, nextPhaseName: currentPhaseName, completed: false };
    }

    // If no next step in current phase, try to get the next phase
    const nextPhase = this.getNextPhase(currentPhaseName);
    if (nextPhase) {
      const firstStep = this.getFirstStep(nextPhase.name);
      if (firstStep) {
        return { nextStepId: firstStep.id, nextPhaseName: nextPhase.name, completed: false };
      }
    }

    // Character creation is complete
    return { completed: true };
  }

  /**
   * Get progress information
   */
  getProgress(currentPhaseName: string, currentStepId: string): {
    currentPhaseIndex: number;
    totalPhases: number;
    currentStepIndex: number;
    totalStepsInPhase: number;
    overallProgress: number;
  } {
    const phaseIndex = this.phases.findIndex(p => p.name === currentPhaseName);
    const phase = this.phases[phaseIndex];
    const stepIndex = phase ? phase.steps.findIndex(s => s.id === currentStepId) : -1;

    // Calculate overall progress
    let completedSteps = 0;
    let totalSteps = 0;

    for (let i = 0; i < this.phases.length; i++) {
      const phaseSteps = this.phases[i].steps.length;
      totalSteps += phaseSteps;
      
      if (i < phaseIndex) {
        // All steps in previous phases are completed
        completedSteps += phaseSteps;
      } else if (i === phaseIndex) {
        // Add completed steps in current phase
        completedSteps += Math.max(0, stepIndex);
      }
    }

    const overallProgress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

    return {
      currentPhaseIndex: Math.max(0, phaseIndex),
      totalPhases: this.phases.length,
      currentStepIndex: Math.max(0, stepIndex),
      totalStepsInPhase: phase ? phase.steps.length : 0,
      overallProgress: Math.round(overallProgress),
    };
  }
}
