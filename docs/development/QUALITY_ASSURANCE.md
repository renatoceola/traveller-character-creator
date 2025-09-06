# Traveller Character Creator v2 - Quality Assurance Guidelines

## 🎯 Quality Assurance Overview

This document defines the mandatory quality assurance standards, testing requirements, and validation processes to maintain the integrity and reliability of the Traveller Character Creator v2 project.

## 🏆 Quality Standards

### Code Quality Requirements (Mandatory)

#### TypeScript Strict Mode Compliance
```typescript
// ✅ REQUIRED: All code must pass TypeScript strict mode
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

// ❌ FORBIDDEN: Any usage of 'any' type
function processData(data: any): any {  // NEVER USE
  return data
}

// ✅ REQUIRED: Proper type definitions
function processCharacterData(data: CharacterData): CharacterResult {
  return validateAndTransformCharacter(data)
}
```

#### Error Handling Standards
```typescript
// ✅ REQUIRED: Comprehensive error handling
export async function loadConfiguration(): Promise<Configuration> {
  try {
    const response = await fetch('/config/rules.json')
    
    if (!response.ok) {
      throw new ConfigLoadError(
        `Failed to load configuration: ${response.status} ${response.statusText}`
      )
    }

    const data = await response.json()
    return configurationSchema.parse(data)
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ConfigValidationError('Invalid configuration format', error.errors)
    }
    
    if (error instanceof ConfigLoadError) {
      throw error
    }
    
    throw new ConfigLoadError('Unexpected error loading configuration', error)
  }
}
```

### Performance Requirements (Mandatory)

#### Bundle Size Limits
- **Initial bundle**: Maximum 500KB gzipped
- **Component chunks**: Maximum 100KB each
- **Configuration files**: Maximum 50KB each
- **Image assets**: WebP format, optimized sizes

#### Runtime Performance Targets
- **Initial load time**: < 2 seconds on 3G connection
- **Component render time**: < 100ms for complex components
- **Configuration load time**: < 500ms
- **Memory usage**: < 50MB for typical character creation session
- **Time to Interactive (TTI)**: < 3 seconds

#### Performance Monitoring
```typescript
// ✅ REQUIRED: Performance measurement
export function measurePerformance<T>(
  operation: string,
  fn: () => T | Promise<T>
): T | Promise<T> {
  const startTime = performance.now()
  
  const result = fn()
  
  if (result instanceof Promise) {
    return result.finally(() => {
      const endTime = performance.now()
      console.debug(`${operation} took ${endTime - startTime}ms`)
    })
  }
  
  const endTime = performance.now()
  console.debug(`${operation} took ${endTime - startTime}ms`)
  return result
}
```

## 🧪 Testing Requirements

### Test Coverage Standards (Mandatory)

#### Minimum Coverage Requirements
- **Overall coverage**: 90% minimum
- **Core modules**: 95% minimum (`/src/core/`, `/src/utils/`)
- **Configuration validation**: 100% coverage
- **Critical paths**: 100% coverage (character creation workflow)
- **Error handling**: 100% coverage

#### Test Categories and Requirements

##### 1. Unit Tests (Required)
```typescript
// ✅ UNIT TEST: Pure function testing with CharacteristicCalculator
import { CharacteristicCalculator } from '@/utils/characteristicCalculator'

describe('CharacteristicCalculator', () => {
  const mockRules: Rules = {
    characteristics: {
      generation: { method: '2d6', rolls: 6, minimumValue: 1, maximumValue: 15 },
      dmTable: [
        { minValue: 0, maxValue: 2, modifier: -2 },
        { minValue: 3, maxValue: 5, modifier: -1 },
        { minValue: 6, maxValue: 8, modifier: 0 },
        { minValue: 9, maxValue: 11, modifier: 1 },
        { minValue: 12, maxValue: 14, modifier: 2 },
        { minValue: 15, maxValue: 15, modifier: 3 }
      ]
    }
    // ... other required rules properties
  }

  describe('getCharacteristicModifier', () => {
    it.each([
      [0, -2],
      [3, -1],
      [6, 0],
      [9, 1],
      [12, 2],
      [15, 3]
    ])('should return %i modifier for characteristic value %i', (value, expected) => {
      expect(CharacteristicCalculator.getCharacteristicModifier(value, mockRules)).toBe(expected)
    })
  })

  describe('applySpeciesModifiers', () => {
    it('should apply Aslan modifiers correctly', () => {
      const baseCharacteristics = { STR: 8, DEX: 8, END: 8, INT: 8, EDU: 8, SOC: 8 }
      const aslanSpecies: Species = { 
        id: 'aslan',
        name: 'Aslan',
        modifiers: [
          { characteristic: 'STR', modifier: 2 },
          { characteristic: 'DEX', modifier: -2 }
        ],
        traits: []
      }

      const result = CharacteristicCalculator.applySpeciesModifiers(
        baseCharacteristics, 
        aslanSpecies,
        mockRules
      )

      expect(result.STR).toBe(10)
      expect(result.DEX).toBe(6)
      expect(result.END).toBe(8) // Unchanged
    })

    it('should enforce characteristic bounds', () => {
      const baseCharacteristics = { STR: 15, DEX: 2, END: 8, INT: 8, EDU: 8, SOC: 8 }
      const species: Species = { 
        id: 'test',
        name: 'Test',
        modifiers: [
          { characteristic: 'STR', modifier: 2 },  // Would exceed 15
          { characteristic: 'DEX', modifier: -2 }  // Would go below 1
        ],
        traits: []
      }

      const result = CharacteristicCalculator.applySpeciesModifiers(
        baseCharacteristics, 
        species,
        mockRules
      )

      expect(result.STR).toBe(15) // Capped at maximum
      expect(result.DEX).toBe(1)  // Floored at minimum
    })
  })

  describe('validateCharacteristics', () => {
    it('should validate characteristics within bounds', () => {
      const characteristics = { STR: 10, DEX: 8, END: 12, INT: 9, EDU: 11, SOC: 7 }
      
      const result = CharacteristicCalculator.validateCharacteristics(characteristics, mockRules)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect out-of-bounds characteristics', () => {
      const characteristics = { STR: 0, DEX: 16, END: 8, INT: 8, EDU: 8, SOC: 8 }
      
      const result = CharacteristicCalculator.validateCharacteristics(characteristics, mockRules)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('STR value 0 is below minimum 1')
      expect(result.errors).toContain('DEX value 16 is above maximum 15')
    })
  })
})
```

##### 2. Integration Tests (Required)
```typescript
// ✅ INTEGRATION TEST: Component and service integration
describe('Character Creation Integration', () => {
  let configLoader: ConfigLoader
  let stepEngine: StepEngine
  let characterStore: ReturnType<typeof useCharacterStore>

  beforeEach(async () => {
    configLoader = ConfigLoader.getInstance()
    stepEngine = new StepEngine(configLoader)
    characterStore = useCharacterStore.getState()
    
    // Load test configurations
    await configLoader.loadRules()
    await configLoader.loadSpecies()
  })

  describe('Species Selection Workflow', () => {
    it('should complete species selection step', async () => {
      // Start with rolled characteristics
      characterStore.actions.updateCharacteristic('STR', 10)
      characterStore.actions.updateCharacteristic('DEX', 8)
      
      // Select Aslan species
      const aslanSpecies = await configLoader.getSpecies('aslan')
      const result = await stepEngine.executeStep('choose-species', {
        selectedSpecies: aslanSpecies
      })

      expect(result.success).toBe(true)
      expect(characterStore.character.species).toEqual(aslanSpecies)
      expect(characterStore.character.characteristics.STR).toBe(12) // 10 + 2
      expect(characterStore.character.characteristics.DEX).toBe(6)   // 8 - 2
    })

    it('should validate step dependencies', async () => {
      // Attempt species selection without characteristics
      const result = await stepEngine.executeStep('choose-species', {
        selectedSpecies: await configLoader.getSpecies('human')
      })

      expect(result.success).toBe(false)
      expect(result.errors).toContain('characteristics_not_rolled')
    })
  })
})
```

##### 3. Component Tests (Required)
```typescript
// ✅ COMPONENT TEST: React component testing with reference implementations
import { render, screen, userEvent } from '@testing-library/react'
import { SpeciesSelector } from '@/components/ui/SpeciesSelector'

describe('SpeciesSelector', () => {
  const mockSpecies: Species[] = [
    {
      id: 'human',
      name: 'Human',
      modifiers: [],
      traits: []
    },
    {
      id: 'aslan',
      name: 'Aslan',
      modifiers: [
        { characteristic: 'STR', modifier: 2 },
        { characteristic: 'DEX', modifier: -2 }
      ],
      traits: []
    }
  ]

  it('should render species options', () => {
    render(
      <SpeciesSelector
        species={mockSpecies}
        selectedSpecies={null}
        onSpeciesSelect={jest.fn()}
        isLoading={false}
      />
    )

    expect(screen.getByText('Human')).toBeInTheDocument()
    expect(screen.getByText('Aslan')).toBeInTheDocument()
  })

  it('should show modifiers for non-human species', () => {
    render(
      <SpeciesSelector
        species={mockSpecies}
        selectedSpecies={null}
        onSpeciesSelect={jest.fn()}
        isLoading={false}
      />
    )

    expect(screen.getByText('STR +2')).toBeInTheDocument()
    expect(screen.getByText('DEX -2')).toBeInTheDocument()
  })

  // ✅ REFERENCE: Tests based on actual SpeciesSelector implementation
  // See src/components/ui/SpeciesSelector.tsx for complete component
})

    expect(screen.getByText('STR +2')).toBeInTheDocument()
    expect(screen.getByText('DEX -2')).toBeInTheDocument()
  })

  it('should handle species selection', async () => {
    const mockOnSelect = jest.fn()
    
    render(
      <SpeciesSelectionStep
        species={mockSpecies}
        selectedSpecies={null}
        onSpeciesSelect={mockOnSelect}
        isLoading={false}
      />
    )

    const aslanCard = screen.getByTestId('species-card-aslan')
    await userEvent.click(aslanCard)

    expect(mockOnSelect).toHaveBeenCalledWith(mockSpecies[1])
  })

  it('should show loading state', () => {
    render(
      <SpeciesSelectionStep
        species={[]}
        selectedSpecies={null}
        onSpeciesSelect={jest.fn()}
        isLoading={true}
      />
    )

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('should be accessible', async () => {
    const { container } = render(
      <SpeciesSelectionStep
        species={mockSpecies}
        selectedSpecies={null}
        onSpeciesSelect={jest.fn()}
        isLoading={false}
      />
    )

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
```

##### 4. Configuration Tests (Required)
```typescript
// ✅ CONFIGURATION TEST: Validate all configuration files
describe('Configuration Validation', () => {
  describe('Rules Configuration', () => {
    it('should load valid rules configuration', async () => {
      const rules = await ConfigLoader.getInstance().loadRules()
      
      expect(rules.version).toMatch(/^\d+\.\d+\.\d+$/)
      expect(rules.characteristics).toBeDefined()
      expect(rules.aging).toBeDefined()
      expect(rules.skills).toBeDefined()
    })

    it('should validate characteristic generation rules', async () => {
      const rules = await ConfigLoader.getInstance().loadRules()
      
      expect(rules.characteristics.generation.method).toBe('2d6')
      expect(rules.characteristics.generation.rolls).toBe(6)
      expect(rules.characteristics.generation.minimumValue).toBe(1)
      expect(rules.characteristics.generation.maximumValue).toBe(15)
    })
  })

  describe('Species Configuration', () => {
    it('should load all core species', async () => {
      const species = await ConfigLoader.getInstance().loadSpecies()
      
      const speciesNames = species.map(s => s.name)
      expect(speciesNames).toContain('Human')
      expect(speciesNames).toContain('Aslan')
      expect(speciesNames).toContain('Vargr')
      expect(speciesNames).toContain('Zhodani')
    })

    it('should validate species modifiers', async () => {
      const species = await ConfigLoader.getInstance().loadSpecies()
      
      species.forEach(s => {
        s.modifiers.forEach(modifier => {
          expect(['STR', 'DEX', 'END', 'INT', 'EDU', 'SOC']).toContain(modifier.characteristic)
          expect(modifier.modifier).toBeGreaterThanOrEqual(-3)
          expect(modifier.modifier).toBeLessThanOrEqual(3)
        })
      })
    })
  })

  describe('Phase Configuration', () => {
    it('should load valid phase configuration', async () => {
      const phases = await ConfigLoader.getInstance().loadPhases()
      
      expect(phases).toHaveLength(5) // Expected number of phases
      
      const stepIds = phases.flatMap(p => p.steps.map(s => s.id))
      expect(stepIds).toContain('roll-characteristics')
      expect(stepIds).toContain('choose-species')
    })

    it('should validate step dependencies', async () => {
      const phases = await ConfigLoader.getInstance().loadPhases()
      
      phases.forEach(phase => {
        phase.steps.forEach(step => {
          if (step.dependencies) {
            step.dependencies.forEach(depId => {
              const allStepIds = phases.flatMap(p => p.steps.map(s => s.id))
              expect(allStepIds).toContain(depId)
            })
          }
        })
      })
    })
  })
})
```

##### 5. End-to-End Tests (Required)
```typescript
// ✅ E2E TEST: Complete user workflows
describe('Character Creation E2E', () => {
  beforeEach(async () => {
    await page.goto('http://localhost:3000')
  })

  it('should complete basic character creation', async () => {
    // Step 1: Roll characteristics
    await page.click('[data-testid="roll-characteristics-button"]')
    await page.waitForSelector('[data-testid="characteristics-rolled"]')
    
    // Verify characteristics are displayed
    const strValue = await page.textContent('[data-testid="characteristic-STR"]')
    expect(parseInt(strValue || '0')).toBeGreaterThan(0)
    
    // Assign characteristics (if using manual assignment)
    await page.click('[data-testid="assign-characteristics"]')
    
    // Step 2: Choose species
    await page.click('[data-testid="next-step"]')
    await page.click('[data-testid="species-card-aslan"]')
    
    // Verify modifiers are applied
    const modifiedStr = await page.textContent('[data-testid="characteristic-STR"]')
    expect(parseInt(modifiedStr || '0')).toBeGreaterThan(parseInt(strValue || '0'))
    
    // Step 3: Character details
    await page.click('[data-testid="next-step"]')
    await page.fill('[data-testid="character-name"]', 'Test Character')
    await page.fill('[data-testid="character-homeworld"]', 'Test World')
    
    // Step 4: Continue through remaining steps
    await page.click('[data-testid="next-step"]')
    // ... continue through all steps
    
    // Final verification
    await page.waitForSelector('[data-testid="character-complete"]')
    expect(await page.textContent('[data-testid="character-name-display"]')).toBe('Test Character')
  })

  it('should handle errors gracefully', async () => {
    // Simulate configuration loading failure
    await page.route('/config/rules.json', route => route.abort())
    
    await page.reload()
    
    // Should show error message
    await page.waitForSelector('[data-testid="config-error"]')
    expect(await page.textContent('[data-testid="error-message"]')).toContain('Failed to load')
    
    // Should offer retry option
    await page.click('[data-testid="retry-button"]')
  })

  it('should be accessible', async () => {
    await injectAxe(page)
    
    const accessibilityResults = await checkA11y(page)
    expect(accessibilityResults.violations).toHaveLength(0)
  })

  it('should work on mobile', async () => {
    await page.setViewportSize({ width: 375, height: 667 }) // iPhone SE
    
    // Basic functionality should work
    await page.click('[data-testid="roll-characteristics-button"]')
    await page.waitForSelector('[data-testid="characteristics-rolled"]')
    
    // Navigation should be mobile-friendly
    expect(await page.isVisible('[data-testid="mobile-navigation"]')).toBe(true)
  })
})
```

### Accessibility Testing (Mandatory)

#### WCAG 2.1 Compliance Requirements
```typescript
// ✅ ACCESSIBILITY: Comprehensive a11y testing
describe('Accessibility Compliance', () => {
  it('should meet WCAG 2.1 AA standards', async () => {
    const { container } = render(<CharacterCreationApp />)
    const results = await axe(container, {
      rules: {
        'color-contrast': { enabled: true },
        'keyboard-navigation': { enabled: true },
        'aria-labels': { enabled: true },
        'focus-management': { enabled: true }
      }
    })
    
    expect(results).toHaveNoViolations()
  })

  it('should support keyboard navigation', async () => {
    render(<SpeciesSelectionStep {...props} />)
    
    // Tab through all interactive elements
    await userEvent.tab()
    expect(screen.getByTestId('species-card-human')).toHaveFocus()
    
    await userEvent.tab()
    expect(screen.getByTestId('species-card-aslan')).toHaveFocus()
    
    // Enter should select species
    await userEvent.keyboard('{Enter}')
    expect(mockOnSelect).toHaveBeenCalled()
  })

  it('should provide proper ARIA labels', () => {
    render(<DiceRollingComponent {...props} />)
    
    const rollButton = screen.getByRole('button', { name: /roll 2d6/i })
    expect(rollButton).toHaveAttribute('aria-describedby')
    
    const description = screen.getByText(/click to roll two six-sided dice/i)
    expect(description).toBeInTheDocument()
  })

  it('should announce dynamic content changes', async () => {
    render(<CharacteristicDisplay {...props} />)
    
    const liveRegion = screen.getByRole('status')
    expect(liveRegion).toHaveAttribute('aria-live', 'polite')
    
    // Simulate characteristic change
    await userEvent.click(screen.getByTestId('roll-str'))
    
    expect(liveRegion).toHaveTextContent(/strength updated to/i)
  })
})
```

### Performance Testing (Mandatory)

#### Load Testing
```typescript
// ✅ PERFORMANCE: Load and stress testing
describe('Performance Testing', () => {
  it('should load initial bundle within size limits', async () => {
    const bundleStats = await getBundleStats()
    
    expect(bundleStats.totalSize).toBeLessThan(500 * 1024) // 500KB
    expect(bundleStats.gzippedSize).toBeLessThan(150 * 1024) // 150KB gzipped
  })

  it('should render components within time limits', async () => {
    const startTime = performance.now()
    
    render(<ComplexCharacterSheet character={mockComplexCharacter} />)
    
    const endTime = performance.now()
    expect(endTime - startTime).toBeLessThan(100) // 100ms
  })

  it('should handle large configuration files efficiently', async () => {
    const largeConfig = generateLargeConfiguration(1000) // 1000 species
    
    const startTime = performance.now()
    const processed = await processConfiguration(largeConfig)
    const endTime = performance.now()
    
    expect(endTime - startTime).toBeLessThan(500) // 500ms
    expect(processed).toBeDefined()
  })

  it('should maintain stable memory usage', async () => {
    const initialMemory = getMemoryUsage()
    
    // Simulate extended character creation session
    for (let i = 0; i < 100; i++) {
      await createCharacter()
    }
    
    const finalMemory = getMemoryUsage()
    const memoryGrowth = finalMemory - initialMemory
    
    expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024) // 10MB max growth
  })
})
```

## 🔍 Code Review Requirements

### Pre-Commit Checklist (Mandatory)
```bash
# ✅ REQUIRED: All checks must pass before commit
npm run type-check     # TypeScript compilation
npm run lint          # ESLint with no warnings
npm run test          # All tests pass
npm run test:coverage # Coverage meets minimums
npm run build         # Production build succeeds
npm run a11y          # Accessibility checks pass
```

### Pull Request Requirements (Mandatory)

#### Code Review Checklist
- [ ] **Type Safety**: TypeScript compiles without errors
- [ ] **Test Coverage**: New code has 90%+ test coverage
- [ ] **Configuration**: No hardcoded game rules in components
- [ ] **Error Handling**: All async operations have error handling
- [ ] **Accessibility**: WCAG 2.1 AA compliance verified
- [ ] **Performance**: Bundle size and runtime performance within limits
- [ ] **Documentation**: API changes documented
- [ ] **Backward Compatibility**: Changes don't break existing configurations

#### Automated Checks
```yaml
# .github/workflows/quality-assurance.yml
name: Quality Assurance
on: [push, pull_request]

jobs:
  quality-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Type checking
        run: npm run type-check
      
      - name: Linting
        run: npm run lint
      
      - name: Unit tests
        run: npm run test:coverage
      
      - name: Component tests
        run: npm run test:components
      
      - name: E2E tests
        run: npm run test:e2e
      
      - name: Accessibility tests
        run: npm run test:a11y
      
      - name: Performance tests
        run: npm run test:performance
      
      - name: Bundle analysis
        run: npm run analyze
      
      - name: Configuration validation
        run: npm run validate:configs
```

## 📊 Quality Metrics Dashboard

### Continuous Monitoring
```typescript
// ✅ MONITORING: Quality metrics tracking
export interface QualityMetrics {
  readonly codeQuality: {
    readonly typeScriptErrors: number
    readonly eslintWarnings: number
    readonly testCoverage: number
    readonly codeComplexity: number
  }
  
  readonly performance: {
    readonly bundleSize: number
    readonly initialLoadTime: number
    readonly timeToInteractive: number
    readonly memoryUsage: number
  }
  
  readonly accessibility: {
    readonly wcagViolations: number
    readonly keyboardNavigation: boolean
    readonly screenReaderCompatible: boolean
    readonly colorContrast: number
  }
  
  readonly configuration: {
    readonly hardcodedRules: number
    readonly configurationCoverage: number
    readonly schemaValidation: boolean
    readonly backwardCompatibility: boolean
  }
}

export function generateQualityReport(): QualityMetrics {
  return {
    codeQuality: {
      typeScriptErrors: getTypeScriptErrors(),
      eslintWarnings: getEslintWarnings(),
      testCoverage: getTestCoverage(),
      codeComplexity: getCodeComplexity()
    },
    performance: {
      bundleSize: getBundleSize(),
      initialLoadTime: measureInitialLoadTime(),
      timeToInteractive: measureTimeToInteractive(),
      memoryUsage: measureMemoryUsage()
    },
    accessibility: {
      wcagViolations: getAccessibilityViolations(),
      keyboardNavigation: testKeyboardNavigation(),
      screenReaderCompatible: testScreenReaderCompatibility(),
      colorContrast: measureColorContrast()
    },
    configuration: {
      hardcodedRules: detectHardcodedRules(),
      configurationCoverage: measureConfigurationCoverage(),
      schemaValidation: validateAllSchemas(),
      backwardCompatibility: testBackwardCompatibility()
    }
  }
}
```

### Quality Gates
```typescript
// ✅ QUALITY GATES: Automated quality enforcement
export const QUALITY_GATES = {
  codeQuality: {
    typeScriptErrors: 0,        // No TypeScript errors allowed
    eslintWarnings: 0,          // No ESLint warnings allowed
    testCoverage: 90,           // Minimum 90% test coverage
    codeComplexity: 10          // Maximum cyclomatic complexity
  },
  
  performance: {
    bundleSize: 500 * 1024,     // 500KB maximum
    initialLoadTime: 2000,      // 2 seconds maximum
    timeToInteractive: 3000,    // 3 seconds maximum
    memoryUsage: 50 * 1024 * 1024 // 50MB maximum
  },
  
  accessibility: {
    wcagViolations: 0,          // No WCAG violations
    keyboardNavigation: true,   // Full keyboard support required
    screenReaderCompatible: true, // Screen reader support required
    colorContrast: 4.5          // WCAG AA contrast ratio
  },
  
  configuration: {
    hardcodedRules: 0,          // No hardcoded game rules
    configurationCoverage: 100, // All rules must be configurable
    schemaValidation: true,     // All schemas must validate
    backwardCompatibility: true // Must maintain compatibility
  }
} as const

export function validateQualityGates(metrics: QualityMetrics): boolean {
  const violations: string[] = []
  
  // Check each quality gate
  Object.entries(QUALITY_GATES).forEach(([category, gates]) => {
    Object.entries(gates).forEach(([metric, threshold]) => {
      const value = metrics[category as keyof QualityMetrics][metric as string]
      
      if (typeof threshold === 'number' && typeof value === 'number') {
        if (value > threshold) {
          violations.push(`${category}.${metric}: ${value} exceeds ${threshold}`)
        }
      } else if (typeof threshold === 'boolean' && value !== threshold) {
        violations.push(`${category}.${metric}: ${value} should be ${threshold}`)
      }
    })
  })
  
  if (violations.length > 0) {
    console.error('Quality gate violations:', violations)
    return false
  }
  
  return true
}
```

## 🚨 Quality Assurance Compliance Checklist

### Development Process ✅
- [ ] TypeScript strict mode enabled and all code compiles
- [ ] 90%+ test coverage maintained across all categories
- [ ] All tests pass in CI/CD pipeline
- [ ] ESLint rules enforced with zero warnings
- [ ] Performance budgets within defined limits
- [ ] Accessibility standards (WCAG 2.1 AA) verified

### Configuration Quality ✅
- [ ] No hardcoded game rules in source code
- [ ] All configuration files have corresponding Zod schemas
- [ ] Runtime validation for all external data
- [ ] Backward compatibility maintained for configuration changes
- [ ] Configuration documentation updated with changes

### Code Review Process ✅
- [ ] Two-reviewer approval for core system changes
- [ ] Automated quality checks pass before merge
- [ ] Performance impact assessed for significant changes
- [ ] Security review for plugin system changes
- [ ] Documentation updated for API changes

### Release Quality ✅
- [ ] All quality gates pass
- [ ] E2E tests cover critical user workflows
- [ ] Performance testing on multiple devices
- [ ] Accessibility testing with real assistive technologies
- [ ] Configuration migration guides provided for breaking changes

**Remember**: Quality assurance is not optional - it's fundamental to maintaining the integrity and reliability of our configuration-driven architecture. Every contribution must meet these standards to ensure our system remains robust, accessible, and performant.
