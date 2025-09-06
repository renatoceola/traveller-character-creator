/**
 * Character History Display Component
 * Shows the character's backstory and event history in real-time
 */

import React, { useState } from 'react';
import type { Character } from '@/types';
import { CharacterHistoryManager } from '@/utils/characterHistory';

interface CharacterHistoryDisplayProps {
  character: Character;
  className?: string;
}

/**
 * ✅ STANDARDS COMPLIANT: Real-time backstory display
 * - Shows events as they're added
 * - Generates narrative from character actions
 * - Provides backstory inspiration for users
 * - Type-safe throughout
 */
export const CharacterHistoryDisplay: React.FC<CharacterHistoryDisplayProps> = ({
  character,
  className = '',
}) => {
  const [showDetailed, setShowDetailed] = useState(false);
  
  const backstory = CharacterHistoryManager.generateBackstory(character);
  const stats = CharacterHistoryManager.getEventStats(character);

  if (character.history.length === 0) {
    return (
      <div className={`character-history-empty card p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-white mb-2">Character History</h3>
        <p className="text-slate-400 text-sm">
          Your character's backstory will appear here as you make choices during creation.
        </p>
      </div>
    );
  }

  return (
    <div className={`character-history card p-6 ${className}`}>
      <div className="history-header flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">Character History</h3>
        <button
          onClick={() => setShowDetailed(!showDetailed)}
          className="text-sm px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-slate-300 hover:text-white transition-colors"
        >
          {showDetailed ? 'Show Summary' : 'Show Details'}
        </button>
      </div>

      {/* Statistics */}
      <div className="history-stats grid grid-cols-2 md:grid-cols-5 gap-2 mb-4 text-xs">
        <div className="stat bg-slate-800 p-2 rounded text-center">
          <div className="text-white font-bold">{stats.total}</div>
          <div className="text-slate-400">Events</div>
        </div>
        <div className="stat bg-green-500/20 p-2 rounded text-center">
          <div className="text-green-400 font-bold">{stats.successes}</div>
          <div className="text-slate-400">Successes</div>
        </div>
        <div className="stat bg-red-500/20 p-2 rounded text-center">
          <div className="text-red-400 font-bold">{stats.failures}</div>
          <div className="text-slate-400">Failures</div>
        </div>
        <div className="stat bg-blue-500/20 p-2 rounded text-center">
          <div className="text-blue-400 font-bold">{stats.choices}</div>
          <div className="text-slate-400">Choices</div>
        </div>
        <div className="stat bg-purple-500/20 p-2 rounded text-center">
          <div className="text-purple-400 font-bold">{stats.gains}</div>
          <div className="text-slate-400">Gains</div>
        </div>
      </div>

      {showDetailed ? (
        // Detailed event timeline
        <div className="detailed-history">
          <h4 className="text-white font-medium mb-3">Event Timeline</h4>
          <div className="events-list space-y-3 max-h-64 overflow-y-auto">
            {character.history.map((event, index) => (
              <div
                key={event.id}
                className="event-item p-3 bg-slate-800 rounded-lg border-l-4 border-slate-600"
                style={{
                  borderLeftColor: getEventColor(event.type)
                }}
              >
                <div className="event-header flex justify-between items-start mb-1">
                  <span className="text-white text-sm font-medium">
                    {event.stepName}
                  </span>
                  <span className="text-xs text-slate-500">
                    #{index + 1}
                  </span>
                </div>
                
                <p className="text-slate-300 text-sm mb-2">{event.description}</p>
                
                {event.impact.narrative && (
                  <p className="text-slate-400 text-xs italic">
                    "{event.impact.narrative}"
                  </p>
                )}
                
                {/* Event details */}
                {(event.details.rolls || event.details.gains || event.details.choices || event.details.relationship || event.details.context) && (
                  <div className="event-details mt-2 text-xs">
                    {event.details.rolls && (
                      <div className="text-slate-400">
                        🎲 {event.details.rolls.map(roll => 
                          `${roll.dice}: ${roll.result}${roll.target ? ` (vs ${roll.target})` : ''}`
                        ).join(', ')}
                        {event.details.context?.margin && (
                          <span className="ml-1 text-xs">
                            ({event.details.context.margin > 0 ? '+' : ''}{event.details.context.margin})
                          </span>
                        )}
                      </div>
                    )}
                    
                    {event.details.gains && (
                      <div className="text-green-400">
                        ➕ {event.details.gains.map(gain => 
                          `${gain.item}${gain.amount ? ` (${gain.amount})` : ''}`
                        ).join(', ')}
                        {event.details.context?.method && (
                          <span className="ml-1 text-xs text-slate-500">
                            ({event.details.context.method.replace('_', ' ')})
                          </span>
                        )}
                      </div>
                    )}
                    
                    {event.details.choices && (
                      <div className="text-blue-400">
                        ✨ Chose: {event.details.choices.find(c => c.selected)?.option}
                        {event.details.context?.reasoning && (
                          <div className="text-slate-500 text-xs mt-1">
                            💭 {event.details.context.reasoning}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {event.details.relationship && (
                      <div className="text-cyan-400">
                        👤 {event.details.relationship.type}: {event.details.relationship.name}
                        {event.details.relationship.influence && (
                          <span className="ml-1 text-xs">({event.details.relationship.influence})</span>
                        )}
                      </div>
                    )}
                    
                    {event.details.context?.dramaticNarrative && (
                      <div className="text-slate-400 text-xs mt-1 italic">
                        "({event.details.context.dramaticNarrative})"
                      </div>
                    )}
                    
                    {event.details.context?.flavorText && (
                      <div className="text-slate-400 text-xs mt-1 italic">
                        "{event.details.context.flavorText}"
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        // Summary view
        <div className="summary-history">
          <div className="backstory-text mb-4">
            <h4 className="text-white font-medium mb-2">Backstory Summary</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              {backstory.summary}
            </p>
          </div>

          {backstory.keyMoments.length > 0 && (
            <div className="key-moments mb-4">
              <h5 className="text-slate-300 font-medium mb-2">Key Moments</h5>
              <ul className="space-y-1">
                {backstory.keyMoments.slice(0, 3).map((moment, index) => (
                  <li key={index} className="text-slate-400 text-sm flex items-start gap-2">
                    <span className="text-blue-400 flex-shrink-0">•</span>
                    <span>{moment}</span>
                  </li>
                ))}
              </ul>
              {backstory.keyMoments.length > 3 && (
                <p className="text-slate-500 text-xs mt-1">
                  +{backstory.keyMoments.length - 3} more moments...
                </p>
              )}
            </div>
          )}

          {/* Recent events preview */}
          {character.history.length > 0 && (
            <div className="recent-events">
              <h5 className="text-slate-300 font-medium mb-2">Recent Events</h5>
              <div className="space-y-1">
                {character.history.slice(-2).map((event) => (
                  <div key={event.id} className="text-slate-400 text-sm flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: getEventColor(event.type) }}
                    />
                    <span className="truncate">{event.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Export button */}
      <div className="history-actions mt-4 pt-4 border-t border-slate-700">
        <button
          onClick={() => {
            const exported = CharacterHistoryManager.exportHistory(character);
            navigator.clipboard.writeText(exported).then(() => {
              alert('Character history copied to clipboard!');
            });
          }}
          className="text-sm px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 rounded text-blue-400 hover:text-blue-300 transition-colors"
        >
          📋 Export History
        </button>
      </div>
    </div>
  );
};

/**
 * Get color for event type
 */
function getEventColor(type: string): string {
  const colors: Record<string, string> = {
    success: '#22c55e',
    failure: '#ef4444',
    choice: '#3b82f6',
    roll: '#f59e0b',
    gain: '#10b981',
    loss: '#f97316',
    milestone: '#8b5cf6',
    relationship: '#06b6d4',
    life_event: '#f472b6',
    training: '#84cc16',
  };
  
  return colors[type] || '#64748b';
}
