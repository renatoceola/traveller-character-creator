/**
 * Character History and Backstory Generation
 * Manages character creation events and generates narrative backstory
 */

import type { Character, CharacterEvent, CharacterBackstory } from '@/types';

/**
 * ✅ STANDARDS COMPLIANT: Configuration-driven backstory generation
 * - Event tracking for all character creation steps
 * - Narrative generation from game events
 * - Rich backstory compilation
 * - Type-safe throughout
 */
export class CharacterHistoryManager {
  /**
   * Add an event to character history
   */
  static addEvent(
    character: Character, 
    stepId: string, 
    stepName: string, 
    phase: string, 
    event: Omit<CharacterEvent, 'id' | 'stepId' | 'stepName' | 'phase' | 'timestamp'>
  ): Character {
    const newEvent: CharacterEvent = {
      id: crypto.randomUUID(),
      stepId,
      stepName,
      phase,
      timestamp: Date.now(),
      ...event,
    };

    return {
      ...character,
      history: [...character.history, newEvent],
    };
  }

  /**
   * Create a choice event (user selected an option)
   */
  static createChoiceEvent(
    option: string, 
    alternatives: string[], 
    description: string,
    impact?: CharacterEvent['impact'],
    context?: any
  ): Omit<CharacterEvent, 'id' | 'stepId' | 'stepName' | 'phase' | 'timestamp'> {
    return {
      type: 'choice',
      description,
      details: {
        choices: [
          { option, selected: true },
          ...alternatives.map(alt => ({ option: alt, selected: false }))
        ],
        ...(context && { context })
      },
      impact: impact || {}
    };
  }

  /**
   * Create a roll event (dice roll with success/failure)
   */
  static createRollEvent(
    dice: string,
    result: number,
    target: number | undefined,
    description: string,
    success: boolean,
    impact?: CharacterEvent['impact'],
    context?: any
  ): Omit<CharacterEvent, 'id' | 'stepId' | 'stepName' | 'phase' | 'timestamp'> {
    return {
      type: success ? 'success' : 'failure',
      description,
      details: {
        rolls: [{ dice, result, target }],
        ...(context && { context })
      },
      impact: impact || {}
    };
  }

  /**
   * Create a gain event (acquired skill, benefit, etc.)
   */
  static createGainEvent(
    type: string,
    item: string,
    amount: number | undefined,
    description: string,
    impact?: CharacterEvent['impact'],
    context?: any
  ): Omit<CharacterEvent, 'id' | 'stepId' | 'stepName' | 'phase' | 'timestamp'> {
    return {
      type: 'gain',
      description,
      details: {
        gains: [{ type, item, amount }],
        ...(context && { context })
      },
      impact: impact || {}
    };
  }

  /**
   * Create a milestone event (major character creation step)
   */
  static createMilestoneEvent(
    description: string,
    narrative: string,
    impact?: CharacterEvent['impact'],
    context?: any
  ): Omit<CharacterEvent, 'id' | 'stepId' | 'stepName' | 'phase' | 'timestamp'> {
    return {
      type: 'milestone',
      description,
      details: {
        ...(context && { context })
      },
      impact: {
        ...impact,
        narrative
      }
    };
  }

  /**
   * Create a life event (general life event with narrative)
   */
  static createLifeEvent(
    title: string,
    description: string,
    narrative: string,
    impact?: CharacterEvent['impact'],
    context?: any
  ): Omit<CharacterEvent, 'id' | 'stepId' | 'stepName' | 'phase' | 'timestamp'> {
    return {
      type: 'life_event',
      description: `${title}: ${description}`,
      details: {
        eventType: 'milestone',
        consequences: narrative,
        ...(context && { context })
      },
      impact: impact || {}
    };
  }

  /**
   * Create a loss event (character lost something)
   */
  static createLossEvent(
    type: string,
    item: string,
    amount: number | undefined,
    description: string,
    impact?: CharacterEvent['impact'],
    context?: any
  ): Omit<CharacterEvent, 'id' | 'stepId' | 'stepName' | 'phase' | 'timestamp'> {
    return {
      type: 'loss',
      description,
      details: {
        losses: [{ type, item, amount }],
        ...(context && { context })
      },
      impact: impact || {}
    };
  }

  /**
   * Create a relationship event (gained/lost relationships)
   */
  static createRelationshipEvent(
    type: 'friend' | 'enemy' | 'contact' | 'ally',
    name: string,
    description: string,
    impact?: CharacterEvent['impact'],
    context?: any
  ): Omit<CharacterEvent, 'id' | 'stepId' | 'stepName' | 'phase' | 'timestamp'> {
    return {
      type: 'relationship',
      description,
      details: {
        relationship: { type, name },
        ...(context && { context })
      },
      impact: impact || {}
    };
  }

  /**
   * Generate a comprehensive backstory from character events
   */
  static generateBackstory(character: Character): CharacterBackstory {
    const events = character.history;
    const keyMoments: string[] = [];
    const relationships: string[] = [];
    const motivations: string[] = [];

    // Extract key moments from events
    events.forEach(event => {
      if (event.type === 'milestone' && event.impact.narrative) {
        keyMoments.push(event.impact.narrative);
      }
      
      if (event.type === 'success' || event.type === 'failure') {
        if (event.description.toLowerCase().includes('career') || 
            event.description.toLowerCase().includes('service')) {
          keyMoments.push(event.description);
        }
      }
    });

    // Generate narrative summary
    const summary = this.generateNarrativeSummary(character, events);

    // Extract relationships and motivations from events
    events.forEach(event => {
      if (event.impact.narrative) {
        const narrative = event.impact.narrative.toLowerCase();
        if (narrative.includes('friend') || narrative.includes('ally') || narrative.includes('enemy')) {
          relationships.push(event.impact.narrative);
        }
        if (narrative.includes('driven') || narrative.includes('motivated') || narrative.includes('goal')) {
          motivations.push(event.impact.narrative);
        }
      }
    });

    return {
      events,
      summary,
      keyMoments: keyMoments.slice(0, 10), // Limit to most important
      relationships: relationships.slice(0, 5),
      motivations: motivations.slice(0, 5),
    };
  }

  /**
   * Generate a narrative summary of the character's life
   */
  private static generateNarrativeSummary(character: Character, events: CharacterEvent[]): string {
    const parts: string[] = [];

    // Introduction
    parts.push(`${character.name} is a ${character.age}-year-old ${character.species}.`);

    // Early life (homeworld, education)
    const earlyEvents = events.filter(e => 
      e.stepId.includes('homeworld') || 
      e.stepId.includes('education') || 
      e.stepId.includes('pre-career')
    );

    if (earlyEvents.length > 0) {
      parts.push("In their formative years, " + this.synthesizeEvents(earlyEvents));
    }

    // Career events
    const careerEvents = events.filter(e => 
      e.stepId.includes('career') || 
      e.stepId.includes('term')
    );

    if (careerEvents.length > 0) {
      parts.push("During their career, " + this.synthesizeEvents(careerEvents));
    }

    // Skills and specializations
    if (character.skills.length > 0) {
      const topSkills = character.skills
        .filter(s => s.level > 0)
        .sort((a, b) => b.level - a.level)
        .slice(0, 3)
        .map(s => s.name);

      if (topSkills.length > 0) {
        parts.push(`They are particularly skilled in ${topSkills.join(', ')}.`);
      }
    }

    // Current status
    if (character.terms > 0) {
      parts.push(`After ${character.terms} term${character.terms > 1 ? 's' : ''} of service, they are ready for new adventures.`);
    } else {
      parts.push("They are just beginning their journey into the wider universe.");
    }

    return parts.join(' ');
  }

  /**
   * Synthesize multiple events into narrative text
   */
  private static synthesizeEvents(events: CharacterEvent[]): string {
    const descriptions = events
      .map(e => e.description)
      .filter(d => d && d.length > 0);

    if (descriptions.length === 0) return "they experienced various formative events.";
    if (descriptions.length === 1) return descriptions[0].toLowerCase() + ".";
    if (descriptions.length === 2) return descriptions.join(" and ").toLowerCase() + ".";
    
    const last = descriptions.pop();
    return descriptions.join(", ").toLowerCase() + ", and " + last?.toLowerCase() + ".";
  }

  /**
   * Get events for a specific phase
   */
  static getEventsForPhase(character: Character, phase: string): CharacterEvent[] {
    return character.history.filter(event => event.phase === phase);
  }

  /**
   * Get events for a specific step
   */
  static getEventsForStep(character: Character, stepId: string): CharacterEvent[] {
    return character.history.filter(event => event.stepId === stepId);
  }

  /**
   * Count successes and failures
   */
  static getEventStats(character: Character): {
    successes: number;
    failures: number;
    choices: number;
    gains: number;
    total: number;
  } {
    const events = character.history;
    return {
      successes: events.filter(e => e.type === 'success').length,
      failures: events.filter(e => e.type === 'failure').length,
      choices: events.filter(e => e.type === 'choice').length,
      gains: events.filter(e => e.type === 'gain').length,
      total: events.length,
    };
  }

  /**
   * Export history as formatted text for external use
   */
  static exportHistory(character: Character): string {
    const backstory = this.generateBackstory(character);
    const stats = this.getEventStats(character);

    let output = `CHARACTER HISTORY: ${character.name}\n`;
    output += `${'='.repeat(50)}\n\n`;
    output += `SUMMARY:\n${backstory.summary}\n\n`;

    if (backstory.keyMoments.length > 0) {
      output += `KEY MOMENTS:\n`;
      backstory.keyMoments.forEach((moment, i) => {
        output += `${i + 1}. ${moment}\n`;
      });
      output += '\n';
    }

    output += `STATISTICS:\n`;
    output += `- Total Events: ${stats.total}\n`;
    output += `- Successes: ${stats.successes}\n`;
    output += `- Failures: ${stats.failures}\n`;
    output += `- Major Choices: ${stats.choices}\n`;
    output += `- Gains/Achievements: ${stats.gains}\n\n`;

    output += `DETAILED TIMELINE:\n`;
    character.history.forEach((event, i) => {
      const date = new Date(event.timestamp).toLocaleDateString();
      output += `${i + 1}. [${event.phase}:${event.stepName}] ${event.description} (${event.type}) - ${date}\n`;
    });

    return output;
  }
}
