/**
 * Pre-generation Script for Intervention Guides
 * 
 * Generates text and audio guides for all unique interventions once
 * and writes them to generatedGuides.ts to avoid repeated API calls.
 * 
 * Run with: npm run generate-guides
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: join(process.cwd(), '.env.local') });

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB';

if (!OPENAI_API_KEY) {
  console.error('Error: OPENAI_API_KEY not found in environment variables');
  process.exit(1);
}

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

// Import static interventions (we'll read it as a string and parse)
const staticInterventionsPath = join(process.cwd(), 'src/data/staticInterventions.ts');
const staticInterventionsContent = readFileSync(staticInterventionsPath, 'utf-8');

// Extract unique interventions from staticInterventions
// We'll parse the JSON-like structure manually or use a simpler approach
interface Intervention {
  title: string;
  description: string;
  duration_minutes: number;
  location: string;
  research: string;
  instructions: string[];
  modification?: string;
  phase_tags: string[];
}

// Get all unique interventions
function getUniqueInterventions(): Intervention[] {
  // Simple approach: we know the structure, so we'll create a helper
  // In a real scenario, we'd import, but for a script we'll parse
  const interventions: Intervention[] = [
    {
      title: "Child's Pose",
      description: 'Gentle yoga pose that increases pelvic blood flow and reduces cramping through relaxation and breath.',
      duration_minutes: 3,
      location: 'Floor/yoga mat',
      research: 'Rakhshaee, 2011',
      instructions: [
        'Kneel, touch big toes together (30 sec)',
        'Sink hips toward heels, extend arms forward (30 sec)',
        'Rest forehead on floor, breathe deeply (2 min)',
        'Slowly rise when ready'
      ],
      modification: 'Place pillow under forehead if uncomfortable',
      phase_tags: ['menstrual', 'luteal']
    },
    {
      title: 'Box Breathing',
      description: 'Controlled breathing practice that activates parasympathetic response, reducing cortisol and stress.',
      duration_minutes: 3,
      location: 'Anywhere',
      research: 'Joshi & Telles, 2009',
      instructions: [
        'Inhale through nose for 4 counts',
        'Hold breath for 4 counts',
        'Exhale through mouth for 4 counts',
        'Hold empty lungs for 4 counts',
        'Repeat for 3 minutes'
      ],
      phase_tags: ['menstrual', 'luteal']
    },
    {
      title: 'Heat Therapy',
      description: 'Apply heat to lower abdomen or back to relieve cramps and pain as effectively as NSAIDs.',
      duration_minutes: 5,
      location: 'Bed/couch',
      research: 'Heat at 40°C as effective as NSAIDs for menstrual pain (Akin et al., 2001)',
      instructions: [
        'Apply heat to lower abdomen or back',
        'Find comfortable position (lying or seated)',
        'Breathe deeply and relax muscles',
        'Leave on for 5 minutes minimum'
      ],
      phase_tags: ['menstrual']
    },
    {
      title: 'Power Walk',
      description: 'Brisk walking capitalizes on rising estrogen levels to enhance cardiovascular health and mood.',
      duration_minutes: 5,
      location: 'Outdoors/Indoors',
      research: 'Exercise during follicular phase enhances fat oxidation and energy utilization (Oosthuyse & Bosch, 2010)',
      instructions: [
        'Walk at brisk pace for 5 minutes',
        'Swing arms naturally',
        'Focus on deep breathing',
        'Maintain upright posture'
      ],
      phase_tags: ['follicular', 'ovulatory']
    },
    {
      title: 'Protein-Rich Breakfast',
      description: 'High-protein meal supports tissue building and sustained energy during follicular growth phase.',
      duration_minutes: 5,
      location: 'Kitchen',
      research: 'Protein intake during follicular phase supports optimal hormone synthesis (Barr et al., 2010)',
      instructions: [
        'Prepare 20g+ protein meal (eggs, yogurt, or protein shake)',
        'Add colorful vegetables if possible',
        'Eat mindfully, chewing thoroughly',
        'Stay hydrated with water'
      ],
      phase_tags: ['follicular']
    },
    {
      title: 'Goal Planning',
      description: 'Leverage increased cognitive function and optimism to set and plan meaningful goals.',
      duration_minutes: 5,
      location: 'Anywhere quiet',
      research: 'Cognitive performance peaks during follicular phase due to estrogen effects (Hampson, 1990)',
      instructions: [
        'Write down one goal for the week',
        'Break it into 3 actionable steps',
        'Identify first step you can take today',
        'Visualize successful completion'
      ],
      phase_tags: ['follicular', 'ovulatory']
    },
    {
      title: 'HIIT Circuit',
      description: 'High-intensity intervals capitalize on peak strength and endurance during ovulation.',
      duration_minutes: 5,
      location: 'Anywhere',
      research: 'Athletic performance peaks during ovulation due to optimal hormonal state (Janse de Jonge, 2003)',
      instructions: [
        '30 sec jumping jacks',
        '30 sec squats',
        '30 sec push-ups (modified okay)',
        '30 sec rest',
        'Repeat 2-3 times'
      ],
      phase_tags: ['ovulatory']
    },
    {
      title: 'Voice Your Needs',
      description: 'Use peak communication confidence to express needs clearly and assertively.',
      duration_minutes: 5,
      location: 'Anywhere',
      research: 'Social confidence and verbal fluency peak mid-cycle (Haselton & Gangestad, 2006)',
      instructions: [
        'Identify one unspoken need or boundary',
        'Write it in clear, direct language',
        'Practice saying it aloud',
        'Schedule conversation or send message'
      ],
      phase_tags: ['ovulatory', 'follicular']
    },
    {
      title: 'Success Review',
      description: 'Reflect on recent achievements to boost confidence and motivation during peak energy.',
      duration_minutes: 5,
      location: 'Anywhere quiet',
      research: 'Positive mood and self-perception peak at ovulation (Maki et al., 2002)',
      instructions: [
        'List 3 things that went well this week',
        'Write why each success matters',
        'Acknowledge your role in each',
        'Share one win with someone you trust'
      ],
      phase_tags: ['ovulatory']
    },
    {
      title: 'Reflective Journaling',
      description: 'Expressive writing reduces rumination and anxiety during emotionally sensitive luteal phase.',
      duration_minutes: 5,
      location: 'Anywhere quiet',
      research: 'Expressive writing reduces rumination and anxiety (Pennebaker & Beall, 1986)',
      instructions: [
        'Write response to: "What\'s triggering me today?"',
        'No editing, just stream of consciousness',
        'Ask: "Is this temporary or does it need attention?"',
        'Identify one pattern',
        'Decide: address now or wait until after period'
      ],
      phase_tags: ['luteal']
    }
  ];

  return interventions;
}

async function generateTextGuide(intervention: Intervention): Promise<any> {
  console.log(`Generating text guide for: ${intervention.title}...`);

  const prompt = `You are a compassionate, grounding health guide specializing in women's wellness and menstrual cycle support.

Create a detailed, empowering practice guide for: "${intervention.title}"

Context:
- Practice Description: ${intervention.description}
- Duration: ${intervention.duration_minutes} minutes
- Location: ${intervention.location}
- Phase: ${intervention.phase_tags[0] || 'any'}
- Scientific Basis: ${intervention.research}

Generate a warm, grounding guide with:
1. A brief introduction (1-2 sentences) that validates their experience and sets an empowering tone
2. ${intervention.instructions.length} detailed steps that are:
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

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
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
      console.error(`Failed to parse text guide for ${intervention.title}:`, responseText);
      // Fallback to static instructions
      const steps = intervention.instructions.map((instruction, index) => ({
        step_number: index + 1,
        instruction: instruction,
        duration_seconds: 30,
      }));

      parsedGuide = {
        introduction: intervention.description,
        steps: steps,
        reflection_question: 'How do you feel? Notice any changes in your body or mind?'
      };
    }

    // Format steps with step numbers
    const formattedSteps = (parsedGuide.steps || []).map((step: any, index: number) => ({
      step_number: index + 1,
      instruction: step.instruction || step,
      duration_seconds: step.duration_seconds || 30,
      breathing_cue: step.breathing_cue,
      physiological_explanation: step.physiological_explanation,
    }));

    const practice = {
      intervention_title: intervention.title,
      mode: 'text' as const,
      steps: formattedSteps,
      reflection_question: parsedGuide.reflection_question || 'How do you feel? Notice any changes in your body or mind?',
      estimated_time: intervention.duration_minutes * 60,
      generated_at: new Date().toISOString(),
      introduction: parsedGuide.introduction,
      modification: parsedGuide.modification || intervention.modification,
    };

    return practice;
  } catch (error) {
    console.error(`Error generating text guide for ${intervention.title}:`, error);
    throw error;
  }
}

async function generateAudioGuide(intervention: Intervention): Promise<any> {
  console.log(`Generating audio guide for: ${intervention.title}...`);

  const prompt = `You are a health behavior guide creating a calming, encouraging narrated practice guide.

Create a spoken guide for: "${intervention.title}"
Description: ${intervention.description}

Generate a natural, conversational script that:
1. Warmly introduces the practice (15 seconds)
2. Guides through each step with clear, calming instructions
3. Includes breathing cues and physiological explanations
4. Ends with a gentle reflection question

Keep tone warm, encouraging, and supportive. Total duration should be about ${intervention.duration_minutes} minutes.

Return the narration as a single flowing script.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
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
    
    if (ELEVENLABS_API_KEY && narrationScript) {
      try {
        const elevenLabsResponse = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
          {
            method: 'POST',
            headers: {
              'Accept': 'audio/mpeg',
              'Content-Type': 'application/json',
              'xi-api-key': ELEVENLABS_API_KEY,
            },
            body: JSON.stringify({
              text: narrationScript,
              model_id: 'eleven_monolingual_v1',
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
        } else {
          console.warn(`ElevenLabs API error for ${intervention.title}:`, elevenLabsResponse.statusText);
        }
      } catch (audioError) {
        console.error(`ElevenLabs error for ${intervention.title}:`, audioError);
      }
    } else {
      console.warn(`Skipping audio generation for ${intervention.title} - ElevenLabs API key not provided`);
    }

    const practice = {
      intervention_title: intervention.title,
      mode: 'audio' as const,
      steps: [
        {
          step_number: 1,
          instruction: 'Listen to the guided audio practice',
          physiological_explanation: narrationScript,
        }
      ],
      reflection_question: 'How do you feel after this practice?',
      estimated_time: intervention.duration_minutes * 60,
      audio_base64: audioBase64,
      generated_at: new Date().toISOString(),
    };

    return practice;
  } catch (error) {
    console.error(`Error generating audio guide for ${intervention.title}:`, error);
    throw error;
  }
}

async function main() {
  console.log('Starting guide generation...\n');

  const interventions = getUniqueInterventions();
  console.log(`Found ${interventions.length} unique interventions\n`);

  const generatedGuides: Record<string, { text: any; audio: any }> = {};
  const errors: string[] = [];

  for (const intervention of interventions) {
    try {
      // Generate text guide
      const textGuide = await generateTextGuide(intervention);
      
      // Generate audio guide
      const audioGuide = await generateAudioGuide(intervention);
      
      generatedGuides[intervention.title] = {
        text: textGuide,
        audio: audioGuide,
      };

      console.log(`✓ Completed: ${intervention.title}\n`);
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      const errorMsg = `Failed to generate guides for ${intervention.title}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(errorMsg);
      errors.push(errorMsg);
    }
  }

  // Generate separate files for text and audio
  const textGuidesPath = join(process.cwd(), 'src/data/generatedGuides.ts');
  const audioGuidesPath = join(process.cwd(), 'src/data/generatedGuidesAudio.json');
  
  // Separate text and audio guides
  const textGuides: Record<string, any> = {};
  const audioGuides: Record<string, any> = {};
  
  for (const [title, guides] of Object.entries(generatedGuides)) {
    textGuides[title] = guides.text;
    audioGuides[title] = guides.audio;
  }
  
  // Generate the TypeScript file for text guides only
  const textFileContent = `/**
 * Pre-generated Intervention Text Guides
 * 
 * This file contains pre-generated text guides for all interventions.
 * Generated once to avoid repeated API calls and credit waste.
 * 
 * Generated at: ${new Date().toISOString()}
 * Total interventions: ${Object.keys(textGuides).length}
 * 
 * To regenerate: Run \`npm run generate-guides\`
 * 
 * Note: Audio guides are stored separately in generatedGuidesAudio.json
 */

import { SynthesizedPractice } from '@/types/interventions';

export interface GeneratedGuides {
  [practiceTitle: string]: SynthesizedPractice;
}

export interface GeneratedGuidesMetadata {
  version: string;
  generated_at: string;
  total_interventions: number;
}

export const generatedGuidesMetadata: GeneratedGuidesMetadata = {
  version: '1.0.0',
  generated_at: '${new Date().toISOString()}',
  total_interventions: ${Object.keys(textGuides).length},
};

export const generatedGuides: GeneratedGuides = ${JSON.stringify(textGuides, null, 2)};

/**
 * Get a cached text guide for a specific intervention
 */
export function getCachedTextGuide(
  interventionTitle: string
): SynthesizedPractice | null {
  return generatedGuides[interventionTitle] || null;
}

/**
 * Check if a text guide exists in cache
 */
export function hasCachedTextGuide(
  interventionTitle: string
): boolean {
  return !!getCachedTextGuide(interventionTitle);
}
`;

  // Generate the JSON file for audio guides
  const audioFileContent = JSON.stringify({
    version: '1.0.0',
    generated_at: new Date().toISOString(),
    total_interventions: Object.keys(audioGuides).length,
    guides: audioGuides
  }, null, 2);

  writeFileSync(textGuidesPath, textFileContent, 'utf-8');
  writeFileSync(audioGuidesPath, audioFileContent, 'utf-8');

  console.log(`\n✓ Successfully generated guides for ${Object.keys(generatedGuides).length} interventions`);
  console.log(`✓ Text guides written to: ${textGuidesPath}`);
  console.log(`✓ Audio guides written to: ${audioGuidesPath}`);
  
  if (errors.length > 0) {
    console.log(`\n⚠️  ${errors.length} error(s) occurred:`);
    errors.forEach(err => console.log(`  - ${err}`));
  }
}

main().catch(console.error);

