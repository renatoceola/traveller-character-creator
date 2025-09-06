/**
 * Pre-Career Events Step Component
 * Handles pre-career events during education terms using the official Traveller 2D6 table
 */

import React, { useState, useEffect } from 'react';
import type { Character, Rules, StepResult, PreCareerEvent } from '@/types';
import { CharacterHistoryManager } from '@/utils/characterHistory';
import { roll } from '@/utils/dice';
import { LifeEventsResolver, type LifeEventResolution } from '@/components/ui/LifeEventsResolver';

interface PreCareerStepProps {
  character: Character;
  rules: Rules;
  onStepComplete: (stepId: string, result: StepResult) => void;
  onBack?: () => void;
}

/**
 * ✅ STANDARDS COMPLIANT: Configuration-driven pre-career events
 * - All events loaded from JSON configuration
 * - Enhanced history tracking with rich narratives
 * - Type-safe throughout
 */
export const PreCareerStep: React.FC<PreCareerStepProps> = ({
  character: _character,
  rules: _rules,
  onStepComplete,
  onBack,
}) => {
  const [preCareerEvents, setPreCareerEvents] = useState<PreCareerEvent[]>([]);
  const [currentEvent, setCurrentEvent] = useState<PreCareerEvent | null>(null);
  const [eventRoll, setEventRoll] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [showLifeEvents, setShowLifeEvents] = useState(false);

  // Load pre-career events configuration
  useEffect(() => {
    const loadEvents = async () => {
      try {
        setIsLoading(true);
        const basePath = import.meta.env.BASE_URL || '/';
        const response = await fetch(`${basePath}config/pre-career-events.json`);
        if (!response.ok) {
          throw new Error(`Failed to load pre-career events: ${response.statusText}`);
        }
        const data = await response.json();
        setPreCareerEvents(data.events || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load pre-career events');
      } finally {
        setIsLoading(false);
      }
    };

    loadEvents();
  }, []);

  const rollForEvent = (): void => {
    const rollResult = roll('2d6');
    setEventRoll(rollResult.total);
    
    const event = preCareerEvents.find(e => e.roll === rollResult.total);
    if (event) {
      setCurrentEvent(event);
      
      // Create enhanced roll event with narrative context
      const rollEvent = CharacterHistoryManager.createRollEvent(
        '2d6',
        rollResult.total,
        undefined,
        `Rolled ${rollResult.total} on Pre-Career Events table: ${event.title}`,
        true,
        {
          narrative: event.narrative?.setup || `An unexpected event occurred during their education.`
        },
        {
          difficulty: 'average' as const,
          dramaticNarrative: `Fate intervened during their studies: ${event.title.toLowerCase()}.`
        }
      );
      
      setEvents([rollEvent]);
    }
  };

  const resolveEvent = (): void => {
    if (!currentEvent) return;

    // Check if this is a life event (roll 7)
    if (currentEvent.effect.type === 'life_event') {
      setShowLifeEvents(true);
      return;
    }

    // Create milestone event for event resolution
    const milestoneEvent = CharacterHistoryManager.createMilestoneEvent(
      `Experienced: ${currentEvent.title}`,
      currentEvent.narrative?.consequence || `The ${currentEvent.title.toLowerCase()} event shaped their character development.`,
      undefined,
      {
        significance: 'major' as const,
        themes: currentEvent.tags || ['pre_career', 'education']
      }
    );

    const allEvents = [...events, milestoneEvent];
    setEvents(allEvents);
  };

  const handleLifeEventResolution = (resolution: LifeEventResolution): void => {
    // Merge life event results with pre-career event
    const combinedEvents = [...events, ...resolution.events];
    setEvents(combinedEvents);
    setShowLifeEvents(false);

    // Create milestone for completing the life event
    const milestoneEvent = CharacterHistoryManager.createMilestoneEvent(
      `Pre-Career Life Event: ${resolution.event.title}`,
      `During their education, they experienced: ${resolution.event.title.toLowerCase()}. This life event would have lasting impact on their development.`,
      {
        narrative: `The life event during their pre-career education shaped their development significantly.`
      },
      {
        significance: 'major' as const,
        themes: ['pre_career', 'life_event', ...(resolution.event.tags || [])]
      }
    );

    combinedEvents.push(milestoneEvent);
    setEvents(combinedEvents);
  };

  const handleContinue = (): void => {
    onStepComplete('pre-career', {
      data: {
        eventRoll,
        event: currentEvent,
        events
      },
      valid: true,
    });
  };

  const handleSkipEvents = (): void => {
    onStepComplete('pre-career', {
      data: {
        skipped: true,
        events: []
      },
      valid: true,
    });
  };

  if (isLoading) {
    return (
      <div className="pre-career-step">
        <div className="card p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-slate-400">Loading pre-career events...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pre-career-step">
        <div className="card p-6">
          <div className="text-center py-8">
            <div className="text-red-400 mb-4">❌ Error loading pre-career events</div>
            <p className="text-slate-400 mb-4">{error}</p>
            <button onClick={handleSkipEvents} className="btn-secondary">
              Skip Pre-Career Events
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pre-career-step">
      <div className="step-header mb-6">
        <h3 className="text-xl font-semibold text-white mb-2">Pre-Career Events</h3>
        <p className="text-slate-400">
          Roll for significant events that occurred during your education. These events can shape your character's 
          development, relationships, and future opportunities.
        </p>
      </div>

      {!currentEvent ? (
        <div className="card p-6 mb-6">
          <div className="text-center">
            <h4 className="text-lg font-medium text-white mb-4">Roll for Pre-Career Event</h4>
            <p className="text-slate-400 mb-6">
              Roll 2D6 to determine what significant event occurred during your education.
            </p>
            
            <button
              onClick={rollForEvent}
              className="btn-primary text-lg px-8 py-3"
            >
              🎲 Roll 2D6 for Event
            </button>
            
            <div className="mt-6 pt-6 border-t border-slate-700">
              <button
                onClick={handleSkipEvents}
                className="btn-secondary text-sm"
              >
                Skip Pre-Career Events
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-white">Event Result</h4>
              <div className="text-2xl font-bold text-blue-400">🎲 {eventRoll}</div>
            </div>
            
            <h5 className="text-white font-semibold text-lg mb-2">{currentEvent.title}</h5>
            <p className="text-slate-300 mb-4">{currentEvent.description}</p>
            
            {currentEvent.narrative && (
              <div className="narrative-context p-4 bg-slate-800 rounded-lg mb-4">
                <p className="text-slate-400 text-sm italic">"{currentEvent.narrative.setup}"</p>
                <p className="text-slate-400 text-sm mt-2">{currentEvent.narrative.consequence}</p>
              </div>
            )}

            <div className="effect-description p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <h6 className="text-blue-300 font-medium mb-2">Effect</h6>
              <p className="text-blue-200">{currentEvent.effect.description}</p>
            </div>
            
            <button
              onClick={resolveEvent}
              className="btn-primary w-full mt-4"
            >
              Apply Event
            </button>
          </div>

          <div className="step-actions flex justify-between">
            {onBack && (
              <button onClick={onBack} className="btn-secondary">
                Back
              </button>
            )}
            
            <button
              onClick={handleContinue}
              className="btn-primary"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Life Events Resolver Modal */}
      {showLifeEvents && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <LifeEventsResolver
                character={_character}
                onResolve={handleLifeEventResolution}
                onCancel={() => setShowLifeEvents(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
