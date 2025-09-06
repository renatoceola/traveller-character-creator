# Traveller Character Creator v2 - Coding Standards

## 📋 Code Quality Standards

This document defines the mandatory coding standards for maintaining project integrity, consistency, and quality in the Traveller Character Creator v2 project.

## 🎯 Core Principles

### 1. TypeScript Strict Mode
**Mandatory**: All code must compile with TypeScript strict mode enabled.

```typescript
// tsconfig.json - REQUIRED configuration
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true
  }
}
```

**Enforcement Rules:**
- ❌ **NO `any` types** (use `unknown` if necessary)
- ❌ **NO implicit returns** in functions
- ❌ **NO unused variables or parameters**
- ✅ **Define explicit return types** for all functions
- ✅ **Use proper interface definitions**

### 2. Configuration-Driven Architecture
**Mandatory**: Zero hardcoded game rules in React components.

```typescript
// ❌ FORBIDDEN: Hardcoded game logic
function CharacteristicRoll({ species }: Props) {
  if (species === 'Aslan') {
    return rollDice() + 2  // NEVER hardcode modifiers
  }
}

// ✅ REQUIRED: Configuration-driven using CharacteristicCalculator
import { CharacteristicCalculator } from '@/utils/characteristicCalculator'

function CharacteristicRoll({ characteristic, species, rules }: Props) {
  const calculator = new CharacteristicCalculator(rules)
  const modifiedValue = calculator.applySpeciesModifiers(
    { [characteristic]: rollDice() },
    species
  )
  return modifiedValue[characteristic]
}

// ✅ REFERENCE: See StepByStepCreation.tsx and individual step components for complete implementation
```

**Enforcement Rules:**
- ❌ **NO hardcoded numbers** for game mechanics
- ❌ **NO hardcoded species/career/skill names**
- ❌ **NO hardcoded rules or formulas**
- ✅ **ALL game data from configuration files**
- ✅ **Components receive configuration as props**

### 3. Immutable State Management
**Mandatory**: All state updates must be immutable using Zustand + Immer.

```typescript
// ✅ REQUIRED: Immutable state pattern
const useCharacterStore = create<CharacterState>()(
  immer((set, get) => ({
    characteristics: initialCharacteristics,
    
    updateCharacteristic: (char: Characteristic, value: number) =>
      set((state) => {
        state.characteristics[char] = value
      }),
    
    // ❌ FORBIDDEN: Direct mutation
    // updateCharacteristic: (char, value) => {
    //   get().characteristics[char] = value  // NEVER mutate directly
    // }
  }))
)
```

## 🏗️ File Organization Standards

### Directory Structure (Mandatory)
```
src/
├── core/                    # ✅ Core engine classes ONLY
│   ├── ConfigLoader.ts     # Configuration management
│   ├── StepEngine.ts       # Workflow management
│   └── ValidationEngine.ts # Rule validation
├── store/                   # ✅ Zustand stores ONLY
│   ├── characterStore.ts   # Character creation state
│   └── configStore.ts      # Configuration state
├── types/                   # ✅ TypeScript definitions ONLY
│   ├── index.ts           # Main type exports
│   ├── character.ts       # Character-related types
│   └── config.ts          # Configuration types
├── utils/                   # ✅ Pure functions ONLY
│   ├── dice.ts            # Dice mechanics
│   ├── validation.ts      # Validation helpers
│   └── calculations.ts    # Game calculations
├── components/              # ✅ React components ONLY
│   ├── phases/            # Step-specific components
│   ├── ui/                # Reusable UI components
│   └── forms/             # Form components
└── plugins/                # 🚧 Future plugin system
```

**File Naming Rules:**
- **PascalCase** for components: `ChooseSpeciesStep.tsx`
- **camelCase** for utilities: `diceRoller.ts`
- **kebab-case** for configuration: `species-config.json`
- **SCREAMING_SNAKE_CASE** for constants: `DEFAULT_CHARACTERISTICS.ts`

### Import Organization (Mandatory)
```typescript
// ✅ REQUIRED import order and grouping
// 1. External libraries
import React, { useState, useEffect } from 'react'
import { z } from 'zod'
import { create } from 'zustand'

// 2. Internal modules (absolute imports)
import { ConfigLoader } from '@/core/ConfigLoader'
import { useCharacterStore } from '@/store/characterStore'
import type { Species, CharacterState } from '@/types'

// 3. Relative imports
import { DiceRoller } from './DiceRoller'
import './Component.css'
```

## 🎨 Component Standards

### Component Interface Definition (Mandatory)
```typescript
// ✅ REQUIRED: Explicit prop interfaces
interface StepComponentProps {
  readonly stepId: string
  readonly config: StepConfig
  readonly onComplete: (data: StepData) => void
  readonly onError: (error: Error) => void
  readonly isLoading?: boolean
}

// ✅ REQUIRED: Default props when applicable
const defaultProps: Partial<StepComponentProps> = {
  isLoading: false
}

export function StepComponent(props: StepComponentProps) {
  const { stepId, config, onComplete, onError, isLoading = false } = props
  // Implementation
}
```

### Error Handling (Mandatory)
```typescript
// ✅ REQUIRED: Comprehensive error handling
export function ConfigLoadingComponent() {
  const [config, setConfig] = useState<Config | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    ConfigLoader.getInstance()
      .loadRules()
      .then(setConfig)
      .catch(setError)
      .finally(() => setIsLoading(false))
  }, [])

  if (error) {
    return <ErrorBoundary error={error} />
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!config) {
    return <NoDataMessage />
  }

  return <ComponentContent config={config} />
}
```

### Accessibility Standards (Mandatory)
```typescript
// ✅ REQUIRED: Accessibility attributes
export function DiceRollingComponent({ onRoll }: Props) {
  return (
    <div role="region" aria-labelledby="dice-section">
      <h3 id="dice-section">Roll Characteristics</h3>
      <button
        onClick={onRoll}
        aria-describedby="dice-help"
        className="focus:ring-2 focus:ring-blue-500 focus:outline-none"
      >
        Roll 2D6
      </button>
      <p id="dice-help" className="sr-only">
        Click to roll two six-sided dice for characteristic generation
      </p>
    </div>
  )
}
```

## 📊 Data Validation Standards

### Zod Schema Requirements (Mandatory)
```typescript
// ✅ REQUIRED: Every configuration type needs a Zod schema
export const speciesConfigSchema = z.object({
  name: z.string().min(1, "Species name is required"),
  modifiers: z.array(z.object({
    characteristic: z.enum(['STR', 'DEX', 'END', 'INT', 'EDU', 'SOC'], {
      errorMap: () => ({ message: "Invalid characteristic" })
    }),
    modifier: z.number().int().min(-3).max(3, "Modifier must be between -3 and +3")
  })),
  traits: z.array(z.string()).optional().default([]),
  homeworld: z.string().optional()
}).strict()

// ✅ REQUIRED: Type inference from schema
export type SpeciesConfig = z.infer<typeof speciesConfigSchema>
```

### Runtime Validation (Mandatory)
```typescript
// ✅ REQUIRED: Validate all external data
export class ConfigLoader {
  private async loadAndValidateConfig<T>(
    path: string, 
    schema: z.ZodSchema<T>
  ): Promise<T> {
    try {
      const response = await fetch(path)
      const data = await response.json()
      
      // REQUIRED: Always validate runtime data
      return schema.parse(data)
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ConfigValidationError(
          `Invalid configuration at ${path}`,
          error.errors
        )
      }
      throw new ConfigLoadError(`Failed to load ${path}`, error)
    }
  }
}
```

## 🧪 Testing Standards

### Test File Organization (Mandatory)
```
src/
├── components/
│   ├── ChooseSpeciesStep.tsx
│   └── ChooseSpeciesStep.test.tsx    # ✅ Test alongside component
├── utils/
│   ├── dice.ts
│   └── dice.test.ts                  # ✅ Test alongside utility
└── core/
    ├── ConfigLoader.ts
    └── ConfigLoader.test.ts          # ✅ Test alongside core class
```

### Test Structure (Mandatory)
```typescript
// ✅ REQUIRED: Comprehensive test coverage
describe('ConfigLoader', () => {
  let configLoader: ConfigLoader

  beforeEach(() => {
    configLoader = ConfigLoader.getInstance()
  })

  describe('loadRules', () => {
    it('should load valid configuration successfully', async () => {
      const rules = await configLoader.loadRules()
      
      expect(rules).toBeDefined()
      expect(rules.version).toMatch(/^\d+\.\d+\.\d+$/)
      expect(rules.characteristics).toBeDefined()
    })

    it('should throw ConfigValidationError for invalid data', async () => {
      // Mock invalid response
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        json: () => Promise.resolve({ invalid: 'data' })
      } as Response)

      await expect(configLoader.loadRules()).rejects.toThrow(ConfigValidationError)
    })

    it('should handle network errors gracefully', async () => {
      jest.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network error'))

      await expect(configLoader.loadRules()).rejects.toThrow(ConfigLoadError)
    })
  })
})
```

### Test Coverage Requirements
- **Minimum 90% code coverage**
- **All public APIs must be tested**
- **Error conditions must be tested**
- **Configuration validation must be tested**

## 🎨 Styling Standards

### Tailwind CSS Usage (Mandatory)
```typescript
// ✅ REQUIRED: Semantic class combinations
export function CharacterCard({ character }: Props) {
  return (
    <div className="flex flex-col gap-4 p-6 bg-gray-900 border border-gray-700 rounded-lg shadow-lg">
      <h3 className="text-xl font-semibold text-gray-100">
        {character.name}
      </h3>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
        {/* Characteristic display */}
      </div>
    </div>
  )
}

// ❌ FORBIDDEN: Custom CSS without justification
// .custom-character-card {
//   /* Avoid custom CSS when Tailwind classes exist */
// }
```

### Responsive Design (Mandatory)
```typescript
// ✅ REQUIRED: Mobile-first responsive design
<div className="
  flex flex-col gap-2           /* Mobile: stack vertically */
  sm:flex-row sm:gap-4          /* Small screens: horizontal */
  md:gap-6                      /* Medium screens: more space */
  lg:max-w-4xl lg:mx-auto       /* Large screens: center with max width */
">
```

### Dark Theme Compatibility (Mandatory)
```typescript
// ✅ REQUIRED: Dark theme support
<button className="
  px-4 py-2 
  text-gray-900 bg-gray-100        /* Light theme */
  dark:text-gray-100 dark:bg-gray-800  /* Dark theme */
  border border-gray-300 
  dark:border-gray-600
  hover:bg-gray-200 
  dark:hover:bg-gray-700
  focus:ring-2 focus:ring-blue-500
">
```

## 📝 Configuration Standards

### JSON Configuration Format (Mandatory)
```json
{
  "version": "2.1.0",
  "metadata": {
    "title": "Configuration Name",
    "description": "Clear description of configuration purpose",
    "author": "Author Name",
    "lastUpdated": "2024-12-28",
    "compatibleWith": ["2.0.0", "2.1.0"]
  },
  "data": {
    "rules": {},
    "species": {},
    "careers": {}
  }
}
```

### Configuration Validation Rules
1. **Every config file must have a version**
2. **All configs must have metadata section**
3. **Use semantic versioning (semver)**
4. **Include compatibility information**
5. **Validate against Zod schemas**

## 🚨 Code Review Checklist

### Pre-Commit Requirements (Mandatory)
- [ ] **TypeScript compiles without errors**
- [ ] **All tests pass**
- [ ] **ESLint passes without warnings**
- [ ] **No console.log statements** (use proper logging)
- [ ] **All functions have explicit return types**
- [ ] **No hardcoded game rules in components**

### Pull Request Requirements (Mandatory)
- [ ] **Configuration changes include schema updates**
- [ ] **New components have comprehensive tests**
- [ ] **Error handling implemented for all async operations**
- [ ] **Accessibility attributes added where applicable**
- [ ] **Documentation updated for API changes**
- [ ] **Performance impact assessed**

### Code Quality Checks
- [ ] **No code duplication** (DRY principle)
- [ ] **Functions are pure when possible**
- [ ] **Complex logic is properly documented**
- [ ] **Magic numbers replaced with named constants**
- [ ] **Error messages are user-friendly**

## 🔧 Development Tools Configuration

### ESLint Configuration (Mandatory)
```javascript
// eslint.config.js - REQUIRED rules
export default tseslint.config([
  {
    rules: {
      '@typescript-eslint/no-any': 'error',
      '@typescript-eslint/explicit-return-type': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/strict-boolean-expressions': 'error',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn'
    }
  }
])
```

### Prettier Configuration (Mandatory)
```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "printWidth": 100,
  "trailingComma": "es5"
}
```

## 📊 Performance Standards

### Bundle Size Limits (Mandatory)
- **Initial bundle**: < 500KB gzipped
- **Component chunks**: < 100KB each
- **Configuration files**: < 50KB each
- **Image assets**: Optimized and WebP format when possible

### Runtime Performance (Mandatory)
- **Initial load time**: < 2 seconds
- **Component render time**: < 100ms
- **Configuration load time**: < 500ms
- **Memory usage**: < 50MB for typical character creation

### Code Splitting Requirements
```typescript
// ✅ REQUIRED: Lazy load large components
const CareerSelectionStep = lazy(() => import('./phases/CareerSelectionStep'))
const EquipmentStep = lazy(() => import('./phases/EquipmentStep'))

// ✅ REQUIRED: Suspense boundaries
<Suspense fallback={<LoadingSpinner />}>
  <CareerSelectionStep />
</Suspense>
```

## 🎯 Enforcement and Compliance

### Automated Checks
1. **Pre-commit hooks** enforce code quality
2. **CI/CD pipeline** runs all tests and lints
3. **TypeScript compilation** must pass
4. **Test coverage** must meet minimum thresholds

### Code Review Process
1. **Two approvals required** for core system changes
2. **Architecture review** for significant changes
3. **Performance review** for components with complex logic
4. **Security review** for plugin system changes

### Documentation Requirements
1. **API documentation** for all public interfaces
2. **Configuration examples** for all new config options
3. **Migration guides** for breaking changes
4. **Architecture decision records** (ADRs) for major decisions

---

## 📚 Quick Reference

### Common Patterns
```typescript
// Configuration loading
const config = await ConfigLoader.getInstance().loadSpecies()

// State management
const updateChar = useCharacterStore(state => state.updateCharacteristic)

// Component props
interface Props {
  readonly config: Config
  readonly onComplete: (data: Data) => void
}

// Error handling
try {
  const result = await riskyOperation()
} catch (error) {
  handleError(error)
}
```

### Quality Gates
- ✅ TypeScript strict mode compliance
- ✅ Zero hardcoded game rules
- ✅ 90%+ test coverage
- ✅ Accessibility compliance
- ✅ Performance within limits
- ✅ Configuration-driven architecture

**Remember**: These standards ensure our codebase remains maintainable, extensible, and true to our configuration-driven architecture vision. Every line of code should contribute to a system where game rules live in JSON files, not in React components.
