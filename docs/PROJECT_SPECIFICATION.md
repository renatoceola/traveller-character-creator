# 📋 Traveller Character Creator - Project Specification

## **🎯 Project Overview**

### **Project Name**
Traveller Character Creator - Configuration-Driven Architecture

### **Version**
2.0 - Next Generation Architecture

### **Description**
A modern, extensible web application for creating Traveller RPG characters using a configuration-driven, plugin-based architecture. The system implements official Mongoose Traveller 2nd Edition (Update 2022) rules through JSON-based configuration files, enabling easy customization and rule modifications without code changes.

### **Primary Objectives**
- **Simplicity**: Minimize hardcoded rules and enable JSON-driven configuration
- **Customizability**: Support multiple Traveller editions and house rules
- **Extensibility**: Plugin architecture for community-created content
- **Maintainability**: Clean separation between game rules and application logic

---

## **🛠️ Technology Stack**

### **Core Framework**
- **React 18.3.1** - Component-based UI with modern hooks
- **TypeScript 5.8.3** - Type safety and enhanced developer experience
- **Vite 7.1.2** - Fast build tool with hot module replacement

### **State Management**
- **Zustand 4.5.7** - Lightweight reactive state management
- **Immer Integration** - Immutable state updates with mutable syntax
- **LocalStorage Persistence** - Automatic character data persistence

### **Styling & UI**
- **Tailwind CSS 3.4.17** - Utility-first CSS framework
- **PostCSS 8.5.6** - CSS preprocessing pipeline
- **Classnames 2.5.1** - Dynamic CSS class composition

### **Data Validation**
- **Zod 3.25.76** - Runtime schema validation and type inference
- **JSON Schema** - Configuration file validation
- **TypeScript Integration** - Compile-time type checking

### **Development Tools**
- **ES2022/ES2023** - Modern JavaScript features
- **Path Aliases (@/*)** - Clean import structure
- **Strict TypeScript** - Enhanced type checking
- **Hot Module Replacement** - Fast development feedback

---

## **🏗️ Architectural Requirements**

### **1. Configuration-Driven System**

#### **Step Configuration Format**
```typescript
interface StepConfig {
  id: string
  title: string
  description?: string
  order: number
  enabled: boolean
  phases: PhaseConfig[]
  validation?: ValidationConfig
}

interface PhaseConfig {
  id: string
  type: PhaseType
  title: string
  config: Record<string, any>
  actions?: ActionConfig[]
  ui?: UIConfig
}
```

#### **Rule Engine Configuration**
```typescript
interface RuleSet {
  edition: string
  version: string
  characteristics: CharacteristicRules
  education: EducationRules
  careers: CareerRules
  aging: AgingRules
  dice: DiceRules
}
```

### **2. Plugin Architecture**

#### **Plugin Interface**
```typescript
interface TravellerPlugin {
  id: string
  name: string
  version: string
  dependencies?: string[]
  provides: {
    species?: SpeciesDefinition[]
    careers?: CareerDefinition[]
    steps?: StepDefinition[]
    rules?: RuleOverrides
    ui?: UIComponents
  }
  install: (app: TravellerApp) => void
  uninstall: (app: TravellerApp) => void
}
```

### **3. Dynamic Component System**

#### **Phase Component Registry**
```typescript
interface PhaseComponent {
  type: string
  component: React.ComponentType<PhaseProps>
  configSchema: ZodSchema
  defaultConfig: Record<string, any>
}

const PHASE_REGISTRY = {
  'choice-grid': ChoiceGridPhase,
  'dice-rolling': DiceRollingPhase,
  'skill-selection': SkillSelectionPhase,
  'probability-display': ProbabilityPhase,
  'summary-review': SummaryPhase
}
```

---

## **📋 Implemented Game Rules (Mongoose Traveller 2nd Edition)**

### **1. Character Identity**
- **Name Assignment** - Free text input
- **Species Selection** - Human (default), Aslan, Vargr, Zhodani, Vilani, Solomani with modifiers
- **Homeworld** - Free text input for background

### **2. Species System**

#### **Human (Baseline)**
```json
{
  "name": "Human",
  "modifiers": [],
  "traits": [],
  "specialRules": ["Baseline species", "No characteristic modifiers"]
}
```

#### **Aslan**
```json
{
  "name": "Aslan",
  "modifiers": [
    { "characteristic": "STR", "modifier": 2 },
    { "characteristic": "DEX", "modifier": -2 }
  ],
  "specialRules": [
    "Dewclaw: +1 DM to melee attacks",
    "Territory: Strong drive to acquire and defend territory"
  ]
}
```

#### **Vargr**
```json
{
  "name": "Vargr",
  "modifiers": [
    { "characteristic": "DEX", "modifier": 1 },
    { "characteristic": "END", "modifier": -2 },
    { "characteristic": "SOC", "modifier": 1 }
  ],
  "specialRules": [
    "Pack Mentality: +1 DM to Leadership checks with other Vargr",
    "Bite: Natural weapon (1D damage)"
  ]
}
```

### **3. Characteristics System**

#### **Generation Method**
- **Dice Rolling** - 2D6 six times OR 3D6 drop lowest twice + 2D6 four times
- **Assignment** - Freely assign rolled values to STR, DEX, END, INT, EDU, SOC
- **Limits** - Cannot exceed 15 (before augments), minimum 1

#### **Dice Modifier Table**
```json
{
  "dmTable": {
    "0": -3,
    "1-2": -2,
    "3-5": -1,
    "6-8": 0,
    "9-11": 1,
    "12-14": 2,
    "15+": 3
  }
}
```

### **4. Background Skills**
- **Age Requirement** - Gained at age 18
- **Quantity** - EDU DM + 3 (minimum 0, maximum ~6)
- **Skill List** - Admin, Animals, Art, Athletics, Carouse, Drive, Electronics, Flyer, Language, Mechanic, Medic, Profession, Science, Seafarer, Streetwise, Survival, Vacc Suit
- **Level** - All background skills start at level 0

### **5. Career System Framework**

#### **Career Structure**
```json
{
  "qualification": {
    "target": 6,
    "formula": "2D6 + characteristic_DM",
    "modifiers": []
  },
  "basicTraining": {
    "firstCareer": "allServiceSkills",
    "laterCareers": "oneServiceSkill"
  },
  "survival": {
    "target": 5,
    "formula": "2D6 + characteristic_DM"
  },
  "advancement": {
    "target": 7,
    "formula": "2D6 + characteristic_DM"
  },
  "skillTables": {
    "personal": [],
    "service": [],
    "assignment": [],
    "advanced": [],
    "officer": []
  }
}
```

### **7. Character History & Backstory System**

#### **Event Tracking Architecture**
```json
{
  "eventTypes": {
    "success": "Positive outcomes and achievements",
    "failure": "Setbacks and challenges faced",
    "choice": "Important decisions made by the character",
    "roll": "Dice roll outcomes with context",
    "gain": "Skills, characteristics, or items acquired",
    "loss": "Skills, characteristics, or items lost",
    "milestone": "Significant character development moments"
  }
}
```

#### **Character Event Structure**
```typescript
interface CharacterEvent {
  id: string
  type: 'success' | 'failure' | 'choice' | 'roll' | 'gain' | 'loss' | 'milestone'
  timestamp: number
  step: string
  phase: string
  title: string
  description: string
  impact: 'positive' | 'negative' | 'neutral'
  data?: Record<string, any>
}
```

#### **Backstory Generation**
- **Real-time Narrative Synthesis** - Converts events into coherent backstory text
- **Event Timeline Display** - Chronological view of character development
- **Impact Assessment** - Tracks positive/negative outcomes for personality insights
- **Export Functionality** - Copy generated backstory to clipboard for external use

#### **History Manager Features**
- **Event Creation Utilities** - Standardized methods for common event types
- **Narrative Templates** - Context-aware description generation
- **Statistical Analysis** - Success/failure ratios and event distribution
- **Integration Points** - Seamless embedding in all character creation steps

### **8. Character Preview & Navigation System**

#### **Enhanced Character Display**
```json
{
  "characterPreview": {
    "basicInfo": "Name, species, total skills, events count",
    "characteristics": "Six-stat grid with values",
    "skillsDisplay": {
      "levelIndicators": "Visual badges (0=gray, 1+=green)",
      "sourceGrouping": "Skills grouped by acquisition source",
      "detailedView": "Name, level, and source for each skill"
    }
  }
}
```

#### **Navigation Protection System**
```typescript
interface NavigationLocking {
  milestoneSteps: ['roll-characteristics', 'choose-species', 'homeworld', 'education']
  protectionRules: {
    'roll-characteristics': 'Block after any characteristic > 0',
    'choose-species': 'Block after species selection',
    'homeworld': 'Block after homeworld skills acquired',
    'education': 'Block after education skills acquired'
  }
  visualIndicators: {
    lockedSteps: 'Red dots on navigation',
    warningMessage: 'Yellow banner explaining restrictions',
    disabledBackButton: 'Back button hidden/disabled when locked'
  }
}
```

#### **Data Integrity Features**
- **Milestone Protection** - Prevents rollback after major character decisions
- **Character Data Consistency** - Ensures species modifiers don't get corrupted
- **Skills Source Tracking** - Maintains skill acquisition history
- **User Education** - Clear messaging about navigation restrictions

---

## **🎯 Implementation Status**

### **✅ Foundation Complete (Phase 1)**
- [x] Core technology stack setup
- [x] Configuration-driven architecture foundation
- [x] TypeScript type system with Zod validation
- [x] Basic configuration loader
- [x] State management with Zustand
- [x] Core game mechanics (dice, characteristics)
- [x] Species system implementation
- [x] Step engine and workflow management
- [x] Character history and backstory system
- [x] Real-time event tracking and narrative generation
- [x] Enhanced character preview with skills display
- [x] Navigation locking system for data integrity

### **🚧 In Progress (Phase 2)**
- [x] Dynamic UI component system (core components complete)
- [x] Complete step-by-step UI implementation (core steps)
- [x] Character data integrity protection
- [ ] Advanced configuration validation
- [ ] Career system implementation
- [ ] Education and pre-career systems

### **📋 Planned (Phase 3-4)**
- [ ] Plugin architecture implementation
- [ ] Visual configuration editor
- [ ] Advanced rule engine
- [ ] Performance optimizations
- [ ] Testing framework
- [ ] Documentation system

---

## **📁 Target Project Structure**

```
├── config/                          # Configuration files
│   ├── rules/
│   │   ├── traveller-m22.json      # Core ruleset
│   │   ├── traveller-classic.json  # Classic Traveller
│   │   └── house-rules.json        # Custom modifications
│   ├── species/
│   │   ├── core-species.json       # Human, Aslan, Vargr
│   │   └── extended-species.json   # Additional species
│   ├── careers/
│   │   ├── military.json           # Military careers
│   │   ├── civilian.json           # Civilian careers
│   │   └── specialist.json         # Specialist careers
│   ├── steps/
│   │   ├── character-creation.json # Step definitions
│   │   └── career-progression.json # Career steps
│   └── editions/
│       ├── mongoose-2e.json        # Complete M2E config
│       └── mega-traveller.json     # MegaTraveller config
├── schemas/                         # JSON validation schemas
│   ├── step-config.schema.json
│   ├── rule-set.schema.json
│   ├── species.schema.json
│   └── career.schema.json
├── src/
│   ├── core/
│   │   ├── ConfigLoader.ts         # ✅ Configuration management
│   │   ├── RuleEngine.ts           # 🚧 Rule interpretation
│   │   ├── StepFactory.ts          # 🚧 Dynamic step creation
│   │   ├── PluginSystem.ts         # 📋 Plugin architecture
│   │   └── ValidationEngine.ts     # 🚧 Data validation
│   ├── components/
│   │   ├── phases/                 # 🚧 Phase components
│   │   │   ├── ChoiceGridPhase.tsx
│   │   │   ├── DiceRollingPhase.tsx
│   │   │   ├── SkillSelectionPhase.tsx
│   │   │   └── SummaryPhase.tsx
│   │   ├── forms/                  # 📋 Form components
│   │   └── ui/                     # 📋 Base UI components
│   ├── plugins/                    # 📋 Plugin implementations
│   │   ├── vargr-expansion/
│   │   ├── pirate-careers/
│   │   └── high-tech-rules/
│   ├── store/                      # ✅ State management
│   ├── types/                      # ✅ TypeScript definitions
│   └── utils/                      # ✅ Utility functions
├── docs/                           # 📋 Documentation
│   ├── configuration-guide.md
│   ├── plugin-development.md
│   └── rule-implementation.md
└── tests/                          # 📋 Test suite
    ├── unit/
    ├── integration/
    └── e2e/
```

---

## **🔧 Development Requirements**

### **Development Environment**
- Node.js 18+ with npm/yarn
- TypeScript 5.8+ with strict configuration
- Vite 7+ for build tooling
- Jest for unit testing
- Playwright for E2E testing

### **Code Quality Standards**
- ESLint with strict TypeScript rules
- Prettier for code formatting
- Husky for pre-commit hooks
- Conventional commits
- 90%+ test coverage

### **Performance Requirements**
- Initial load time < 2 seconds
- Configuration hot reload < 500ms
- Character generation < 100ms
- Memory usage < 50MB
- Bundle size < 500KB (gzipped)

---

## **📋 Success Criteria**

### **Functional Requirements**
- [ ] Complete M22 character creation process
- [ ] Species system with modifiers and traits
- [ ] Configuration-driven step definitions
- [ ] Plugin architecture implementation
- [ ] Rule engine with JSON configuration
- [ ] Dynamic UI component system

### **Non-Functional Requirements**
- [ ] Zero hardcoded game rules in components
- [ ] Hot-swappable configurations
- [ ] Plugin loading without app restart
- [ ] Type-safe configuration system
- [ ] Comprehensive error handling
- [ ] Automated testing coverage

### **User Experience Requirements**
- [ ] Intuitive character creation flow
- [ ] Real-time validation feedback
- [ ] Progress saving and restoration
- [ ] Export/import functionality
- [ ] Mobile-responsive design
- [ ] Accessibility compliance (WCAG 2.1)

This specification provides a comprehensive roadmap for transforming the Traveller Character Creator into a flexible, configuration-driven system that can adapt to different rule sets, house rules, and community content while maintaining the robust character creation experience.
