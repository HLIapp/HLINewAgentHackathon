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
 * with detailed hormonal insights and body manifestations
 * @param phase - The cycle phase
 * @returns Description of the phase with hormonal shifts and body effects
 */
export function getPhaseDescription(phase: CyclePhase): string {
  const descriptions = {
    menstrual: `Menstrual Phase (Days 1-5) - Your period is here. Hormonally, estrogen and progesterone are at their lowest levels of the cycle, which triggers the shedding of your uterine lining. This hormonal drop can manifest as lower energy, increased sensitivity to pain, and a need for rest. You may notice your body craving warmth, comfort foods, and gentle movement. Your brain chemistry shifts to support rest and recovery - this is why many people feel more introspective and in need of downtime during this phase.`,
    
    follicular: `Follicular Phase (Days 6-13) - Your body is preparing for ovulation. Estrogen levels begin to rise steadily, triggered by follicle-stimulating hormone (FSH). As estrogen increases, you'll likely notice your energy levels climbing, your mood brightening, and your cognitive function sharpening. This is your body's natural "upward swing" - you may feel more motivated, optimistic, and capable of taking on challenges. Your body is building strength and endurance, making this an ideal time for strength training and high-intensity activities. Your skin may glow, and you may feel more confident and social.`,
    
    ovulatory: `Ovulatory Phase (Days 14-16) - Estrogen peaks right before ovulation, then drops slightly as luteinizing hormone (LH) surges to trigger the release of an egg. This is your peak performance window - estrogen at its highest enhances coordination, reaction time, and physical strength. You may notice peak social confidence, clearer communication, and increased libido. Your body is primed for connection and activity. Some people experience mild cramping or spotting during ovulation. After the egg is released, progesterone begins to rise.`,
    
    luteal: `Luteal Phase (Days 17-28) - After ovulation, progesterone rises significantly while estrogen also increases (creating a second, smaller peak). This hormonal shift supports potential pregnancy but also brings changes. In the early luteal phase (days 17-21), you may still feel energetic as progesterone builds gradually. By mid-to-late luteal phase (days 22-28), as progesterone peaks and then drops if no pregnancy occurs, you may notice increased sensitivity, mood fluctuations, fluid retention, and cravings. Your body is preparing for either pregnancy or menstruation - this can manifest as needing more rest, feeling more emotional, and preferring comfort and routine. Sleep quality may shift, and you may feel more sensitive to stress.`
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
