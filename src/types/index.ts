/**
 * Core type definitions for the Traveller Character Creator
 */

// Basic value types
export type DiceRoll = string; // e.g., "2d6", "1d6+1"
export type SkillName = string;
export type SpeciesName = string;
export type PhaseName = string;

// Characteristics
export type Characteristic = 'STR' | 'DEX' | 'END' | 'INT' | 'EDU' | 'SOC';

export interface CharacteristicSet {
  STR: number;
  DEX: number;
  END: number;
  INT: number;
  EDU: number;
  SOC: number;
}

// Skills
export interface Skill {
  name: SkillName;
  level: number;
  cascade?: string[]; // For cascade skills like Pilot
  source?: string; // Source of the skill (e.g., 'homeworld', 'education', 'career')
}

export interface SkillDefinition {
  name: SkillName;
  description: string;
  cascade?: string[];
  characteristic?: Characteristic;
}

// Career system
export interface CareerQualification {
  characteristic: Characteristic;
  target: number;
  dm?: Record<Characteristic, Record<string, number>>;
}

export interface CareerAssignment {
  id: string;
  name: string;
  description: string;
  skillTable: string[];
}

export interface CareerRank {
  id: number;
  name: string;
  title: string;
  bonus?: {
    skill?: string;
    level?: number;
    characteristic?: Characteristic;
  };
}

// Pre-career education record
export interface PreCareerEducation {
  type: 'university' | 'military-academy' | 'trade-school' | 'none';
  name?: string;
  graduated: boolean;
  honors?: boolean;
  skills: Skill[];
}

export interface Career {
  id: string;
  name: string;
  description: string;
  qualification: CareerQualification;
  survival: CareerQualification;
  advancement: CareerQualification;
  assignments: CareerAssignment[];
  skillTables: {
    personal: string[];
    service: string[];
    advanced: string[];
  };
  ranks: CareerRank[];
}

// Life Events system
export interface LifeEvent {
  roll: number;
  title: string;
  description: string;
  effect: LifeEventEffect;
  narrative?: {
    setup: string;
    consequence: string;
    worldBuilding?: string;
  };
  tags?: string[];
}

export interface LifeEventEffect {
  type: 'injury_table' | 'choice' | 'ally' | 'contact' | 'betrayal' | 'travel' | 'good_fortune' | 'unusual_event';
  description: string;
  table?: string;
  relationship_type?: string;
  conversion?: boolean;
  modifier?: {
    type: string;
    value: number;
    duration: string;
  };
  subtable?: Record<string, {
    title: string;
    description: string;
  }>;
  options?: Array<{
    choice: string;
    effect: string;
    description: string;
    career?: string;
  }>;
}

export interface InjuryTableEntry {
  roll: number;
  title: string;
  description: string;
  effect: {
    type: 'characteristic_loss' | 'cosmetic' | 'none';
    description?: string;
    primary?: {
      characteristics: Characteristic[];
      reduction: number | string;
      choose: number;
    };
    secondary?: {
      characteristics: Characteristic[];
      reduction: number;
      choose: number;
      exclude_primary?: boolean;
    };
  };
}

// Pre-career education and events
export interface PreCareerEventEffect {
  type: 'characteristic' | 'skill' | 'skill_choice' | 'ally' | 'enemy' | 'rival' | 'failure' | 'choice' | 'life_event' | 'test';
  characteristic?: Characteristic;
  modifier?: number;
  skill?: string;
  level?: number;
  count?: string; // For dice-based counts like "1d3"
  description?: string;
  options?: Array<{
    requirement?: string;
    effect?: string;
    description: string;
  }>;
}

export interface PreCareerEvent {
  roll: number;
  title: string;
  description: string;
  effect: PreCareerEventEffect;
  narrative?: {
    setup: string;
    consequence: string;
    worldBuilding?: string;
  };
  tags?: string[];
}

// Character history and event tracking
export interface CharacterEvent {
  id: string;
  stepId: string;
  stepName: string;
  phase: string;
  timestamp: number;
  type: 'success' | 'failure' | 'choice' | 'roll' | 'gain' | 'loss' | 'milestone' | 'relationship' | 'life_event' | 'training';
  description: string;
  details: {
    // Existing details
    rolls?: { dice: string; result: number; target?: number }[];
    choices?: { option: string; selected: boolean }[];
    gains?: { type: string; item: string; amount?: number }[];
    losses?: { type: string; item: string; amount?: number }[];
    previousValue?: unknown;
    newValue?: unknown;
    
    // Enhanced context for all event types
    context?: {
      // Choice context
      reasoning?: string;
      consequences?: string;
      worldBuilding?: string;
      emotionalTone?: 'positive' | 'negative' | 'neutral' | 'mixed';
      
      // Roll context
      difficulty?: 'routine' | 'easy' | 'average' | 'difficult' | 'very_difficult' | 'formidable';
      modifiers?: Array<{ name: string; value: number }>;
      dramaticNarrative?: string;
      margin?: number;
      
      // Gain context
      source?: string;
      method?: 'training' | 'experience' | 'natural_talent' | 'education' | 'mentorship';
      flavorText?: string;
      
      // General significance (used by multiple event types)
      significance?: 'minor' | 'moderate' | 'major' | 'life_changing' | 'life_defining';
      
      // Milestone context
      themes?: string[];
      
      // Life event context
      severity?: 'minor' | 'moderate' | 'major' | 'catastrophic';
      lasting?: boolean;
      witnesses?: string[];
      location?: string;
    };
    
    // Relationship details
    relationship?: {
      type: 'ally' | 'enemy' | 'rival' | 'contact' | 'mentor' | 'dependent';
      name: string;
      howMet?: string;
      significance?: string;
      currentStatus?: string;
      influence?: 'minor' | 'moderate' | 'major';
    };
    
    // Life event details
    eventType?: 'injury' | 'betrayal' | 'discovery' | 'tragedy' | 'triumph' | 'mystery' | 'scandal' | 'milestone';
    consequences?: string;
    
    // Training details
    skill?: string;
    instructor?: string;
    method?: 'formal' | 'self_taught' | 'mentorship' | 'trial_by_fire' | 'observation';
  };
  impact: {
    characteristics?: Partial<CharacteristicSet>;
    skills?: string[];
    benefits?: string[];
    credits?: number;
    narrative?: string;
  };
}

export interface CharacterBackstory {
  events: CharacterEvent[];
  summary: string;
  keyMoments: string[];
  relationships: string[];
  motivations: string[];
}

// Character state
export interface Character {
  id: string;
  name: string;
  species: SpeciesName;
  characteristics: CharacteristicSet;
  skills: Skill[];
  age: number;
  terms: number;
  credits: number;
  equipment: string[];
  benefits: string[];
  currentPhase: PhaseName;
  phaseData: Record<string, unknown>;
  history: CharacterEvent[];
  backstory?: CharacterBackstory;
  preCareerEducation?: PreCareerEducation;
  careers?: CareerRecord[];
  specialAccess?: string[]; // Special career access (e.g., 'psion')
  lifeEventBonuses?: Array<{
    type: string;
    value: number;
    source: string;
  }>;
  forcedCareer?: string; // Career forced by events
  educationFailed?: boolean;
  mustLeaveEducation?: boolean;
  cannotGraduate?: boolean;
}

// Career record in character
export interface CareerRecord {
  careerId: string;
  assignmentId: string;
  rank: number;
  terms: number;
  commissioned?: boolean;
}

// Configuration types
export interface RuleConfig {
  name: string;
  description: string;
  enabled: boolean;
  parameters?: Record<string, unknown>;
}

export interface Rules {
  characterCreation: {
    allowCharacteristicRerolls: boolean;
    maxRerollsPerCharacteristic: number;
    enforceMinimumCharacteristics: boolean;
    minCharacteristicSum: number;
    minimumValue?: number;
    maximumValue?: number;
    dmTable?: Record<string, number>;
    generation?: {
      method: string;
      rolls: number;
      assignment: string;
      alternativeMethod?: string;
      minimumValue?: number;
      maximumValue?: number;
      rerollsAllowed?: number;
      rerollCondition?: string;
    };
  };
  skills: {
    allowSkillAdvancement: boolean;
    maxSkillLevel: number;
    cascadeSkillRules: Record<string, string[]>;
  };
  aging: {
    enableAging: boolean;
    agingStartTerm: number;
    agingModifiers: Record<string, Partial<Record<Characteristic, number>>>;
  };
  plugins?: RuleConfig[];
}

// Species configuration
export interface SpeciesModifier {
  characteristic: Characteristic;
  modifier: number;
}

export interface Species {
  name: SpeciesName;
  description: string;
  modifiers: SpeciesModifier[];
  specialRules?: string[];
  homeworld?: string;
}

// Phase configuration
export interface PhaseStep {
  id: string;
  title: string;
  description: string;
  component: string; // Component name to render
  validation?: string[]; // Validation rules
  dependencies?: string[]; // Required previous steps
}

export interface Phase {
  name: PhaseName;
  title: string;
  description: string;
  steps: PhaseStep[];
  order: number;
}

// Step context and results
export interface StepContext {
  character: Character;
  rules: Rules;
  species: Species[];
  currentStep: PhaseStep;
  previousSteps: Record<string, unknown>;
}

export interface StepResult {
  valid: boolean;
  data: Record<string, unknown>;
  errors?: string[];
  warnings?: string[];
  nextStep?: string;
}

// UI component props
export interface BaseStepProps {
  context: StepContext;
  onComplete: (result: StepResult) => void;
  onBack?: () => void;
}

// Event types
export interface StepCompleteEvent {
  stepId: string;
  result: StepResult;
  timestamp: number;
}

export interface CharacterUpdateEvent {
  type: 'characteristic' | 'skill' | 'equipment' | 'benefit' | 'other';
  data: unknown;
  timestamp: number;
}

// Store state
export interface CharacterStore {
  character: Character;
  rules: Rules;
  species: Species[];
  careers: Career[];
  preCareerEvents: PreCareerEvent[];
  phases: Phase[];
  currentPhase: PhaseName;
  currentStep: string;
  history: StepCompleteEvent[];
  
  // Actions
  updateCharacter: (updates: Partial<Character>) => void;
  completeStep: (stepId: string, result: StepResult) => void;
  goToStep: (stepId: string) => void;
  goToPhase: (phaseName: PhaseName) => void;
  resetCharacter: () => void;
  loadConfiguration: (rules: Rules, species: Species[], phases: Phase[], careers: Career[], preCareerEvents: PreCareerEvent[]) => void;
}

// Configuration loading
export interface ConfigurationBundle {
  rules: Rules;
  species: Species[];
  phases: Phase[];
  careers: Career[];
  preCareerEvents: PreCareerEvent[];
}

// Error types
export class ConfigurationError extends Error {
  public code: string;
  
  constructor(message: string, code: string) {
    super(message);
    this.name = 'ConfigurationError';
    this.code = code;
  }
}

export class ValidationError extends Error {
  public field: string;
  
  constructor(message: string, field: string) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

// Career Terms System Types
export interface CareerTerm {
  termNumber: number;
  career: Career;
  assignment: CareerAssignment;
  age: number;
  rank: number;
  events: string[];
  skillsGained: Skill[];
  survived: boolean;
  advanced: boolean;
  commissioned?: boolean;
  mustContinue?: boolean; // Natural 12 on advancement
  mishap?: string;
}

export interface CareerTermResult {
  term: CareerTerm;
  character: Character;
  shouldContinue: boolean;
  availableChoices: CareerChoice[];
}

export interface CareerChoice {
  type: 'continue' | 'change_career' | 'change_assignment' | 'university' | 'end_career';
  label: string;
  description: string;
  available: boolean;
  reason?: string; // Why not available
}

export interface SkillTable {
  name: string;
  skills: string[];
  requirement?: string; // e.g., "Officer rank required"
}

export interface TermPhase {
  phase: 'qualification' | 'basic_training' | 'skill_training' | 'survival' | 'advancement' | 'aging' | 'decision';
  completed: boolean;
  result?: unknown;
}

export interface CareerTermState {
  currentTerm: number;
  age: number;
  totalTerms: number;
  activeCareer: Career | null;
  currentAssignment: CareerAssignment | null;
  rank: number;
  commissioned: boolean;
  mustContinue?: boolean; // Natural 12 on advancement
  canReturnToUniversity: boolean;
  terms: CareerTerm[];
  phases: TermPhase[];
}

export interface DraftResult {
  career: Career;
  assignment: CareerAssignment;
  forced: boolean;
}
