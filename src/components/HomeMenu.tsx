/**
 * Home Menu Component
 * Main entry point for character creation with different creation methods
 */

import React from 'react';

interface HomeMenuProps {
  onSelectCreationMethod: (method: 'step-by-step' | 'package-based' | 'quick-start') => void;
}

/**
 * ✅ STANDARDS COMPLIANT: Clean home menu interface
 * - Multiple character creation methods
 * - Clear descriptions and expectations
 * - Consistent UI design patterns
 */
export const HomeMenu: React.FC<HomeMenuProps> = ({ onSelectCreationMethod }) => {
  return (
    <div className="home-menu min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="container mx-auto px-6 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Traveller
            <span className="text-blue-400 ml-3">Character Creator</span>
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Create your character for the classic science fiction RPG. 
            Choose your preferred creation method and begin your journey among the stars.
          </p>
          <div className="mt-6 text-sm text-slate-400">
            Based on Mongoose Traveller 2nd Edition
          </div>
        </div>

        {/* Creation Method Options */}
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* Package-Based Creation */}
          <div className="creation-option group">
            <div className="card p-8 h-full border-2 border-purple-500/20 hover:border-purple-500/50 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-purple-500/20">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                  <span className="text-2xl">📦</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Package-Based Creation</h3>
                <div className="inline-block px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full font-medium mb-4">
                  ✅ Available
                </div>
              </div>
              
              <div className="text-slate-300 text-sm mb-6 space-y-2">
                <p>Quick character creation using pre-made packages:</p>
                <ul className="list-disc list-inside space-y-1 text-xs text-slate-400">
                  <li>Choose from classic career packages</li>
                  <li>Pre-configured skill sets and equipment</li>
                  <li>Balanced characters ready to play</li>
                  <li>Customization options available</li>
                  <li>Faster creation for experienced players</li>
                  <li>NPC generation support</li>
                </ul>
              </div>

              <div className="mt-auto">
                <button
                  onClick={() => onSelectCreationMethod('package-based')}
                  className="btn-primary w-full group-hover:bg-purple-600 transition-colors"
                >
                  Start Package Creation
                </button>
              </div>
            </div>
          </div>

          {/* Step-by-Step Creation */}
          <div className="creation-option group">
            <div className="card p-8 h-full border-2 border-blue-500/20 hover:border-blue-500/50 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-blue-500/20">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                  <span className="text-2xl">🛠️</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Step-by-Step Creation</h3>
                <div className="inline-block px-3 py-1 bg-orange-500/20 text-orange-400 text-xs rounded-full font-medium mb-4">
                  🚧 Planned
                </div>
              </div>
              
              <div className="text-slate-300 text-sm mb-6 space-y-2">
                <p>The complete Traveller character creation experience:</p>
                <ul className="list-disc list-inside space-y-1 text-xs text-slate-400">
                  <li>Roll characteristics (STR, DEX, END, INT, EDU, SOC)</li>
                  <li>Choose species and homeworld</li>
                  <li>Pre-career education with events</li>
                  <li>Career terms with advancement and events</li>
                  <li>Rich character history and backstory</li>
                  <li>Equipment and benefit resolution</li>
                </ul>
              </div>

              <div className="mt-auto">
                <button
                  onClick={() => onSelectCreationMethod('step-by-step')}
                  disabled
                  className="btn-secondary w-full opacity-50 cursor-not-allowed"
                >
                  Step-by-Step (Planned)
                </button>
              </div>
            </div>
          </div>

          {/* Quick Start */}
          <div className="creation-option group md:col-span-2 lg:col-span-1">
            <div className="card p-8 h-full border-2 border-green-500/20 hover:border-green-500/50 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-green-500/20">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                  <span className="text-2xl">⚡</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Quick Start</h3>
                <div className="inline-block px-3 py-1 bg-orange-500/20 text-orange-400 text-xs rounded-full font-medium mb-4">
                  🚧 Planned
                </div>
              </div>
              
              <div className="text-slate-300 text-sm mb-6 space-y-2">
                <p>Generate a complete character instantly:</p>
                <ul className="list-disc list-inside space-y-1 text-xs text-slate-400">
                  <li>Fully randomized character generation</li>
                  <li>Complete backstory and history</li>
                  <li>Ready-to-play in seconds</li>
                  <li>Great for NPCs or quick games</li>
                  <li>Export to character sheet</li>
                  <li>Regenerate until satisfied</li>
                </ul>
              </div>

              <div className="mt-auto">
                <button
                  onClick={() => onSelectCreationMethod('quick-start')}
                  disabled
                  className="btn-secondary w-full opacity-50 cursor-not-allowed"
                >
                  Quick Start (Planned)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            Why Use This Character Creator?
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="feature-card card p-6 border border-slate-700">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">📚</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Official Rules</h3>
                  <p className="text-slate-300 text-sm">
                    Based on Mongoose Traveller 2nd Edition rules with accurate tables, 
                    calculations, and event resolution.
                  </p>
                </div>
              </div>
            </div>

            <div className="feature-card card p-6 border border-slate-700">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">📖</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Rich Backstory</h3>
                  <p className="text-slate-300 text-sm">
                    Every decision creates detailed character history with narrative 
                    context and story hooks for your game.
                  </p>
                </div>
              </div>
            </div>

            <div className="feature-card card p-6 border border-slate-700">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">🎲</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Interactive Events</h3>
                  <p className="text-slate-300 text-sm">
                    Experience pre-career events, life events, career mishaps, and 
                    advancement opportunities with full narrative context.
                  </p>
                </div>
              </div>
            </div>

            <div className="feature-card card p-6 border border-slate-700">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">💾</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Export Ready</h3>
                  <p className="text-slate-300 text-sm">
                    Generate complete character sheets ready for print or digital 
                    use in your Traveller campaigns.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-slate-500 text-sm">
          <p>
            This character creator is a fan-made tool for Mongoose Traveller 2nd Edition.
            <br />
            Traveller is a trademark of Far Future Enterprises and used under license.
          </p>
        </div>
      </div>
    </div>
  );
};
