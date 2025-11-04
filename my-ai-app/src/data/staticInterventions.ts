/**
 * Static Intervention Data
 * Pre-defined interventions for each cycle phase to avoid API calls
 */

import { InterventionCard, CyclePhase, InterventionType } from '@/types/interventions';

export interface StaticIntervention extends Omit<InterventionCard, 'id' | 'relevance_score'> {
  research: string;
  instructions: string[];
  modification?: string;
  equipment?: string;
  interaction_type?: InterventionType;
}

export const staticInterventions: Record<CyclePhase, StaticIntervention[]> = {
  menstrual: [
    {
      phase_tags: ['menstrual'],
      category: 'movement',
      emoji: '🧘',
      benefit: 'Ease Cramps',
      title: "Child's Pose",
      duration_minutes: 3,
      location: 'Floor/yoga mat',
      description: 'Gentle yoga pose that increases pelvic blood flow and reduces cramping through relaxation and breath.',
      instructions: [
        'Kneel, touch big toes together (30 sec)',
        'Sink hips toward heels, extend arms forward (30 sec)',
        'Rest forehead on floor, breathe deeply (2 min)',
        'Slowly rise when ready'
      ],
      modification: 'Place pillow under forehead if uncomfortable',
      research: 'Rakhshaee, 2011'
    },
    {
      phase_tags: ['menstrual', 'luteal'],
      category: 'breathwork',
      emoji: '🫁',
      benefit: 'Find Calm',
      title: 'Box Breathing',
      duration_minutes: 3,
      location: 'Anywhere',
      description: 'Controlled breathing practice that activates parasympathetic response, reducing cortisol and stress.',
      instructions: [
        'Inhale through nose for 4 counts',
        'Hold breath for 4 counts',
        'Exhale through mouth for 4 counts',
        'Hold empty lungs for 4 counts',
        'Repeat for 3 minutes'
      ],
      research: 'Joshi & Telles, 2009'
    },
    {
      phase_tags: ['menstrual'],
      category: 'supplementation',
      emoji: '🔥',
      benefit: 'Manage Pain',
      title: 'Heat Therapy',
      duration_minutes: 5,
      location: 'Bed/couch',
      description: 'Apply heat to lower abdomen or back to relieve cramps and pain as effectively as NSAIDs.',
      equipment: 'Heating pad or hot water bottle',
      instructions: [
        'Apply heat to lower abdomen or back',
        'Find comfortable position (lying or seated)',
        'Breathe deeply and relax muscles',
        'Leave on for 5 minutes minimum'
      ],
      research: 'Heat at 40°C as effective as NSAIDs for menstrual pain (Akin et al., 2001)'
    }
  ],
  
  follicular: [
    {
      phase_tags: ['follicular', 'ovulatory'],
      category: 'movement',
      emoji: '🏃',
      benefit: 'Boost Energy',
      title: 'Power Walk',
      duration_minutes: 5,
      location: 'Outdoors/Indoors',
      description: 'Brisk walking capitalizes on rising estrogen levels to enhance cardiovascular health and mood.',
      instructions: [
        'Walk at brisk pace for 5 minutes',
        'Swing arms naturally',
        'Focus on deep breathing',
        'Maintain upright posture'
      ],
      research: 'Exercise during follicular phase enhances fat oxidation and energy utilization (Oosthuyse & Bosch, 2010)',
      interaction_type: 'interactive_movement'
    },
    {
      phase_tags: ['follicular'],
      category: 'nutrition',
      emoji: '🥗',
      benefit: 'Nourish Growth',
      title: 'Protein-Rich Breakfast',
      duration_minutes: 5,
      location: 'Kitchen',
      description: 'High-protein meal supports tissue building and sustained energy during follicular growth phase.',
      instructions: [
        'Prepare 20g+ protein meal (eggs, yogurt, or protein shake)',
        'Add colorful vegetables if possible',
        'Eat mindfully, chewing thoroughly',
        'Stay hydrated with water'
      ],
      research: 'Protein intake during follicular phase supports optimal hormone synthesis (Barr et al., 2010)',
      interaction_type: 'interactive_nutrition'
    },
    {
      phase_tags: ['follicular', 'ovulatory'],
      category: 'mindset',
      emoji: '💭',
      benefit: 'Set Intentions',
      title: 'Goal Planning',
      duration_minutes: 5,
      location: 'Anywhere quiet',
      description: 'Leverage increased cognitive function and optimism to set and plan meaningful goals.',
      instructions: [
        'Write down one goal for the week',
        'Break it into 3 actionable steps',
        'Identify first step you can take today',
        'Visualize successful completion'
      ],
      research: 'Cognitive performance peaks during follicular phase due to estrogen effects (Hampson, 1990)',
      interaction_type: 'interactive_goal'
    }
  ],
  
  ovulatory: [
    {
      phase_tags: ['ovulatory'],
      category: 'movement',
      emoji: '💪',
      benefit: 'Peak Performance',
      title: 'HIIT Circuit',
      duration_minutes: 5,
      location: 'Anywhere',
      description: 'High-intensity intervals capitalize on peak strength and endurance during ovulation.',
      instructions: [
        '30 sec jumping jacks',
        '30 sec squats',
        '30 sec push-ups (modified okay)',
        '30 sec rest',
        'Repeat 2-3 times'
      ],
      research: 'Athletic performance peaks during ovulation due to optimal hormonal state (Janse de Jonge, 2003)',
      interaction_type: 'interactive_movement'
    },
    {
      phase_tags: ['ovulatory', 'follicular'],
      category: 'mindset',
      emoji: '🗣️',
      benefit: 'Express Yourself',
      title: 'Voice Your Needs',
      duration_minutes: 5,
      location: 'Anywhere',
      description: 'Use peak communication confidence to express needs clearly and assertively.',
      instructions: [
        'Identify one unspoken need or boundary',
        'Write it in clear, direct language',
        'Practice saying it aloud',
        'Schedule conversation or send message'
      ],
      research: 'Social confidence and verbal fluency peak mid-cycle (Haselton & Gangestad, 2006)',
      interaction_type: 'interactive_goal'
    },
    {
      phase_tags: ['ovulatory'],
      category: 'reflection',
      emoji: '✨',
      benefit: 'Celebrate Wins',
      title: 'Success Review',
      duration_minutes: 5,
      location: 'Anywhere quiet',
      description: 'Reflect on recent achievements to boost confidence and motivation during peak energy.',
      instructions: [
        'List 3 things that went well this week',
        'Write why each success matters',
        'Acknowledge your role in each',
        'Share one win with someone you trust'
      ],
      research: 'Positive mood and self-perception peak at ovulation (Maki et al., 2002)'
    }
  ],
  
  luteal: [
    {
      phase_tags: ['luteal'],
      category: 'movement',
      emoji: '🧘',
      benefit: 'Physical Relief',
      title: "Child's Pose",
      duration_minutes: 3,
      location: 'Floor/yoga mat',
      description: 'Gentle yoga pose that increases pelvic blood flow and reduces cramping through relaxation and breath.',
      instructions: [
        'Kneel, touch big toes together (30 sec)',
        'Sink hips toward heels, extend arms forward (30 sec)',
        'Rest forehead on floor, breathe deeply (2 min)',
        'Slowly rise when ready'
      ],
      modification: 'Place pillow under forehead if uncomfortable',
      research: 'Gentle yoga poses increase pelvic blood flow and reduce cramping (Rakhshaee, 2011)'
    },
    {
      phase_tags: ['luteal'],
      category: 'reflection',
      emoji: '📝',
      benefit: 'Process Emotions',
      title: 'Reflective Journaling',
      duration_minutes: 5,
      location: 'Anywhere quiet',
      description: 'Expressive writing reduces rumination and anxiety during emotionally sensitive luteal phase.',
      instructions: [
        'Write response to: "What\'s triggering me today?"',
        'No editing, just stream of consciousness',
        'Ask: "Is this temporary or does it need attention?"',
        'Identify one pattern',
        'Decide: address now or wait until after period'
      ],
      research: 'Expressive writing reduces rumination and anxiety (Pennebaker & Beall, 1986)',
      interaction_type: 'interactive_goal'
    },
    {
      phase_tags: ['luteal'],
      category: 'breathwork',
      emoji: '🫁',
      benefit: 'Reduce Stress',
      title: 'Box Breathing',
      duration_minutes: 3,
      location: 'Anywhere',
      description: 'Controlled breathing activates parasympathetic response, managing luteal phase stress and irritability.',
      instructions: [
        'Inhale through nose for 4 counts',
        'Hold breath for 4 counts',
        'Exhale through mouth for 4 counts',
        'Hold empty lungs for 4 counts',
        'Repeat for 3 minutes'
      ],
      research: 'Controlled breathing activates parasympathetic response, reducing cortisol (Joshi & Telles, 2009)'
    }
  ]
};

// Helper function to get interventions for a phase
export function getInterventionsForPhase(phase: CyclePhase, count: number = 3): InterventionCard[] {
  const phaseInterventions = staticInterventions[phase] || staticInterventions.menstrual;
  
  return phaseInterventions.slice(0, count).map((intervention, index) => ({
    id: `${phase}_static_${index}`,
    ...intervention,
    relevance_score: 1.0 - (index * 0.1)
  }));
}

// Helper to match interventions to symptoms
export function getPersonalizedInterventions(
  phase: CyclePhase,
  symptoms: string[],
  mood: string,
  energy: string,
  count: number = 3
): InterventionCard[] {
  const allInterventions = staticInterventions[phase] || staticInterventions.menstrual;
  
  // Simple scoring based on keywords
  const scoredInterventions = allInterventions.map((intervention) => {
    let score = 1.0;
    
    // Match symptoms to benefits/titles
    if (symptoms.some(s => ['cramp', 'pain'].includes(s.toLowerCase())) && 
        intervention.benefit.toLowerCase().includes('pain')) {
      score += 0.5;
    }
    if (symptoms.some(s => ['fatigue', 'tired'].includes(s.toLowerCase())) && 
        intervention.benefit.toLowerCase().includes('energy')) {
      score += 0.5;
    }
    if (mood === 'low' && intervention.category === 'mindset') {
      score += 0.3;
    }
    if (energy === 'low' && intervention.category === 'movement') {
      score += 0.3;
    }
    
    return { ...intervention, score };
  });
  
  // Sort by score and take top N
  const sorted = scoredInterventions.sort((a, b) => b.score - a.score);
  
  return sorted.slice(0, count).map((intervention, index) => ({
    id: `${phase}_personalized_${Date.now()}_${index}`,
    phase_tags: intervention.phase_tags,
    category: intervention.category,
    emoji: intervention.emoji,
    benefit: intervention.benefit,
    title: intervention.title,
    duration_minutes: intervention.duration_minutes,
    location: intervention.location,
    description: intervention.description,
    relevance_score: 1.0 - (index * 0.1)
  }));
}

// Helper to get intervention by title (for detail page lookup)
export function getInterventionByTitle(title: string): StaticIntervention | null {
  for (const phase in staticInterventions) {
    const intervention = staticInterventions[phase as CyclePhase].find(
      (i) => i.title === title
    );
    if (intervention) {
      return intervention;
    }
  }
  return null;
}

// Helper to get all interventions as a flat array
export function getAllStaticInterventions(): StaticIntervention[] {
  return Object.values(staticInterventions).flat();
}

// Helper to get all unique interventions (no duplicates)
export function getAllUniqueInterventions(): StaticIntervention[] {
  const interventionMap = new Map<string, StaticIntervention>();
  
  Object.values(staticInterventions).forEach(phaseInterventions => {
    phaseInterventions.forEach(intervention => {
      if (!interventionMap.has(intervention.title)) {
        interventionMap.set(intervention.title, intervention);
      }
    });
  });
  
  return Array.from(interventionMap.values());
}
