import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { env, validateEnvironment } from '@/config/env';
import { GoalSynthesisRequest, ActionableGoal } from '@/types/interventions';

// Validate environment variables
try {
  validateEnvironment();
} catch (error) {
  console.error('Environment validation failed:', error);
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: env.openai.apiKey,
});

export async function POST(request: NextRequest) {
  try {
    const body: GoalSynthesisRequest = await request.json();
    const { goal_text, goal_audio_base64, intervention_title } = body;

    if (!goal_text && !goal_audio_base64) {
      return NextResponse.json(
        { error: 'Either goal_text or goal_audio_base64 is required' },
        { status: 400 }
      );
    }

    let finalGoalText = goal_text || '';

    // If audio is provided, transcribe it first
    if (goal_audio_base64 && !goal_text) {
      try {
        // Convert base64 to buffer
        const audioBuffer = Buffer.from(goal_audio_base64, 'base64');
        
        // Create a File object for Whisper API
        // In Node.js, we need to create a File-like object
        // Using OpenAI SDK's built-in support
        const audioFile = new File([audioBuffer], 'audio.webm', { 
          type: 'audio/webm' 
        });
        
        // Transcribe using OpenAI Whisper via SDK
        const transcription = await openai.audio.transcriptions.create({
          file: audioFile,
          model: 'whisper-1',
        });
        
        finalGoalText = transcription.text;
      } catch (transcriptionError) {
        console.error('Audio transcription error:', transcriptionError);
        return NextResponse.json(
          { error: 'Failed to transcribe audio. Please try again or use text input.' },
          { status: 500 }
        );
      }
    }

    if (!finalGoalText.trim()) {
      return NextResponse.json(
        { error: 'Goal text cannot be empty' },
        { status: 400 }
      );
    }

    // Synthesize goal into actionable steps using GPT-4
    const prompt = `You are a compassionate, empowering goal-setting coach specializing in helping people create actionable, achievable goals.

The user has shared this goal: "${finalGoalText}"

Your task is to help them break this goal down into clear, actionable steps. Consider:
1. What are 3-5 specific, concrete steps they can take to achieve this goal?
2. What is the very next action they can take today or this week?
3. Make each step specific and measurable where possible
4. Be encouraging and realistic

Return your response as JSON with this exact structure:
{
  "original_goal": "the user's original goal text",
  "actionable_steps": [
    {
      "step_number": 1,
      "action": "specific actionable step",
      "timeframe": "suggested timeframe (optional)"
    }
  ],
  "next_action": "the very next specific action they can take"
}

Be concise but complete. Focus on making the goal feel achievable and breaking it into manageable pieces.`;

    const completion = await openai.chat.completions.create({
      model: env.openai.model,
      messages: [
        {
          role: 'system',
          content: 'You are a supportive goal-setting coach. Help users break down goals into actionable steps. Always respond with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 800,
      temperature: 0.7,
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    
    // Parse the response
    let parsedGoal: ActionableGoal;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? jsonMatch[0] : responseText;
      parsedGoal = JSON.parse(jsonText);
      
      // Ensure required fields exist
      if (!parsedGoal.original_goal) {
        parsedGoal.original_goal = finalGoalText;
      }
      if (!parsedGoal.actionable_steps || !Array.isArray(parsedGoal.actionable_steps)) {
        parsedGoal.actionable_steps = [];
      }
      if (!parsedGoal.next_action) {
        parsedGoal.next_action = 'Start by reviewing your goal and taking the first small step.';
      }
      
      parsedGoal.generated_at = new Date().toISOString();
    } catch (parseError) {
      console.error('Failed to parse goal synthesis:', responseText);
      // Fallback response
      parsedGoal = {
        original_goal: finalGoalText,
        actionable_steps: [
          {
            step_number: 1,
            action: 'Break down your goal into smaller, manageable pieces',
            timeframe: 'This week'
          },
          {
            step_number: 2,
            action: 'Identify resources or support you might need',
            timeframe: 'This week'
          },
          {
            step_number: 3,
            action: 'Take the first small step toward your goal',
            timeframe: 'Today'
          }
        ],
        next_action: 'Reflect on your goal and identify one concrete action you can take today.',
        generated_at: new Date().toISOString(),
      };
    }

    return NextResponse.json(parsedGoal);

  } catch (error) {
    console.error('Goal Synthesis API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Goal Synthesis API',
    description: 'Synthesizes user goals into actionable steps',
    endpoints: {
      POST: '/api/goal-synthesize - Synthesize goal into actionable steps',
      parameters: {
        goal_text: 'string (optional) - Text of the goal',
        goal_audio_base64: 'string (optional) - Base64 encoded audio recording',
        intervention_title: 'string (required) - Title of the intervention'
      },
      note: 'Either goal_text or goal_audio_base64 must be provided'
    },
    example_request: {
      goal_text: 'I want to start a regular exercise routine',
      intervention_title: 'Goal Planning'
    }
  });
}

