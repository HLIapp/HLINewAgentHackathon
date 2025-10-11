/**
 * Menstrual Cycle Phase Detection Utility
 * 
 * Maps the last period date to the current cycle phase based on a 28-day cycle:
 * - Menstrual: Days 1-5
 * - Follicular: Days 6-13
 * - Ovulatory: Days 14-16
 * - Luteal: Days 17-28
 */

export type CyclePhase = 'menstrual' | 'follicular' | 'ovulatory' | 'luteal';

export interface CycleInfo {
  phase: CyclePhase;
  dayOfCycle: number;
  daysUntilNextPeriod: number;
  estimatedOvulation: Date | null;
  estimatedNextPeriod: Date;
}

/**
 * Detects the current menstrual cycle phase based on the last period date
 * @param lastPeriod - The date of the last menstrual period
 * @param cycleLength - Optional cycle length in days (default: 28)
 * @returns CycleInfo object with phase, day of cycle, and other cycle data
 */
export function detectPhase(lastPeriod: Date, cycleLength: number = 28): CycleInfo {
  const now = new Date();
  const timeDiff = now.getTime() - lastPeriod.getTime();
  const daysSinceLastPeriod = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  
  // Calculate day of current cycle (1-based)
  const dayOfCycle = (daysSinceLastPeriod % cycleLength) + 1;
  
  // Determine phase based on cycle day
  let phase: CyclePhase;
  if (dayOfCycle >= 1 && dayOfCycle <= 5) {
    phase = 'menstrual';
  } else if (dayOfCycle >= 6 && dayOfCycle <= 13) {
    phase = 'follicular';
  } else if (dayOfCycle >= 14 && dayOfCycle <= 16) {
    phase = 'ovulatory';
  } else {
    phase = 'luteal';
  }
  
  // Calculate days until next period
  const daysUntilNextPeriod = cycleLength - dayOfCycle + 1;
  
  // Estimate ovulation (typically 14 days before next period)
  const ovulationDay = cycleLength - 14;
  const estimatedOvulation = dayOfCycle <= ovulationDay 
    ? new Date(lastPeriod.getTime() + (ovulationDay - 1) * 24 * 60 * 60 * 1000)
    : new Date(lastPeriod.getTime() + (cycleLength + ovulationDay - 1) * 24 * 60 * 60 * 1000);
  
  // Estimate next period
  const estimatedNextPeriod = new Date(lastPeriod.getTime() + cycleLength * 24 * 60 * 60 * 1000);
  
  return {
    phase,
    dayOfCycle,
    daysUntilNextPeriod,
    estimatedOvulation: phase === 'ovulatory' ? estimatedOvulation : null,
    estimatedNextPeriod
  };
}

/**
 * Gets a human-readable description of the current cycle phase
 * @param phase - The cycle phase
 * @returns Description of the phase
 */
export function getPhaseDescription(phase: CyclePhase): string {
  const descriptions = {
    menstrual: 'Menstrual phase - period is occurring',
    follicular: 'Follicular phase - follicles are developing in the ovaries',
    ovulatory: 'Ovulatory phase - ovulation is occurring or about to occur',
    luteal: 'Luteal phase - uterine lining is preparing for potential pregnancy'
  };
  
  return descriptions[phase];
}

/**
 * Gets phase-specific health tips and recommendations
 * @param phase - The cycle phase
 * @returns Array of tips for the current phase
 */
export function getPhaseTips(phase: CyclePhase): string[] {
  const tips = {
    menstrual: [
      'Stay hydrated and get plenty of rest',
      'Consider iron-rich foods to replenish lost nutrients',
      'Use heating pads or warm baths for cramp relief',
      'Engage in gentle exercise like walking or yoga'
    ],
    follicular: [
      'Focus on strength training and cardio',
      'Eat foods rich in iron and vitamin C',
      'This is a great time for new challenges and goals',
      'Energy levels are typically higher during this phase'
    ],
    ovulatory: [
      'Peak fertility window - plan accordingly',
      'Engage in high-intensity workouts if desired',
      'Social energy is often at its highest',
      'Consider tracking basal body temperature for fertility'
    ],
    luteal: [
      'Focus on mood-supporting nutrients like magnesium',
      'Consider gentle exercise and stress management',
      'Be mindful of potential PMS symptoms',
      'Prioritize sleep and relaxation'
    ]
  };
  
  return tips[phase];
}
