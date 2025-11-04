import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { env } from '@/config/env';
import { WalkAccompanimentRequest, WalkAccompaniment } from '@/types/interventions';

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

export async function POST(request: NextRequest) {
  try {
    if (!openai) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const body: WalkAccompanimentRequest = await request.json();
    const { intervention_title, phase, preference = 'all' } = body;

    const phaseContext = {
      follicular: 'follicular phase - rising energy, optimism, and motivation. This is a time of building and growth.',
      ovulatory: 'ovulatory phase - peak energy, confidence, and social connection. Peak performance window.',
      menstrual: 'menstrual phase - lower energy, need for rest and self-care. Gentle movement is supportive.',
      luteal: 'luteal phase - variable energy, may need motivation or calming support depending on the day.',
    };

    const prompt = `You are a supportive movement coach helping someone with a power walk during their ${phaseContext[phase]}.

Generate engaging accompaniments for their walk:

1. **Music Suggestions**: Provide 5-7 specific song recommendations (song title and artist). Choose songs that match the energy and mood of their phase - upbeat and motivating for follicular/ovulatory, gentler for menstrual, adaptable for luteal.

2. **Affirmations**: Create 5-7 short, powerful affirmations (1-2 sentences max) specifically for walking and movement. Make them personal, empowering, and aligned with their phase's energy.

3. **Meditation Theme**: Suggest a meditation theme or focus for their walk (e.g., "Mindful Steps", "Gratitude Walk", "Energy Flow"). Include a brief description of how to incorporate it.

4. **Photo Challenge**: Create a creative, engaging photo challenge for their walk. It should be:
   - Specific but achievable
   - Encourages observation and presence
   - Fun and motivating
   - Aligned with their phase's energy

Format your response as JSON:
{
  "music_suggestions": [
    {"song": "Song Title", "artist": "Artist Name"}
  ],
  "affirmations": [
    "Affirmation 1",
    "Affirmation 2"
  ],
  "meditation_theme": {
    "theme": "Theme Name",
    "description": "How to practice this during the walk"
  },
  "photo_challenge": {
    "challenge": "Challenge title (e.g., 'Find Something Green')",
    "description": "Detailed description of what to look for and why"
  }
}`;

    const completion = await openai.chat.completions.create({
      model: env.openai.model,
      messages: [
        {
          role: 'system',
          content: 'You are an encouraging movement coach who creates personalized, engaging experiences for walking. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 1200,
      temperature: 0.8,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: 'Failed to generate walk accompaniments' },
        { status: 500 }
      );
    }

    // Parse JSON response
    let accompaniment: WalkAccompaniment;
    try {
      accompaniment = JSON.parse(content);
    } catch (parseError) {
      // Try to extract JSON if wrapped in markdown
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        accompaniment = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } else {
        throw parseError;
      }
    }

    // Convert music suggestions to array of strings if needed
    if (accompaniment.music_suggestions) {
      accompaniment.music_suggestions = accompaniment.music_suggestions.map((item: any) => {
        if (typeof item === 'string') {
          return item;
        }
        // Handle object format: {song: "...", artist: "..."}
        if (item.song && item.artist) {
          return `${item.song} by ${item.artist}`;
        }
        // Fallback to string representation
        return String(item);
      });
    }

    return NextResponse.json({
      ...accompaniment,
      generated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error generating walk accompaniments:', error);
    return NextResponse.json(
      { error: 'Failed to generate walk accompaniments. Please try again.' },
      { status: 500 }
    );
  }
}

