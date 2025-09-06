import React, { useEffect, useState } from 'react';
import { ConfigLoader } from '@/core/ConfigLoader';
import { useCharacterActions, useCharacterStore } from '@/store/characterStore';
import { StepByStepCreation } from '@/components/ui/StepByStepCreation';
import { PackageBasedCreation } from '@/components/ui/PackageBasedCreation';
import { ProgressIndicator } from '@/components/ui/ProgressIndicator';
import { HomeMenu } from '@/components/HomeMenu';

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'home' | 'step-by-step' | 'package-based' | 'quick-start'>('home');
  
  const { loadConfiguration, updateCharacter } = useCharacterActions();
  const { rules, species, phases, currentPhase, character } = useCharacterStore();

  useEffect(() => {
    const loadApp = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);
        
        const configLoader = ConfigLoader.getInstance();
        
        // Load complete configuration bundle
        const config = await configLoader.loadConfiguration();
        
        // Initialize store with loaded configuration
        loadConfiguration(config.rules, config.species, config.phases, config.careers, config.preCareerEvents);
        
      } catch (err) {
        console.error('Failed to load configuration:', err);
        if (err instanceof Error) {
          setError(`Configuration Error: ${err.message}`);
        } else {
          setError('Failed to load application configuration');
        }
      } finally {
        setLoading(false);
      }
    };

    loadApp();
  }, [loadConfiguration]);

  const handleStartOver = (): void => {
    setCurrentView('home');
    window.location.reload();
  };

  const handleSelectCreationMethod = (method: 'step-by-step' | 'package-based' | 'quick-start'): void => {
    if (method === 'step-by-step') {
      setCurrentView('step-by-step');
    } else if (method === 'package-based') {
      setCurrentView('package-based');
    } else if (method === 'quick-start') {
      // TODO: Implement quick-start creation
      alert('Quick-start creation is planned for a future release!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-white mb-2">Loading Traveller Character Creator</h2>
          <p className="text-slate-400">Initializing configuration...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="card p-8 max-w-md mx-4">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-white mb-2">Configuration Error</h2>
            <p className="text-slate-400 mb-4">{error}</p>
            <button 
              onClick={handleStartOver} 
              className="btn-primary"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show home menu by default
  if (currentView === 'home') {
    return <HomeMenu onSelectCreationMethod={handleSelectCreationMethod} />;
  }

  // Step-by-step character creation interface
  if (currentView === 'step-by-step') {
    return (
      <div className="min-h-screen bg-slate-900">
        <header className="bg-slate-800 border-b border-slate-700">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white">Step-by-Step Character Creation</h1>
                <p className="text-slate-400 mt-2">Create your Traveller RPG character</p>
              </div>
              <button
                onClick={() => setCurrentView('home')}
                className="btn-secondary"
              >
                ← Back to Home
              </button>
            </div>
            
            {/* Progress indicator */}
            {phases && phases.length > 0 && (
              <div className="mt-4">
                <ProgressIndicator />
              </div>
            )}
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {/* Character creation workflow */}
          {rules && species && phases ? (
            <div className="max-w-4xl mx-auto">
              {currentPhase === 'character-creation' ? (
                <StepByStepCreation
                  rules={rules}
                  species={species}
                  character={character}
                  onCharacterUpdate={updateCharacter}
                  onComplete={() => {
                    console.log('Character creation completed!', character);
                    // Could navigate to next phase here
                  }}
                />
              ) : (
                // Placeholder for other phases
                <div className="card p-8 text-center">
                  <h2 className="text-xl font-semibold text-white mb-4">
                    Phase: {currentPhase}
                  </h2>
                  <p className="text-slate-400 mb-6">
                    This phase is under development. 
                  </p>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong className="text-white">Current Character:</strong>
                        <div className="text-slate-400 mt-1">
                          {character.name || 'Unnamed Character'}
                        </div>
                      </div>
                      <div>
                        <strong className="text-white">Species:</strong>
                        <div className="text-slate-400 mt-1">
                          {character.species || 'Not selected'}
                        </div>
                      </div>
                    </div>
                    <button 
                      className="btn-secondary"
                      onClick={handleStartOver}
                    >
                      Start Over
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Loading state for step-by-step creation
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-slate-400">Loading character creation system...</p>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  // Package-based character creation interface
  if (currentView === 'package-based') {
    return (
      <div className="min-h-screen bg-slate-900">
        <header className="bg-slate-800 border-b border-slate-700">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white">Package-Based Character Creation</h1>
                <p className="text-slate-400 mt-2">Quick character creation using background packages</p>
              </div>
              <button
                onClick={() => setCurrentView('home')}
                className="btn-secondary"
              >
                ← Back to Home
              </button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {rules && phases ? (
            <PackageBasedCreation
              rules={rules}
              character={character}
              onCharacterUpdate={updateCharacter}
              onComplete={(completedCharacter) => {
                console.log('Package-based character creation completed!', completedCharacter);
                // Could navigate to character sheet or summary here
              }}
              onBack={() => setCurrentView('home')}
            />
          ) : (
            // Loading state for package-based creation
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-4"></div>
                <p className="text-slate-400">Loading package-based creation system...</p>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  // Fallback for other views (should not reach here normally)
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="card p-8 max-w-md mx-4 text-center">
        <h2 className="text-xl font-semibold text-white mb-4">View Not Found</h2>
        <p className="text-slate-400 mb-4">The requested view is not available.</p>
        <button onClick={() => setCurrentView('home')} className="btn-primary">
          Return to Home
        </button>
      </div>
    </div>
  );
};

export default App;
