/**
 * Intervention Configuration System
 * Defines metadata and capabilities for each intervention
 * This will translate directly to SwiftUI configuration
 * 
 * Benefits:
 * - Single source of truth for intervention capabilities
 * - Type-safe configuration with TypeScript
 * - Easy querying and filtering by capability
 * - Config-driven development approach
 * - Smooth SwiftUI migration path
 * 
 * Usage:
 * ```typescript
 * import { getInterventionConfig, hasCapability } from '@/core/interventionConfig';
 * 
 * // Check if intervention uses timer
 * if (hasCapability('Box Breathing', 'requiresTimer')) {
 *   // Show timer UI
 * }
 * 
 * // Get full config
 * const config = getInterventionConfig('Box Breathing');
 * ```
 */

import { getRegisteredInterventions } from './interventionRegistry';

/**
 * Defines the capabilities and requirements of an intervention
 */
export interface InterventionCapabilities {
  /** Does intervention use a timer? */
  requiresTimer?: boolean;
  /** Does intervention have a setup phase? */
  requiresSetup?: boolean;
  /** Does intervention use camera/audio/media? */
  requiresMedia?: boolean;
  /** Does intervention call external APIs? */
  requiresAPI?: boolean;
  /** Does intervention show celebration card on completion? */
  hasCelebration?: boolean;
  /** Does intervention collect reflection/notes? */
  hasReflection?: boolean;
  /** Which guide modes are supported? */
  supportedModes?: ('text' | 'audio' | 'visual')[];
}

/**
 * Configuration for a single intervention
 */
export interface InterventionConfig {
  /** Intervention title (must match staticInterventions.ts) */
  title: string;
  /** Capabilities and requirements */
  capabilities: InterventionCapabilities;
  /** Default duration in minutes */
  defaultDuration?: number;
  /** Intervention-specific custom properties */
  customProps?: Record<string, any>;
}

/**
 * Configuration registry for interventions
 * Add new interventions here with their capabilities
 * 
 * To add a new intervention:
 * 1. Add entry to this array with title and capabilities
 * 2. Ensure title matches staticInterventions.ts exactly
 * 3. Set capabilities based on component implementation
 */
export const interventionConfigs: InterventionConfig[] = [
  {
    title: 'Box Breathing',
    capabilities: {
      requiresTimer: true,
      requiresSetup: true,
      hasCelebration: true,
      supportedModes: ['text', 'audio'],
    },
    defaultDuration: 3,
    customProps: {
      breathingPhases: ['inhale', 'hold1', 'exhale', 'hold2'],
      phaseDuration: 4, // seconds
      durationOptions: [3, 5], // minutes
    },
  },
  {
    title: 'Heat Therapy',
    capabilities: {
      requiresTimer: true,
      requiresSetup: true,
      hasCelebration: true,
      hasReflection: true,
      supportedModes: ['text'],
    },
    defaultDuration: 5,
    customProps: {
      setupSteps: ['position', 'painLevel', 'equipment'],
      positionOptions: ['abdomen', 'back', 'both'],
    },
  },
  {
    title: 'HIIT Circuit',
    capabilities: {
      requiresTimer: true,
      requiresSetup: true,
      hasCelebration: true,
      supportedModes: ['text', 'visual'],
    },
    defaultDuration: 5,
    customProps: {
      exerciseTypes: ['jumping_jacks', 'squats', 'push_ups'],
      intervalDuration: 30, // seconds
    },
  },
  {
    title: 'Protein-Rich Breakfast',
    capabilities: {
      requiresAPI: true,
      hasCelebration: true,
      supportedModes: ['text'],
    },
    customProps: {
      apiEndpoint: '/api/meal-analyze',
      mealTypes: ['breakfast'],
    },
  },
  {
    title: 'Power Walk',
    capabilities: {
      requiresMedia: true,
      requiresAPI: true,
      hasCelebration: true,
      supportedModes: ['text', 'visual'],
    },
    defaultDuration: 5,
    customProps: {
      mediaType: 'photo',
      apiEndpoint: '/api/walk-accompaniment',
    },
  },
  {
    title: 'Goal Planning',
    capabilities: {
      requiresAPI: true,
      hasCelebration: true,
      supportedModes: ['text'],
    },
    customProps: {
      apiEndpoint: '/api/goal-synthesize',
    },
  },
  {
    title: 'Voice Your Needs',
    capabilities: {
      requiresMedia: true,
      requiresAPI: true,
      hasCelebration: true,
      supportedModes: ['text', 'audio'],
    },
    customProps: {
      mediaType: 'audio',
      apiEndpoint: '/api/voice-needs',
      transcriptionEnabled: true,
    },
  },
  {
    title: 'Success Review',
    capabilities: {
      requiresMedia: true,
      requiresAPI: true,
      hasCelebration: true,
      supportedModes: ['text', 'audio'],
    },
    customProps: {
      mediaType: 'audio',
      apiEndpoint: '/api/success-review',
      transcriptionEnabled: true,
    },
  },
  {
    title: 'Reflective Journaling',
    capabilities: {
      requiresMedia: true,
      requiresAPI: true,
      hasReflection: true,
      supportedModes: ['text', 'audio'],
    },
    customProps: {
      mediaType: 'audio',
      apiEndpoint: '/api/journal-reflect',
      transcriptionEnabled: true,
    },
  },
];

/**
 * Get configuration for an intervention by title
 * 
 * @param title - The intervention title (must match staticInterventions.ts)
 * @returns The configuration if found, null otherwise
 * 
 * @example
 * ```typescript
 * const config = getInterventionConfig('Box Breathing');
 * if (config?.capabilities.requiresTimer) {
 *   // Show timer
 * }
 * ```
 */
export function getInterventionConfig(title: string): InterventionConfig | null {
  return interventionConfigs.find(config => config.title === title) || null;
}

/**
 * Check if an intervention has a specific capability
 * 
 * @param title - The intervention title
 * @param capability - The capability to check
 * @returns true if intervention has the capability, false otherwise
 * 
 * @example
 * ```typescript
 * if (hasCapability('Box Breathing', 'requiresTimer')) {
 *   // Show timer UI
 * }
 * ```
 */
export function hasCapability(
  title: string,
  capability: keyof InterventionCapabilities
): boolean {
  const config = getInterventionConfig(title);
  return config?.capabilities[capability] ?? false;
}

/**
 * Get all interventions that have a specific capability
 * 
 * @param capability - The capability to filter by
 * @returns Array of intervention titles that have the capability
 * 
 * @example
 * ```typescript
 * const timerInterventions = getInterventionsByCapability('requiresTimer');
 * // Returns: ['Box Breathing', 'Heat Therapy', 'HIIT Circuit', 'Power Walk']
 * ```
 */
export function getInterventionsByCapability(
  capability: keyof InterventionCapabilities
): string[] {
  return interventionConfigs
    .filter(config => config.capabilities[capability])
    .map(config => config.title);
}

/**
 * Get the default duration for an intervention
 * 
 * @param title - The intervention title
 * @returns Default duration in minutes, or undefined if not specified
 * 
 * @example
 * ```typescript
 * const duration = getInterventionDefaultDuration('Box Breathing'); // 3
 * ```
 */
export function getInterventionDefaultDuration(title: string): number | undefined {
  const config = getInterventionConfig(title);
  return config?.defaultDuration;
}

/**
 * Get supported guide modes for an intervention
 * 
 * @param title - The intervention title
 * @returns Array of supported modes, or empty array if none specified
 * 
 * @example
 * ```typescript
 * const modes = getInterventionSupportedModes('Power Walk');
 * // Returns: ['text', 'visual']
 * ```
 */
export function getInterventionSupportedModes(
  title: string
): ('text' | 'audio' | 'visual')[] {
  const config = getInterventionConfig(title);
  return config?.capabilities.supportedModes || [];
}

/**
 * Validate an intervention configuration
 * 
 * @param config - The configuration to validate
 * @returns Object with validation result and any errors
 * 
 * @example
 * ```typescript
 * const result = validateInterventionConfig(config);
 * if (!result.isValid) {
 *   console.error(result.errors);
 * }
 * ```
 */
export function validateInterventionConfig(config: InterventionConfig): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config.title || config.title.trim() === '') {
    errors.push('Title is required');
  }

  if (!config.capabilities) {
    errors.push('Capabilities object is required');
  }

  // Validate capability combinations
  if (config.capabilities.hasReflection && !config.capabilities.hasCelebration) {
    errors.push('Interventions with reflection should have celebration');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate all intervention configurations
 * Ensures all registered interventions have configs and validates them
 * 
 * @returns Object with validation results
 * 
 * @example
 * ```typescript
 * const results = validateAllInterventionConfigs();
 * if (!results.allValid) {
 *   console.warn('Some configs are invalid:', results.errors);
 * }
 * ```
 */
export function validateAllInterventionConfigs(): {
  allValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Get all registered intervention titles
  const registeredTitles = getRegisteredInterventions();

  // Check that all registered interventions have configs
  for (const title of registeredTitles) {
    const config = getInterventionConfig(title);
    if (!config) {
      warnings.push(`No config found for registered intervention: ${title}`);
    } else {
      // Validate the config
      const validation = validateInterventionConfig(config);
      if (!validation.isValid) {
        errors.push(`${title}: ${validation.errors.join(', ')}`);
      }
    }
  }

  // Check for configs that don't have registered components
  for (const config of interventionConfigs) {
    if (!registeredTitles.includes(config.title)) {
      warnings.push(`Config exists for ${config.title} but no component is registered`);
    }
  }

  return {
    allValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Get custom properties for an intervention
 * 
 * @param title - The intervention title
 * @returns Custom properties object, or empty object if none
 * 
 * @example
 * ```typescript
 * const props = getInterventionCustomProps('Box Breathing');
 * const phases = props.breathingPhases; // ['inhale', 'hold1', 'exhale', 'hold2']
 * ```
 */
export function getInterventionCustomProps(title: string): Record<string, any> {
  const config = getInterventionConfig(title);
  return config?.customProps || {};
}

