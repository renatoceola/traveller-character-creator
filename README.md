# Traveller Character Creator

A modern, web-based character creation tool for the classic science fiction RPG **Mongoose Traveller 2nd Edition**. Create rich, detailed characters with full backstories, skills, and equipment through an intuitive interface.

![Traveller Character Creator](https://img.shields.io/badge/Traveller-Character%20Creator-blue)
![Version](https://img.shields.io/badge/version-0.0.0-green)
![License](https://img.shields.io/badge/license-MIT-blue)
![React](https://img.shields.io/badge/React-18.x-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)

## 🚀 Features

### ✅ Available Features
- **Package-Based Character Creation** - Quick character generation using pre-made career packages
- **Rich Character History** - Detailed backstory generation with narrative context
- **Interactive UI** - Modern, responsive interface built with React and Tailwind CSS
- **Configuration-Driven** - All game rules and data stored in JSON configuration files
- **Export Ready** - Generate complete character sheets for print or digital use

### 🚧 Planned Features
- **Step-by-Step Creation** - Complete Traveller character creation experience
- **Quick Start** - Instant character generation for NPCs and quick games
- **Character Sheet Export** - PDF and digital format exports
- **Campaign Integration** - Save and load characters for ongoing campaigns

## 🎯 Why Use This Character Creator?

- **Official Rules Compliance** - Based on Mongoose Traveller 2nd Edition with accurate tables and calculations
- **Rich Backstory Generation** - Every decision creates detailed character history with narrative context
- **Interactive Events** - Experience pre-career events, life events, career mishaps, and advancement opportunities
- **Export Ready** - Generate complete character sheets ready for your Traveller campaigns

## 🛠️ Technology Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **State Management**: Zustand
- **Game Data**: JSON configuration files
- **Development**: ESLint + Prettier

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/traveller-character-creator.git
   cd traveller-character-creator
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

## 🎮 Usage

### Package-Based Character Creation
1. Select "Start Package Creation" from the home menu
2. Choose your character's background package
3. Select a career package that matches your desired profession
4. Review and customize your character's details
5. Export your completed character sheet

### Configuration
The application uses JSON configuration files located in `public/config/`:
- `species.json` - Available character species
- `careers.json` - Career packages and progression
- `rules.json` - Game rules and modifiers
- `phases.json` - Character creation phases
- `life-events.json` - Life event tables
- `pre-career-events.json` - Pre-career event tables

## 🏗️ Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   ├── steps/          # Character creation step components
│   └── phases/         # Phase-specific components
├── core/               # Core application logic
│   ├── ConfigLoader.ts # Configuration management
│   └── StepEngine.ts   # Character creation workflow
├── store/              # State management
│   └── characterStore.ts
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── assets/             # Static assets

public/
└── config/             # Game configuration files
    ├── species.json
    ├── careers.json
    ├── rules.json
    └── ...
```

## 🧪 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

### Code Standards
- TypeScript for type safety
- ESLint for code quality
- Prettier for code formatting
- Component-based architecture
- Configuration-driven design

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚖️ Legal Notice

This character creator is a fan-made tool for **Mongoose Traveller 2nd Edition**. 

**Traveller** is a trademark of Far Future Enterprises and used under license. This project is not affiliated with or endorsed by Far Future Enterprises or Mongoose Publishing.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Guidelines
1. Follow the existing code style and patterns
2. Add TypeScript types for all new code
3. Update documentation for new features
4. Test your changes thoroughly
5. Ensure the build passes without errors

## 📞 Support

If you encounter any issues or have questions:
1. Check the [Issues](https://github.com/yourusername/traveller-character-creator/issues) page
2. Create a new issue with detailed information
3. Include steps to reproduce any bugs

## 🗺️ Roadmap

- [ ] Complete Step-by-Step character creation
- [ ] Add Quick Start character generation
- [ ] Implement character sheet export (PDF)
- [ ] Add campaign management features
- [ ] Create character gallery/save system
- [ ] Add more species and career options
- [ ] Implement dice rolling interface
- [ ] Add character validation and error checking

## 🙏 Acknowledgments

- **Far Future Enterprises** for creating the Traveller universe
- **Mongoose Publishing** for the excellent 2nd Edition rules
- The Traveller community for inspiration and feedback
- All contributors who help improve this tool

---

**Happy Travelling!** 🌌