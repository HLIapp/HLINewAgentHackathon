/**
 * Intervention Component Registry
 * 
 * Central registry for mapping intervention titles to their interactive components.
 * This pattern enables easy addition of new interventions without modifying routing code.
 * 
 * Benefits:
 * - Single source of truth for component mapping
 * - Easy to add new interventions (just register them here)
 * - Type-safe component mapping
 * - Pattern translates directly to SwiftUI (Dictionary/Map equivalent)
 * 
 * Usage:
 * ```typescript
 * import { getInterventionComponent } from '@/core/interventionRegistry';
 * 
 * const Component = getInterventionComponent(intervention.title);
 * if (Component) {
 *   return <Component intervention={intervention} />;
 * }
 * ```
 * 
 * To add a new intervention:
 * 1. Create your component file
 * 2. Import it here
 * 3. Add to registry: registry.set('Intervention Title', YourComponent)
 * 4. Done! No routing code changes needed.
 */

import { ComponentType } from 'react';
import { StaticIntervention } from '@/data/staticInterventions';
import BoxBreathingInteractive from '@/components/BoxBreathingInteractive';
import HeatTherapyInteractive from '@/components/HeatTherapyInteractive';
import HIITCircuitInteractive from '@/components/HIITCircuitInteractive';
import ProteinBreakfastInteractive from '@/components/ProteinBreakfastInteractive';
import PowerWalkInteractive from '@/components/PowerWalkInteractive';
import GoalPlanningInteractive from '@/components/GoalPlanningInteractive';
import VoiceYourNeedsInteractive from '@/components/VoiceYourNeedsInteractive';
import SuccessReviewInteractive from '@/components/SuccessReviewInteractive';
import ReflectiveJournalingInteractive from '@/components/ReflectiveJournalingInteractive';

/**
 * Type alias for intervention components
 * All interactive components must accept intervention prop
 */
export type InterventionComponent = ComponentType<{ intervention: StaticIntervention }>;

/**
 * Registry mapping intervention titles to their interactive components
 * 
 * Key: Intervention title (must match exactly as defined in staticInterventions.ts)
 * Value: React component that handles the interactive experience
 * 
 * To add a new intervention: simply add a new entry here
 */
export const interventionRegistry = new Map<string, InterventionComponent>([
  ['Box Breathing', BoxBreathingInteractive],
  ['Heat Therapy', HeatTherapyInteractive],
  ['HIIT Circuit', HIITCircuitInteractive],
  ['Protein-Rich Breakfast', ProteinBreakfastInteractive],
  ['Power Walk', PowerWalkInteractive],
  ['Goal Planning', GoalPlanningInteractive],
  ['Voice Your Needs', VoiceYourNeedsInteractive],
  ['Success Review', SuccessReviewInteractive],
  ['Reflective Journaling', ReflectiveJournalingInteractive],
]);

/**
 * Get the interactive component for an intervention by title
 * 
 * @param title - The intervention title (must match exactly)
 * @returns The component if found, null if no interactive component exists
 * 
 * @example
 * ```typescript
 * const Component = getInterventionComponent('Box Breathing');
 * if (Component) {
 *   return <Component intervention={intervention} />;
 * }
 * ```
 */
export function getInterventionComponent(title: string): InterventionComponent | null {
  return interventionRegistry.get(title) || null;
}

/**
 * Register a new intervention component
 * 
 * Use this when adding new interactive interventions to the system.
 * This is the only place you need to modify when adding a new intervention.
 * 
 * @param title - The intervention title (must match staticInterventions.ts)
 * @param component - The React component that handles the intervention
 * 
 * @example
 * ```typescript
 * import NewInterventionComponent from '@/components/NewInterventionComponent';
 * registerIntervention('New Intervention', NewInterventionComponent);
 * ```
 */
export function registerIntervention(title: string, component: InterventionComponent): void {
  interventionRegistry.set(title, component);
}

/**
 * Check if an intervention has an interactive component registered
 * 
 * @param title - The intervention title to check
 * @returns true if component exists, false otherwise
 * 
 * @example
 * ```typescript
 * if (hasInteractiveComponent('Box Breathing')) {
 *   // Show interactive version
 * } else {
 *   // Show standard view
 * }
 * ```
 */
export function hasInteractiveComponent(title: string): boolean {
  return interventionRegistry.has(title);
}

/**
 * Get all registered intervention titles
 * Useful for debugging or validation
 * 
 * @returns Array of all registered intervention titles
 */
export function getRegisteredInterventions(): string[] {
  return Array.from(interventionRegistry.keys());
}

