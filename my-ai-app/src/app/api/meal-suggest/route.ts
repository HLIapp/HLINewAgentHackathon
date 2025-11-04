import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { env } from '@/config/env';
import { MealSuggestionRequest } from '@/types/interventions';

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

    const body: MealSuggestionRequest = await request.json();
    const { ingredients, intervention_title, phase } = body;

    if (!ingredients || ingredients.length === 0) {
      return NextResponse.json(
        { error: 'Ingredients list is required' },
        { status: 400 }
      );
    }

    const phaseContext = {
      follicular: 'follicular phase - a time of rising estrogen, increasing energy, and tissue building',
      ovulatory: 'ovulatory phase - peak performance window with high estrogen and optimal energy',
      menstrual: 'menstrual phase - a time of rest and recovery with lower hormone levels',
      luteal: 'luteal phase - progesterone rising, supporting potential pregnancy and recovery',
    };

    const prompt = `You are a compassionate, knowledgeable nutritionist specializing in cycle-synced nutrition. A user has these ingredients available: ${ingredients.join(', ')}.

They are in their ${phaseContext[phase]} and need a protein-rich breakfast (20g+ protein) that supports their hormonal phase.

Provide 3-4 creative meal suggestions using their available ingredients. For each suggestion, include:
1. The meal name
2. Brief description (1-2 sentences)
3. Estimated protein content (g)
4. Quick preparation steps (2-3 steps)
5. How it supports their current phase

Be encouraging, practical, and focus on whole foods. If they don't have typical protein sources, suggest creative combinations.

Format your response as JSON:
{
  "suggestions": [
    {
      "name": "Meal name",
      "description": "Brief description",
      "protein_grams": 25,
      "preparation_steps": ["step 1", "step 2"],
      "phase_support": "How this supports their phase"
    }
  ],
  "tips": ["general tip 1", "general tip 2"]
}`;

    const completion = await openai.chat.completions.create({
      model: env.openai.model,
      messages: [
        {
          role: 'system',
          content: 'You are a supportive nutritionist who helps people create nourishing meals that align with their hormonal cycle. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: 'Failed to generate meal suggestions' },
        { status: 500 }
      );
    }

    // Parse JSON response
    let mealSuggestions;
    try {
      mealSuggestions = JSON.parse(content);
    } catch (parseError) {
      // Try to extract JSON if wrapped in markdown
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        mealSuggestions = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } else {
        throw parseError;
      }
    }

    return NextResponse.json({
      ...mealSuggestions,
      generated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error generating meal suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to generate meal suggestions. Please try again.' },
      { status: 500 }
    );
  }
}

