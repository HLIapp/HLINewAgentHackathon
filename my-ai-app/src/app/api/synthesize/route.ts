import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { env, validateEnvironment } from '@/config/env';
import { SynthesizeRequest, SynthesizedPractice, PracticeStep } from '@/types/interventions';
import { getInterventionByTitle } from '@/data/staticInterventions';
import { getCachedTextGuide } from '@/data/generatedGuides';
import { getCachedAudioGuide } from '@/data/audioGuidesLoader';

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

// Cache for synthesized practices
const synthesisCache = new Map<string, { practice: SynthesizedPractice, timestamp: number }>();

export async function POST(request: NextRequest) {
  try {
    const body: SynthesizeRequest = await request.json();
    const { intervention_title, intervention_description, mode, phase } = body;

    if (!intervention_title || !mode) {
      return NextResponse.json(
        { error: 'Missing required fields: intervention_title, mode' },
        { status: 400 }
      );
    }

    // Check file-based cache first (pre-generated guides)
    if (mode === 'text') {
      const cachedGuide = getCachedTextGuide(intervention_title);
      if (cachedGuide) {
        return NextResponse.json(cachedGuide);
      }
    }
    
    if (mode === 'audio') {
      const cachedGuide = getCachedAudioGuide(intervention_title);
      if (cachedGuide) {
        return NextResponse.json(cachedGuide);
      }
      // If we have pre-generated guides, we should never reach here
      // This means the cache lookup failed - return error instead of generating
      return NextResponse.json(
        { error: 'Audio guide not found in cache. Please regenerate guides.' },
        { status: 404 }
      );
    }

    // Fallback to in-memory cache for backward compatibility
    const cacheKey = `${intervention_title}_${mode}`;
    const cached = synthesisCache.get(cacheKey);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < 3600000) { // 1 hour cache
      return NextResponse.json(cached.practice);
    }

    // Get full intervention details from static data
    const fullIntervention = getInterventionByTitle(intervention_title);

    // For TEXT mode - generate empowering guide using OpenAI
    if (mode === 'text') {
      if (!fullIntervention) {
        return NextResponse.json(
          { error: 'Intervention not found in database' },
          { status: 404 }
        );
      }

      // Generate detailed, empowering text guide
      const prompt = `You are a compassionate, grounding health guide specializing in women's wellness and menstrual cycle support.

Create a detailed, empowering practice guide for: "${intervention_title}"

Context:
- Practice Description: ${intervention_description}
- Duration: ${fullIntervention.duration_minutes} minutes
- Location: ${fullIntervention.location}
- Phase: ${phase || 'any'}
- Scientific Basis: ${fullIntervention.research}

Generate a warm, grounding guide with:
1. A brief introduction (1-2 sentences) that validates their experience and sets an empowering tone
2. ${fullIntervention.instructions.length} detailed steps that are:
   - Clear and specific with timing
   - Include breathing cues where appropriate
   - Offer gentle physiological explanations
   - Use encouraging, supportive language
3. Optional modification or variation
4. A reflective closing question that promotes self-awareness

Tone: Grounding, empowering, gentle, evidence-based
Length: Concise yet complete - no fluff, every word serves the practice

Return as JSON with this structure:
{
  "introduction": "brief empowering intro",
  "steps": [
    {
      "instruction": "clear detailed step",
      "duration_seconds": 30,
      "breathing_cue": "optional breathing guidance",
      "physiological_explanation": "brief why this helps"
    }
  ],
  "modification": "optional modification tip",
  "reflection_question": "grounding reflection question"
}`;

      const completion = await openai.chat.completions.create({
        model: env.openai.model,
        messages: [
          {
            role: 'system',
            content: 'You are a grounding, empowering wellness guide. Create detailed practice guides in JSON format. Be concise yet complete, validating yet actionable.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1200,
        temperature: 0.7,
      });

      const responseText = completion.choices[0]?.message?.content || '{}';
      
      // Parse the response
      let parsedGuide;
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        const jsonText = jsonMatch ? jsonMatch[0] : responseText;
        parsedGuide = JSON.parse(jsonText);
      } catch (parseError) {
        console.error('Failed to parse text guide:', responseText);
        // Fallback to static instructions
        const steps: PracticeStep[] = fullIntervention.instructions.map((instruction, index) => ({
          step_number: index + 1,
          instruction: instruction,
          duration_seconds: 30,
        }));

        parsedGuide = {
          introduction: fullIntervention.description,
          steps: steps,
          reflection_question: 'How do you feel? Notice any changes in your body or mind?'
        };
      }

      // Format steps with step numbers
      const formattedSteps: PracticeStep[] = (parsedGuide.steps || []).map((step: any, index: number) => ({
        step_number: index + 1,
        instruction: step.instruction || step,
        duration_seconds: step.duration_seconds || 30,
        breathing_cue: step.breathing_cue,
        physiological_explanation: step.physiological_explanation,
      }));

      const practice: SynthesizedPractice = {
        intervention_title,
        mode: 'text',
        steps: formattedSteps,
        reflection_question: parsedGuide.reflection_question || 'How do you feel? Notice any changes in your body or mind?',
        estimated_time: fullIntervention.duration_minutes * 60,
        generated_at: new Date().toISOString(),
      };

      // Add introduction and modification to the response (extend type temporarily)
      const enhancedPractice = {
        ...practice,
        introduction: parsedGuide.introduction,
        modification: parsedGuide.modification || fullIntervention.modification,
      };

      // Cache the result
      synthesisCache.set(cacheKey, { practice: enhancedPractice as any, timestamp: now });

      return NextResponse.json(enhancedPractice);
    }

    // For AUDIO mode - should not reach here if guides are pre-generated
    // This code path is kept for backward compatibility but should not execute
    if (mode === 'audio') {
      return NextResponse.json(
        { error: 'Audio guide not found in cache. Please regenerate guides.' },
        { status: 404 }
      );
    }

    // For VISUAL mode - return visual diagram images
    if (mode === 'visual') {
      let visualSteps: PracticeStep[] = [];
      let visualUrls: string[] = [];
      
      // For Child's Pose, return the step-by-step visual diagrams
      if (intervention_title === "Child's Pose") {
        visualUrls = [
          "/Child's Pose - Step 1.png",
          "/Child's Pose - Step 2.png",
          "/Child's Pose - Step 3.png",
          "/Child's Pose - Step 4.png"
        ];
        
        visualSteps = [
          {
            step_number: 1,
            instruction: 'Kneel, touch big toes together',
            physiological_explanation: 'Setting up the foundation for the pose'
          },
          {
            step_number: 2,
            instruction: 'Sink hips toward heels, extend arms forward',
            physiological_explanation: 'Gentle stretch through the back and hips'
          },
          {
            step_number: 3,
            instruction: 'Rest forehead on floor, breathe deeply',
            physiological_explanation: 'Increasing pelvic blood flow and relaxation'
          },
          {
            step_number: 4,
            instruction: 'Slowly rise when ready',
            physiological_explanation: 'Completing the practice with awareness'
          }
        ];
      } else {
        // For other interventions, use placeholder
        visualSteps = [
          {
            step_number: 1,
            instruction: 'Visual guide generation coming soon',
            physiological_explanation: 'We are working on generating illustrated step-by-step guides using AI.'
          }
        ];
      }

      const practice: SynthesizedPractice = {
        intervention_title,
        mode: 'visual',
        steps: visualSteps,
        reflection_question: 'How do you feel after this practice?',
        estimated_time: (fullIntervention?.duration_minutes || 5) * 60,
        visual_url: visualUrls.length > 0 ? visualUrls[0] : undefined, // Keep for backward compatibility
        visual_urls: visualUrls, // New field for multiple images
        generated_at: new Date().toISOString(),
      };

      // Cache the result
      synthesisCache.set(cacheKey, { practice: practice as any, timestamp: now });

      return NextResponse.json(practice);
    }

    return NextResponse.json(
      { error: 'Invalid mode. Must be text, audio, or visual' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Synthesizer API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Practice Synthesizer API',
    description: 'Generates personalized practice guides in different formats',
    endpoints: {
      POST: '/api/synthesize - Generate practice guide',
      parameters: {
        intervention_title: 'string (required) - Title of the intervention',
        intervention_description: 'string (required) - Description of the intervention',
        mode: 'string (required) - Guide format: text, audio, or visual',
        phase: 'string (optional) - Current cycle phase for context'
      }
    },
    modes: {
      text: 'Step-by-step written instructions with physiological explanations',
      audio: 'Narrated audio guide using ElevenLabs text-to-speech',
      visual: 'Step-by-step illustrated visual diagrams with instructions'
    },
    example_request: {
      intervention_title: "Child's Pose",
      intervention_description: "Gentle yoga pose that increases pelvic blood flow and reduces cramping",
      mode: 'text',
      phase: 'menstrual'
    }
  });
}
