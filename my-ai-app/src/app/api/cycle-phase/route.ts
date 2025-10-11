import { NextRequest, NextResponse } from 'next/server';
import { detectPhase, getPhaseDescription, getPhaseTips, CycleInfo } from '@/utils/menstrualCycle';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lastPeriod, cycleLength = 28 } = body;

    if (!lastPeriod) {
      return NextResponse.json(
        { error: 'Last period date is required' },
        { status: 400 }
      );
    }

    const lastPeriodDate = new Date(lastPeriod);
    
    if (isNaN(lastPeriodDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    const cycleInfo: CycleInfo = detectPhase(lastPeriodDate, cycleLength);
    const description = getPhaseDescription(cycleInfo.phase);
    const tips = getPhaseTips(cycleInfo.phase);

    return NextResponse.json({
      ...cycleInfo,
      description,
      tips,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Cycle Phase API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Cycle Phase API endpoint is running',
    endpoints: {
      POST: '/api/cycle-phase - Calculate menstrual cycle phase',
      parameters: {
        lastPeriod: 'string (required) - Last period date in YYYY-MM-DD format',
        cycleLength: 'number (optional) - Cycle length in days (default: 28)'
      },
      phases: {
        menstrual: 'Days 1-5: Period is occurring',
        follicular: 'Days 6-13: Follicles developing in ovaries',
        ovulatory: 'Days 14-16: Ovulation occurring or about to occur',
        luteal: 'Days 17-28: Uterine lining preparing for potential pregnancy'
      }
    }
  });
}
