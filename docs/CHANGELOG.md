# Traveller Character Creator v2 - Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Species Special Rules Display** (August 25, 2025)
  - Added species special rules section to character preview
  - Intelligent rule parsing with name/description separation
  - Enhanced visual presentation with card-based layout
  - Automatic fallback for species without special rules
  - Blue color-coded rule names and bullet points

- **Documentation Organization** (August 25, 2025)
  - Created organized `docs/` folder structure
  - Added `docs/development/` for development guidelines
  - Added `docs/features/` for feature documentation
  - Created comprehensive `docs/README.md` index

### Changed
- **Streamlined Application Architecture** (August 25, 2025)
  - Removed all-in-one view, kept only step-by-step workflow
  - Updated main README.md to reference new documentation structure
  - Updated all documentation to reflect removal of CharacterCreationPhase component
  - Updated .github/copilot-instructions.md with new file paths
  - Enhanced project structure clarity

### Removed
- **Code Cleanup** (August 25, 2025)
  - Removed `src/components/phases/CharacterCreationPhase.tsx` (all-in-one approach)
  - Removed `src/components/ExampleCharacterCreatorApp.tsx` (example file)
  - Removed `src/App_new.tsx` (backup file)
  - Removed empty `src/components/phases/` directory
  - Cleaned up all documentation references to removed components

### Added (Previous)
- Comprehensive project instruction files
  - CONTRIBUTING.md - Development contribution guidelines
  - CODING_STANDARDS.md - Mandatory coding standards and patterns
  - ARCHITECTURE.md - System architecture guidelines
  - CONFIGURATION_GUIDE.md - Configuration system documentation
  - CHANGELOG.md - Project change tracking

### Changed (Previous)
- Updated documentation structure for maintainability
- Improved project governance and development guidelines

## [1.0.0-alpha] - 2024-12-28

### Added
- **Foundation Complete (Phase 1)**
  - Modern tech stack: Vite 7.1.2, React 19.1.1, TypeScript 5.8.3
  - Configuration-driven architecture with JSON-based game rules
  - Type-safe configuration system with Zod validation
  - State management with Zustand 4.5.7 and Immer integration
  - Core game mechanics: dice rolling, characteristics, species modifiers
  - Comprehensive error handling and validation

- **Configuration System**
  - ConfigLoader singleton for JSON configuration management
  - Runtime validation with Zod schemas
  - Hot-reloadable configurations in development
  - Type-safe configuration interfaces

- **Game Data Implementation**
  - Rules configuration (character creation, aging, skills)
  - Species system: 6 species (Human, Aslan, Vargr, Zhodani, Vilani, Solomani)
  - Workflow definition: 5 phases, 11 steps with dependencies
  - Complete characteristic generation and modification system

- **State Management**
  - Zustand store with reactive character creation state
  - Action hooks for clean state manipulation
  - Computed selectors for derived state calculations
  - Progress tracking for step completion

- **Core Engine**
  - StepEngine for workflow management with dependencies
  - Dice system with complete Traveller mechanics (2d6, 3d6, modifiers)
  - Validation engine with rule-based step validation
  - Progress tracking for phases and step completion

- **UI Foundation**
  - Tailwind CSS setup with dark theme support
  - Responsive design with mobile-first approach
  - Error boundaries for graceful error handling
  - Loading states for async configuration loading
  - Basic component shell ready for implementation

- **Development Environment**
  - TypeScript strict mode configuration
  - ESLint with TypeScript and React rules
  - Path aliases for clean imports (@/, @config/, @schemas/)
  - Fast HMR with Vite
  - Production-ready build system

### Project Structure
```
traveller-v2/
├── config/                  # Development configuration files
├── public/config/           # Runtime configuration files
│   ├── rules.json          # Game rules and mechanics
│   ├── species.json        # Species definitions with modifiers
│   └── phases.json         # Character creation workflow
├── schemas/                # Zod validation schemas
│   └── validation.ts       # Runtime validation
├── src/
│   ├── core/              # Core system classes
│   │   ├── ConfigLoader.ts # Configuration management
│   │   └── StepEngine.ts   # Workflow management
│   ├── store/             # State management
│   │   └── characterStore.ts # Character creation state
│   ├── types/             # TypeScript definitions
│   │   └── index.ts       # Complete type system
│   ├── utils/             # Utility functions
│   │   └── dice.ts        # Traveller dice mechanics
│   ├── components/        # React components (basic shell)
│   │   ├── phases/        # Step-specific components (planned)
│   │   └── ui/            # Reusable UI components (planned)
│   └── App.tsx            # Main application
└── Documentation files
```

### Technical Specifications
- **Bundle Size**: Production build under 200KB gzipped
- **Performance**: Sub-2s builds, instant HMR
- **Type Safety**: 100% TypeScript coverage with strict mode
- **Validation**: All configurations validated with Zod schemas
- **Browser Support**: Modern browsers with ES2022 support

### Game System Implementation
- **Characteristics**: STR, DEX, END, INT, EDU, SOC with proper ranges (1-15)
- **Dice Mechanics**: 2d6 standard, 3d6 for generation, DM calculations
- **Species System**: 6 major species with accurate characteristic modifiers
- **Aging Framework**: Term-based characteristic degradation system
- **Skill Structure**: Levels 0-4 with cascade specializations
- **Workflow Management**: Phase-based character creation with dependencies

### Documentation
- PROJECT_SPECIFICATION.md - Complete project vision and requirements
- DEVELOPMENT_ROADMAP.md - Phased development plan and milestones
- PROJECT_STATUS.md - Current implementation status and progress
- AI_ASSISTANT_SUMMARY.md - Project context and architectural insights
- README.md - Basic project information and setup

### Configuration Files
- **rules.json**: Character creation rules, aging mechanics, skill system
- **species.json**: Species definitions with modifiers and special rules
- **phases.json**: Step-by-step character creation workflow

## [0.1.0] - 2024-12-27

### Added
- Initial project setup with Vite + React + TypeScript
- Basic project structure and build configuration
- Initial dependency installation and configuration

### Infrastructure
- Node.js project initialization
- Package.json with dependencies
- TypeScript configuration
- Vite configuration
- Basic file structure

---

## Version History Summary

- **1.0.0-alpha**: Complete foundation with configuration-driven architecture
- **0.1.0**: Initial project setup

## Next Planned Releases

### [1.1.0] - Phase 2: Core UI Implementation (Planned)
- Interactive dice rolling components
- Species selection interface
- Character sheet preview
- Step navigation system
- Basic character creation workflow

### [1.2.0] - Phase 2 Continued (Planned)
- Background skills selection
- Education system implementation
- Pre-career events
- Complete step component library

### [2.0.0] - Phase 3: Advanced Game Systems (Planned)
- Career system with full tables
- Event system implementation
- Equipment and mustering out
- Enhanced species traits
- Complete Mongoose Traveller 2nd Edition support

### [3.0.0] - Phase 4: Plugin Architecture (Planned)
- Dynamic component registry
- Plugin loading system
- Configuration merging
- Visual configuration editor
- Community plugin support

## Breaking Changes

### [1.0.0-alpha]
- Initial stable API - no breaking changes from previous versions
- Configuration file format established
- Type system finalized

## Migration Guides

### Upgrading to 1.0.0-alpha
- No migration needed for new installations
- Configuration files follow established JSON schema
- TypeScript interfaces provide compile-time safety

## Security Updates

### [1.0.0-alpha]
- Runtime validation prevents configuration injection attacks
- Type safety prevents common runtime errors
- No external data sources without validation

## Performance Improvements

### [1.0.0-alpha]
- Configuration caching for improved load times
- Lazy loading architecture prepared
- Optimized bundle size under 200KB gzipped
- Fast HMR for development

## Documentation Changes

### [1.0.0-alpha]
- Complete project specification documented
- Development roadmap established
- Architectural guidelines defined
- Configuration system documented

---

## Changelog Guidelines

### Change Categories
- **Added**: New features
- **Changed**: Changes in existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Now removed features
- **Fixed**: Bug fixes
- **Security**: Vulnerability fixes

### Version Numbering
- **MAJOR**: Incompatible API changes
- **MINOR**: Backward-compatible functionality additions
- **PATCH**: Backward-compatible bug fixes
- **ALPHA/BETA**: Pre-release versions

### Commit Message Format
```
feat(core): add species trait system
fix(ui): resolve dice rolling animation issue
config(species): add Zhodani psionic traits
docs(readme): update installation instructions
test(store): add character state management tests
```

### Configuration Changes
- All configuration changes must be documented
- Breaking configuration changes require major version bump
- Backward compatibility notes for configuration files
- Migration guides for significant configuration changes

---

**Maintenance**: This changelog is automatically updated with each release and manually curated for clarity and completeness.
