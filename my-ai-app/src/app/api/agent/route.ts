import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { AgentRequest, AgentResponse, AgentError, AgentInfoResponse } from '@/types/api';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest): Promise<NextResponse<AgentResponse | AgentError>> {
  try {
    const body: AgentRequest = await request.json();
    const { message, voiceId, generateAudio = false } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Generate response using OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful AI assistant. Provide clear, concise, and helpful responses.'
        },
        {
          role: 'user',
          content: message
        }
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const aiResponse = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    const response: AgentResponse = {
      message: aiResponse,
      timestamp: new Date().toISOString(),
    };

    // Generate audio using ElevenLabs if requested
    if (generateAudio && process.env.ELEVENLABS_API_KEY) {
      try {
        const voiceId = process.env.ELEVENLABS_VOICE_ID || voiceId || 'pNInz6obpgDQGcFmaJgB'; // Default voice
        
        const elevenLabsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': process.env.ELEVENLABS_API_KEY!,
          },
          body: JSON.stringify({
            text: aiResponse,
            model_id: 'eleven_monolingual_v1',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.5,
            },
          }),
        });

        if (!elevenLabsResponse.ok) {
          throw new Error(`ElevenLabs API error: ${elevenLabsResponse.status}`);
        }

        const audioBuffer = await elevenLabsResponse.arrayBuffer();
        const audioBase64 = Buffer.from(audioBuffer).toString('base64');
        response.audio = `data:audio/mpeg;base64,${audioBase64}`;
      } catch (audioError) {
        console.error('ElevenLabs audio generation error:', audioError);
        response.audioError = `Failed to generate audio: ${audioError instanceof Error ? audioError.message : 'Unknown error'}`;
      }
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(): Promise<NextResponse<AgentInfoResponse>> {
  return NextResponse.json({
    message: 'Agent API endpoint is running',
    endpoints: {
      POST: '/api/agent - Send a message to the AI agent',
      parameters: {
        message: 'string (required) - The message to send to the AI',
        voiceId: 'string (optional) - ElevenLabs voice ID',
        generateAudio: 'boolean (optional) - Whether to generate audio response'
      }
    }
  });
}
