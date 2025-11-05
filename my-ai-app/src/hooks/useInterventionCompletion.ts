/**
 * Shared hook for handling intervention completion
 * Standardizes completion tracking across all interventions
 */

import { useRouter } from 'next/navigation';
import { StaticIntervention } from '@/data/staticInterventions';
import { addCompletedIntervention } from '@/utils/userStorage';

export interface CompletionOptions {
  rating?: number;
  notes?: string;
  completedFull?: boolean;
  changesNoticed?: string[];
}

export function useInterventionCompletion() {
  const router = useRouter();

  const markAsCompleted = (
    intervention: StaticIntervention,
    options?: CompletionOptions
  ) => {
    // Find intervention ID from cache
    const cachedInterventions = localStorage.getItem('current_interventions');
    let interventionId = intervention.title.toLowerCase().replace(/\s+/g, '-');
    
    if (cachedInterventions) {
      try {
        const parsed = JSON.parse(cachedInterventions);
        const found = parsed.interventions.find((i: any) => i.title === intervention.title);
        if (found) {
          interventionId = found.id;
        }
      } catch (error) {
        console.error('Error finding intervention ID:', error);
      }
    }

    addCompletedIntervention({
      intervention_id: interventionId,
      intervention_title: intervention.title,
      completed_at: new Date().toISOString(),
      completed_full_practice: options?.completedFull ?? true,
      rating: options?.rating,
      notes: options?.notes,
      changes_noticed: options?.changesNoticed,
    });
  };

  const handleDone = (intervention: StaticIntervention, options?: CompletionOptions) => {
    markAsCompleted(intervention, options);
    router.back();
  };

  return {
    markAsCompleted,
    handleDone,
  };
}

