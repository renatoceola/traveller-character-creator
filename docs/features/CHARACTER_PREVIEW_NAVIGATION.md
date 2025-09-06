# 📊 Character Preview & Navigation System

## 🎯 Overview

The Character Preview & Navigation System provides comprehensive character state visualization and data integrity protection through milestone-based navigation locking. This system ensures users can see their character's complete development while preventing data corruption from step rollbacks.

## 🏗️ Architecture

### **Core Components**

```typescript
// Character preview infrastructure
Enhanced Character Display    → Complete character state visualization
Skills Display System       → Level-based skill representation with sources
Navigation Locking Engine   → Milestone-based rollback prevention
Data Integrity Protection  → Character consistency enforcement
```

### **Data Flow**
```
Character State → Preview Generation → Skills Analysis → Navigation Rules → Display Update
```

## 📊 Character Preview System

### **Enhanced Character Display**

The character preview provides a comprehensive view of the character's current state across multiple categories:

#### **Basic Information Panel**
```typescript
interface CharacterBasicInfo {
  name: string;           // Character name or "Unnamed"
  species: string;        // Selected species or "Not selected"
  skillsCount: number;    // Total number of acquired skills
  eventsCount: number;    // Number of history events
}
```

#### **Characteristics Grid**
```typescript
interface CharacteristicsDisplay {
  layout: 'grid';         // 3x2 grid on mobile, 6x1 on desktop
  characteristics: {
    STR: number;         // With visual emphasis on modified values
    DEX: number;
    END: number;
    INT: number;
    EDU: number;
    SOC: number;
  };
}
```

### **Skills Display System**

#### **Comprehensive Skills Visualization**
```typescript
interface SkillsDisplay {
  overview: {
    totalCount: number;
    levelDistribution: Record<number, number>;
  };
  skillsList: Array<{
    name: string;
    level: number;
    source: string;       // 'homeworld', 'education', 'career', etc.
    visualIndicator: 'background' | 'trained';  // 0 = background, 1+ = trained
  }>;
  groupedBySource: Array<{
    source: string;
    skills: Skill[];
  }>;
}
```

#### **Visual Indicators**
- **Level 0 (Background Skills)**: Gray badges indicating foundational knowledge
- **Level 1+ (Trained Skills)**: Green badges showing formal training
- **Source Grouping**: Skills organized by where they were acquired
- **Responsive Layout**: Grid adjusts for mobile and desktop viewing

### **Skills by Source Display**
```typescript
// Example output
{
  "homeworld": ["Drive", "Animals"],
  "education": ["Computer", "Engineering"], 
  "career": ["Gun Combat", "Leadership"]
}
```

### **Species Special Rules Display**

#### **Intelligent Rule Presentation**
```typescript
interface SpeciesRulesDisplay {
  speciesName: string;    // e.g., "Aslan Special Rules"
  rules: Array<{
    name: string;         // Rule name (extracted from colon-separated format)
    description: string;  // Rule description and mechanics
    presentation: 'card'; // Styled card with visual separation
  }>;
  fallback: string;      // "No special rules for this species"
}
```

#### **Rule Formatting Examples**
- **Simple Rules**: `"Territory: Strong drive to acquire and defend territory"`
- **Mechanical Rules**: `"Dewclaw: +1 DM to melee attacks"`
- **Complex Rules**: `"Pack Mentality: +1 DM to Leadership checks with other Vargr"`

#### **Visual Design**
- **Card Layout**: Each rule in a styled card with background separation
- **Color Coding**: Blue bullets and rule names for visual hierarchy
- **Name/Description Split**: Automatic parsing of colon-separated rule formats
- **Responsive Cards**: Proper spacing and readability across screen sizes

## 🔒 Navigation Locking System

### **Milestone-Based Protection**

The navigation system implements progressive locking to prevent data corruption:

#### **Protected Milestones**
```typescript
const MILESTONE_STEPS = [
  'roll-characteristics',  // Lock after any characteristic > 0
  'choose-species',       // Lock after species selection
  'homeworld',           // Lock after homeworld skills acquired
  'education'            // Lock after education completed
];
```

#### **Locking Logic**
```typescript
function shouldBlockBack(currentStepId: string, character: Character): boolean {
  const protectionRules = {
    'roll-characteristics': () => 
      Object.values(character.characteristics).some(value => value > 0),
    'choose-species': () => 
      Boolean(character.species),
    'homeworld': () => 
      character.skills.some(skill => skill.source === 'homeworld'),
    'education': () => 
      character.skills.some(skill => skill.source === 'education')
  };
  
  // Check if any previous milestone step has been completed
  for (const [stepId, checkFn] of Object.entries(protectionRules)) {
    if (isStepBefore(stepId, currentStepId) && checkFn()) {
      return true;
    }
  }
  
  return false;
}
```

### **Visual Navigation Indicators**

#### **Step Progress Visualization**
```typescript
interface StepIndicator {
  status: 'completed' | 'current' | 'pending';
  isLocked: boolean;
  visualElement: {
    color: 'green' | 'blue' | 'gray';
    lockIndicator?: 'red-dot';  // Shows when step is locked
  };
  tooltip: string;  // Explains status and lock state
}
```

#### **Navigation Warning System**
```typescript
interface NavigationWarning {
  trigger: 'milestone-locked';
  display: {
    banner: 'yellow-warning-bar';
    icon: '🔒';
    title: 'Navigation Locked';
    message: string;
  };
  userGuidance: string;
}
```

## 🔧 Implementation Details

### **Character Preview Component**

```typescript
const CharacterPreview: React.FC<{ character: Character }> = ({ character }) => {
  return (
    <div className="character-preview">
      {/* Basic Info Grid */}
      <BasicInfoPanel character={character} />
      
      {/* Characteristics Display */}
      <CharacteristicsGrid characteristics={character.characteristics} />
      
      {/* Enhanced Skills Display */}
      {character.skills.length > 0 && (
        <SkillsSection 
          skills={character.skills}
          groupBySource={true}
          showLevelIndicators={true}
        />
      )}
    </div>
  );
};
```

### **Skills Section Implementation**

```typescript
const SkillsSection: React.FC<SkillsSectionProps> = ({ skills, groupBySource }) => {
  const skillsBySource = getSkillsBySource(skills);
  
  return (
    <div className="skills-summary">
      <h4>Skills ({skills.length})</h4>
      
      {/* Individual Skills List */}
      <div className="skills-grid">
        {skills.map(skill => (
          <SkillIndicator 
            key={`${skill.name}-${skill.source}`}
            skill={skill}
          />
        ))}
      </div>
      
      {/* Grouped by Source */}
      {groupBySource && (
        <div className="skills-by-source">
          {skillsBySource.map(({ source, skills }) => (
            <SourceGroup key={source} source={source} skills={skills} />
          ))}
        </div>
      )}
    </div>
  );
};
```

### **Navigation Locking Implementation**

```typescript
const StepNavigation: React.FC<NavigationProps> = ({ 
  currentStep, 
  character, 
  onStepComplete,
  onBack 
}) => {
  const canGoBack = currentStepIndex > 0 && !shouldBlockBack(currentStep.id, character);
  const isLocked = shouldBlockBack(currentStep.id, character);
  
  return (
    <div className="step-navigation">
      {/* Warning Banner */}
      {isLocked && <NavigationWarning />}
      
      {/* Step Indicators */}
      <StepIndicators 
        steps={characterCreationSteps}
        currentIndex={currentStepIndex}
        lockingFunction={shouldBlockBack}
        character={character}
      />
      
      {/* Navigation Controls */}
      <NavigationControls
        canGoBack={canGoBack}
        onBack={onBack}
        onContinue={onStepComplete}
      />
    </div>
  );
};
```

## 📈 Data Integrity Benefits

### **Character Consistency**
- **Prevents Characteristic Re-rolling**: After species selection, characteristics can't be changed
- **Maintains Species Modifiers**: Ensures species bonuses aren't lost or corrupted
- **Preserves Skill Sources**: Maintains accurate tracking of skill acquisition
- **Historical Accuracy**: Keeps character history events in correct sequence

### **User Experience Protection**
- **Clear Feedback**: Users understand why navigation is restricted
- **Visual Indicators**: Locked steps are clearly marked
- **Progressive Locking**: Users can still modify current step content
- **Restart Option**: Clear path to restart if major changes are needed

## 🎨 Visual Design

### **Color Coding System**
```css
/* Step Status Colors */
.step-completed { color: #10b981; }    /* Green */
.step-current { color: #3b82f6; }      /* Blue */
.step-pending { color: #64748b; }      /* Gray */
.step-locked { border: 2px solid #ef4444; } /* Red indicator */

/* Skill Level Indicators */
.skill-background { background: #64748b; }  /* Gray for level 0 */
.skill-trained { background: #059669; }     /* Green for level 1+ */

/* Warning Elements */
.navigation-warning { 
  background: rgba(217, 119, 6, 0.2);  /* Yellow warning */
  border: 1px solid #d97706;
}
```

### **Responsive Layout**
- **Mobile**: Stacked cards with collapsed skill sources
- **Tablet**: Grid layout with expanded skill details
- **Desktop**: Side-by-side preview and history panels

## 📊 Performance Considerations

### **Optimization Strategies**
- **Memoized Components**: Skills display only re-renders when skills change
- **Virtual Scrolling**: For characters with many skills (future enhancement)
- **Lazy Loading**: Source grouping calculated on demand
- **Efficient Updates**: Only affected UI sections re-render on character changes

### **Memory Management**
- **Skills Array**: Efficiently stored with source references
- **Navigation State**: Minimal state for locking calculations
- **Preview Updates**: Debounced for rapid character changes

## 🧪 Testing Strategy

### **Unit Tests**
- Navigation locking logic for each milestone
- Skills grouping and display functions
- Character preview data transformation
- Visual indicator state calculations

### **Integration Tests**
- Complete character creation workflow with navigation
- Skills acquisition and display across multiple steps
- Navigation warning display and dismissal
- Character consistency throughout process

### **User Experience Tests**
- Navigation attempt scenarios
- Skills display accuracy
- Warning message clarity
- Mobile responsiveness

## 🚀 Future Enhancements

### **Advanced Features**
- **Skill Filters**: Filter skills by level, source, or type
- **Character Comparison**: Compare multiple character builds
- **Export Preview**: Include preview in character sheet exports
- **Skill Dependencies**: Show skill prerequisites and relationships

### **Enhanced Navigation**
- **Step Previews**: Hover to see step content summaries
- **Progress Estimation**: Show estimated completion time
- **Bookmark System**: Save character state at specific steps
- **Guided Tours**: Interactive tutorials for new users

### **Advanced Locking**
- **Conditional Locks**: Lock based on specific choices made
- **Temporary Unlocks**: Allow brief rollback with confirmation
- **Custom Milestones**: User-defined points of no return
- **Rollback Warnings**: Preview what would be lost before locking

## 🎯 Success Metrics

### **User Engagement**
- **Preview Usage**: > 90% of users interact with character preview
- **Navigation Clarity**: < 5% of users attempt locked navigation
- **Skills Understanding**: > 95% accuracy in user skill comprehension
- **Completion Rate**: > 80% of users complete character creation

### **Technical Performance**
- **Preview Rendering**: < 50ms for character preview updates
- **Navigation Response**: < 10ms for lock state calculations
- **Memory Usage**: < 5MB for complete character state
- **Update Efficiency**: < 3 DOM updates per character change

### **Data Integrity**
- **Character Consistency**: 100% accurate character state maintenance
- **Skill Tracking**: 100% accurate source attribution
- **History Preservation**: 100% complete event tracking
- **Navigation Safety**: 0% character corruption from rollbacks

The Character Preview & Navigation System provides users with comprehensive character understanding while maintaining strict data integrity throughout the character creation process, resulting in a reliable and user-friendly experience.
