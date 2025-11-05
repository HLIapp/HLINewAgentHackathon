import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { env, validateEnvironment } from '@/config/env';
import { SuccessReviewRequest, SuccessReviewResponse } from '@/types/interventions';

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
    const body: SuccessReviewRequest = await request.json();
    const { win_text, prompt_id, intervention_title } = body;

    if (!win_text || !win_text.trim()) {
      return NextResponse.json(
        { error: 'Win text is required' },
        { status: 400 }
      );
    }

    // Synthesize win into amplified, impactful reflection using GPT-4
    const prompt = `You are a compassionate and empowering life coach specializing in helping people recognize and celebrate their wins, no matter how big or small.

The user has shared this win they want to celebrate: "${win_text}"

Your task is to help them:
1. Amplify their win into a powerful, affirming statement that captures its full significance
2. Identify the growth and learning that occurred through this win
3. Reflect on the impact this win has had (or will have) on their life
4. Create a shareable, inspiring quote that captures the essence of this win
5. Provide encouraging words that acknowledge their achievement and build momentum

Focus on:
- Making the win feel significant and meaningful (even if it seems small)
- Highlighting their agency and effort in achieving this win
- Connecting the win to personal growth and development
- Being specific and concrete rather than generic
- Being genuinely celebratory and encouraging
- Helping them see the bigger picture of their progress

Return your response as JSON with this exact structure:
{
  "original_win": "the user's original text",
  "amplified_statement": "a powerful, affirming statement that amplifies the significance of their win",
  "growth_insight": "what this win reveals about their growth, skills, or character development",
  "impact_reflection": "how this win impacts (or will impact) their life, relationships, or future",
  "shareable_quote": "a short, inspiring quote (1-2 sentences) that captures the essence of this win",
  "encouragement": "genuine, specific encouragement that acknowledges their achievement and builds momentum"
}

Be warm, specific, and genuinely celebratory. Help them feel proud of what they've accomplished.`;

    const completion = await openai.chat.completions.create({
      model: env.openai.model,
      messages: [
        {
          role: 'system',
          content: 'You are a supportive life coach. Help users recognize and celebrate their wins in meaningful ways. Always respond with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 800,
      temperature: 0.8,
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    
    // Parse the response
    let parsedResponse: SuccessReviewResponse;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? jsonMatch[0] : responseText;
      const amplifiedWin = JSON.parse(jsonText);
      
      // Ensure required fields exist
      if (!amplifiedWin.original_win) {
        amplifiedWin.original_win = win_text;
      }
      if (!amplifiedWin.amplified_statement) {
        amplifiedWin.amplified_statement = win_text;
      }
      if (!amplifiedWin.growth_insight) {
        amplifiedWin.growth_insight = 'Every win, no matter how small, represents growth and progress on your journey.';
      }
      if (!amplifiedWin.impact_reflection) {
        amplifiedWin.impact_reflection = 'This achievement contributes to your ongoing growth and success.';
      }
      if (!amplifiedWin.shareable_quote) {
        amplifiedWin.shareable_quote = `I'm celebrating a win: ${win_text}`;
      }
      if (!amplifiedWin.encouragement) {
        amplifiedWin.encouragement = 'Keep going! Every step forward matters.';
      }
      
      parsedResponse = {
        amplified_win: amplifiedWin,
        generated_at: new Date().toISOString(),
      };
    } catch {
      console.error('Failed to parse success review synthesis:', responseText);
      // Fallback response
      parsedResponse = {
        amplified_win: {
          original_win: win_text,
          amplified_statement: win_text,
          growth_insight: 'Every win, no matter how small, represents growth and progress on your journey.',
          impact_reflection: 'This achievement contributes to your ongoing growth and success.',
          shareable_quote: `I'm celebrating a win: ${win_text}`,
          encouragement: 'Keep going! Every step forward matters. You\'re doing great!',
        },
        generated_at: new Date().toISOString(),
      };
    }

    return NextResponse.json(parsedResponse);

  } catch (error) {
    console.error('Success Review API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Success Review API',
    description: 'Helps users recognize and celebrate their wins in meaningful ways',
    endpoints: {
      POST: '/api/success-review - Amplify and celebrate a user win',
      parameters: {
        win_text: 'string (required) - The win or achievement to celebrate',
        prompt_id: 'string (optional) - ID of the reflection prompt used',
        intervention_title: 'string (required) - Title of the intervention'
      }
    },
    example_request: {
      win_text: 'I finally set a boundary with my coworker and felt good about it',
      prompt_id: 'boundary-setting',
      intervention_title: 'Success Review'
    }
  });
}
