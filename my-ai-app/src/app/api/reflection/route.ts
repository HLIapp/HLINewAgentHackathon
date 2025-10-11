import { NextRequest, NextResponse } from 'next/server';
import { CompletedIntervention } from '@/utils/userStorage';

// In-memory storage for reflections (simulates database)
const reflections: CompletedIntervention[] = [];

export async function POST(request: NextRequest) {
  try {
    const body: CompletedIntervention = await request.json();
    
    // Validate required fields
    if (!body.intervention_id || !body.intervention_title) {
      return NextResponse.json(
        { error: 'Missing required fields: intervention_id, intervention_title' },
        { status: 400 }
      );
    }

    // Create completion record
    const completion: CompletedIntervention = {
      intervention_id: body.intervention_id,
      intervention_title: body.intervention_title,
      completed_at: new Date().toISOString(),
      rating: body.rating,
      completed_full_practice: body.completed_full_practice ?? true,
      changes_noticed: body.changes_noticed || [],
      notes: body.notes,
    };

    // Store in memory (in production, this would go to a database)
    reflections.push(completion);

    return NextResponse.json({
      success: true,
      completion,
      message: 'Reflection saved successfully',
    });

  } catch (error) {
    console.error('Reflection API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Reflection API',
    description: 'Stores user reflections and completion data for interventions',
    endpoints: {
      POST: '/api/reflection - Submit practice reflection',
      parameters: {
        intervention_id: 'string (required) - ID of the intervention',
        intervention_title: 'string (required) - Title of the intervention',
        rating: 'number (optional) - Rating 1-5',
        completed_full_practice: 'boolean (optional) - Whether full practice was completed',
        changes_noticed: 'string[] (optional) - Array of changes noticed',
        notes: 'string (optional) - Additional notes'
      }
    },
    rating_scale: {
      1: '😔 Not helpful',
      2: '😐 Slightly helpful',
      3: '🙂 Helpful',
      4: '😊 Very helpful',
      5: '🤩 Extremely helpful'
    },
    change_tags: [
      'pain decreased',
      'felt calmer',
      'more energy',
      'better mood',
      'less bloating',
      'improved focus',
      'reduced anxiety',
      'physical relief'
    ],
    total_reflections: reflections.length
  });
}
