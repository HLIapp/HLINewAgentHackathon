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
