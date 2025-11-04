/**
 * Intervention Types
 * Types for the intervention generation and management system
 */

export type PracticeCategory = 
  | 'nutrition'
  | 'movement'
  | 'mindset'
  | 'breathwork'
  | 'sleep'
  | 'supplementation'
  | 'stress_management'
  | 'reflection';

export type CyclePhase = 'menstrual' | 'follicular' | 'ovulatory' | 'luteal';

export type InterventionType = 'standard' | 'interactive_goal' | 'interactive_nutrition' | 'interactive_movement';

export interface InterventionCard {
  id: string;
  phase_tags: CyclePhase[];
  category: PracticeCategory;
  emoji: string;
  benefit: string;
  title: string;
  duration_minutes: number;
  location: string;
  description: string;
  relevance_score?: number;
}

export interface InterventionRequest {
  phase: CyclePhase;
  symptoms: string[];
  mood: string;
  energy: string;
  goal: string;
  username?: string;
}

export interface InterventionResponse {
  interventions: InterventionCard[];
  phase: CyclePhase;
  generated_at: string;
  cached: boolean;
}

export interface InterventionDetail extends InterventionCard {
  why_recommended: string;
  expected_outcomes: string[];
  duration_minutes: number;
  difficulty_level: 'easy' | 'moderate' | 'challenging';
}

export interface SynthesizeRequest {
  intervention_title: string;
  intervention_description: string;
  mode: 'text' | 'audio' | 'visual';
  phase?: string;
}

export interface SynthesizedPractice {
  intervention_title: string;
  mode: 'text' | 'audio' | 'visual';
  steps: PracticeStep[];
  reflection_question: string;
  estimated_time: number;
  audio_base64?: string;
  visual_url?: string;
  visual_urls?: string[]; // Array of image URLs for step-by-step visual guides
  generated_at: string;
}

export interface PracticeStep {
  step_number: number;
  instruction: string;
  duration_seconds?: number;
  physiological_explanation?: string;
  breathing_cue?: string;
}

export interface CompletedIntervention {
  intervention_id: string;
  completed_at: string;
  rating?: number; // 1-5
  feedback?: string;
  completed_full_practice: boolean;
  changes_noticed?: string[];
}

export interface GoalSynthesisRequest {
  goal_text: string;
  goal_audio_base64?: string;
  intervention_title: string;
}

export interface ActionableGoal {
  original_goal: string;
  actionable_steps: {
    step_number: number;
    action: string;
    timeframe?: string;
  }[];
  next_action: string;
  generated_at: string;
}

export interface MealSuggestionRequest {
  ingredients: string[];
  intervention_title: string;
  phase: CyclePhase;
}

export interface MealAnalysisRequest {
  meal_description?: string;
  meal_image_base64?: string;
  intervention_title: string;
  phase: CyclePhase;
}

export interface MealAnalysis {
  meal_description: string;
  estimated_calories: number;
  estimated_protein: number;
  nutritional_assessment: string;
  phase_support: string;
  suggestions?: string[];
  alternatives?: string[];
  generated_at: string;
}

export interface WalkAccompanimentRequest {
  intervention_title: string;
  phase: CyclePhase;
  preference?: 'music' | 'affirmations' | 'meditation' | 'all';
}

export interface WalkAccompaniment {
  music_suggestions?: string[];
  affirmations?: string[];
  meditation_theme?: {
    theme: string;
    description: string;
  };
  photo_challenge?: {
    challenge: string;
    description: string;
  };
  generated_at: string;
}
