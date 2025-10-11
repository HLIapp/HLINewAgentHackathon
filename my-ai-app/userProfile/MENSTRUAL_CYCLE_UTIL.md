# Menstrual Cycle Phase Detection Utility

A comprehensive utility for detecting menstrual cycle phases based on the last period date.

## 🚀 Features

- **Phase Detection**: Automatically maps last period date to current cycle phase
- **Cycle Tracking**: Calculates day of cycle, days until next period
- **Health Insights**: Provides phase-specific descriptions and health tips
- **Flexible Configuration**: Supports custom cycle lengths (default: 28 days)
- **API Integration**: RESTful API endpoint for easy integration

## 📊 Cycle Phases

| Phase | Days | Description |
|-------|------|-------------|
| **Menstrual** | 1-5 | Period is occurring |
| **Follicular** | 6-13 | Follicles developing in ovaries |
| **Ovulatory** | 14-16 | Ovulation occurring or about to occur |
| **Luteal** | 17-28 | Uterine lining preparing for potential pregnancy |

## 🛠 Usage

### Basic Usage

```typescript
import { detectPhase } from '@/utils/menstrualCycle';

const lastPeriod = new Date('2024-01-01');
const cycleInfo = detectPhase(lastPeriod);

console.log(cycleInfo.phase); // 'menstrual' | 'follicular' | 'ovulatory' | 'luteal'
console.log(cycleInfo.dayOfCycle); // 1-28
console.log(cycleInfo.daysUntilNextPeriod); // number
```

### Advanced Usage with Custom Cycle Length

```typescript
const cycleInfo = detectPhase(lastPeriod, 30); // 30-day cycle
```

### Getting Phase Information

```typescript
import { getPhaseDescription, getPhaseTips } from '@/utils/menstrualCycle';

const description = getPhaseDescription('ovulatory');
const tips = getPhaseTips('luteal');
```

## 📡 API Endpoints

### `GET /api/cycle-phase`
Returns API information and available phases.

### `POST /api/cycle-phase`
Calculate cycle phase from last period date.

**Request Body:**
```json
{
  "lastPeriod": "2024-01-01",
  "cycleLength": 28
}
```

**Response:**
```json
{
  "phase": "follicular",
  "dayOfCycle": 12,
  "daysUntilNextPeriod": 17,
  "estimatedOvulation": null,
  "estimatedNextPeriod": "2024-01-29T00:00:00.000Z",
  "description": "Follicular phase - follicles are developing in the ovaries",
  "tips": [
    "Focus on strength training and cardio",
    "Eat foods rich in iron and vitamin C",
    "This is a great time for new challenges and goals",
    "Energy levels are typically higher during this phase"
  ],
  "timestamp": "2024-01-12T10:00:00.000Z"
}
```

## 🧪 Testing

### Web Interface
Visit `http://localhost:3001/test-cycle` for an interactive testing interface.

### API Testing
```bash
# Test the API endpoint
curl -X POST http://localhost:3001/api/cycle-phase \
  -H "Content-Type: application/json" \
  -d '{"lastPeriod": "2024-01-01", "cycleLength": 28}'
```

## 📝 TypeScript Types

```typescript
export type CyclePhase = 'menstrual' | 'follicular' | 'ovulatory' | 'luteal';

export interface CycleInfo {
  phase: CyclePhase;
  dayOfCycle: number;
  daysUntilNextPeriod: number;
  estimatedOvulation: Date | null;
  estimatedNextPeriod: Date;
}
```

## 🔬 Algorithm Details

### Phase Detection Logic
1. Calculate days since last period: `(currentDate - lastPeriod) / (1000 * 60 * 60 * 24)`
2. Determine cycle day: `(daysSinceLastPeriod % cycleLength) + 1`
3. Map cycle day to phase based on standard ranges

### Ovulation Estimation
- Typically occurs 14 days before next period
- Only provided during ovulatory phase
- Based on standard luteal phase length

### Next Period Calculation
- Estimated as: `lastPeriod + cycleLength days`

## 📈 Example Scenarios

### Scenario 1: Day 3 of Cycle
```typescript
const lastPeriod = new Date('2024-01-01');
// Current date: 2024-01-03
const result = detectPhase(lastPeriod);
// Result: { phase: 'menstrual', dayOfCycle: 3, daysUntilNextPeriod: 26 }
```

### Scenario 2: Day 15 of Cycle (Ovulation)
```typescript
const lastPeriod = new Date('2024-01-01');
// Current date: 2024-01-15
const result = detectPhase(lastPeriod);
// Result: { phase: 'ovulatory', dayOfCycle: 15, estimatedOvulation: Date }
```

### Scenario 3: Day 25 of Cycle
```typescript
const lastPeriod = new Date('2024-01-01');
// Current date: 2024-01-25
const result = detectPhase(lastPeriod);
// Result: { phase: 'luteal', dayOfCycle: 25, daysUntilNextPeriod: 4 }
```

## 🎯 Health Tips by Phase

### Menstrual Phase (Days 1-5)
- Stay hydrated and get plenty of rest
- Consider iron-rich foods to replenish lost nutrients
- Use heating pads or warm baths for cramp relief
- Engage in gentle exercise like walking or yoga

### Follicular Phase (Days 6-13)
- Focus on strength training and cardio
- Eat foods rich in iron and vitamin C
- This is a great time for new challenges and goals
- Energy levels are typically higher during this phase

### Ovulatory Phase (Days 14-16)
- Peak fertility window - plan accordingly
- Engage in high-intensity workouts if desired
- Social energy is often at its highest
- Consider tracking basal body temperature for fertility

### Luteal Phase (Days 17-28)
- Focus on mood-supporting nutrients like magnesium
- Consider gentle exercise and stress management
- Be mindful of potential PMS symptoms
- Prioritize sleep and relaxation

## ⚠️ Important Notes

1. **Medical Disclaimer**: This utility is for informational purposes only and should not replace medical advice.

2. **Cycle Variability**: Individual cycles may vary significantly from the standard 28-day model.

3. **Accuracy Limitations**: The algorithm assumes regular cycles and may not be accurate for irregular cycles.

4. **Date Handling**: All dates are handled in the user's local timezone.

## 🔧 Customization

### Custom Cycle Lengths
```typescript
// For 30-day cycles
const cycleInfo = detectPhase(lastPeriod, 30);

// For 25-day cycles
const cycleInfo = detectPhase(lastPeriod, 25);
```

### Custom Phase Ranges
To modify phase ranges, update the logic in `detectPhase()` function:
```typescript
// Custom ranges example
if (dayOfCycle >= 1 && dayOfCycle <= 6) {
  phase = 'menstrual';
} else if (dayOfCycle >= 7 && dayOfCycle <= 14) {
  phase = 'follicular';
}
// ... etc
```

## 🚀 Future Enhancements

- [ ] Support for irregular cycle tracking
- [ ] Integration with fertility tracking methods
- [ ] Symptom tracking and correlation
- [ ] Machine learning for personalized predictions
- [ ] Integration with health apps and devices
