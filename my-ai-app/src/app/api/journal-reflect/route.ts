import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { env } from '@/config/env';

let openai: OpenAI | null = null;

try {
  if (env.openai.apiKey) {
    openai = new OpenAI({
      apiKey: env.openai.apiKey,
    });
  }
} catch (error) {
  console.error('Failed to initialize OpenAI client:', error);
}

export interface JournalReflectionRequest {
  journal_text: string;
  journal_audio_base64?: string;
  intervention_title: string;
  phase?: string;
}

export interface JournalReflection {
  original_entry: string;
  insights: {
    main_theme: string;
    emotional_patterns: string[];
    temporary_vs_persistent: {
      temporary: string[];
      needs_attention: string[];
    };
    identified_pattern: string;
    recommendation: 'address_now' | 'wait_until_after_period' | 'both';
    reasoning: string;
  };
  reflection_questions: string[];
  generated_at: string;
}

export async function POST(request: NextRequest) {
  try {
    if (!openai) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const body: JournalReflectionRequest = await request.json();
    const { journal_text, journal_audio_base64, intervention_title, phase } = body;

    if (!journal_text && !journal_audio_base64) {
      return NextResponse.json(
        { error: 'Either journal_text or journal_audio_base64 is required' },
        { status: 400 }
      );
    }

    let finalJournalText = journal_text || '';

    // If audio is provided, transcribe it first
    if (journal_audio_base64 && !journal_text) {
      try {
        const audioBuffer = Buffer.from(journal_audio_base64, 'base64');
        const audioFile = new File([audioBuffer], 'audio.webm', { 
          type: 'audio/webm' 
        });
        
        const transcription = await openai.audio.transcriptions.create({
          file: audioFile,
          model: 'whisper-1',
        });
        
        finalJournalText = transcription.text;
      } catch (transcriptionError) {
        console.error('Audio transcription error:', transcriptionError);
        return NextResponse.json(
          { error: 'Failed to transcribe audio. Please try again or use text input.' },
          { status: 500 }
        );
      }
    }

    if (!finalJournalText.trim()) {
      return NextResponse.json(
        { error: 'Journal entry cannot be empty' },
        { status: 400 }
      );
    }

    const phaseContext = phase === 'luteal' 
      ? 'During the luteal phase, emotions can be more intense and sensitive. This is a time when some concerns may feel amplified by hormonal shifts.'
      : '';

    const prompt = `You are a compassionate, grounding therapist specializing in helping people process emotions and understand patterns through reflective journaling.

The user has shared this journal entry: "${finalJournalText}"

${phaseContext ? `Context: ${phaseContext}` : ''}

Your task is to help them process this entry by:
1. Identifying the main theme or core concern
2. Recognizing emotional patterns or triggers
3. Distinguishing between temporary concerns (that may be amplified by current phase/hormones) vs. persistent issues that need attention
4. Identifying one key pattern or insight
5. Recommending whether to address this now or wait until after their period (if in luteal phase)
6. Providing gentle, reflective questions to deepen their understanding

Be compassionate, non-judgmental, and validating. Acknowledge their feelings while helping them gain perspective.

Return your response as JSON with this exact structure:
{
  "original_entry": "the user's original journal text",
  "insights": {
    "main_theme": "one sentence summary of the core concern",
    "emotional_patterns": ["pattern 1", "pattern 2", "pattern 3"],
    "temporary_vs_persistent": {
      "temporary": ["concerns that may be phase-related", "emotions that might shift"],
      "needs_attention": ["persistent issues that deserve attention", "real concerns"]
    },
    "identified_pattern": "one key pattern or insight you notice",
    "recommendation": "address_now" | "wait_until_after_period" | "both",
    "reasoning": "gentle explanation of why this recommendation makes sense"
  },
  "reflection_questions": [
    "question 1 to deepen understanding",
    "question 2 to explore further",
    "question 3 for self-compassion"
  ]
}

Be warm, insightful, and empowering. Help them feel seen and understood.`;

    const completion = await openai.chat.completions.create({
      model: env.openai.model,
      messages: [
        {
          role: 'system',
          content: 'You are a supportive therapist who helps people process emotions through reflective journaling. Always respond with valid JSON.'
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
    let reflection: JournalReflection;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? jsonMatch[0] : responseText;
      reflection = JSON.parse(jsonText);
      
      // Ensure required fields exist
      if (!reflection.original_entry) {
        reflection.original_entry = finalJournalText;
      }
      if (!reflection.insights) {
        reflection.insights = {
          main_theme: 'Processing emotions and patterns',
          emotional_patterns: [],
          temporary_vs_persistent: { temporary: [], needs_attention: [] },
          identified_pattern: '',
          recommendation: 'both',
          reasoning: 'Take time to process and reflect.',
        };
      }
      if (!reflection.reflection_questions || !Array.isArray(reflection.reflection_questions)) {
        reflection.reflection_questions = [
          'What would feel most supportive right now?',
          'How can I practice self-compassion with these feelings?',
        ];
      }
      
      reflection.generated_at = new Date().toISOString();
    } catch (parseError) {
      console.error('Failed to parse journal reflection:', responseText);
      // Fallback response
      reflection = {
        original_entry: finalJournalText,
        insights: {
          main_theme: 'Processing emotions and patterns',
          emotional_patterns: ['Emotional processing', 'Self-reflection'],
          temporary_vs_persistent: {
            temporary: [],
            needs_attention: [],
          },
          identified_pattern: 'A pattern of reflection and self-awareness',
          recommendation: 'both',
          reasoning: 'Take time to process your feelings. Some may shift with time, while others may need attention.',
        },
        reflection_questions: [
          'What would feel most supportive right now?',
          'How can I practice self-compassion with these feelings?',
          'What insight can I take from this reflection?',
        ],
        generated_at: new Date().toISOString(),
      };
    }

    return NextResponse.json(reflection);

  } catch (error) {
    console.error('Journal Reflection API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

