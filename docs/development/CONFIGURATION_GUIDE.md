# Traveller Character Creator v2 - Configuration Guide

## 📋 Configuration System Overview

This guide defines the mandatory configuration standards and patterns for maintaining the integrity of the configuration-driven architecture in the Traveller Character Creator v2 project.

## 🎯 Configuration Philosophy

### Core Principle: Zero Hardcoded Game Rules
**Every game mechanic, rule, and constant must be externalized to configuration files.**

```typescript
// ❌ FORBIDDEN: Hardcoded game rules
const ASLAN_STR_MODIFIER = 2
const AGING_THRESHOLD = 34
const BACKGROUND_SKILLS_BASE = 3

// ✅ REQUIRED: Configuration-driven
const config = await ConfigLoader.getInstance().loadRules()
const modifier = config.species.find(s => s.name === 'Aslan')?.modifiers.STR ?? 0
const agingThreshold = config.aging.threshold
const backgroundSkillsBase = config.backgroundSkills.base
```

## 📁 Configuration File Structure

### Mandatory Directory Layout
```
config/                          # Development configurations
├── rules/
│   ├── traveller-m22.json      # Mongoose Traveller 2nd Edition
│   ├── traveller-classic.json  # Classic Traveller (future)
│   └── house-rules.json        # Custom rule variants
├── species/
│   ├── core-species.json       # Human, Aslan, Vargr, Zhodani, Vilani, Solomani
│   └── extended-species.json   # Additional species (plugins)
├── careers/
│   ├── military.json           # Military career paths
│   ├── civilian.json           # Civilian careers
│   └── specialist.json         # Specialist careers
├── steps/
│   ├── character-creation.json # Core creation workflow
│   └── optional-steps.json     # Optional enhancement steps
└── editions/
    ├── mongoose-2e.json        # Complete M22 configuration
    └── mega-traveller.json     # MegaTraveller configuration

public/config/                   # Runtime configurations (loaded by browser)
├── rules.json                  # Active rules configuration
├── species.json                # Active species configuration
└── phases.json                 # Active step workflow
```

## 📋 Configuration File Standards

### Version and Metadata (Mandatory)
**Every configuration file must include version and metadata.**

```json
{
  "version": "2.1.0",
  "metadata": {
    "title": "Mongoose Traveller 2nd Edition Rules",
    "description": "Official M22 character creation rules with Update 2022",
    "author": "Traveller Creator Team",
    "source": "Mongoose Publishing Traveller Core Rulebook",
    "lastUpdated": "2024-12-28",
    "compatibleWith": ["2.0.0", "2.1.0"],
    "supersedes": ["2.0.0"],
    "tags": ["official", "core", "mongoose", "2e"]
  },
  "rules": {
    // Rule definitions here
  }
}
```

### Schema Validation (Mandatory)
**Every configuration file must have a corresponding Zod schema.**

```typescript
// schemas/rules.schema.ts
export const rulesConfigSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/, "Must be semantic version"),
  metadata: z.object({
    title: z.string().min(1),
    description: z.string(),
    author: z.string(),
    source: z.string().optional(),
    lastUpdated: z.string().datetime(),
    compatibleWith: z.array(z.string()),
    supersedes: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional()
  }),
  rules: rulesSchema
}).strict()

export type RulesConfig = z.infer<typeof rulesConfigSchema>
```

## 🎮 Game Configuration Patterns

### Rules Configuration (rules.json)

```json
{
  "version": "2.1.0",
  "metadata": { /* ... */ },
  "rules": {
    "characteristics": {
      "generation": {
        "method": "2d6",
        "alternativeMethod": "3d6_drop_lowest",
        "rolls": 6,
        "assignment": "free",
        "minimumValue": 1,
        "maximumValue": 15,
        "rerollsAllowed": 1,
        "rerollCondition": "total_less_than_30"
      },
      "modifiers": {
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
    },
    "skills": {
      "levels": {
        "minimum": 0,
        "maximum": 4,
        "specialistMaximum": 6
      },
      "cascade": {
        "enabled": true,
        "threshold": 1,
        "specializations": {
          "Gun Combat": ["Archaic", "Energy", "Slug"],
          "Melee": ["Blade", "Bludgeon", "Natural", "Unarmed"],
          "Pilot": ["Small Craft", "Spacecraft", "Capital Ships"]
        }
      },
      "advancement": {
        "formula": "current_level + 1",
        "maximumIncrease": 1,
        "trainingTime": "1d6_weeks"
      }
    },
    "aging": {
      "threshold": 34,
      "checkInterval": 4,
      "formula": "2d6 - terms_served",
      "effects": {
        "-6": { "STR": -2, "DEX": -2, "END": -2 },
        "-5": { "STR": -2, "DEX": -2, "END": -1 },
        "-4": { "STR": -2, "DEX": -1, "END": -1 },
        "-3": { "STR": -1, "DEX": -1, "END": -1 },
        "-2": { "STR": -1, "DEX": -1, "END": 0 },
        "-1": { "STR": -1, "DEX": 0, "END": 0 },
        "0+": { "STR": 0, "DEX": 0, "END": 0 }
      },
      "anagathics": {
        "available": true,
        "cost": 100000,
        "effectiveness": "+1_dm_to_aging_roll"
      }
    },
    "backgroundSkills": {
      "baseNumber": 3,
      "educationModifier": true,
      "formula": "3 + EDU_DM",
      "minimumSkills": 0,
      "maximumSkills": 8,
      "availableSkills": [
        "Admin", "Animals", "Art", "Athletics", "Carouse", "Drive",
        "Electronics", "Flyer", "Language", "Mechanic", "Medic",
        "Profession", "Science", "Seafarer", "Streetwise", "Survival", "Vacc Suit"
      ]
    },
    "dice": {
      "standard": "2d6",
      "characteristic": "2d6",
      "alternativeCharacteristic": "3d6_drop_lowest",
      "modifierCap": 6
    }
  }
}
```

### Species Configuration (species.json)

```json
{
  "version": "2.1.0",
  "metadata": {
    "title": "Core Species Definitions",
    "description": "Major species for Traveller character creation",
    "author": "Traveller Creator Team",
    "lastUpdated": "2024-12-28"
  },
  "species": [
    {
      "id": "human",
      "name": "Human",
      "description": "Baseline human species with no modifiers",
      "modifiers": [],
      "traits": [],
      "specialRules": [
        "Baseline species with no characteristic modifiers",
        "Most adaptable and widespread species"
      ],
      "homeworlds": [
        "Terra", "Solomani Rim worlds", "Imperial Core worlds"
      ],
      "languageSkills": ["Anglic"],
      "availableCareers": "all"
    },
    {
      "id": "aslan",
      "name": "Aslan",
      "description": "Proud, feline-descended species with strong territorial instincts",
      "modifiers": [
        {
          "characteristic": "STR",
          "modifier": 2,
          "reason": "Naturally stronger physique"
        },
        {
          "characteristic": "DEX",
          "modifier": -2,
          "reason": "Less agile than baseline human"
        }
      ],
      "traits": [
        {
          "name": "Dewclaw",
          "type": "naturalWeapon",
          "description": "Retractable claws provide +1 DM to melee attacks",
          "effect": {
            "type": "combat_modifier",
            "target": "melee_attacks",
            "modifier": 1
          }
        },
        {
          "name": "Territorial Instinct",
          "type": "behavioral",
          "description": "Strong drive to acquire and defend territory",
          "effect": {
            "type": "roleplay_trait",
            "description": "Must make difficult decisions regarding territory"
          }
        }
      ],
      "specialRules": [
        "Males focus on military and territorial careers",
        "Females dominate trade and technical careers",
        "Honor-bound society with strict codes of conduct"
      ],
      "homeworlds": ["Kusyu", "Aslan Hierate worlds"],
      "languageSkills": ["Trokh"],
      "restrictedCareers": ["Imperial Navy", "Imperial Marines"],
      "preferredCareers": ["Aslan Military", "Mercenary", "Hunter"]
    },
    {
      "id": "vargr",
      "name": "Vargr",
      "description": "Canine-descended species with pack mentality and strong loyalty bonds",
      "modifiers": [
        {
          "characteristic": "DEX",
          "modifier": 1,
          "reason": "Enhanced agility and reflexes"
        },
        {
          "characteristic": "END",
          "modifier": -2,
          "reason": "Less physical endurance"
        },
        {
          "characteristic": "SOC",
          "modifier": 1,
          "reason": "Strong pack social dynamics"
        }
      ],
      "traits": [
        {
          "name": "Pack Mentality",
          "type": "social",
          "description": "Gains +1 DM to Leadership checks when working with other Vargr",
          "effect": {
            "type": "skill_modifier",
            "target": "Leadership",
            "modifier": 1,
            "condition": "other_vargr_present"
          }
        },
        {
          "name": "Bite Attack",
          "type": "naturalWeapon",
          "description": "Natural bite attack inflicting 1D damage",
          "effect": {
            "type": "natural_weapon",
            "damage": "1D",
            "traits": ["natural"]
          }
        }
      ],
      "specialRules": [
        "Charisma-based leadership determines pack hierarchy",
        "Loyalty bonds are extremely strong",
        "May become despondent if separated from pack"
      ],
      "homeworlds": ["Lair", "Vargr Extents worlds"],
      "languageSkills": ["Gvegh"],
      "preferredCareers": ["Corsair", "Mercenary", "Scout", "Rogue"]
    }
  ]
}
```

### Step Workflow Configuration (phases.json)

```json
{
  "version": "2.1.0",
  "metadata": {
    "title": "Character Creation Workflow",
    "description": "Step-by-step character creation phases and dependencies",
    "author": "Traveller Creator Team",
    "lastUpdated": "2024-12-28"
  },
  "phases": [
    {
      "id": "character-creation",
      "title": "Character Creation",
      "description": "Basic character generation and species selection",
      "order": 1,
      "steps": [
        {
          "id": "roll-characteristics",
          "title": "Roll Characteristics",
          "component": "RollCharacteristicsStep",
          "order": 1,
          "required": true,
          "config": {
            "rollMethod": "2d6",
            "alternativeMethod": "3d6_drop_lowest",
            "rollCount": 6,
            "assignment": "free",
            "rerollsAllowed": 1
          },
          "validation": [
            "all_characteristics_assigned",
            "characteristics_within_bounds"
          ],
          "dependencies": []
        },
        {
          "id": "choose-species",
          "title": "Choose Species",
          "component": "ChooseSpeciesStep",
          "order": 2,
          "required": true,
          "config": {
            "availableSpecies": ["human", "aslan", "vargr", "zhodani", "vilani", "solomani"],
            "showModifiers": true,
            "showTraits": true
          },
          "validation": [
            "species_selected",
            "modifiers_applied"
          ],
          "dependencies": ["roll-characteristics"]
        },
        {
          "id": "character-details",
          "title": "Character Details",
          "component": "CharacterDetailsStep",
          "order": 3,
          "required": true,
          "config": {
            "requiredFields": ["name"],
            "optionalFields": ["homeworld", "age", "gender", "appearance"],
            "validation": {
              "name": {
                "minLength": 1,
                "maxLength": 50,
                "pattern": "^[A-Za-z\\s\\-']+$"
              }
            }
          },
          "validation": [
            "name_provided",
            "fields_validated"
          ],
          "dependencies": ["choose-species"]
        }
      ]
    },
    {
      "id": "background-skills",
      "title": "Background Skills",
      "description": "Education and pre-career skill acquisition",
      "order": 2,
      "steps": [
        {
          "id": "homeworld",
          "title": "Homeworld",
          "component": "HomeworldStep",
          "order": 1,
          "required": false,
          "config": {
            "selectionType": "free_text",
            "suggestedWorlds": ["Terra", "Capital", "Regina", "Vland"],
            "worldTraits": true
          },
          "validation": [],
          "dependencies": ["character-details"]
        },
        {
          "id": "education",
          "title": "Education",
          "component": "EducationStep",
          "order": 2,
          "required": false,
          "config": {
            "options": ["none", "university", "military_academy"],
            "universitySkills": ["Admin", "Advocate", "Art", "Computers", "Electronics", "Medic"],
            "militarySkills": ["Gun Combat", "Leadership", "Melee", "Tactics", "Vacc Suit"],
            "graduationBonus": {
              "university": { "EDU": 1 },
              "military_academy": { "SOC": 1 }
            }
          },
          "validation": [
            "education_choice_made"
          ],
          "dependencies": ["homeworld"]
        },
        {
          "id": "background-skills",
          "title": "Background Skills",
          "component": "BackgroundSkillsStep",
          "order": 3,
          "required": true,
          "config": {
            "formula": "3 + EDU_DM",
            "minimumSkills": 0,
            "maximumSkills": 8,
            "skillLevel": 0,
            "availableSkills": [
              "Admin", "Animals", "Art", "Athletics", "Carouse", "Drive",
              "Electronics", "Flyer", "Language", "Mechanic", "Medic",
              "Profession", "Science", "Seafarer", "Streetwise", "Survival", "Vacc Suit"
            ]
          },
          "validation": [
            "correct_skill_count",
            "all_skills_level_0"
          ],
          "dependencies": ["education"]
        }
      ]
    }
  ]
}
```

### Career Configuration Example (careers/military.json)

```json
{
  "version": "2.1.0",
  "metadata": {
    "title": "Military Careers",
    "description": "Imperial military career paths",
    "author": "Traveller Creator Team",
    "lastUpdated": "2024-12-28"
  },
  "careers": [
    {
      "id": "navy",
      "name": "Navy",
      "description": "Imperial Navy service aboard starships",
      "qualification": {
        "target": 6,
        "characteristic": "INT",
        "modifiers": [
          {
            "condition": "EDU >= 9",
            "modifier": 1,
            "description": "Higher education"
          },
          {
            "condition": "SOC >= 9",
            "modifier": 1,
            "description": "Noble background"
          }
        ]
      },
      "assignments": [
        {
          "id": "line_crew",
          "name": "Line/Crew",
          "description": "General shipboard duties and operations",
          "survival": {
            "target": 5,
            "characteristic": "INT"
          },
          "advancement": {
            "target": 7,
            "characteristic": "EDU"
          }
        },
        {
          "id": "engineer_gunner",
          "name": "Engineer/Gunner",
          "description": "Technical and weapons systems",
          "survival": {
            "target": 6,
            "characteristic": "INT"
          },
          "advancement": {
            "target": 6,
            "characteristic": "EDU"
          }
        },
        {
          "id": "flight",
          "name": "Flight",
          "description": "Small craft and fighter operations",
          "survival": {
            "target": 7,
            "characteristic": "DEX"
          },
          "advancement": {
            "target": 5,
            "characteristic": "EDU"
          }
        }
      ],
      "skillTables": {
        "personal": [
          {"roll": 1, "skill": "Gun Combat", "specialization": "any"},
          {"roll": 2, "skill": "Athletics", "specialization": "any"},
          {"roll": 3, "skill": "Melee", "specialization": "blade"},
          {"roll": 4, "skill": "Flyer", "specialization": "grav"},
          {"roll": 5, "skill": "Vacc Suit"},
          {"roll": 6, "skill": "Streetwise"}
        ],
        "service": [
          {"roll": 1, "skill": "Pilot", "specialization": "spacecraft"},
          {"roll": 2, "skill": "Vacc Suit"},
          {"roll": 3, "skill": "Athletics", "specialization": "zero-g"},
          {"roll": 4, "skill": "Gunner", "specialization": "turret"},
          {"roll": 5, "skill": "Mechanic"},
          {"roll": 6, "skill": "Gun Combat", "specialization": "energy"}
        ],
        "assignment": {
          "line_crew": [
            {"roll": 1, "skill": "Electronics", "specialization": "computers"},
            {"roll": 2, "skill": "Pilot", "specialization": "spacecraft"},
            {"roll": 3, "skill": "Gunner", "specialization": "turret"},
            {"roll": 4, "skill": "Flyer", "specialization": "grav"},
            {"roll": 5, "skill": "Melee", "specialization": "blade"},
            {"roll": 6, "skill": "Vacc Suit"}
          ]
        },
        "advanced": [
          {"roll": 1, "skill": "Advocate"},
          {"roll": 2, "skill": "Broker"},
          {"roll": 3, "skill": "Electronics", "specialization": "computers"},
          {"roll": 4, "skill": "Engineer", "specialization": "jump_drive"},
          {"roll": 5, "skill": "Investigate"},
          {"roll": 6, "skill": "Medic"}
        ],
        "officer": [
          {"roll": 1, "skill": "Leadership"},
          {"roll": 2, "skill": "Electronics", "specialization": "computers"},
          {"roll": 3, "skill": "Pilot", "specialization": "spacecraft"},
          {"roll": 4, "skill": "Tactics", "specialization": "naval"},
          {"roll": 5, "skill": "Admin"},
          {"roll": 6, "skill": "Advocate"}
        ]
      },
      "basicTraining": [
        "Pilot", "Vacc Suit", "Athletics", "Gunner", "Mechanic", "Gun Combat"
      ],
      "musteringOut": {
        "benefits": [
          {"roll": 1, "benefit": "Gun", "type": "equipment"},
          {"roll": 2, "benefit": "Blade", "type": "equipment"},
          {"roll": 3, "benefit": "Travellers", "type": "membership"},
          {"roll": 4, "benefit": "Gun", "type": "equipment"},
          {"roll": 5, "benefit": "Ship Share", "type": "asset"},
          {"roll": 6, "benefit": "Armour", "type": "equipment"},
          {"roll": 7, "benefit": "SOC +1", "type": "characteristic"}
        ],
        "cash": [
          {"roll": 1, "amount": 1000},
          {"roll": 2, "amount": 5000},
          {"roll": 3, "amount": 5000},
          {"roll": 4, "amount": 10000},
          {"roll": 5, "amount": 20000},
          {"roll": 6, "amount": 50000},
          {"roll": 7, "amount": 50000}
        ]
      }
    }
  ]
}
```

## 🔧 Configuration Loading Patterns

### ConfigLoader Implementation Pattern

```typescript
// ✅ CONFIGURATION LOADING: Type-safe configuration management
export class ConfigLoader {
  private static instance: ConfigLoader
  private configCache = new Map<string, unknown>()

  static getInstance(): ConfigLoader {
    if (!ConfigLoader.instance) {
      ConfigLoader.instance = new ConfigLoader()
    }
    return ConfigLoader.instance
  }

  async loadRules(): Promise<Rules> {
    return this.loadConfiguration(
      '/config/rules.json',
      rulesConfigSchema,
      'rules'
    )
  }

  async loadSpecies(): Promise<Species[]> {
    const config = await this.loadConfiguration(
      '/config/species.json',
      speciesConfigSchema,
      'species'
    )
    return config.species
  }

  async loadPhases(): Promise<Phase[]> {
    const config = await this.loadConfiguration(
      '/config/phases.json',
      phasesConfigSchema,
      'phases'
    )
    return config.phases
  }

  private async loadConfiguration<T>(
    path: string,
    schema: z.ZodSchema<T>,
    cacheKey: string
  ): Promise<T> {
    // Check cache first
    if (this.configCache.has(cacheKey)) {
      return this.configCache.get(cacheKey) as T
    }

    try {
      const response = await fetch(path)
      if (!response.ok) {
        throw new ConfigLoadError(`Failed to load configuration: ${path}`)
      }

      const data = await response.json()
      
      // Validate configuration with schema
      const validatedConfig = schema.parse(data)
      
      // Cache validated configuration
      this.configCache.set(cacheKey, validatedConfig)
      
      return validatedConfig
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ConfigValidationError(
          `Invalid configuration format in ${path}`,
          error.errors
        )
      }
      throw error
    }
  }

  // Development helper: Hot reload configurations
  clearCache(): void {
    this.configCache.clear()
  }
}
```

### Configuration Hooks Pattern

```typescript
// ✅ REACT HOOKS: Configuration access hooks
export function useRulesConfig(): {
  rules: Rules | null
  isLoading: boolean
  error: Error | null
} {
  const [rules, setRules] = useState<Rules | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    ConfigLoader.getInstance()
      .loadRules()
      .then(setRules)
      .catch(setError)
      .finally(() => setIsLoading(false))
  }, [])

  return { rules, isLoading, error }
}

export function useSpeciesConfig(): {
  species: Species[]
  isLoading: boolean
  error: Error | null
} {
  const [species, setSpecies] = useState<Species[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    ConfigLoader.getInstance()
      .loadSpecies()
      .then(setSpecies)
      .catch(setError)
      .finally(() => setIsLoading(false))
  }, [])

  return { species, isLoading, error }
}
```

## 🔍 Configuration Validation Patterns

### Schema Definition Pattern

```typescript
// ✅ VALIDATION: Comprehensive schema definitions
import { z } from 'zod'

// Base schemas
export const characteristicSchema = z.enum(['STR', 'DEX', 'END', 'INT', 'EDU', 'SOC'])
export const semverSchema = z.string().regex(/^\d+\.\d+\.\d+$/)

// Metadata schema
export const metadataSchema = z.object({
  title: z.string().min(1),
  description: z.string(),
  author: z.string(),
  source: z.string().optional(),
  lastUpdated: z.string().datetime(),
  compatibleWith: z.array(semverSchema),
  supersedes: z.array(semverSchema).optional(),
  tags: z.array(z.string()).optional()
})

// Species trait schema
export const traitSchema = z.object({
  name: z.string(),
  type: z.enum(['naturalWeapon', 'social', 'behavioral', 'environmental']),
  description: z.string(),
  effect: z.object({
    type: z.string(),
    target: z.string().optional(),
    modifier: z.number().optional(),
    condition: z.string().optional(),
    damage: z.string().optional(),
    traits: z.array(z.string()).optional()
  })
})

// Species modifier schema
export const modifierSchema = z.object({
  characteristic: characteristicSchema,
  modifier: z.number().int().min(-3).max(3),
  reason: z.string().optional()
})

// Complete species schema
export const speciesSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  modifiers: z.array(modifierSchema),
  traits: z.array(traitSchema),
  specialRules: z.array(z.string()),
  homeworlds: z.array(z.string()),
  languageSkills: z.array(z.string()),
  availableCareers: z.union([z.literal('all'), z.array(z.string())]),
  restrictedCareers: z.array(z.string()).optional(),
  preferredCareers: z.array(z.string()).optional()
})

// Configuration file schema
export const speciesConfigSchema = z.object({
  version: semverSchema,
  metadata: metadataSchema,
  species: z.array(speciesSchema)
}).strict()

export type SpeciesConfig = z.infer<typeof speciesConfigSchema>
export type Species = z.infer<typeof speciesSchema>
export type SpeciesTrait = z.infer<typeof traitSchema>
export type SpeciesModifier = z.infer<typeof modifierSchema>
```

### Validation Error Handling

```typescript
// ✅ ERROR HANDLING: Comprehensive validation errors
export class ConfigValidationError extends Error {
  constructor(
    message: string,
    public readonly zodErrors: z.ZodError['errors']
  ) {
    super(message)
    this.name = 'ConfigValidationError'
  }

  getFormattedErrors(): string[] {
    return this.zodErrors.map(error => {
      const path = error.path.join('.')
      return `${path}: ${error.message}`
    })
  }
}

export class ConfigLoadError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message)
    this.name = 'ConfigLoadError'
  }
}

// Usage in components
export function ConfigErrorBoundary({ children }: PropsWithChildren) {
  return (
    <ErrorBoundary
      fallback={({ error }) => {
        if (error instanceof ConfigValidationError) {
          return (
            <ConfigValidationErrorDisplay 
              error={error}
              onRetry={() => window.location.reload()}
            />
          )
        }
        
        if (error instanceof ConfigLoadError) {
          return (
            <ConfigLoadErrorDisplay 
              error={error}
              onRetry={() => window.location.reload()}
            />
          )
        }

        return <GenericErrorDisplay error={error} />
      }}
    >
      {children}
    </ErrorBoundary>
  )
}
```

## 📋 Configuration Best Practices

### 1. Semantic Versioning
```json
{
  "version": "2.1.0",  // MAJOR.MINOR.PATCH
  "metadata": {
    "compatibleWith": ["2.0.0", "2.1.0"],
    "supersedes": ["2.0.0"]
  }
}
```

### 2. Backward Compatibility
```json
{
  "rules": {
    "characteristics": {
      "generation": {
        "method": "2d6",
        "alternativeMethod": "3d6_drop_lowest",  // New optional feature
        "legacySupport": true                    // Maintain old behavior
      }
    }
  }
}
```

### 3. Extensibility Points
```json
{
  "species": {
    "id": "custom_species",
    "extends": "human",                        // Inherit from base species
    "overrides": {
      "modifiers": [
        { "characteristic": "INT", "modifier": 1 }
      ]
    },
    "additionalTraits": [/* ... */]
  }
}
```

### 4. Documentation
```json
{
  "rules": {
    "aging": {
      "threshold": 34,
      "_description": "Characters begin aging checks at age 34",
      "_formula": "2d6 - terms_served >= threshold",
      "_reference": "Traveller Core Rulebook p.42"
    }
  }
}
```

## 🚨 Configuration Compliance Checklist

### File Structure ✅
- [ ] Proper directory organization (`config/`, `public/config/`)
- [ ] Semantic file naming (`kebab-case.json`)
- [ ] Version information in all files
- [ ] Metadata section with required fields

### Schema Validation ✅
- [ ] Zod schema for every configuration file
- [ ] Runtime validation for all loaded configs
- [ ] Proper error handling for validation failures
- [ ] Type inference from schemas

### Content Standards ✅
- [ ] No hardcoded values in source code
- [ ] All game rules externalized to configs
- [ ] Proper semantic versioning
- [ ] Backward compatibility maintained

### Performance ✅
- [ ] Configuration caching implemented
- [ ] Lazy loading for large configs
- [ ] Hot reloading in development
- [ ] Optimized bundle size

**Remember**: Configuration files are the single source of truth for all game rules. Any game mechanic, constant, or rule must be externalized to these files to maintain our zero-hardcoded-rules architecture.
