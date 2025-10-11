import { NextRequest, NextResponse } from 'next/server';
import { 
  InterventionRequest, 
  InterventionResponse, 
  InterventionCard,
  CyclePhase 
} from '@/types/interventions';
import { getPersonalizedInterventions } from '@/data/staticInterventions';

// Helper function to generate cache key
function getCacheKey(request: InterventionRequest): string {
  return `interventions_${request.phase}_${request.symptoms.sort().join('_')}_${request.mood}_${request.energy}`;
}

// Helper function to check localStorage cache (simulated on server)
const interventionCache = new Map<string, { interventions: InterventionCard[], timestamp: number }>();

export async function POST(request: NextRequest): Promise<NextResponse<InterventionResponse>> {
  try {
    const body: InterventionRequest = await request.json();
    const { phase, symptoms, mood, energy, goal, username } = body;

    // Validate required fields
    if (!phase || !symptoms || !mood || !energy || !goal) {
      return NextResponse.json(
        { error: 'Missing required fields: phase, symptoms, mood, energy, goal' } as any,
        { status: 400 }
      );
    }

    // Check cache (1 hour expiry)
    const cacheKey = getCacheKey(body);
    const cached = interventionCache.get(cacheKey);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < 3600000) { // 1 hour
      return NextResponse.json({
        interventions: cached.interventions,
        phase,
        generated_at: new Date(cached.timestamp).toISOString(),
        cached: true,
      });
    }

    // Get personalized interventions from static data
    const interventions: InterventionCard[] = getPersonalizedInterventions(
      phase,
      symptoms,
      mood,
      energy,
      3
    );

    // Cache the results
    interventionCache.set(cacheKey, {
      interventions,
      timestamp: now
    });

    const response: InterventionResponse = {
      interventions,
      phase,
      generated_at: new Date().toISOString(),
      cached: false,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Intervention API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' } as any,
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Intervention Generation API',
    endpoints: {
      POST: '/api/interventions - Generate personalized intervention cards',
      parameters: {
        phase: 'string (required) - Current cycle phase: menstrual, follicular, ovulatory, or luteal',
        symptoms: 'array (required) - Array of current symptoms',
        mood: 'string (required) - Current mood state',
        energy: 'string (required) - Current energy level',
        goal: 'string (required) - Primary health goal',
        username: 'string (optional) - Username for personalization'
      }
    },
    practice_categories: [
      'nutrition', 'movement', 'mindset', 'breathwork', 
      'sleep', 'supplementation', 'stress_management', 'reflection'
    ],
    example_request: {
      phase: 'luteal',
      symptoms: ['fatigue', 'bloating'],
      mood: 'low',
      energy: 'moderate',
      goal: 'energy management'
    },
    example_response: {
      interventions: [
        {
          id: 'luteal_1234567890_0',
          phase_tags: ['luteal'],
          category: 'breathwork',
          emoji: '🫁',
          benefit: 'Find Calm',
          title: 'Box Breathing',
          duration_minutes: 3,
          location: 'Anywhere',
          description: 'A short breathing practice to regulate your nervous system and reduce stress response.',
          relevance_score: 1.0
        }
      ],
      phase: 'luteal',
      generated_at: '2025-10-11T20:00:00.000Z',
      cached: false
    }
  });
}
