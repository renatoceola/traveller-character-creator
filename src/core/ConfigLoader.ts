import { z } from 'zod';
import { validateConfiguration } from '@schemas/validation';
import type { ConfigurationBundle, Rules, Species, Phase } from '@/types';
import { ConfigurationError } from '@/types';

/**
 * Core configuration loader for the Traveller Character Creator
 */
export class ConfigLoader {
  private static instance: ConfigLoader;
  private loadedConfig: ConfigurationBundle | null = null;

  private constructor() {}

  static getInstance(): ConfigLoader {
    if (!ConfigLoader.instance) {
      ConfigLoader.instance = new ConfigLoader();
    }
    return ConfigLoader.instance;
  }

  /**
   * Load configuration from JSON files
   */
  async loadConfiguration(): Promise<ConfigurationBundle> {
    try {
      // Load all configuration files in parallel
      const [rulesData, speciesData, phasesData, careersData, preCareerEventsData] = await Promise.all([
        this.loadJsonFile('rules.json'),
        this.loadJsonFile('species.json'),
        this.loadJsonFile('phases.json'),
        this.loadJsonFile('careers.json'),
        this.loadJsonFile('pre-career-events.json'),
      ]);

      // Combine into configuration bundle
      const config = {
        rules: rulesData,
        species: speciesData,
        phases: phasesData,
        careers: (careersData as { careers: unknown[] }).careers, // Extract careers array from the wrapper object
        preCareerEvents: (preCareerEventsData as { events: unknown[] }).events, // Extract events array
      };

      // Validate the complete configuration
      const validatedConfig = validateConfiguration(config);
      
      this.loadedConfig = validatedConfig;
      return validatedConfig;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ConfigurationError(
          `Configuration validation failed: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
          'VALIDATION_ERROR'
        );
      }
      throw new ConfigurationError(
        `Failed to load configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'LOAD_ERROR'
      );
    }
  }

  /**
   * Get currently loaded configuration
   */
  getConfiguration(): ConfigurationBundle {
    if (!this.loadedConfig) {
      throw new ConfigurationError('Configuration not loaded. Call loadConfiguration() first.', 'NOT_LOADED');
    }
    return this.loadedConfig;
  }

  /**
   * Load configuration from a custom bundle
   */
  loadFromBundle(bundle: ConfigurationBundle): void {
    try {
      const validatedConfig = validateConfiguration(bundle);
      this.loadedConfig = validatedConfig;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ConfigurationError(
          `Bundle validation failed: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
          'VALIDATION_ERROR'
        );
      }
      throw error;
    }
  }

  /**
   * Get rules configuration
   */
  getRules(): Rules {
    return this.getConfiguration().rules;
  }

  /**
   * Get species configurations
   */
  getSpecies(): Species[] {
    return this.getConfiguration().species;
  }

  /**
   * Get phases configuration
   */
  getPhases(): Phase[] {
    return this.getConfiguration().phases;
  }

  /**
   * Get a specific species by name
   */
  getSpeciesByName(name: string): Species | undefined {
    return this.getSpecies().find(species => species.name === name);
  }

  /**
   * Get a specific phase by name
   */
  getPhaseByName(name: string): Phase | undefined {
    return this.getPhases().find(phase => phase.name === name);
  }

  /**
   * Get phases sorted by order
   */
  getPhasesInOrder(): Phase[] {
    return [...this.getPhases()].sort((a, b) => a.order - b.order);
  }

  /**
   * Get pre-career events
   */
  getPreCareerEvents(): import('@/types').PreCareerEvent[] {
    if (!this.loadedConfig) {
      throw new ConfigurationError('Configuration not loaded', 'NOT_LOADED');
    }
    return this.loadedConfig.preCareerEvents;
  }

  /**
   * Load a JSON file from the config directory
   */
  private async loadJsonFile(filename: string): Promise<unknown> {
    try {
      // In a real implementation, this would load from the file system
      // For now, we'll use dynamic imports or fetch
      const response = await fetch(`/config/${filename}`);
      if (!response.ok) {
        throw new Error(`Failed to load ${filename}: ${response.statusText}`);
      }
      return await response.json();
    } catch {
      // Fallback: try to load from public folder
      try {
        const response = await fetch(`/public/config/${filename}`);
        if (!response.ok) {
          throw new Error(`Failed to load ${filename} from public folder: ${response.statusText}`);
        }
        return await response.json();
      } catch {
        throw new Error(`Failed to load ${filename} from both /config and /public/config directories`);
      }
    }
  }

  /**
   * Reload configuration (useful for development)
   */
  async reloadConfiguration(): Promise<ConfigurationBundle> {
    this.loadedConfig = null;
    return await this.loadConfiguration();
  }

  /**
   * Check if configuration is loaded
   */
  isLoaded(): boolean {
    return this.loadedConfig !== null;
  }
}

// Export singleton instance
export const configLoader = ConfigLoader.getInstance();
