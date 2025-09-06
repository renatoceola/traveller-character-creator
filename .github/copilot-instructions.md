# Traveller Character Creator v2 - AI Coding Agent Instructions

## 🎯 Project Architecture Overview

This is a **configuration-driven** Traveller RPG character creator where **zero game rules are hardcoded**. All mechanics live in JSON files (`/public/config/`), validated by Zod schemas, and consumed through a type-safe singleton `ConfigLoader`. The system features comprehensive character creation from characteristics through career selection, with complete architecture for career progression, real-time character preview, skills tracking, and navigation protection.

### Core Data Flow
```
JSON Configs → ConfigLoader → Zustand Store → React Components → Enhanced Character Display
```

**Critical Pattern**: Components receive game data as props, never hardcode rules, and maintain data integrity through milestone-based navigation locking.

## 🚨 Current Project Status (December 15, 2024)

### ✅ **MAJOR MILESTONE ACHIEVED** - 80% Complete Character Creation System
- **Foundation**: ✅ Complete configuration-driven architecture with type safety
- **Character Creation Core**: ✅ Roll characteristics, species selection, character details
- **Background Skills**: ✅ Homeworld and education systems with level validation
- **Career Selection**: ✅ Full qualification system with 4 careers and assignments
- **Career Terms Framework**: ✅ Complete looping 4-year term architecture (handlers implemented, UI pending)
- **Character Preview**: ✅ Real-time updates with skills, characteristics, and history tracking
- **Navigation Protection**: ✅ Milestone-based locking preventing data corruption

### 🚧 **IMMEDIATE FOCUS** - Career Terms UI Implementation
The comprehensive career progression architecture is complete with all 7 phase handlers implemented:
- qualification → basic training → skill training → survival → advancement → aging → decision
- All handlers in `CareerTermsStep.tsx` need UI component connection
- State management (`CareerTermState`) fully implemented and tested
- Configuration system supports all career progression mechanics

## 🚨 Mandatory Quality Gates

### TypeScript Strict Mode (Required)
```typescript
// ✅ REQUIRED: All code must pass TypeScript strict mode
// ❌ FORBIDDEN: Any usage of 'any' type
// ✅ REQUIRED: Explicit return types for functions
function processCharacterData(data: CharacterData): CharacterResult {
  return validateAndTransformCharacter(data)
}
```

### Error Handling (Required)
```typescript
// ✅ REQUIRED: Comprehensive error handling for all async operations
try {
  const response = await fetch('/config/rules.json')
  if (!response.ok) throw new ConfigLoadError(`Failed: ${response.status}`)
  return configurationSchema.parse(await response.json())
} catch (error) {
  if (error instanceof z.ZodError) {
    throw new ConfigValidationError('Invalid format', error.errors)
  }
  throw error
}
```

## 🏗️ Key Architectural Components

### ConfigLoader Singleton (`/src/core/ConfigLoader.ts`)
**The heart of the system** - loads and validates all game data:
```typescript
// Always use singleton pattern
const config = ConfigLoader.getInstance()
await config.loadConfiguration()  // Loads rules.json, species.json, phases.json
const species = config.getSpecies()  // Type-safe access
```

### Zustand Store (`/src/store/characterStore.ts`)
**State management** with Immer for immutable updates:
```typescript
// Use action hooks, not direct store access
const { updateCharacter, completeStep } = useCharacterActions()
const character = useCharacter()  // Selector hook

// ✅ REQUIRED: Immutable state pattern
const useCharacterStore = create<CharacterState>()(
  immer((set) => ({
    updateCharacteristic: (char: Characteristic, value: number) =>
      set((state) => {
        state.characteristics[char] = value  // Immer handles immutability
      })
  }))
)
```

### Layered Architecture (Mandatory)
```
Presentation Layer: React Components (NO game logic, pure UI)
Application Layer: StepEngine, Workflow Management (/src/core/)
Domain Layer: Game Rules, Validation (/src/utils/)  
Infrastructure: ConfigLoader, Data Persistence (/src/store/)
```

**Layer Rules:**
- **Presentation**: Components receive props, never access configs directly
- **Application**: Orchestrates workflow, calls domain functions
- **Domain**: Pure functions for game calculations
- **Infrastructure**: Data access and persistence only

## 🔧 Essential Development Patterns

### 1. Configuration-First Development
Before writing any game logic, check if data exists in configs:
- `/public/config/rules.json` - Game mechanics, aging, skill limits
- `/public/config/species.json` - Species modifiers and traits
- `/public/config/phases.json` - Character creation workflow steps

**Configuration Loading Pattern:**
```typescript
// ✅ REQUIRED: Always load configs through ConfigLoader
const config = ConfigLoader.getInstance()
await config.loadConfiguration()
const rules = config.getRules()
const species = config.getSpecies()
```

### 2. Type Safety Pattern
```typescript
// Always import types from central location
import type { Species, Character, Rules } from '@/types'

// Use Zod for runtime validation (see /schemas/validation.ts)
const validatedSpecies = speciesSchema.parse(data)
```

### 3. Component Props Pattern
```typescript
// ✅ Configuration-driven component
interface SpeciesStepProps {
  species: Species[]  // From config, not hardcoded
  selectedSpecies: Species | null
  onSpeciesSelect: (species: Species) => void
}

// ❌ Never hardcode game rules
const aslanBonus = species === 'Aslan' ? 2 : 0  // FORBIDDEN
```

### 4. Character Preview & Navigation System
```typescript
// Enhanced character display with skills and navigation protection
interface CharacterPreview {
  basicInfo: Character;           // Name, species, counts
  characteristics: CharacteristicSet;
  skills: SkillWithSource[];      // Skills with level indicators and sources
  navigation: NavigationState;    // Milestone locking status
}

// Navigation protection prevents rollback after milestones
const shouldBlockBack = (step: string, character: Character): boolean => {
  // Blocks back navigation after characteristics, species, homeworld, education
}
```

### 5. Data Integrity Protection
```typescript
// Skills with source tracking
interface Skill {
  name: string;
  level: number;
  source: 'homeworld' | 'education' | 'career' | string;
}

// Navigation milestone protection
const MILESTONE_STEPS = [
  'roll-characteristics',  // Lock after any characteristic > 0
  'choose-species',       // Lock after species selection  
  'homeworld',           // Lock after homeworld skills
  'education'            // Lock after education completion
];
```

## 🚀 Critical Commands & Workflows

### Development Workflow
```bash
npm run dev          # Vite dev server with HMR
npm run build        # TypeScript + Vite production build
npm run lint         # ESLint with strict TypeScript rules
```

### Path Aliases (configured in vite.config.ts)
```typescript
import { ConfigLoader } from '@/core/ConfigLoader'     // src/
import type { Species } from '@/types'                // src/types/
import { speciesSchema } from '@schemas/validation'   // schemas/
```

### State Management Hooks
```typescript
// Preferred: Use specific selector hooks
const character = useCharacter()
const species = useSpecies()
const { updateCharacter } = useCharacterActions()

// Available: Computed selectors
const currentPhase = useCurrentPhaseData()
const currentStep = useCurrentStepData()
```

## 🎮 Game System Knowledge

### Character Creation Flow
7 steps with advanced features, defined in `phases.json`:
1. **Character Creation**: Roll characteristics, choose species, character details
2. **Background Skills**: Homeworld, education with level-based skill selection
3. **Career Selection**: Career qualification and assignment selection with 4 careers
4. **Career Terms**: ✅ Architecture complete - Looping 4-year term progression (UI pending)
5. **Mustering Out**: Benefits and equipment (planned)
6. **Final Review**: Export and completion (planned)

### Species System
6 core species with modifiers applied via `CharacteristicCalculator.applySpeciesModifiers()`:
- Human (baseline), Aslan (+2 STR, -2 DEX), Vargr (+1 DEX, -2 END, +1 SOC), etc.

### Career System (✅ Complete Architecture)
4 complete careers with qualification, survival, advancement mechanics:
- **Navy**: Naval operations and ship service
- **Army**: Ground forces and military operations  
- **Marines**: Elite forces and ship security
- **Merchant**: Trade and commercial operations

Each career includes:
- Qualification requirements (characteristic + DM)
- Assignments with specialized skill tables
- Survival and advancement mechanics
- Skill training tables (Personal, Service, Advanced)
- Complete 4-year term progression system

### **Current Implementation Status**
- ✅ **Foundation**: ConfigLoader, Zustand store, type system, comprehensive utilities
- ✅ **Character Creation Core**: Roll characteristics, species selection, character details with history tracking
- ✅ **Background Skills**: Complete homeworld and education systems with skill level validation
- ✅ **Career Selection**: Full qualification system with 4 careers (Navy, Army, Marines, Merchant)
- ✅ **Career Terms Architecture**: Complete looping 4-year term system with all phase handlers
- ✅ **Character Preview**: Skills display with levels, sources, characteristics, and navigation protection
- ✅ **Build System**: TypeScript strict mode compliance, production-ready builds
- 🚧 **Career Terms UI**: Architecture complete, handlers need UI component connection
- 📋 **Mustering Out**: Benefits and equipment system planned
- 📋 **Advanced Features**: Export/import, plugin architecture planned

## ⚠️ Critical Rules & Anti-Patterns

### Zero Hardcoded Rules Policy (MANDATORY)
```typescript
// ❌ FORBIDDEN: Any hardcoded game mechanics
if (species === 'Aslan') { strength += 2 }
if (age >= 34) { characteristics.forEach(c => c -= 1) }
const skillLimit = career === 'Navy' ? 4 : 2

// ✅ REQUIRED: Configuration-driven mechanics
const speciesModifier = species.modifiers.find(m => m.characteristic === 'STR')?.modifier ?? 0
const agingData = rules.aging.find(bracket => age >= bracket.minAge)
const skillLimit = career.maxSkillLevel
```

### Immutable State Management (MANDATORY)
```typescript
// ❌ FORBIDDEN: Direct state mutation
state.character.STR = 10
state.skills.push(newSkill)
delete state.equipment.weapon

// ✅ REQUIRED: Immutable updates via actions
const { updateCharacter, addSkill, removeEquipment } = useCharacterActions()
updateCharacter({ characteristics: { ...current, STR: 10 } })
addSkill(newSkill)
removeEquipment('weapon')
```

### Type Safety Requirements (MANDATORY)
```typescript
// ❌ FORBIDDEN: Any usage of 'any' type
function processData(data: any): any

// ✅ REQUIRED: Explicit typing with runtime validation
function processCharacterData(data: CharacterData): ValidationResult<Character> {
  return characterSchema.safeParse(data)
}
```

### Component Architecture Rules (MANDATORY)
```typescript
// ❌ FORBIDDEN: Direct config access in components
const species = ConfigLoader.getInstance().getSpecies()

// ✅ REQUIRED: Props-based configuration
interface ComponentProps {
  species: Species[]  // Passed from parent
  rules: Rules       // Passed from parent
}

// ❌ FORBIDDEN: Business logic in components
const calculateModifier = (species: string) => species === 'Aslan' ? 2 : 0

// ✅ REQUIRED: Pure UI components
const SpeciesDisplay = ({ modifier }: { modifier: number }) => <span>+{modifier}</span>
```

## 🔍 Debugging & Troubleshooting

### Configuration Issues
- Check browser network tab for failed `/config/*.json` loads
- Verify Zod validation errors in console
- Use `ConfigLoader.getInstance().isLoaded()` to check state

### State Issues
- Use Zustand DevTools to inspect store state
- Check `useCharacterStore.getState()` for current state
- Verify action dispatching with store devtools

### Build Issues
- TypeScript strict mode enabled - all errors must be fixed
- Check path aliases in imports match vite.config.ts
- ESLint enforces zero warnings policy

### Performance Monitoring
- Use React DevTools Profiler for component performance
- Monitor bundle size with `npm run build:analyze`
- Check configuration loading times in Network tab

### Error Boundaries
```typescript
// ✅ REQUIRED: Implement error boundaries for configuration failures
class ConfigErrorBoundary extends Component<Props, State> {
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Configuration loading failed:', error, errorInfo)
  }
}
```

## 📁 Key Files for Context

- **`/src/types/index.ts`**: Central type definitions with comprehensive interfaces including career progression types
- **`/public/config/*.json`**: All game data (rules, species, phases, careers)
- **`/schemas/validation.ts`**: Zod schemas for runtime validation
- **`/src/utils/characteristicCalculator.ts`**: Configuration-driven game calculations
- **`/src/utils/characterHistory.ts`**: Character history management and backstory generation
- **`/src/components/ui/SpeciesSelector.tsx`**: Example of pure UI component patterns
- **`/src/components/ui/CharacteristicDisplay.tsx`**: Configuration-driven display component
- **`/src/components/ui/StepEngineIntegration.tsx`**: Step management integration hook
- **`/src/components/ui/StepByStepCreation.tsx`**: Complete integration with preview and navigation
- **`/src/components/ui/CharacterHistoryDisplay.tsx`**: Real-time backstory visualization
- **`/src/components/steps/HomeworldStep.tsx`**: Enhanced homeworld selection with custom options
- **`/src/components/steps/EducationStep.tsx`**: Complete education system with University level 0/1 selection
- **`/src/components/steps/ChooseCareerStep.tsx`**: Complete career selection with qualification system
- **`/src/components/steps/CareerTermsStep.tsx`**: ✅ Complete architecture, handlers ready for UI connection
- **`/docs/features/CHARACTER_HISTORY_SYSTEM.md`**: Character history and backstory system documentation
- **`/docs/features/CHARACTER_PREVIEW_NAVIGATION.md`**: Character preview and navigation system documentation
- **`/docs/development/CONTRIBUTING.md`**: Development contribution guidelines and core patterns
- **`/docs/development/CODING_STANDARDS.md`**: Mandatory coding standards and quality enforcement
- **`/docs/development/ARCHITECTURE.md`**: Detailed architectural guidelines and layered design
- **`/docs/development/CONFIGURATION_GUIDE.md`**: Configuration system documentation
- **`/docs/development/QUALITY_ASSURANCE.md`**: Testing requirements and quality gates

### Essential Documentation Patterns
```typescript
// Follow the established patterns from instruction files:
// - docs/development/CONTRIBUTING.md: Configuration-driven development workflow
// - docs/development/CODING_STANDARDS.md: TypeScript strict mode and file organization
// - docs/development/ARCHITECTURE.md: Layered architecture and component lifecycle
// - docs/development/QUALITY_ASSURANCE.md: Error handling and performance requirements

// Reference implementations demonstrate proper patterns:
// - SpeciesSelector: Pure UI component with configuration-driven display
// - CharacteristicCalculator: Business logic utility with zero hardcoded rules
// - StepEngineIntegration: Workflow management with type-safe transitions
// - StepByStepCreation: Complete step-by-step workflow with enhanced preview and navigation
```

## 🎯 Current Development Priorities

1. **Career Terms UI Implementation**: Wire up the 7 phase handlers to UI components in CareerTermsStep.tsx
2. **Mustering Out Benefits System**: Final character completion with benefits and equipment
3. **Enhanced Character Sheet**: Complete character display with export functionality
4. **Career Event Tables**: Add event resolution during career progression

Focus on **Career Terms UI** completion - connecting the complete architectural foundation with user interface components for the looping 4-year term progression system.
