import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { env, validateEnvironment } from '@/config/env';
import { SynthesizeRequest, SynthesizedPractice, PracticeStep } from '@/types/interventions';
import { getInterventionByTitle } from '@/data/staticInterventions';

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

    // Check cache
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

    // For AUDIO mode - generate narrated guide using OpenAI + ElevenLabs
    if (mode === 'audio') {
      // Generate narration script using OpenAI
      const prompt = `You are a health behavior guide creating a calming, encouraging narrated practice guide.

Create a spoken guide for: "${intervention_title}"
Description: ${intervention_description}

Generate a natural, conversational script that:
1. Warmly introduces the practice (15 seconds)
2. Guides through each step with clear, calming instructions
3. Includes breathing cues and physiological explanations
4. Ends with a gentle reflection question

Keep tone warm, encouraging, and supportive. Total duration should be about ${fullIntervention?.duration_minutes || 5} minutes.

Return the narration as a single flowing script.`;

      const completion = await openai.chat.completions.create({
        model: env.openai.model,
        messages: [
          {
            role: 'system',
            content: 'You are a calming health guide. Create warm, encouraging narration for wellness practices.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      });

      const narrationScript = completion.choices[0]?.message?.content || '';

      // Generate audio using ElevenLabs
      let audioBase64: string | undefined;
      
      if (env.elevenlabs.apiKey && narrationScript) {
        try {
          const elevenLabsResponse = await fetch(
            `https://api.elevenlabs.io/v1/text-to-speech/${env.elevenlabs.voiceId}`,
            {
              method: 'POST',
              headers: {
                'Accept': 'audio/mpeg',
                'Content-Type': 'application/json',
                'xi-api-key': env.elevenlabs.apiKey,
              },
              body: JSON.stringify({
                text: narrationScript,
                model_id: env.elevenlabs.model,
                voice_settings: {
                  stability: 0.6,
                  similarity_boost: 0.7,
                },
              }),
            }
          );

          if (elevenLabsResponse.ok) {
            const audioBuffer = await elevenLabsResponse.arrayBuffer();
            audioBase64 = Buffer.from(audioBuffer).toString('base64');
          }
        } catch (audioError) {
          console.error('ElevenLabs error:', audioError);
        }
      }

      const practice: SynthesizedPractice = {
        intervention_title,
        mode: 'audio',
        steps: [
          {
            step_number: 1,
            instruction: 'Listen to the guided audio practice',
            physiological_explanation: narrationScript,
          }
        ],
        reflection_question: 'How do you feel after this practice?',
        estimated_time: (fullIntervention?.duration_minutes || 5) * 60,
        audio_base64: audioBase64,
        generated_at: new Date().toISOString(),
      };

      // Cache the result
      synthesisCache.set(cacheKey, { practice, timestamp: now });

      return NextResponse.json(practice);
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
