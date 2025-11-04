import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { env } from '@/config/env';
import { MealAnalysisRequest, MealAnalysis } from '@/types/interventions';

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

    const body: MealAnalysisRequest = await request.json();
    const { meal_description, meal_image_base64, intervention_title, phase } = body;

    if (!meal_description && !meal_image_base64) {
      return NextResponse.json(
        { error: 'Either meal description or meal image is required' },
        { status: 400 }
      );
    }

    const phaseContext = {
      follicular: 'follicular phase - a time of rising estrogen, increasing energy, and tissue building. Protein needs are higher to support tissue growth.',
      ovulatory: 'ovulatory phase - peak performance window with high estrogen and optimal energy. Balanced nutrition supports peak function.',
      menstrual: 'menstrual phase - a time of rest and recovery with lower hormone levels. Easier digestion and comfort foods may be preferred.',
      luteal: 'luteal phase - progesterone rising, supporting potential pregnancy and recovery. Stable blood sugar is important.',
    };

    let analyzedDescription = meal_description;

    // If image provided, use Vision API to analyze
    if (meal_image_base64 && !meal_description) {
      const visionResponse = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Describe this meal in detail. Include all visible foods, approximate portion sizes, and how it appears prepared (e.g., scrambled eggs with spinach, whole grain toast, avocado slices). Be specific about ingredients you can see.',
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${meal_image_base64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 300,
      });

      analyzedDescription = visionResponse.choices[0]?.message?.content || 'Unable to analyze image';
    }

    const prompt = `You are a compassionate, knowledgeable nutritionist specializing in cycle-synced nutrition. A user has eaten this meal: "${analyzedDescription}"

They are in their ${phaseContext[phase]} and this is a breakfast meal.

Analyze this meal and provide:
1. Estimated calories (be reasonable, not exact)
2. Estimated protein content (g)
3. Nutritional assessment (what's good about it, what could be improved)
4. How well it supports their current hormonal phase
5. If it's lacking protein (<20g) or doesn't align well with their phase, suggest 2-3 simple alternatives or additions

Be encouraging and supportive. Focus on what's working well, then gently suggest improvements if needed.

Format your response as JSON:
{
  "meal_description": "detailed description of what was eaten",
  "estimated_calories": 450,
  "estimated_protein": 18,
  "nutritional_assessment": "Assessment of the meal's nutritional value",
  "phase_support": "How this meal supports or doesn't support their current phase",
  "suggestions": ["suggestion 1", "suggestion 2"] (only if improvements needed),
  "alternatives": ["alternative 1", "alternative 2"] (only if protein <20g or phase misalignment)
}`;

    const completion = await openai.chat.completions.create({
      model: env.openai.model,
      messages: [
        {
          role: 'system',
          content: 'You are a supportive nutritionist who helps people understand their meals and align nutrition with their hormonal cycle. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 800,
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: 'Failed to analyze meal' },
        { status: 500 }
      );
    }

    // Parse JSON response
    let mealAnalysis: MealAnalysis;
    try {
      mealAnalysis = JSON.parse(content);
    } catch (parseError) {
      // Try to extract JSON if wrapped in markdown
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        mealAnalysis = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } else {
        throw parseError;
      }
    }

    // Ensure meal_description is set
    if (!mealAnalysis.meal_description) {
      mealAnalysis.meal_description = analyzedDescription;
    }

    return NextResponse.json({
      ...mealAnalysis,
      generated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error analyzing meal:', error);
    return NextResponse.json(
      { error: 'Failed to analyze meal. Please try again.' },
      { status: 500 }
    );
  }
}

