import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { 
  Character, 
  Rules, 
  Phase,
  StepCompleteEvent,
  CharacterStore 
} from '@/types';

/**
 * Default character state
 */
const createDefaultCharacter = (): Character => ({
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
});

/**
 * Zustand store for character creation state
 */
export const useCharacterStore = create<CharacterStore>()(
  devtools(
    subscribeWithSelector(
      immer((set) => ({
        // State
        character: createDefaultCharacter(),
        rules: {} as Rules,
        species: [],
        careers: [],
        preCareerEvents: [],
        phases: [],
        currentPhase: 'character-creation',
        currentStep: '',
        history: [],

        // Actions
        updateCharacter: (updates) => {
          set((state) => {
            Object.assign(state.character, updates);
          }, false, 'updateCharacter');
        },

        completeStep: (stepId, result) => {
          const timestamp = Date.now();
          const event: StepCompleteEvent = {
            stepId,
            result,
            timestamp,
          };

          set((state) => {
            // Apply step result data to character
            if (result.valid && result.data) {
              Object.assign(state.character, result.data);
              
              // Update phase data
              state.character.phaseData = {
                ...state.character.phaseData,
                [stepId]: result.data,
              };
            }

            state.history.push(event);
            state.currentStep = result.nextStep || state.currentStep;
          }, false, 'completeStep');
        },

        goToStep: (stepId) => {
          set((state) => {
            state.currentStep = stepId;
          }, false, 'goToStep');
        },

        goToPhase: (phaseName) => {
          set((state) => {
            // Find the first step of the target phase
            const targetPhase = state.phases.find((p: Phase) => p.name === phaseName);
            const firstStep = targetPhase?.steps[0]?.id || '';

            state.currentPhase = phaseName;
            state.currentStep = firstStep;
            state.character.currentPhase = phaseName;
          }, false, 'goToPhase');
        },

        resetCharacter: () => {
          set((state) => {
            state.character = createDefaultCharacter();
            state.currentPhase = 'character-creation';
            state.currentStep = '';
            state.history = [];
          }, false, 'resetCharacter');
        },

        loadConfiguration: (rules, species, phases, careers, preCareerEvents) => {
          set((state) => {
            // Sort phases by order
            const sortedPhases = [...phases].sort((a, b) => a.order - b.order);
            const firstPhase = sortedPhases[0];
            const firstStep = firstPhase?.steps[0]?.id || '';

            state.rules = rules;
            state.species = species;
            state.careers = careers;
            state.preCareerEvents = preCareerEvents;
            state.phases = sortedPhases;
            state.currentPhase = firstPhase?.name || 'character-creation';
            state.currentStep = firstStep;
          }, false, 'loadConfiguration');
        },
      }))
    ),
    {
      name: 'traveller-character-store',
    }
  )
);

// Utility hooks
export const useCharacter = () => useCharacterStore((state) => state.character);
export const useRules = () => useCharacterStore((state) => state.rules);
export const useSpecies = () => useCharacterStore((state) => state.species);
export const usePhases = () => useCharacterStore((state) => state.phases);
export const useCurrentPhase = () => useCharacterStore((state) => state.currentPhase);
export const useCurrentStep = () => useCharacterStore((state) => state.currentStep);

// Action hooks
export const useCharacterActions = () => {
  const {
    updateCharacter,
    completeStep,
    goToStep,
    goToPhase,
    resetCharacter,
    loadConfiguration,
  } = useCharacterStore();

  return {
    updateCharacter,
    completeStep,
    goToStep,
    goToPhase,
    resetCharacter,
    loadConfiguration,
  };
};

// Computed selectors
export const useCurrentPhaseData = () => {
  return useCharacterStore((state) => {
    const currentPhase = state.phases.find((p: Phase) => p.name === state.currentPhase);
    return currentPhase;
  });
};

export const useCurrentStepData = () => {
  return useCharacterStore((state) => {
    const currentPhase = state.phases.find((p: Phase) => p.name === state.currentPhase);
    const currentStep = currentPhase?.steps.find((s) => s.id === state.currentStep);
    return currentStep;
  });
};

export const useStepHistory = () => {
  return useCharacterStore((state) => state.history);
};

export const useCanGoBack = () => {
  return useCharacterStore((state) => state.history.length > 0);
};

export const usePreCareerEvents = () => {
  return useCharacterStore((state) => state.preCareerEvents);
};

export const useGoBack = () => {
  const { history, phases, goToStep, goToPhase } = useCharacterStore();
  
  return () => {
    if (history.length === 0) return;
    
    // Remove the last step from history
    const newHistory = history.slice(0, -1);
    
    if (newHistory.length === 0) {
      // Go to the beginning
      const firstPhase = phases[0];
      if (firstPhase) {
        goToPhase(firstPhase.name);
      }
      return;
    }
    
    // Go to the previous step
    const lastEvent = newHistory[newHistory.length - 1];
    if (lastEvent.result.nextStep) {
      goToStep(lastEvent.result.nextStep);
    }
  };
};
