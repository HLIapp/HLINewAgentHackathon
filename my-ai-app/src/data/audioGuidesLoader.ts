/**
 * Audio Guides Loader
 * 
 * Loads audio guides from JSON file at runtime to avoid slow TypeScript imports.
 * Audio guides are stored separately due to large base64 strings.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { SynthesizedPractice } from '@/types/interventions';

let audioGuidesCache: Record<string, SynthesizedPractice> | null = null;

/**
 * Load audio guides from JSON file (lazy loading)
 * Works in both development and production Next.js environments
 */
function loadAudioGuides(): Record<string, SynthesizedPractice> {
  if (audioGuidesCache) {
    return audioGuidesCache;
  }

  try {
    // Try multiple possible paths for Next.js compatibility
    const possiblePaths = [
      join(process.cwd(), 'src/data/generatedGuidesAudio.json'),
      join(process.cwd(), 'src', 'data', 'generatedGuidesAudio.json'),
      join(__dirname, 'generatedGuidesAudio.json'),
      join(process.cwd(), '.next', 'server', 'src', 'data', 'generatedGuidesAudio.json'),
    ];

    let audioFileContent: string | null = null;
    
    for (const path of possiblePaths) {
      try {
        audioFileContent = readFileSync(path, 'utf-8');
        break;
      } catch (error) {
        // Try next path
        continue;
      }
    }

    if (!audioFileContent) {
      console.error('Could not find generatedGuidesAudio.json in any expected location');
      return {};
    }

    const audioData = JSON.parse(audioFileContent);
    audioGuidesCache = audioData.guides || {};
    return audioGuidesCache;
  } catch (error) {
    console.error('Error loading audio guides:', error);
    return {};
  }
}

/**
 * Get a cached audio guide for a specific intervention
 */
export function getCachedAudioGuide(
  interventionTitle: string
): SynthesizedPractice | null {
  const guides = loadAudioGuides();
  return guides[interventionTitle] || null;
}

/**
 * Check if an audio guide exists in cache
 */
export function hasCachedAudioGuide(
  interventionTitle: string
): boolean {
  return !!getCachedAudioGuide(interventionTitle);
}

