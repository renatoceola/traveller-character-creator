# Contributing to Traveller Character Creator v2

## 📋 Project Overview

This project is a configuration-driven, TypeScript-based Traveller RPG character creator implementing Mongoose Traveller 2nd Edition rules. We maintain strict architectural principles to ensure code quality, type safety, and extensibility.

## 🏗️ Core Architectural Principles

### 1. Configuration-Driven Design
- **NO hardcoded game rules in React components**
- All game mechanics must be defined in JSON configuration files
- Components should be generic and configurable
- Rules belong in `/config/` or `/public/config/` directories

```typescript
// ❌ BAD: Hardcoded rules
const rollCharacteristics = () => {
  if (species === 'Aslan') {
    return { STR: roll2d6() + 2, DEX: roll2d6() - 2 }
  }
}

// ✅ GOOD: Configuration-driven using CharacteristicCalculator
import { CharacteristicCalculator } from '@/utils/characteristicCalculator'

const applySpeciesModifiers = (baseStats: Characteristics, species: Species, rules: Rules) => {
  return CharacteristicCalculator.applySpeciesModifiers(baseStats, species, rules)
}

// ✅ REFERENCE IMPLEMENTATION: See StepByStepCreation.tsx for complete example
const calculateModifiers = (characteristics: Characteristics, rules: Rules) => {
  return CharacteristicCalculator.getCharacteristicModifiers(characteristics, rules)
}
```

### 2. Type Safety First
- Use TypeScript strict mode at all times
- Define interfaces before implementation
- Validate runtime data with Zod schemas
- No `any` types except in extreme circumstances

```typescript
// ✅ Required pattern
interface StepConfig {
  id: string
  title: string
  order: number
  enabled: boolean
  phases: PhaseConfig[]
  validation?: ValidationConfig
}

const stepConfigSchema = z.object({
  id: z.string(),
  title: z.string(),
  order: z.number(),
  enabled: z.boolean(),
  phases: z.array(phaseConfigSchema),
  validation: validationConfigSchema.optional()
})
```

### 3. Immutable State Management
- Use Zustand with Immer for state management
- All state updates must be immutable
- Action creators should be pure functions
- Use selectors for computed state

```typescript
// ✅ Correct state update pattern
const useCharacterStore = create<CharacterState>()(
  immer((set) => ({
    updateCharacteristic: (characteristic: Characteristic, value: number) =>
      set((state) => {
        state.characteristics[characteristic] = value
      })
  }))
)
```

## 🎯 Development Guidelines

### Code Organization

#### File Structure Rules
```
src/
├── core/              # Core engine classes (ConfigLoader, StepEngine)
├── store/             # Zustand state management
├── types/             # TypeScript type definitions
├── utils/             # Pure utility functions
├── components/        # React components (NO game logic)
│   ├── phases/       # Step-specific UI components
│   ├── ui/           # Reusable UI components
│   └── forms/        # Form components
└── plugins/          # Plugin implementations (future)
```

#### Import Rules
- Use path aliases: `@/`, `@config/`, `@schemas/`
- Import order: external libraries → internal modules → relative imports
- Use named imports when possible

```typescript
// ✅ Correct import pattern
import { z } from 'zod'
import { create } from 'zustand'

import { ConfigLoader } from '@/core/ConfigLoader'
import type { CharacterState } from '@/types'

import './Component.css'
```

### Component Development

#### Component Rules
1. **Components should be pure and stateless when possible**
2. **Use TypeScript interfaces for all props**
3. **Handle loading and error states**
4. **Follow accessibility guidelines (ARIA labels, keyboard navigation)**

```typescript
// ✅ Component template - Based on StepByStepCreation.tsx and individual step components
interface ComponentProps {
  stepId: string
  species: Species[]        // From configuration
  rules: Rules             // From configuration
  character: Character     // From store
  onComplete: (data: StepData) => void
  onError: (error: Error) => void
}

export function StepComponent({ stepId, species, rules, character, onComplete, onError }: ComponentProps) {
  const stepConfig = useStepConfig(stepId)
  
  // Use configuration-driven calculator utilities
  const calculator = useMemo(() => new CharacteristicCalculator(rules), [rules])
  
  if (!stepConfig) {
    return <LoadingSpinner />
  }

  return (
    <div className="step-container" role="main" aria-labelledby={`step-${stepId}`}>
      <h2 id={`step-${stepId}`}>{stepConfig.title}</h2>
      
      {/* Example: Species selection using SpeciesSelector component */}
      <SpeciesSelector
        species={species}
        selectedSpecies={character.species}
        onSpeciesSelect={(species) => {
          const modifiedStats = calculator.applySpeciesModifiers(
            character.characteristics,
            species
          )
          onComplete({ species, characteristics: modifiedStats })
        }}
      />
      
      {/* Example: Characteristic display using CharacteristicDisplay */}
      <CharacteristicDisplay
        characteristics={character.characteristics}
        rules={rules}
        onReroll={(char) => {
          const newValue = calculator.rollCharacteristic(rules.characteristics.generation)
          onComplete({ [char]: newValue })
        }}
      />
    </div>
  )
}

// ✅ Reference Implementation Files:
// - src/components/ui/StepByStepCreation.tsx - Complete workflow component
// - src/components/steps/HomeworldStep.tsx - Individual step component
// - src/components/ui/SpeciesSelector.tsx - Pure UI component
// - src/components/ui/CharacteristicDisplay.tsx - Configuration-driven display
// - src/utils/characteristicCalculator.ts - Business logic utility
// - src/components/ui/StepEngineIntegration.tsx - Workflow management hook
```

#### Styling Guidelines
- Use Tailwind CSS utility classes
- Follow mobile-first responsive design
- Maintain dark theme compatibility
- Use semantic class names for custom styles

```typescript
// ✅ Correct styling pattern
<div className="flex flex-col gap-4 p-6 bg-gray-900 rounded-lg border border-gray-700 md:flex-row">
  <button className="btn-primary focus:ring-2 focus:ring-blue-500 focus:outline-none">
    Roll Dice
  </button>
</div>
```

### Configuration Management

#### JSON Configuration Rules
1. **All configuration files must have corresponding Zod schemas**
2. **Use semantic versioning for configuration changes**
3. **Maintain backward compatibility when possible**
4. **Document configuration changes in CHANGELOG**

```json
// ✅ Configuration file pattern
{
  "version": "2.1.0",
  "metadata": {
    "title": "Mongoose Traveller 2nd Edition",
    "description": "Official M22 rules configuration",
    "lastUpdated": "2024-12-28"
  },
  "rules": {
    "characteristics": {
      "generation": {
        "method": "2d6",
        "rolls": 6,
        "assignment": "free"
      }
    }
  }
}
```

#### Schema Validation
- Every configuration file must have a Zod schema in `/schemas/`
- Schemas should provide helpful error messages
- Use runtime validation for all external data

```typescript
// ✅ Schema pattern
const speciesConfigSchema = z.object({
  name: z.string().min(1, "Species name is required"),
  modifiers: z.array(z.object({
    characteristic: z.enum(['STR', 'DEX', 'END', 'INT', 'EDU', 'SOC']),
    modifier: z.number().int().min(-3).max(3)
  })),
  traits: z.array(z.string()).optional()
}).strict()
```

## 🧪 Testing Requirements

### Test Strategy
- **Unit tests**: Core functions and utilities
- **Component tests**: React component behavior
- **Integration tests**: Configuration loading and validation
- **E2E tests**: Complete character creation workflow

### Testing Rules
1. Test file naming: `ComponentName.test.tsx`
2. Place tests alongside source files
3. Aim for 90%+ test coverage
4. Mock external dependencies
5. Test error conditions

```typescript
// ✅ Test pattern
describe('ConfigLoader', () => {
  it('should load and validate configuration', async () => {
    const config = await ConfigLoader.getInstance().loadRules()
    expect(config).toBeDefined()
    expect(config.version).toMatch(/^\d+\.\d+\.\d+$/)
  })

  it('should handle invalid configuration gracefully', async () => {
    await expect(ConfigLoader.loadInvalidConfig()).rejects.toThrow()
  })
})
```

## 🔄 Development Workflow

### Branch Strategy
- `main`: Production-ready code
- `develop`: Integration branch for features
- `feature/`: New features and enhancements
- `fix/`: Bug fixes
- `config/`: Configuration updates

### Commit Guidelines
Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(core): add species trait system
fix(ui): resolve dice rolling animation issue
config(species): add Zhodani psionic traits
docs(readme): update installation instructions
test(store): add character state management tests
```

### Pull Request Process
1. **Create feature branch from `develop`**
2. **Write tests for new functionality**
3. **Update documentation if needed**
4. **Ensure all tests pass and TypeScript compiles**
5. **Request review from core team member**

### Code Review Checklist
- [ ] TypeScript compiles without errors
- [ ] All tests pass
- [ ] No hardcoded game rules in components
- [ ] Configuration files have corresponding schemas
- [ ] Components handle loading and error states
- [ ] Accessibility guidelines followed
- [ ] Performance considerations addressed

## 📚 Documentation Standards

### Code Documentation
- Use JSDoc for public APIs
- Document complex algorithms and business logic
- Include examples for configuration formats
- Maintain README files for each major directory

```typescript
/**
 * Calculates characteristic modifiers based on Traveller rules
 * @param value - Characteristic value (0-15)
 * @returns Dice modifier (-3 to +3)
 * @example
 * ```typescript
 * getCharacteristicModifier(15) // returns 3
 * getCharacteristicModifier(6)  // returns 0
 * ```
 */
function getCharacteristicModifier(value: number): number {
  // Implementation
}
```

### Configuration Documentation
- Document all configuration options
- Provide examples for common use cases
- Explain relationship between configuration files
- Include migration guides for version changes

## 🚨 Common Mistakes to Avoid

### ❌ Anti-Patterns
1. **Hardcoded game rules in React components**
2. **Direct DOM manipulation instead of React patterns**
3. **Mutating state directly without Immer**
4. **Using `any` type instead of proper interfaces**
5. **Missing error handling for async operations**
6. **Not validating external data with schemas**

### ❌ Configuration Mistakes
1. **Adding game logic to UI components**
2. **Inconsistent data structures across configs**
3. **Missing version information in configs**
4. **Not updating schemas when changing configs**

### ❌ Performance Issues
1. **Unnecessary re-renders without memoization**
2. **Loading large configurations synchronously**
3. **Not implementing proper loading states**
4. **Inefficient list rendering without keys**

## 📞 Getting Help

### Resources
- **Project Specification**: `PROJECT_SPECIFICATION.md`
- **Development Roadmap**: `DEVELOPMENT_ROADMAP.md`
- **Project Status**: `PROJECT_STATUS.md`
- **AI Assistant Summary**: `AI_ASSISTANT_SUMMARY.md`

### Code Review Process
- Create draft PR early for feedback
- Tag appropriate reviewers
- Respond to feedback constructively
- Update documentation with changes

### Issues and Bugs
- Use GitHub Issues with appropriate labels
- Include reproduction steps
- Provide system information
- Reference related configuration files

---

## 🎯 Success Criteria

Following these guidelines ensures:
- ✅ **Maintainable Code**: Easy to understand and modify
- ✅ **Type Safety**: Prevents runtime errors
- ✅ **Configuration Flexibility**: Easy rule customization
- ✅ **Extensibility**: Plugin system ready architecture
- ✅ **Performance**: Optimized bundle and runtime
- ✅ **Accessibility**: Inclusive user experience

**Remember**: The goal is a configuration-driven system where game rules live in JSON files, not in React components. Every contribution should move us closer to this vision while maintaining code quality and user experience.
