import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { AgentRequest, AgentResponse, AgentError, AgentInfoResponse } from '@/types/api';
import { getUserProfile, getMockUser } from '@/utils/userStorage';
import { env, validateEnvironment } from '@/config/env';

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

export async function POST(request: NextRequest): Promise<NextResponse<AgentResponse | AgentError>> {
  try {
    const body: AgentRequest = await request.json();
    const { message, voiceId, generateAudio = false, username } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Get user context for personalization
    let userContext = '';
    let displayName = 'there';
    
    if (username) {
      // Try to get user profile from localStorage simulation or mock data
      const mockUser = getMockUser(username);
      if (mockUser) {
        userContext = `You are talking to ${mockUser.username} who is currently experiencing ${mockUser.symptoms.join(', ')} symptoms, has ${mockUser.mood} mood, and ${mockUser.energy} energy. Their goal is ${mockUser.goal}.`;
        displayName = mockUser.username;
      } else {
        displayName = username;
      }
    }

    // Generate response using OpenAI with personalization
    const systemMessage = username 
      ? `You are a helpful AI assistant specialized in women's health and menstrual cycle support. ${userContext} Provide personalized, empathetic, and helpful responses. Be supportive and understanding of their health journey.`
      : 'You are a helpful AI assistant specialized in women\'s health and menstrual cycle support. Provide clear, concise, and helpful responses.';

    const completion = await openai.chat.completions.create({
      model: env.openai.model,
      messages: [
        {
          role: 'system',
          content: systemMessage
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
      username: displayName,
    };

    // Generate audio using ElevenLabs if requested
    if (generateAudio && env.elevenlabs.apiKey) {
      try {
        const selectedVoiceId = voiceId || env.elevenlabs.voiceId;
        
        const elevenLabsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}`, {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': env.elevenlabs.apiKey!,
          },
          body: JSON.stringify({
            text: aiResponse,
            model_id: env.elevenlabs.model,
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
        generateAudio: 'boolean (optional) - Whether to generate audio response',
        username: 'string (optional) - Username for personalization'
      }
    }
  });
}
