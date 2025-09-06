import { z } from 'zod';

/**
 * Zod validation schemas for configuration files
 */

// Basic types
export const DiceRollSchema = z.string().regex(/^\d+d\d+(\+\d+)?$/, 'Invalid dice roll format');
export const CharacteristicSchema = z.enum(['STR', 'DEX', 'END', 'INT', 'EDU', 'SOC']);

// Characteristic set
export const CharacteristicSetSchema = z.object({
  STR: z.number().min(1).max(18),
  DEX: z.number().min(1).max(18),
  END: z.number().min(1).max(18),
  INT: z.number().min(1).max(18),
  EDU: z.number().min(1).max(18),
  SOC: z.number().min(1).max(18),
});

// Skills
export const SkillSchema = z.object({
  name: z.string().min(1),
  level: z.number().min(0).max(4),
  cascade: z.array(z.string()).optional(),
});

export const SkillDefinitionSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  cascade: z.array(z.string()).optional(),
  characteristic: CharacteristicSchema.optional(),
});

// Character
export const CharacterSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  species: z.string().min(1),
  characteristics: CharacteristicSetSchema,
  skills: z.array(SkillSchema),
  age: z.number().min(18),
  terms: z.number().min(0),
  credits: z.number().min(0),
  equipment: z.array(z.string()),
  benefits: z.array(z.string()),
  currentPhase: z.string().min(1),
  phaseData: z.record(z.unknown()),
  history: z.array(z.string()),
});

// Pre-career events
export const PreCareerEventEffectSchema = z.object({
  type: z.enum(['characteristic', 'skill', 'skill_choice', 'ally', 'enemy', 'rival', 'failure', 'choice', 'life_event', 'test']),
  characteristic: CharacteristicSchema.optional(),
  modifier: z.number().optional(),
  skill: z.string().optional(),
  level: z.number().optional(),
  count: z.string().optional(),
  description: z.string().optional(),
  options: z.array(z.object({
    requirement: z.string().optional(),
    effect: z.string().optional(),
    description: z.string(),
  })).optional(),
});

export const PreCareerEventSchema = z.object({
  roll: z.number().min(2).max(12),
  title: z.string().min(1),
  description: z.string().min(1),
  effect: PreCareerEventEffectSchema,
});

// Rules configuration
export const RuleConfigSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  enabled: z.boolean(),
  parameters: z.record(z.unknown()).optional(),
});

export const RulesSchema = z.object({
  characterCreation: z.object({
    allowCharacteristicRerolls: z.boolean(),
    maxRerollsPerCharacteristic: z.number().min(0),
    enforceMinimumCharacteristics: z.boolean(),
    minCharacteristicSum: z.number().min(0),
  }),
  skills: z.object({
    allowSkillAdvancement: z.boolean(),
    maxSkillLevel: z.number().min(0).max(4),
    cascadeSkillRules: z.record(z.array(z.string())),
  }),
  aging: z.object({
    enableAging: z.boolean(),
    agingStartTerm: z.number().min(1),
    agingModifiers: z.record(z.object({
      STR: z.number().optional(),
      DEX: z.number().optional(),
      END: z.number().optional(),
      INT: z.number().optional(),
      EDU: z.number().optional(),
      SOC: z.number().optional(),
    })),
  }),
  plugins: z.array(RuleConfigSchema).optional(),
});

// Species configuration
export const SpeciesModifierSchema = z.object({
  characteristic: CharacteristicSchema,
  modifier: z.number().min(-6).max(6),
});

export const SpeciesSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  modifiers: z.array(SpeciesModifierSchema),
  specialRules: z.array(z.string()).optional(),
  homeworld: z.string().optional(),
});

// Phase configuration
export const PhaseStepSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  component: z.string().min(1),
  validation: z.array(z.string()).optional(),
  dependencies: z.array(z.string()).optional(),
});

export const PhaseSchema = z.object({
  name: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  steps: z.array(PhaseStepSchema),
  order: z.number().min(0),
});

// Career configuration
export const CareerQualificationSchema = z.object({
  characteristic: CharacteristicSchema,
  target: z.number().min(2).max(12),
  dm: z.record(z.record(z.number())).optional(),
});

export const CareerAssignmentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  skillTable: z.array(z.string()),
});

export const CareerRankSchema = z.object({
  id: z.number().min(0),
  name: z.string().min(1),
  title: z.string().min(1),
  bonus: z.object({
    skill: z.string().optional(),
    level: z.number().optional(),
    characteristic: CharacteristicSchema.optional(),
  }).optional(),
});

export const CareerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  qualification: CareerQualificationSchema,
  survival: CareerQualificationSchema,
  advancement: CareerQualificationSchema,
  assignments: z.array(CareerAssignmentSchema),
  skillTables: z.object({
    personal: z.array(z.string()),
    service: z.array(z.string()),
    advanced: z.array(z.string()),
  }),
  ranks: z.array(CareerRankSchema),
});

// Step context and results
export const StepContextSchema = z.object({
  character: CharacterSchema,
  rules: RulesSchema,
  species: z.array(SpeciesSchema),
  currentStep: PhaseStepSchema,
  previousSteps: z.record(z.unknown()),
});

export const StepResultSchema = z.object({
  valid: z.boolean(),
  data: z.record(z.unknown()),
  errors: z.array(z.string()).optional(),
  warnings: z.array(z.string()).optional(),
  nextStep: z.string().optional(),
});

// Configuration bundle
export const ConfigurationBundleSchema = z.object({
  rules: RulesSchema,
  species: z.array(SpeciesSchema),
  phases: z.array(PhaseSchema),
  careers: z.array(CareerSchema),
  preCareerEvents: z.array(PreCareerEventSchema),
});

// Validation helpers
export function validateConfiguration(config: unknown): z.infer<typeof ConfigurationBundleSchema> {
  return ConfigurationBundleSchema.parse(config);
}

export function validateCharacter(character: unknown): z.infer<typeof CharacterSchema> {
  return CharacterSchema.parse(character);
}

export function validateStepResult(result: unknown): z.infer<typeof StepResultSchema> {
  return StepResultSchema.parse(result);
}

// Type inference helpers
export type ValidatedRules = z.infer<typeof RulesSchema>;
export type ValidatedSpecies = z.infer<typeof SpeciesSchema>;
export type ValidatedPhase = z.infer<typeof PhaseSchema>;
export type ValidatedCareer = z.infer<typeof CareerSchema>;
export type ValidatedCharacter = z.infer<typeof CharacterSchema>;
export type ValidatedStepResult = z.infer<typeof StepResultSchema>;
