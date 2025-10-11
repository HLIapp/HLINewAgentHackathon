/**
 * Environment Configuration
 * Centralized environment variable management
 */

export const env = {
  // OpenAI Configuration
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4' as const,
  },

  // ElevenLabs Configuration
  elevenlabs: {
    apiKey: process.env.ELEVENLABS_API_KEY,
    voiceId: process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB', // Default voice
    model: 'eleven_monolingual_v1' as const,
  },

  // Application Configuration
  app: {
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV === 'development',
  },
} as const;

// Validation
export const validateEnvironment = () => {
  const errors: string[] = [];

  if (!env.openai.apiKey) {
    errors.push('OPENAI_API_KEY is required');
  }

  if (!env.elevenlabs.apiKey) {
    console.warn('ELEVENLABS_API_KEY not provided - audio generation will be disabled');
  }

  if (errors.length > 0) {
    throw new Error(`Environment validation failed: ${errors.join(', ')}`);
  }

  return true;
};
