# Traveller Character Creator v2 - Architecture Guidelines

## 🏗️ System Architecture Overview

This document defines the mandatory architectural patterns and principles that must be followed to maintain the integrity of the Traveller Character Creator's configuration-driven, plugin-extensible design.

## 🎯 Core Architectural Principles

### 1. Configuration-Driven Design Pattern

**Principle**: All game logic must be externalized to configuration files. No hardcoded game rules in source code.

```typescript
// ❌ ANTI-PATTERN: Hardcoded game logic
export function CharacteristicGeneration() {
  const rollAslan = () => {
    return {
      STR: roll2d6() + 2,  // Hardcoded modifier
      DEX: roll2d6() - 2   // Hardcoded modifier
    }
  }
}

// ✅ ARCHITECTURAL PATTERN: Configuration-driven with CharacteristicCalculator
import { CharacteristicCalculator } from '@/utils/characteristicCalculator'

export function CharacteristicGeneration({ species, rules }: { species: Species; rules: Rules }) {
  const calculator = new CharacteristicCalculator(rules)
  
  const generateCharacteristics = (): Characteristics => {
    const baseCharacteristics = calculator.rollAllCharacteristics()
    return calculator.applySpeciesModifiers(baseCharacteristics, species)
  }
  
  // ✅ REFERENCE: See StepByStepCreation.tsx for complete implementation
}
```

**Implementation Requirements:**
- All game data in `/config/` or `/public/config/` directories
- Runtime validation with Zod schemas
- Type-safe configuration interfaces
- Hot-reloadable configurations in development

### 2. Layered Architecture Pattern

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                       │
│  React Components (NO game logic, pure UI concerns)        │
├─────────────────────────────────────────────────────────────┤
│                   Application Layer                         │
│  Step Engine, Workflow Management, State Orchestration     │
├─────────────────────────────────────────────────────────────┤
│                    Domain Layer                             │
│  Game Rules Engine, Validation, Business Logic             │
├─────────────────────────────────────────────────────────────┤
│                 Infrastructure Layer                        │
│  Configuration Loading, Data Persistence, External APIs    │
└─────────────────────────────────────────────────────────────┘
```

**Layer Responsibilities:**

#### Presentation Layer (`/src/components/`)
- **Responsibility**: UI rendering, user interactions, visual feedback
- **Restrictions**: NO game logic, NO direct configuration access
- **Dependencies**: Application layer only

```typescript
// ✅ CORRECT: Pure UI component - See SpeciesSelector.tsx reference
interface SpeciesSelectionProps {
  readonly species: Species[]
  readonly selectedSpecies: Species | null
  readonly onSpeciesSelect: (species: Species) => void
  readonly isLoading: boolean
}

export function SpeciesSelection({ species, selectedSpecies, onSpeciesSelect, isLoading }: SpeciesSelectionProps) {
  if (isLoading) return <LoadingSpinner />
  
  return (
    <div className="species-grid">
      {species.map(s => (
        <SpeciesCard 
          key={s.id}
          species={s}
          isSelected={selectedSpecies?.id === s.id}
          onSelect={() => onSpeciesSelect(s)}
        />
      ))}
    </div>
  )
}

// ✅ REFERENCE IMPLEMENTATIONS:
// - src/components/ui/SpeciesSelector.tsx - Complete UI component
// - src/components/ui/StepByStepCreation.tsx - Complete workflow integration
```

#### Application Layer (`/src/core/`)
- **Responsibility**: Workflow management, state coordination, step orchestration
- **Dependencies**: Domain layer, Infrastructure layer

```typescript
// ✅ CORRECT: Application service
export class StepEngine {
  constructor(
    private configLoader: ConfigLoader,
    private ruleEngine: RuleEngine,
    private characterStore: CharacterStore
  ) {}

  async executeStep(stepId: string, input: StepInput): Promise<StepResult> {
    const stepConfig = await this.configLoader.getStepConfig(stepId)
    const validationResult = this.ruleEngine.validateStep(stepConfig, input)
    
    if (!validationResult.isValid) {
      return { success: false, errors: validationResult.errors }
    }

    const result = this.ruleEngine.processStep(stepConfig, input)
    this.characterStore.updateCharacter(result.characterUpdates)
    
    return { success: true, data: result }
  }
}
```

#### Domain Layer (`/src/utils/`, `/src/types/`)
- **Responsibility**: Game rules implementation, business logic, calculations
- **Dependencies**: Only within domain layer

```typescript
// ✅ CORRECT: Domain logic using CharacteristicCalculator
import { CharacteristicCalculator } from '@/utils/characteristicCalculator'

export class GameRulesEngine {
  constructor(private rules: Rules) {}

  calculateCharacteristicModifier(value: number): number {
    return CharacteristicCalculator.getCharacteristicModifier(value, this.rules)
  }

  applySpeciesModifiers(base: Characteristics, species: Species): Characteristics {
    return CharacteristicCalculator.applySpeciesModifiers(base, species, this.rules)
  }

  validateCharacteristics(characteristics: Characteristics): ValidationResult {
    return CharacteristicCalculator.validateCharacteristics(characteristics, this.rules)
  }
  
  // ✅ REFERENCE: Complete implementation in src/utils/characteristicCalculator.ts
}
```

#### Infrastructure Layer (`/src/core/ConfigLoader.ts`, `/src/store/`)
- **Responsibility**: Data access, configuration loading, persistence
- **Dependencies**: External systems only

```typescript
// ✅ CORRECT: Infrastructure service
export class ConfigLoader {
  private static instance: ConfigLoader
  private configCache = new Map<string, unknown>()

  async loadConfiguration<T>(
    path: string, 
    schema: z.ZodSchema<T>, 
    useCache = true
  ): Promise<T> {
    if (useCache && this.configCache.has(path)) {
      return this.configCache.get(path) as T
    }

    const response = await fetch(path)
    const data = await response.json()
    const validated = schema.parse(data)
    
    if (useCache) {
      this.configCache.set(path, validated)
    }
    
    return validated
  }
}
```

### 3. Plugin Architecture Pattern

**Principle**: System must support runtime extension through plugins without core modifications.

```typescript
// ✅ PLUGIN INTERFACE: Extensibility contract
export interface TravellerPlugin {
  readonly id: string
  readonly name: string
  readonly version: string
  readonly dependencies?: readonly string[]
  
  readonly provides: {
    readonly species?: readonly SpeciesDefinition[]
    readonly careers?: readonly CareerDefinition[]
    readonly steps?: readonly StepDefinition[]
    readonly rules?: readonly RuleOverride[]
    readonly components?: readonly ComponentDefinition[]
  }

  install(context: PluginContext): void | Promise<void>
  uninstall(context: PluginContext): void | Promise<void>
}

// ✅ PLUGIN SYSTEM: Runtime plugin management
export class PluginSystem {
  private plugins = new Map<string, TravellerPlugin>()
  private componentRegistry = new Map<string, ComponentDefinition>()

  async installPlugin(plugin: TravellerPlugin): Promise<void> {
    this.validateDependencies(plugin)
    
    // Register plugin-provided components
    plugin.provides.components?.forEach(component => {
      this.componentRegistry.set(component.type, component)
    })

    // Merge plugin configuration
    await this.mergeConfiguration(plugin.provides)
    
    // Execute plugin installation
    await plugin.install(this.createPluginContext(plugin))
    
    this.plugins.set(plugin.id, plugin)
  }
}
```

### 4. Event-Driven Architecture Pattern

**Principle**: Loose coupling through events for cross-cutting concerns.

```typescript
// ✅ EVENT SYSTEM: Decoupled communication
export interface CharacterEvent {
  readonly type: string
  readonly timestamp: number
  readonly payload: unknown
}

export interface CharacterEventBus {
  subscribe<T extends CharacterEvent>(
    eventType: string, 
    handler: (event: T) => void
  ): () => void
  
  publish<T extends CharacterEvent>(event: T): void
}

// Example usage in character creation
export class CharacterCreationService {
  constructor(private eventBus: CharacterEventBus) {}

  updateCharacteristic(char: Characteristic, value: number): void {
    // Update state
    this.characterStore.updateCharacteristic(char, value)
    
    // Publish event for other systems
    this.eventBus.publish({
      type: 'characteristic_updated',
      timestamp: Date.now(),
      payload: { characteristic: char, value, newModifier: calculateModifier(value) }
    })
  }
}
```

## 📊 Data Flow Architecture

### Unidirectional Data Flow Pattern

```typescript
// ✅ DATA FLOW: Configuration → Store → Components
Configuration Files → ConfigLoader → StepEngine → CharacterStore → React Components

// User Actions Flow
User Interaction → Component Event → Store Action → State Update → Component Re-render
```

**Implementation Rules:**
1. **Data flows down**: Props and selectors only
2. **Events flow up**: Callbacks and actions only
3. **Side effects**: Contained in services and stores
4. **Pure components**: No direct state mutations

### State Management Architecture

```typescript
// ✅ STATE ARCHITECTURE: Zustand with Immer
interface CharacterCreationState {
  // Current character data
  readonly character: Character
  readonly currentStep: string
  readonly completedSteps: readonly string[]
  
  // Configuration state
  readonly rules: Rules | null
  readonly species: readonly Species[]
  readonly isLoading: boolean
  readonly error: Error | null
  
  // Actions (Immer-based mutations)
  readonly actions: {
    updateCharacteristic: (char: Characteristic, value: number) => void
    selectSpecies: (species: Species) => void
    completeStep: (stepId: string) => void
    loadConfiguration: () => Promise<void>
  }
}

// Store implementation with proper separation
export const useCharacterStore = create<CharacterCreationState>()(
  immer((set, get) => ({
    // State
    character: createEmptyCharacter(),
    currentStep: 'roll-characteristics',
    completedSteps: [],
    rules: null,
    species: [],
    isLoading: false,
    error: null,

    // Actions
    actions: {
      updateCharacteristic: (char, value) => set(state => {
        state.character.characteristics[char] = value
        // Trigger recalculation of dependent values
        state.character.modifiers[char] = CharacteristicCalculator.calculateModifier(value)
      }),

      selectSpecies: (species) => set(state => {
        state.character.species = species
        // Apply species modifiers
        state.character.characteristics = CharacteristicCalculator.applySpeciesModifiers(
          state.character.baseCharacteristics,
          species
        )
      })
    }
  }))
)
```

## 🔄 Component Lifecycle Architecture

### Step Component Pattern

```typescript
// ✅ STEP COMPONENT: Standardized lifecycle
export interface StepComponentProps<TConfig = unknown, TData = unknown> {
  readonly stepId: string
  readonly config: TConfig
  readonly initialData?: TData
  readonly onComplete: (data: TData) => void
  readonly onError: (error: Error) => void
  readonly onBack?: () => void
}

export interface StepComponent<TConfig = unknown, TData = unknown> {
  readonly displayName: string
  readonly configSchema: z.ZodSchema<TConfig>
  readonly Component: React.ComponentType<StepComponentProps<TConfig, TData>>
}

// Step registration system
export class StepRegistry {
  private steps = new Map<string, StepComponent>()

  register<TConfig, TData>(
    stepType: string, 
    component: StepComponent<TConfig, TData>
  ): void {
    this.steps.set(stepType, component)
  }

  create(stepType: string, props: StepComponentProps): React.ReactElement {
    const stepComponent = this.steps.get(stepType)
    if (!stepComponent) {
      throw new Error(`Unknown step type: ${stepType}`)
    }

    // Validate configuration at runtime
    const validatedConfig = stepComponent.configSchema.parse(props.config)
    
    return React.createElement(stepComponent.Component, {
      ...props,
      config: validatedConfig
    })
  }
}
```

### Error Boundary Architecture

```typescript
// ✅ ERROR HANDLING: Comprehensive error boundaries
export class CharacterCreationErrorBoundary extends React.Component<
  PropsWithChildren<{}>,
  { hasError: boolean; error: Error | null }
> {
  constructor(props: PropsWithChildren<{}>) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error with context
    console.error('Character creation error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorRecoveryComponent 
          error={this.state.error}
          onRetry={() => this.setState({ hasError: false, error: null })}
        />
      )
    }

    return this.props.children
  }
}
```

## 🎮 Game Engine Architecture

### Rule Engine Pattern

```typescript
// ✅ RULE ENGINE: Generic rule evaluation
export interface Rule {
  readonly id: string
  readonly type: string
  readonly condition: string  // Formula like "2d6 + characteristic_DM >= target"
  readonly effects: readonly RuleEffect[]
}

export interface RuleEffect {
  readonly type: 'modify_characteristic' | 'add_skill' | 'add_trait' | 'custom'
  readonly target: string
  readonly value: string | number
  readonly condition?: string
}

export class RuleEngine {
  private formulaParser = new FormulaParser()

  async evaluateRule(rule: Rule, context: RuleContext): Promise<RuleResult> {
    // Parse and evaluate condition
    const conditionResult = this.formulaParser.evaluate(rule.condition, context)
    
    if (!conditionResult.success) {
      return { success: false, errors: conditionResult.errors }
    }

    // Apply effects if condition is true
    const effects: AppliedEffect[] = []
    if (conditionResult.value) {
      for (const effect of rule.effects) {
        const effectResult = await this.applyEffect(effect, context)
        effects.push(effectResult)
      }
    }

    return { success: true, effects }
  }

  private async applyEffect(effect: RuleEffect, context: RuleContext): Promise<AppliedEffect> {
    switch (effect.type) {
      case 'modify_characteristic':
        return this.modifyCharacteristic(effect, context)
      case 'add_skill':
        return this.addSkill(effect, context)
      default:
        throw new Error(`Unknown effect type: ${effect.type}`)
    }
  }
}
```

### Formula Parser Architecture

```typescript
// ✅ FORMULA SYSTEM: Generic formula evaluation
export interface FormulaContext {
  readonly characteristics: Record<Characteristic, number>
  readonly skills: Record<string, number>
  readonly traits: readonly string[]
  readonly variables: Record<string, number>
}

export class FormulaParser {
  private operators = {
    '+': (a: number, b: number) => a + b,
    '-': (a: number, b: number) => a - b,
    '*': (a: number, b: number) => a * b,
    '/': (a: number, b: number) => Math.floor(a / b),
    '>=': (a: number, b: number) => a >= b,
    '<=': (a: number, b: number) => a <= b,
    '>': (a: number, b: number) => a > b,
    '<': (a: number, b: number) => a < b,
    '==': (a: number, b: number) => a === b
  }

  evaluate(formula: string, context: FormulaContext): FormulaResult {
    try {
      // Parse dice expressions (2d6, 3d6, etc.)
      const withDiceRolled = this.resolveDiceExpressions(formula)
      
      // Replace variables with values
      const withVariables = this.resolveVariables(withDiceRolled, context)
      
      // Evaluate mathematical expression
      const result = this.evaluateExpression(withVariables)
      
      return { success: true, value: result }
    } catch (error) {
      return { 
        success: false, 
        errors: [`Formula evaluation failed: ${error.message}`] 
      }
    }
  }

  private resolveDiceExpressions(formula: string): string {
    return formula.replace(/(\d+)d(\d+)/g, (match, count, sides) => {
      const rolls = Array.from({ length: parseInt(count) }, () => 
        Math.floor(Math.random() * parseInt(sides)) + 1
      )
      return rolls.reduce((sum, roll) => sum + roll, 0).toString()
    })
  }
}
```

## 🔌 Plugin System Architecture

### Plugin Loading Pattern

```typescript
// ✅ PLUGIN SYSTEM: Safe plugin loading
export class PluginLoader {
  private sandbox = new PluginSandbox()

  async loadPlugin(pluginCode: string): Promise<TravellerPlugin> {
    // Create isolated execution context
    const context = this.sandbox.createContext()
    
    // Load plugin in sandbox
    const plugin = await this.sandbox.execute(pluginCode, context)
    
    // Validate plugin interface
    const validatedPlugin = this.validatePlugin(plugin)
    
    return validatedPlugin
  }

  private validatePlugin(plugin: unknown): TravellerPlugin {
    const pluginSchema = z.object({
      id: z.string(),
      name: z.string(),
      version: z.string(),
      provides: z.object({
        species: z.array(speciesDefinitionSchema).optional(),
        careers: z.array(careerDefinitionSchema).optional(),
        steps: z.array(stepDefinitionSchema).optional(),
        rules: z.array(ruleOverrideSchema).optional()
      }),
      install: z.function(),
      uninstall: z.function()
    })

    return pluginSchema.parse(plugin)
  }
}
```

### Configuration Merging Strategy

```typescript
// ✅ CONFIGURATION MERGING: Plugin configuration integration
export class ConfigurationMerger {
  mergeConfigurations(
    baseConfig: Configuration,
    pluginConfigs: readonly PluginConfiguration[]
  ): Configuration {
    return pluginConfigs.reduce((merged, pluginConfig) => {
      return {
        species: [...merged.species, ...pluginConfig.species],
        careers: this.mergeWithOverrides(merged.careers, pluginConfig.careers),
        rules: this.applyRuleOverrides(merged.rules, pluginConfig.ruleOverrides)
      }
    }, baseConfig)
  }

  private mergeWithOverrides<T extends { id: string }>(
    base: readonly T[],
    additions: readonly T[]
  ): readonly T[] {
    const baseMap = new Map(base.map(item => [item.id, item]))
    
    // Apply additions/overrides
    additions.forEach(item => {
      baseMap.set(item.id, item)
    })
    
    return Array.from(baseMap.values())
  }
}
```

## 📊 Performance Architecture

### Lazy Loading Strategy

```typescript
// ✅ PERFORMANCE: Component lazy loading
export const StepComponents = {
  'roll-characteristics': lazy(() => import('./phases/RollCharacteristicsStep')),
  'choose-species': lazy(() => import('./phases/ChooseSpeciesStep')),
  'career-selection': lazy(() => import('./phases/CareerSelectionStep')),
  'equipment': lazy(() => import('./phases/EquipmentStep'))
}

// Dynamic component loading with suspense
export function StepRenderer({ stepType, ...props }: StepRendererProps) {
  const Component = StepComponents[stepType]
  
  if (!Component) {
    throw new Error(`Unknown step type: ${stepType}`)
  }

  return (
    <Suspense fallback={<StepLoadingSpinner />}>
      <Component {...props} />
    </Suspense>
  )
}
```

### Memory Management

```typescript
// ✅ MEMORY: Cleanup and resource management
export class ResourceManager {
  private subscriptions = new Set<() => void>()
  private timers = new Set<NodeJS.Timeout>()

  addSubscription(cleanup: () => void): void {
    this.subscriptions.add(cleanup)
  }

  addTimer(timer: NodeJS.Timeout): void {
    this.timers.add(timer)
  }

  cleanup(): void {
    // Cleanup subscriptions
    this.subscriptions.forEach(cleanup => cleanup())
    this.subscriptions.clear()

    // Clear timers
    this.timers.forEach(timer => clearTimeout(timer))
    this.timers.clear()
  }
}

// Hook for resource management
export function useResourceManager(): ResourceManager {
  const manager = useRef(new ResourceManager())

  useEffect(() => {
    return () => manager.current.cleanup()
  }, [])

  return manager.current
}
```

## 🔍 Testing Architecture

### Test Architecture Layers

```typescript
// ✅ TESTING: Comprehensive test strategy
describe('Character Creation System', () => {
  describe('Unit Tests', () => {
    describe('CharacteristicCalculator', () => {
      it('should calculate correct modifiers', () => {
        expect(CharacteristicCalculator.calculateModifier(15)).toBe(3)
        expect(CharacteristicCalculator.calculateModifier(8)).toBe(0)
        expect(CharacteristicCalculator.calculateModifier(1)).toBe(-2)
      })
    })
  })

  describe('Integration Tests', () => {
    describe('Step Engine', () => {
      it('should process complete workflow', async () => {
        const engine = new StepEngine(mockConfigLoader, mockRuleEngine, mockStore)
        const result = await engine.executeWorkflow(testCharacterData)
        expect(result.success).toBe(true)
      })
    })
  })

  describe('Component Tests', () => {
    describe('SpeciesSelection', () => {
      it('should render species options', () => {
        render(<SpeciesSelection species={mockSpecies} onSelect={mockCallback} />)
        expect(screen.getByText('Human')).toBeInTheDocument()
      })
    })
  })
})
```

---

## 🎯 Architecture Compliance Checklist

### Core Architecture ✅
- [ ] Configuration-driven design (no hardcoded rules)
- [ ] Layered architecture with proper separation
- [ ] Plugin-ready extensibility points
- [ ] Event-driven loose coupling
- [ ] Unidirectional data flow

### Code Organization ✅
- [ ] Clear layer boundaries
- [ ] Proper dependency injection
- [ ] Single responsibility principle
- [ ] Interface segregation
- [ ] Dependency inversion

### Performance ✅
- [ ] Lazy loading for large components
- [ ] Memoization for expensive calculations
- [ ] Resource cleanup and memory management
- [ ] Bundle size optimization
- [ ] Runtime performance monitoring

### Quality ✅
- [ ] Comprehensive test coverage
- [ ] Type safety at all levels
- [ ] Error handling and recovery
- [ ] Accessibility compliance
- [ ] Documentation completeness

**Remember**: This architecture ensures our system remains flexible, maintainable, and true to the vision of a fully configuration-driven Traveller character creator. Every architectural decision should support plugin extensibility and zero hardcoded game rules.
