import { detectPhase, getPhaseDescription, getPhaseTips } from '../menstrualCycle';

describe('detectPhase utility', () => {
  test('should detect menstrual phase correctly', () => {
    const lastPeriod = new Date('2024-01-01');
    const today = new Date('2024-01-03'); // Day 3
    
    // Mock Date.now to return our test date
    const originalDateNow = Date.now;
    Date.now = jest.fn(() => today.getTime());
    
    const result = detectPhase(lastPeriod);
    
    expect(result.phase).toBe('menstrual');
    expect(result.dayOfCycle).toBe(3);
    
    // Restore original Date.now
    Date.now = originalDateNow;
  });

  test('should detect follicular phase correctly', () => {
    const lastPeriod = new Date('2024-01-01');
    const today = new Date('2024-01-10'); // Day 10
    
    const originalDateNow = Date.now;
    Date.now = jest.fn(() => today.getTime());
    
    const result = detectPhase(lastPeriod);
    
    expect(result.phase).toBe('follicular');
    expect(result.dayOfCycle).toBe(10);
    
    Date.now = originalDateNow;
  });

  test('should detect ovulatory phase correctly', () => {
    const lastPeriod = new Date('2024-01-01');
    const today = new Date('2024-01-15'); // Day 15
    
    const originalDateNow = Date.now;
    Date.now = jest.fn(() => today.getTime());
    
    const result = detectPhase(lastPeriod);
    
    expect(result.phase).toBe('ovulatory');
    expect(result.dayOfCycle).toBe(15);
    expect(result.estimatedOvulation).not.toBeNull();
    
    Date.now = originalDateNow;
  });

  test('should detect luteal phase correctly', () => {
    const lastPeriod = new Date('2024-01-01');
    const today = new Date('2024-01-22'); // Day 22
    
    const originalDateNow = Date.now;
    Date.now = jest.fn(() => today.getTime());
    
    const result = detectPhase(lastPeriod);
    
    expect(result.phase).toBe('luteal');
    expect(result.dayOfCycle).toBe(22);
    
    Date.now = originalDateNow;
  });

  test('should handle different cycle lengths', () => {
    const lastPeriod = new Date('2024-01-01');
    const today = new Date('2024-01-15'); // Day 15 of a 30-day cycle
    
    const originalDateNow = Date.now;
    Date.now = jest.fn(() => today.getTime());
    
    const result = detectPhase(lastPeriod, 30);
    
    expect(result.phase).toBe('follicular'); // Day 15 of 30-day cycle is still follicular
    expect(result.dayOfCycle).toBe(15);
    
    Date.now = originalDateNow;
  });

  test('should calculate days until next period correctly', () => {
    const lastPeriod = new Date('2024-01-01');
    const today = new Date('2024-01-20'); // Day 20 of 28-day cycle
    
    const originalDateNow = Date.now;
    Date.now = jest.fn(() => today.getTime());
    
    const result = detectPhase(lastPeriod);
    
    expect(result.daysUntilNextPeriod).toBe(9); // 28 - 20 + 1 = 9
    expect(result.estimatedNextPeriod).toEqual(new Date('2024-01-29'));
    
    Date.now = originalDateNow;
  });
});

describe('getPhaseDescription', () => {
  test('should return correct descriptions for all phases', () => {
    expect(getPhaseDescription('menstrual')).toContain('period is occurring');
    expect(getPhaseDescription('follicular')).toContain('follicles are developing');
    expect(getPhaseDescription('ovulatory')).toContain('ovulation is occurring');
    expect(getPhaseDescription('luteal')).toContain('uterine lining is preparing');
  });
});

describe('getPhaseTips', () => {
  test('should return tips for all phases', () => {
    expect(getPhaseTips('menstrual')).toHaveLength(4);
    expect(getPhaseTips('follicular')).toHaveLength(4);
    expect(getPhaseTips('ovulatory')).toHaveLength(4);
    expect(getPhaseTips('luteal')).toHaveLength(4);
  });

  test('should include hydration tips for menstrual phase', () => {
    const tips = getPhaseTips('menstrual');
    expect(tips.some(tip => tip.includes('hydrated'))).toBe(true);
  });
});
