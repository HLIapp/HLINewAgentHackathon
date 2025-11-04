import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { env, validateEnvironment } from '@/config/env';
import { VoiceNeedsRequest, VoiceNeedsResponse } from '@/types/interventions';

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
    const body: VoiceNeedsRequest = await request.json();
    const { need_text, need_audio_base64, intervention_title } = body;

    if (!need_text && !need_audio_base64) {
      return NextResponse.json(
        { error: 'Either need_text or need_audio_base64 is required' },
        { status: 400 }
      );
    }

    let finalNeedText = need_text || '';

    // If audio is provided, transcribe it first
    if (need_audio_base64 && !need_text) {
      try {
        // Convert base64 to buffer
        const audioBuffer = Buffer.from(need_audio_base64, 'base64');
        
        // Create a File object for Whisper API
        const audioFile = new File([audioBuffer], 'audio.webm', { 
          type: 'audio/webm' 
        });
        
        // Transcribe using OpenAI Whisper via SDK
        const transcription = await openai.audio.transcriptions.create({
          file: audioFile,
          model: 'whisper-1',
        });
        
        finalNeedText = transcription.text;
      } catch (transcriptionError) {
        console.error('Audio transcription error:', transcriptionError);
        return NextResponse.json(
          { error: 'Failed to transcribe audio. Please try again or use text input.' },
          { status: 500 }
        );
      }
    }

    if (!finalNeedText.trim()) {
      return NextResponse.json(
        { error: 'Need text cannot be empty' },
        { status: 400 }
      );
    }

    // Synthesize need into clear, assertive communication using GPT-4
    const prompt = `You are a compassionate communication coach specializing in helping people express their needs and boundaries clearly and assertively.

The user has shared this need or boundary they want to express: "${finalNeedText}"

Your task is to help them:
1. Refine their statement into clear, direct, and assertive language
2. Provide communication tips to help them express this effectively
3. Create a practice script they can use to rehearse
4. Suggest next steps for actually voicing this need

Focus on:
- Making the statement clear and direct (not passive or aggressive)
- Using "I" statements
- Being specific about what they need
- Maintaining respect for both themselves and the other person
- Helping them feel confident and empowered

Return your response as JSON with this exact structure:
{
  "original_need": "the user's original text",
  "refined_statement": "a clear, direct, assertive version of their need",
  "communication_tips": [
    {
      "tip": "specific tip",
      "explanation": "why this helps"
    }
  ],
  "practice_script": "a complete script they can practice saying aloud",
  "next_steps": [
    {
      "step_number": 1,
      "action": "specific actionable step",
      "timeframe": "suggested timeframe (optional)"
    }
  ]
}

Be empowering and supportive. Help them feel confident about expressing this need.`;

    const completion = await openai.chat.completions.create({
      model: env.openai.model,
      messages: [
        {
          role: 'system',
          content: 'You are a supportive communication coach. Help users express their needs and boundaries clearly and assertively. Always respond with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    
    // Parse the response
    let parsedResponse: VoiceNeedsResponse;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? jsonMatch[0] : responseText;
      parsedResponse = JSON.parse(jsonText);
      
      // Ensure required fields exist
      if (!parsedResponse.original_need) {
        parsedResponse.original_need = finalNeedText;
      }
      if (!parsedResponse.refined_statement) {
        parsedResponse.refined_statement = finalNeedText;
      }
      if (!parsedResponse.communication_tips || !Array.isArray(parsedResponse.communication_tips)) {
        parsedResponse.communication_tips = [
          {
            tip: 'Use "I" statements',
            explanation: 'Focus on your feelings and needs rather than accusing the other person'
          },
          {
            tip: 'Be specific',
            explanation: 'Clearly state what you need rather than vague requests'
          }
        ];
      }
      if (!parsedResponse.practice_script) {
        parsedResponse.practice_script = parsedResponse.refined_statement;
      }
      if (!parsedResponse.next_steps || !Array.isArray(parsedResponse.next_steps)) {
        parsedResponse.next_steps = [
          {
            step_number: 1,
            action: 'Practice saying your refined statement aloud',
            timeframe: 'Today'
          },
          {
            step_number: 2,
            action: 'Choose when and how you want to communicate this',
            timeframe: 'This week'
          }
        ];
      }
      
      parsedResponse.generated_at = new Date().toISOString();
    } catch {
      console.error('Failed to parse voice needs synthesis:', responseText);
      // Fallback response
      parsedResponse = {
        original_need: finalNeedText,
        refined_statement: finalNeedText,
        communication_tips: [
          {
            tip: 'Use "I" statements',
            explanation: 'Focus on your feelings and needs rather than accusing the other person'
          },
          {
            tip: 'Be specific and clear',
            explanation: 'Clearly state what you need rather than vague requests'
          },
          {
            tip: 'Practice beforehand',
            explanation: 'Rehearsing helps you feel more confident when you actually communicate'
          }
        ],
        practice_script: finalNeedText,
        next_steps: [
          {
            step_number: 1,
            action: 'Practice saying your statement aloud',
            timeframe: 'Today'
          },
          {
            step_number: 2,
            action: 'Choose when and how you want to communicate this',
            timeframe: 'This week'
          }
        ],
        generated_at: new Date().toISOString(),
      };
    }

    return NextResponse.json(parsedResponse);

  } catch (error) {
    console.error('Voice Needs API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Voice Needs API',
    description: 'Helps users refine and express their needs and boundaries clearly',
    endpoints: {
      POST: '/api/voice-needs - Synthesize need into clear communication',
      parameters: {
        need_text: 'string (optional) - Text of the need or boundary',
        need_audio_base64: 'string (optional) - Base64 encoded audio recording',
        intervention_title: 'string (required) - Title of the intervention'
      },
      note: 'Either need_text or need_audio_base64 must be provided'
    },
    example_request: {
      need_text: 'I feel like my boundaries are being crossed at work',
      intervention_title: 'Voice Your Needs'
    }
  });
}
