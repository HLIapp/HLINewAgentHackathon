/**
 * Extract Audio Guides Script
 * 
 * Extracts audio guides from the existing generatedGuides.ts file
 * and creates separate files for text and audio guides.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const generatedGuidesPath = join(process.cwd(), 'src/data/generatedGuides.ts');
const generatedGuidesContent = readFileSync(generatedGuidesPath, 'utf-8');

// Extract the generatedGuides object using regex
const guidesMatch = generatedGuidesContent.match(/export const generatedGuides[^=]+=\s*({[\s\S]*?});/);
if (!guidesMatch) {
  console.error('Could not find generatedGuides object in file');
  process.exit(1);
}

// Parse the guides object
let allGuides: any;
try {
  // Evaluate the guides object (safe since it's from our own file)
  eval(`allGuides = ${guidesMatch[1]}`);
} catch (error) {
  console.error('Error parsing guides:', error);
  process.exit(1);
}

// Separate text and audio guides
const textGuides: Record<string, any> = {};
const audioGuides: Record<string, any> = {};

for (const [title, guides] of Object.entries(allGuides)) {
  if (guides && typeof guides === 'object' && 'text' in guides && 'audio' in guides) {
    textGuides[title] = (guides as any).text;
    audioGuides[title] = (guides as any).audio;
  }
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

const textGuidesPath = join(process.cwd(), 'src/data/generatedGuides.ts');
const audioGuidesPath = join(process.cwd(), 'src/data/generatedGuidesAudio.json');

writeFileSync(textGuidesPath, textFileContent, 'utf-8');
writeFileSync(audioGuidesPath, audioFileContent, 'utf-8');

console.log(`✓ Successfully extracted guides`);
console.log(`✓ Text guides written to: ${textGuidesPath}`);
console.log(`✓ Audio guides written to: ${audioGuidesPath}`);
console.log(`✓ Extracted ${Object.keys(textGuides).length} text guides`);
console.log(`✓ Extracted ${Object.keys(audioGuides).length} audio guides`);

